# Autonomous Multi-Agent Browser Testing System — Design Spec

**Date:** 2026-04-18  
**Project:** Зографа SOP — zografa-sop  
**Status:** Approved

---

## Goal

A fully autonomous multi-agent system that detects code changes, generates Playwright browser tests, runs them, fixes any failures, commits fixes, and delivers a final summary report — all without human intervention.

---

## Architecture

```
File Change (*.ts, *.tsx, *.css)
        ↓
   [Watcher]          chokidar — watches src files
        ↓
[Orchestrator]        Node.js — coordinates agents, manages state
        ↓
  ┌─────────────────────────────────────────┐
  │                                         │
[Writer Agent]                        [Runner Agent]
Analyzes changed files,               Runs all Playwright tests
generates/updates Playwright          in headless Chromium,
test files for affected pages         captures screenshots on failure
  │                                         │
  └──────────────┬──────────────────────────┘
                 ↓ (if failures)
          [Fixer Agent]
          Reads: failing test + screenshot + source code
          Generates fix → applies to source
          Triggers Runner again (max 3 attempts)
                 ↓ (if still failing after 3 attempts)
          [Commit Agent]          [Reporter Agent]
          Commits fixes that      Generates final summary
          passed verification     report to terminal
```

---

## Agents

### 1. Writer Agent
- **Input:** List of changed file paths
- **Task:** For each changed file, determine which pages/components it affects, then generate or update the corresponding Playwright test file
- **Output:** Updated `e2e/*.spec.ts` files
- **Model:** claude-sonnet-4-6
- **Tool access:** Read (source files), Write (test files)

### 2. Runner Agent
- **Input:** List of test files to run
- **Task:** Execute `npx playwright test` for affected specs, capture stdout/stderr and screenshots
- **Output:** Structured result: `{ passed: string[], failed: { spec, error, screenshotPath }[] }`
- **Implementation:** Bash (runs playwright subprocess), no Claude API needed

### 3. Fixer Agent
- **Input:** Failing test spec + error message + screenshot path + source file content
- **Task:** Analyze root cause, generate a targeted fix for the source code (not the test), apply it
- **Output:** Modified source file(s) — then triggers Runner again
- **Model:** claude-sonnet-4-6
- **Tool access:** Read, Edit, Write
- **Max attempts:** 3 per failure

### 4. Commit Agent
- **Input:** List of files modified by Fixer Agent that are now verified passing
- **Task:** Stage and commit fixed files with a descriptive commit message
- **Output:** Git commit hash
- **Implementation:** Bash (`git add` + `git commit`)

### 5. Reporter Agent
- **Input:** Full run results (passed, fixed, unfixable)
- **Task:** Format and print a clean terminal summary
- **Output:** Terminal output only (no files)
- **Implementation:** Pure Node.js (no Claude API — deterministic formatting)

---

## Test Coverage

### Auth (`e2e/auth.spec.ts`)
- Employee login → redirects to `/`
- Admin login → redirects to `/admin`
- Wrong password → shows error
- Unauthenticated access → redirects to `/login`

### Admin Panel (`e2e/admin.spec.ts`)
- `/admin` loads, shows document table
- Publish/unpublish toggle updates status badge
- `/admin/upload` — file input + mode toggle (HTML / AI)
- `/admin/product-models` — list, add model, rename, delete
- `/admin/documents/[id]` — edit title, dept, product model, save

### Employee UI (`e2e/employee.spec.ts`)
- `/` homepage — department cards render
- Sidebar navigation — dept expand/collapse
- `/?dept=[id]&type=form` — form group renders
- `/documents/[id]` — SOP viewer loads, TOC appears
- Print button triggers browser print dialog
- Copy button copies to clipboard
- Mobile: hamburger opens sidebar

---

## File Structure

```
scripts/
  test-orchestrator.mjs     — entry point, watcher + agent coordination
  agents/
    writer-agent.mjs        — generates Playwright tests
    fixer-agent.mjs         — analyzes failures and applies fixes

e2e/
  auth.spec.ts              — authentication flows
  admin.spec.ts             — admin panel coverage
  employee.spec.ts          — employee UI coverage

playwright.config.ts        — config: baseURL, screenshots, retries=0
```

---

## Orchestrator Flow (pseudocode)

```
on file_change(paths):
  1. writer_agent(paths) → updated test files
  2. results = runner(affected_specs)
  3. if results.all_passed:
       reporter("✅ All tests passed")
       return
  4. for each failure in results.failed:
       for attempt in 1..3:
         fixer_agent(failure) → applies fix to source
         rerun = runner([failure.spec])
         if rerun.passed:
           commit_agent([fixed_files])
           break
       if still_failing:
         unfixable.push(failure)
  5. reporter(summary)
```

---

## Environment

- `ANTHROPIC_API_KEY` — already in `.env.local` (via GEMINI key pattern; add Anthropic key)
- `BASE_URL=http://localhost:3000` — Next.js dev server must be running
- Playwright runs headless Chromium (installed via `npx playwright install chromium`)

---

## npm scripts

```json
"test:e2e": "playwright test",
"test:watch": "node scripts/test-orchestrator.mjs"
```

`test:watch` starts the watcher. Developer runs `npm run dev` + `npm run test:watch` in parallel.

---

## Constraints

- Fixer Agent only modifies **source files** — never modifies test files (tests are the source of truth)
- Max 3 fix attempts per failure to avoid infinite loops
- If dev server is not running, orchestrator prints a clear error and exits
- Screenshots saved to `e2e/screenshots/` (gitignored)
- Commits use prefix `fix(auto):` to distinguish agent commits from human commits
