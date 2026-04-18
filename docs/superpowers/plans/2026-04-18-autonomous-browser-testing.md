# Autonomous Multi-Agent Browser Testing System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fully autonomous multi-agent system that detects code changes, writes/updates Playwright browser tests, runs them, fixes failures with Claude API, commits fixes, and reports results — zero human intervention mid-run.

**Architecture:** chokidar watches source files → Orchestrator coordinates Writer Agent (generates tests via Claude) → Runner (executes Playwright headless Chrome) → Fixer Agent (Claude analyzes failures, patches source) → Commit → Reporter prints summary.

**Tech Stack:** Node.js ESM scripts, chokidar, @playwright/test, @anthropic-ai/sdk, claude-sonnet-4-6

---

## File Structure

```
playwright.config.ts                  — Playwright config (baseURL, screenshots, workers)
e2e/
  auth.spec.ts                        — Login/logout/redirect flows
  admin.spec.ts                       — Admin panel: table, publish, upload, product models, doc edit
  employee.spec.ts                    — Employee UI: homepage, sidebar, viewer, mobile, print
scripts/
  test-orchestrator.mjs               — Entry point: watcher + pipeline coordinator
  agents/
    writer-agent.mjs                  — Claude API: generates/updates test specs on file change
    fixer-agent.mjs                   — Claude API: analyzes failures, patches source code
    runner.mjs                        — Runs playwright subprocess, returns structured results
    reporter.mjs                      — Formats and prints final terminal summary
.env.local                            — Add: ANTHROPIC_API_KEY, E2E_EMPLOYEE_PASSWORD, E2E_ADMIN_PASSWORD
package.json                          — Add: chokidar dep, test:e2e + test:watch scripts
.gitignore                            — Add: e2e/screenshots/
```

---

## Task 1: Install dependencies + env vars

**Files:** `package.json`, `.env.local`, `.gitignore`

- [ ] **Step 1: Install packages**

```bash
cd /Users/mihailzografov/Documents/zografa-sop
npm install @anthropic-ai/sdk chokidar
npx playwright install chromium
```

Expected: no errors, `node_modules/@anthropic-ai/sdk` exists.

- [ ] **Step 2: Add env vars to .env.local**

Open `.env.local` and add at the bottom:
```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
E2E_EMPLOYEE_PASSWORD=your-employee-password
E2E_ADMIN_PASSWORD=your-admin-password
```

> The employee and admin passwords are the same ones used to log in to the app.

- [ ] **Step 3: Add screenshots to .gitignore**

Add to `.gitignore`:
```
e2e/screenshots/
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add @anthropic-ai/sdk, chokidar, playwright chromium for multi-agent testing"
```

---

## Task 2: Playwright config

**Files:** `playwright.config.ts`

- [ ] **Step 1: Create playwright.config.ts**

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: 'e2e/screenshots',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
  },
  retries: 0,
  workers: 1,
})
```

- [ ] **Step 2: Add scripts to package.json**

In `package.json`, in the `"scripts"` section add:
```json
"test:e2e": "playwright test",
"test:watch": "node scripts/test-orchestrator.mjs"
```

- [ ] **Step 3: Verify config is valid**

```bash
npx playwright test --list 2>&1 | head -5
```

Expected output includes `No tests found` or lists test files — no error.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts package.json
git commit -m "chore: add playwright.config.ts and test scripts"
```

---

## Task 3: Auth tests

**Files:** `e2e/auth.spec.ts`

- [ ] **Step 1: Create e2e/auth.spec.ts**

```typescript
import { test, expect } from '@playwright/test'

// Login page uses: #password input, button[type="submit"], div.bg-red-50 for errors

test.describe('Автентикация', () => {
  test('служител влиза и вижда homepage', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#password', process.env.E2E_EMPLOYEE_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await expect(page.locator('text=Документи и процеси')).toBeVisible()
  })

  test('администратор влиза и вижда admin панел', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#password', process.env.E2E_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
    await expect(page.locator('text=Admin панел')).toBeVisible()
  })

  test('грешна парола показва грешка', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#password', 'wrong-password-xyz-123')
    await page.click('button[type="submit"]')
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('неавтентикиран достъп пренасочва към login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('неавтентикиран достъп до admin пренасочва към login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/login/)
  })
})
```

