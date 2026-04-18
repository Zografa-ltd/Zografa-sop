import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

const SPEC_MAP = [
  { pattern: 'app/(admin)',         spec: 'e2e/admin.spec.ts' },
  { pattern: 'app/(auth)',          spec: 'e2e/auth.spec.ts' },
  { pattern: 'app/(employee)',      spec: 'e2e/employee.spec.ts' },
  { pattern: 'components/employee', spec: 'e2e/employee.spec.ts' },
]

export async function writerAgent(changedFiles) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const toUpdate = new Set()

  for (const file of changedFiles) {
    const rel = path.relative(ROOT, file)
    for (const { pattern, spec } of SPEC_MAP) {
      if (rel.includes(pattern)) toUpdate.add(spec)
    }
  }

  for (const specRelPath of toUpdate) {
    const specPath = path.join(ROOT, specRelPath)
    const existing = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : ''

    const changedContent = changedFiles
      .map(f => `// ${path.relative(ROOT, f)}\n${fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '(deleted)'}`)
      .join('\n\n---\n\n')

    const prompt = `You are a Playwright test writer for a Next.js 16 SOP app (Bulgarian UI text).

Source files changed. Update the test spec to cover new/changed functionality.

Changed source files:
${changedContent}

Current spec (${specRelPath}):
${existing}

Rules:
- baseURL is http://localhost:3000
- Employee login: page.fill('#password', process.env.E2E_EMPLOYEE_PASSWORD!) then click button[type="submit"]
- Admin login: process.env.E2E_ADMIN_PASSWORD!
- Never hard-code UUIDs
- Keep all existing passing tests unchanged
- Add tests only for new/changed behavior
- Return ONLY the complete TypeScript file content, no explanation, no markdown fences`

    console.log(`  ✍️  Writer updating ${specRelPath}`)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const updated = response.content[0].text.replace(/^```typescript\n?|```$/gm, '').trim()
    fs.writeFileSync(specPath, updated)
    console.log(`  ✅ Updated ${specRelPath}`)
  }
}
