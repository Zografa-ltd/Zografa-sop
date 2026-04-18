import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import chokidar from 'chokidar'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// Load .env.local
try {
  readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
  })
} catch {}

const { runTests }   = await import('./agents/runner.mjs')
const { reporter }   = await import('./agents/reporter.mjs')

const HAS_AI = !!process.env.ANTHROPIC_API_KEY

if (!HAS_AI) {
  console.log('ℹ️  ANTHROPIC_API_KEY не е зададен — работи в базов режим (само тестване + репорт).')
  console.log('   За автоматично генериране и поправяне добави ANTHROPIC_API_KEY в .env.local\n')
}

async function pipeline(changedFiles) {
  console.log('\n🔄 Промяна:', changedFiles.map(f => path.relative(ROOT, f)).join(', '))

  // AI: update test specs for changed source files
  if (HAS_AI && changedFiles.length > 0) {
    const { writerAgent } = await import('./agents/writer-agent.mjs')
    await writerAgent(changedFiles)
  }

  // Run all tests
  const results = runTests()
  console.log(`▶  ${results.passed.length} мин, ${results.failures.length} неуспешни`)

  if (results.failures.length === 0) {
    reporter({ passed: results.passed, fixed: [], unfixable: [] })
    return
  }

  // AI: attempt to fix failures
  if (!HAS_AI) {
    reporter({ passed: results.passed, fixed: [], unfixable: results.failures })
    return
  }

  const { fixerAgent } = await import('./agents/fixer-agent.mjs')
  const fixed    = []
  const unfixable = []

  for (const failure of results.failures) {
    let resolved = false

    for (let attempt = 1; attempt <= 3; attempt++) {
      const modified = await fixerAgent(failure, attempt)
      if (modified.length === 0) break

      const rerun = runTests([failure.spec])
      if (rerun.failures.length === 0) {
        try {
          execSync(`git add ${modified.map(f => `"${f}"`).join(' ')}`, { cwd: ROOT })
          execSync(
            `git commit -m "fix(auto): ${failure.title.replace(/"/g, "'")} — attempt ${attempt}"`,
            { cwd: ROOT }
          )
          console.log(`  ✅ Commit: fix(auto) ${failure.title}`)
        } catch (e) {
          console.warn('  ⚠️  Git commit failed:', e.message)
        }
        fixed.push({ ...failure, fixedIn: attempt })
        resolved = true
        break
      }
    }

    if (!resolved) unfixable.push(failure)
  }

  reporter({ passed: results.passed, fixed, unfixable })
}

// Debounce: wait 1.5s after last change
let timer = null

const watcher = chokidar.watch(
  ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.ts'],
  { cwd: ROOT, ignoreInitial: true, ignored: /node_modules/ }
)

watcher.on('change', (rel) => {
  clearTimeout(timer)
  timer = setTimeout(() => pipeline([path.join(ROOT, rel)]), 1500)
})

console.log('👁  Watcher активен — следи app/, components/, lib/')
console.log('   npm run dev трябва да работи на порт 3000\n')