- [ ] **Step 2: Run auth tests (dev server must be running)**

```bash
E2E_EMPLOYEE_PASSWORD=yourpass E2E_ADMIN_PASSWORD=youradminpass npx playwright test e2e/auth.spec.ts --reporter=list
```

Expected: 5 tests pass. If login fails, check the password values.

- [ ] **Step 3: Commit**

```bash
git add e2e/auth.spec.ts
git commit -m "test: add Playwright auth E2E tests"
```

---

## Task 4: Admin panel tests

**Files:** `e2e/admin.spec.ts`

- [ ] **Step 1: Create e2e/admin.spec.ts**

```typescript
import { test, expect, Page } from '@playwright/test'

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#password', process.env.E2E_ADMIN_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin')
}

test.describe('Admin панел', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('таблицата с документи се зарежда', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible()
  })

  test('header показва брой документи', async ({ page }) => {
    await expect(page.locator('text=/\\d+ документа?/')).toBeVisible()
  })

  test('линк към upload страница', async ({ page }) => {
    await page.click('a:has-text("Качи документ")')
    await page.waitForURL('/admin/upload')
    await expect(page.locator('text=Качи документ')).toBeVisible()
  })

  test('upload страница — двата режима', async ({ page }) => {
    await page.goto('/admin/upload')
    await expect(page.locator('text=Формуляр (HTML)')).toBeVisible()
    await expect(page.locator('text=SOP / Имейл (AI)')).toBeVisible()
  })

  test('publish/unpublish toggle сменя статуса', async ({ page }) => {
    const toggleBtn = page.locator('button:has-text("Публикувай"), button:has-text("Скрий")').first()
    const before = await toggleBtn.textContent()
    await toggleBtn.click()
    await page.waitForTimeout(1000)
    const after = await toggleBtn.textContent()
    expect(after).not.toBe(before)
  })

  test('линк към продуктови модели', async ({ page }) => {
    await page.click('a:has-text("Продуктови модели")')
    await page.waitForURL('/admin/product-models')
    await expect(page.locator('text=Продуктови модели')).toBeVisible()
  })

  test('product-models — направленията се показват', async ({ page }) => {
    await page.goto('/admin/product-models')
    await expect(page.locator('text=Продажби')).toBeVisible()
    await expect(page.locator('text=Логистика')).toBeVisible()
    await expect(page.locator('text=Рекламации')).toBeVisible()
  })

  test('product-models — добавяне на нов модел', async ({ page }) => {
    await page.goto('/admin/product-models')
    await page.locator('button:has-text("+ Добави модел")').first().click()
    await page.fill('input[placeholder="Име на модела"]', 'Автотест Модел')
    await page.click('button:has-text("Добави")')
    await expect(page.locator('text=Автотест Модел')).toBeVisible()
    // Cleanup
    page.on('dialog', dialog => dialog.accept())
    await page.locator('button[title="Изтрий"]').last().click()
  })

  test('document edit страница се зарежда', async ({ page }) => {
    await page.locator('a:has-text("Редактирай")').first().click()
    await expect(page.locator('text=Редактирай документ')).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('select').first()).toBeVisible()
  })

  test('document edit — смяна на заглавие', async ({ page }) => {
    await page.locator('a:has-text("Редактирай")').first().click()
    const titleInput = page.locator('input[type="text"]')
    const original = await titleInput.inputValue()
    await titleInput.fill(original + ' (test)')
    await page.click('button:has-text("Запази промените")')
    await expect(page.locator('.bg-emerald-50')).toBeVisible()
    // Revert
    await page.locator('a:has-text("Редактирай")').first().click()
    await page.locator('input[type="text"]').fill(original)
    await page.click('button:has-text("Запази промените")')
  })
})
```

- [ ] **Step 2: Run admin tests**

```bash
E2E_EMPLOYEE_PASSWORD=yourpass E2E_ADMIN_PASSWORD=youradminpass npx playwright test e2e/admin.spec.ts --reporter=list
```

Expected: all tests pass. Note: publish toggle test may be flaky if all docs are already in same state — acceptable.

- [ ] **Step 3: Commit**

