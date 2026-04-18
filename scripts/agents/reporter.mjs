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
      if (f.screenshotPath) console.log(`         📷 ${f.screenshotPath}`)
    }
  }

  if (unfixable.length === 0 && fixed.length === 0 && passed.length > 0) {
    console.log('\n  🎉  Всичко е наред!')
  }

  console.log(line + '\n')
}
