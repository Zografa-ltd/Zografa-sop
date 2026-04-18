import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

const SOURCE_MAP = {
  admin: [
    'app/(admin)/admin/page.tsx',
    'app/(admin)/admin/components/DocumentTable.tsx',
    'app/(admin)/admin/product-models/page.tsx',
    'app/(admin)/admin/documents/[id]/page.tsx',
    'app/(admin)/admin/upload/page.tsx',
  ],
  employee: [
    'app/(employee)/page.tsx',
    'components/employee/Sidebar.tsx',
    'components/employee/HomepageGrid.tsx',
    'components/employee/DocumentViewer.tsx',
    'components/employee/SidebarShell.tsx',
  ],
  auth: [
    'app/(auth)/login/page.tsx',
    'app/api/auth/login/route.ts',
  ],
}

export async function fixerAgent(failure, attempt) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const { spec, title, error } = failure

  const key = Object.keys(SOURCE_MAP).find(k => spec.includes(k)) ?? 'employee'
  const sourceFiles = SOURCE_MAP[key]
    .map(f => path.join(ROOT, f))
    .filter(f => fs.existsSync(f))

  const testContent = fs.existsSync(spec) ? fs.readFileSync(spec, 'utf8') : '(not found)'
  const sourceContents = sourceFiles
    .map(f => `// ${path.relative(ROOT, f)}\n${fs.readFileSync(f, 'utf8')}`)
    .join('\n\n---\n\n')

  const prompt = `You are an autonomous bug-fixing agent for a Next.js 16 + Supabase SOP application (Bulgarian UI).

A Playwright browser test is failing. Fix the SOURCE CODE — never modify test files.

Failing test: ${title}
Error: ${error}
Attempt: ${attempt}/3

Test file (${path.relative(ROOT, spec)}):
${testContent}

Source files:
${sourceContents}

Rules:
- Only modify files in app/, components/, lib/ — NEVER e2e/
- Make the minimal change that fixes the test
- If test expects text that doesn't exist, add it to source
- If a selector doesn't match, fix the source HTML

Respond with ONLY a JSON object (no markdown fences):
{
  "analysis": "one sentence root cause",
  "fix": {
    "file": "relative/path/from/project/root.tsx",
    "old": "exact string to replace (must exist verbatim in file)",
    "new": "replacement string"
  }
}`

  console.log(`  🤖 Fixer analyzing: ${title} (attempt ${attempt})`)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  let fix
  try {
    fix = JSON.parse(response.content[0].text.replace(/^```json\n?|```$/gm, '').trim())
  } catch {
    console.warn('  ⚠️  Fixer returned invalid JSON')
    return []
  }

  const filePath = path.join(ROOT, fix.fix.file)
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  Target not found: ${fix.fix.file}`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes(fix.fix.old)) {
    console.warn(`  ⚠️  Target string not found in ${fix.fix.file}`)
    return []
  }

  fs.writeFileSync(filePath, content.replace(fix.fix.old, fix.fix.new))
  console.log(`  🔧 Fixed ${fix.fix.file}: ${fix.analysis}`)
  return [filePath]
}