```bash
git add e2e/admin.spec.ts
git commit -m "test: add Playwright admin panel E2E tests"
```

---

## Task 5: Employee UI tests

**Files:** `e2e/employee.spec.ts`

- [ ] **Step 1: Create e2e/employee.spec.ts**

```typescript
import { test, expect, Page } from '@playwright/test'

async function loginEmployee(page: Page) {
  await page.goto('/login')
  await page.fill('#password', process.env.E2E_EMPLOYEE_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

test.describe('Employee UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginEmployee(page)
  })

  test('homepage показва заглавие и dept карти', async ({ page }) => {
    await expect(page.locator('text=Документи и процеси')).toBeVisible()
    await expect(page.locator('.grid')).toBeVisible()
  })

  test('sidebar се показва на desktop', async ({ page }) => {
    await expect(page.locator('[data-sidebar="true"]')).toBeVisible()
    await expect(page.locator('text=Начало')).toBeVisible()
  })

  test('sidebar "Начало" линк е активен на homepage', async ({ page }) => {
    const homeLink = page.locator('[data-sidebar="true"] a:has-text("Начало")')
    await expect(homeLink).toHaveClass(/text-\[#C41E2A\]|font-medium/)
  })

  test('dept карта отваря dept overview', async ({ page }) => {
    await page.locator('.grid a').first().click()
    await expect(page).toHaveURL(/\?dept=/)
  })

  test('sidebar направление expand/collapse', async ({ page }) => {
    const deptBtn = page.locator('[data-sidebar="true"] button').first()
    const initialLinks = await page.locator('[data-sidebar="true"] a[href*="/documents/"]').count()
    await deptBtn.click()
    await page.waitForTimeout(300)
    const afterLinks = await page.locator('[data-sidebar="true"] a[href*="/documents/"]').count()
    // After click, count should differ (expanded or collapsed)
    expect(afterLinks).not.toBe(initialLinks)
  })

  test('form group view зарежда формуляри', async ({ page }) => {
    const formLink = page.locator('[data-sidebar="true"] a:has-text("Въпросници")').first()
    if (await formLink.count() === 0) {
      test.skip()
      return
    }
    await formLink.click()
    await expect(page).toHaveURL(/type=form/)
  })

  test('SOP документ viewer се зарежда', async ({ page }) => {
    const sopLink = page.locator('[data-sidebar="true"] a[href*="/documents/"]').first()
    if (await sopLink.count() === 0) {
      test.skip()
      return
    }
    await sopLink.click()
    await expect(page).toHaveURL(/\/documents\//)
    await expect(page.locator('article, main > div')).toBeVisible()
  })

  test('мобилен hamburger отваря sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const sidebar = page.locator('[data-sidebar="true"]')
    await expect(sidebar).not.toBeInViewport()
    await page.locator('[data-mobile-header="true"] button').click()
    await expect(sidebar).toBeInViewport()
  })

  test('logout работи', async ({ page }) => {
    await page.locator('button:has-text("Изход")').click()
    await expect(page).toHaveURL(/login/)
  })
})
```

- [ ] **Step 2: Run employee tests**

```bash
E2E_EMPLOYEE_PASSWORD=yourpass E2E_ADMIN_PASSWORD=youradminpass npx playwright test e2e/employee.spec.ts --reporter=list
```

Expected: all non-skipped tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/employee.spec.ts
git commit -m "test: add Playwright employee UI E2E tests"
```

---

## Task 6: Runner module

**Files:** `scripts/agents/runner.mjs`

- [ ] **Step 1: Create scripts/agents/runner.mjs**

```javascript
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

/**
 * Runs playwright tests and returns structured results.
 * @param {string[]|null} specs - specific spec files, or null for all
 * @returns {{ passed: string[], failures: Array<{spec,title,error,screenshotPath}> }}
 */
