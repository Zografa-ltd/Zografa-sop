import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

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
        error: `Could not parse playwright output. Exit code: ${exitCode}. stdout: ${stdout.slice(0, 200)}`,
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
      const result = test.results?.[0] ?? {}
      if (result.status === 'passed') {
        passed.push(title)
      } else if (result.status === 'skipped') {
        // ignore
      } else {
        const attachment = result.attachments?.find(a => a.name === 'screenshot')
        failures.push({
          spec: spec.file ?? 'unknown',
          title,
          error: result.error?.message ?? result.error?.value ?? 'Test failed',
          screenshotPath: attachment?.path ?? null,
        })
      }
    }
  }

  function processSuite(suite, pathArr = []) {
    const current = suite.title ? [...pathArr, suite.title] : pathArr
    for (const spec of suite.specs ?? []) processSpec(spec, current)
    for (const child of suite.suites ?? []) processSuite(child, current)
  }

  for (const suite of json.suites ?? []) processSuite(suite)
  return { passed, failures }
}