export function runTests(specs = null) {
  const specArgs = specs ? specs.join(' ') : ''
  const cmd = `npx playwright test ${specArgs} --reporter=json`

  let stdout = ''
  let exitCode = 0
  try {
    stdout = execSync(cmd, { cwd: ROOT, encoding: 'utf8', env: process.env })
  } catch (err) {
    stdout = err.stdout ?? ''
    exitCode = err.status ?? 1
  }

  try {
    const json = JSON.parse(stdout)
    return parsePlaywrightJson(json)
  } catch {
    return {
      passed: [],
      failures: [{
        spec: specs?.[0] ?? 'unknown',
        title: 'Parse error',
        error: `Could not parse playwright output. Exit code: ${exitCode}`,
        screenshotPath: null,
      }],
    }
  }
}

function parsePlaywrightJson(json) {
  const passed = []
  const failures = []

  function processSpec(spec, suitePath) {
    const title = [...suitePath, spec.title].join(' › ')
    for (const test of spec.tests ?? []) {
      if (test.status === 'expected' || test.results?.[0]?.status === 'passed') {
        passed.push(title)
      } else if (test.status === 'skipped') {
        // skip silently
      } else {
        const result = test.results?.[0] ?? {}
        const attachment = result.attachments?.find(a => a.name === 'screenshot')
        failures.push({
          spec: json.suites?.find(s => s.specs?.includes(spec))?.file ?? 'unknown',
          title,
          error: result.error?.message ?? result.error?.value ?? 'Test failed',
          screenshotPath: attachment?.path ?? null,
        })
      }
    }
  }

  function processSuite(suite, path = []) {
    const currentPath = suite.title ? [...path, suite.title] : path
    for (const spec of suite.specs ?? []) processSpec(spec, currentPath)
    for (const child of suite.suites ?? []) processSuite(child, currentPath)
  }

  for (const suite of json.suites ?? []) processSuite(suite)
  return { passed, failures }
}
```

- [ ] **Step 2: Verify module imports cleanly**

```bash
node -e "import('./scripts/agents/runner.mjs').then(m => console.log('ok', Object.keys(m)))"
```

Expected: `ok [ 'runTests' ]`

- [ ] **Step 3: Commit**

```bash
git add scripts/agents/runner.mjs
git commit -m "feat: playwright runner agent module"
```

---

## Task 7: Reporter module

**Files:** `scripts/agents/reporter.mjs`

- [ ] **Step 1: Create scripts/agents/reporter.mjs**

```javascript
/**
 * Prints final test run summary to terminal.
 * @param {{ passed: string[], fixed: Array<{title,fixedIn}>, unfixable: Array<{title,error,screenshotPath}> }} results
 */
export function reporter({ passed, fixed, unfixable }) {
  const line = '─'.repeat(52)
  console.log('\n' + line)
  console.log('  📋  ТЕСТ ДОКЛАД — Зографа SOP')
  console.log(line)

  if (passed.length > 0) {
    console.log(`  ✅  ${passed.length} теста минаха`)
  }

  if (fixed.length > 0) {
    console.log(`\n  🔧  ${fixed.length} проблема поправени автоматично:`)
    for (const f of fixed) {
      console.log(`       fix(auto): ${f.title}  [опит ${f.fixedIn}]`)
    }
  }

  if (unfixable.length > 0) {
    console.log(`\n  ❌  ${unfixable.length} проблема изискват ръчна намеса:`)
    for (const f of unfixable) {
      console.log(`       • ${f.title}`)
      console.log(`         ${f.error.split('\n')[0]}`)
      if (f.screenshotPath) {
        console.log(`         📷 ${f.screenshotPath}`)
      }
    }
  }

  if (unfixable.length === 0 && fixed.length === 0 && passed.length > 0) {
    console.log('\n  🎉  Всичко е наред!')
  }

  console.log(line + '\n')
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/agents/reporter.mjs
git commit -m "feat: reporter agent module"
```

---

## Task 8: Fixer Agent (Claude API)

**Files:** `scripts/agents/fixer-agent.mjs`

- [ ] **Step 1: Create scripts/agents/fixer-agent.mjs**

```javascript
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Maps spec file pattern → relevant source files to read
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

/**
 * Analyzes a failing test and attempts to fix the source code.
 * @param {{ spec: string, title: string, error: string, screenshotPath: string|null }} failure
 * @param {number} attempt - 1-3
 * @returns {string[]} list of modified source file paths
 */
export async function fixerAgent(failure, attempt) {
  const { spec, title, error } = failure

  const key = Object.keys(SOURCE_MAP).find(k => spec.includes(k)) ?? 'employee'
  const sourceFiles = SOURCE_MAP[key]
    .map(f => path.join(ROOT, f))
    .filter(f => fs.existsSync(f))

  const testContent = fs.existsSync(spec) ? fs.readFileSync(spec, 'utf8') : '(not found)'
  const sourceContents = sourceFiles
    .map(f => `// ${path.relative(ROOT, f)}\n${fs.readFileSync(f, 'utf8')}`)
    .join('\n\n---\n\n')

  const prompt = `You are an autonomous bug-fixing agent for a Next.js 16 + Supabase SOP application.

A Playwright browser test is failing. Fix the SOURCE CODE — never modify test files.

**Failing test:** ${title}
**Error:** ${error}
**Attempt:** ${attempt}/3

**Test file (${path.relative(ROOT, spec)}):**
\`\`\`typescript
${testContent}
\`\`\`

**Source files:**
${sourceContents}

Rules:
- Only modify files in app/, components/, lib/ — NEVER e2e/
- Make the minimal change that fixes the test
- If the test expects text that doesn't exist in source, add it
- If a selector doesn't match, fix the source HTML (add the expected attribute/text)

Respond with ONLY a JSON object (no markdown fences):
{
  "analysis": "one sentence root cause",
  "fix": {
    "file": "relative/path/from/project/root.tsx",
    "old": "exact string to replace (must exist verbatim in file)",
    "new": "replacement string"
  }
}`

  console.log(`  🤖 Fixer agent analyzing: ${title} (attempt ${attempt})`)

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
    console.warn(`  ⚠️  Fixer target not found: ${fix.fix.file}`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes(fix.fix.old)) {
    console.warn(`  ⚠️  Fixer: target string not found in ${fix.fix.file}`)
    return []
  }

  fs.writeFileSync(filePath, content.replace(fix.fix.old, fix.fix.new))
  console.log(`  🔧 Applied fix to ${fix.fix.file}: ${fix.analysis}`)
  return [filePath]
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/agents/fixer-agent.mjs
git commit -m "feat: fixer agent — Claude-powered autonomous bug fixer"
```

---

## Task 9: Writer Agent (Claude API)

**Files:** `scripts/agents/writer-agent.mjs`

- [ ] **Step 1: Create scripts/agents/writer-agent.mjs**

```javascript
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Maps changed source path pattern → which spec file to update
const SPEC_MAP = [
  { pattern: 'app/(admin)',       spec: 'e2e/admin.spec.ts' },
  { pattern: 'app/(auth)',        spec: 'e2e/auth.spec.ts' },
  { pattern: 'app/(employee)',    spec: 'e2e/employee.spec.ts' },
  { pattern: 'components/employee', spec: 'e2e/employee.spec.ts' },
]

/**
 * For each changed source file, updates the corresponding Playwright test spec.
 * @param {string[]} changedFiles - absolute paths to changed files
 */
export async function writerAgent(changedFiles) {
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

    const prompt = `You are a Playwright test writer for a Next.js 16 SOP application (Bulgarian UI text).

Source files changed. Update the test spec to cover new/changed functionality.

**Changed source files:**
${changedContent}

**Current spec (${specRelPath}):**
\`\`\`typescript
${existing}
\`\`\`

Rules:
- baseURL is http://localhost:3000
- Login: page.fill('#password', process.env.E2E_EMPLOYEE_PASSWORD!) then click button[type="submit"]
- Admin login: process.env.E2E_ADMIN_PASSWORD!
- Never hard-code UUIDs — use visible text selectors
- Keep all existing passing tests unchanged
- Add tests for any new UI elements or changed behavior
- Return ONLY the complete TypeScript file content, no explanation, no markdown fences`

    console.log(`  ✍️  Writer agent updating ${specRelPath}`)

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
```

- [ ] **Step 2: Commit**

```bash
git add scripts/agents/writer-agent.mjs
git commit -m "feat: writer agent — Claude-powered test file updater"
```

---

## Task 10: Orchestrator (entry point)

**Files:** `scripts/test-orchestrator.mjs`

- [ ] **Step 1: Load .env.local in orchestrator**

The orchestrator needs env vars from `.env.local`. Add this helper at the top:

```javascript
// scripts/test-orchestrator.mjs
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// Load .env.local
try {
  readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
  })
} catch { /* .env.local not found */ }
```

- [ ] **Step 2: Complete the orchestrator**

Full file `scripts/test-orchestrator.mjs`:

```javascript
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

import { runTests } from './agents/runner.mjs'
import { writerAgent } from './agents/writer-agent.mjs'
import { fixerAgent } from './agents/fixer-agent.mjs'
import { reporter } from './agents/reporter.mjs'

async function pipeline(changedFiles) {
  console.log('\n🔄 Промяна открита:', changedFiles.map(f => path.relative(ROOT, f)).join(', '))

  // 1. Update tests for changed files
  await writerAgent(changedFiles)

  // 2. Run all tests
  let results = runTests()
  console.log(`\n▶  Резултат: ${results.passed.length} мин, ${results.failures.length} неуспешни`)

  if (results.failures.length === 0) {
    reporter({ passed: results.passed, fixed: [], unfixable: [] })
    return
  }

  // 3. Attempt to fix each failure
  const fixed = []
  const unfixable = []

  for (const failure of results.failures) {
    let resolved = false

    for (let attempt = 1; attempt <= 3; attempt++) {
      const modifiedFiles = await fixerAgent(failure, attempt)
      if (modifiedFiles.length === 0) break

      const rerun = runTests([failure.spec])
      if (rerun.failures.length === 0) {
        // Fix worked — commit it
        try {
          execSync(`git add ${modifiedFiles.map(f => `"${f}"`).join(' ')}`, { cwd: ROOT })
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

// Debounce: wait 1.5s after last change before running
let timer = null

const watcher = chokidar.watch(
  ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.ts'],
  { cwd: ROOT, ignoreInitial: true, ignored: /node_modules/ }
)

watcher.on('change', (rel) => {
  clearTimeout(timer)
  timer = setTimeout(() => pipeline([path.join(ROOT, rel)]), 1500)
})

console.log('👁  Watcher активен — следи за промени в app/, components/, lib/')
console.log('   (npm run dev трябва да работи на порт 3000)\n')
```

- [ ] **Step 3: Verify orchestrator starts without error**

```bash
node scripts/test-orchestrator.mjs &
sleep 3
kill %1
```

Expected: prints watcher message, no crash.

- [ ] **Step 4: Commit**

```bash
git add scripts/test-orchestrator.mjs
git commit -m "feat: orchestrator — multi-agent test watcher entry point"
```

---

## Task 11: Full end-to-end verification

- [ ] **Step 1: Run all tests manually**

```bash
npm run test:e2e -- --reporter=list
```

Expected: auth, admin, employee tests all pass (skip tests are ok).

- [ ] **Step 2: Test the watcher**

In terminal 1:
```bash
npm run dev
```

In terminal 2:
```bash
npm run test:watch
```

In terminal 3 — make a trivial change:
```bash
echo " " >> components/employee/HomepageGrid.tsx
```

Expected: terminal 2 shows `🔄 Промяна открита:`, runs tests, prints `📋 ТЕСТ ДОКЛАД`.

- [ ] **Step 3: Final commit + push**

```bash
git add .
git commit -m "feat: complete autonomous multi-agent browser testing system"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ File watcher (chokidar) — Task 10
- ✅ Writer Agent (generates tests) — Task 9
- ✅ Runner Agent (Playwright) — Task 6
- ✅ Fixer Agent (Claude API, max 3 attempts) — Task 8
- ✅ Commit Agent (inline in orchestrator) — Task 10
- ✅ Reporter (no prompts, summary only) — Task 7
- ✅ Auth tests — Task 3
- ✅ Admin tests — Task 4
- ✅ Employee tests — Task 5
- ✅ `fix(auto):` commit prefix — Task 10
- ✅ Screenshots on failure — Task 2 (playwright.config.ts)
- ✅ ANTHROPIC_API_KEY, E2E_*_PASSWORD env vars — Task 1

**No placeholders:** confirmed — all steps have exact code.

**Type consistency:** `runTests()` returns `{ passed: string[], failures: [] }` — used consistently in orchestrator and fixer.
