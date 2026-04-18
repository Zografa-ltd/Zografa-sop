/**
 * Seed script — inserts all SOP documents into Supabase.
 * Run: node scripts/seed-documents.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const SOP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content')

function read(path) {
  return readFileSync(join(SOP_DIR, path), 'utf8')
}

// ─── 1. Get department UUIDs ─────────────────────────────────────────────────
const { data: depts, error: deptErr } = await supabase
  .from('departments')
  .select('id, code')

if (deptErr) { console.error('Failed to fetch departments:', deptErr); process.exit(1) }

const dept = Object.fromEntries(depts.map(d => [d.code, d.id]))
console.log('Departments:', dept)

// ─── 2. Document catalogue ───────────────────────────────────────────────────
const documents = [
  // ── SALE ────────────────────────────────────────────────────────────────────
  {
    internal_code: 'SOP_SALE_001',
    title: 'Запитвания Рекламни стелажи',
    type: 'sop',
    department_id: dept['SALE'],
    current_version: '2.3',
    status: 'published',
    content_md: read('Human_Playbooks/Sales/SOP_SALE_001_Запитвания Рекламни стелажи.md'),
  },
  {
    internal_code: 'TMP_SALE_001A',
    title: 'Въпросник — Рекламни стелажи',
    type: 'form',
    department_id: dept['SALE'],
    current_version: '4.0',
    status: 'published',
    content_md: read('Templates/Sales/TEMPLATE_SALE_001A_Въпросник.md'),
  },
  {
    internal_code: 'TMP_SALE_001A2',
    title: 'Въпросник — Рекламни стелажи (Технически и Логистика)',
    type: 'form',
    department_id: dept['SALE'],
    current_version: '4.1',
    status: 'published',
    content_md: read('Templates/Sales/TEMPLATE_SALE_001A2_Въпросник_Технически.md'),
  },
  {
    internal_code: 'TMP_SALE_001B',
    title: 'Шаблонни имейли — Рекламни стелажи',
    type: 'email_template',
    department_id: dept['SALE'],
    current_version: '2.2',
    status: 'published',
    content_md: read('Templates/Sales/TEMPLATE_SALE_001B_Имейли.md'),
  },
  {
    internal_code: 'TMP_SALE_001C',
    title: 'Задание към проектант — Рекламни стелажи',
    type: 'assignment',
    department_id: dept['SALE'],
    current_version: '2.0',
    status: 'published',
    content_md: read('Templates/Sales/TEMPLATE_SALE_001C_Задание_Към_Проектант.md'),
  },
  // ── ЛОГИСТИКА ───────────────────────────────────────────────────────────────
  {
    internal_code: 'SOP_LOG_001',
    title: 'Управление на Логистика, Доставка и Монтаж',
    type: 'sop',
    department_id: dept['LOG'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Human_Playbooks/Logistics/SOP_LOG_001_Управление_Логистика_Доставка_Монтаж.md'),
  },
  {
    internal_code: 'TMP_LOG_001A',
    title: 'Въпросник за оферта на доставка и монтаж',
    type: 'form',
    department_id: dept['LOG'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Templates/Logistics/TEMPLATE_LOG_001A_Въпросник_Офериране_Доставка_Монтаж.md'),
  },
  {
    internal_code: 'TMP_LOG_001B',
    title: 'Декларация за доставка и монтаж',
    type: 'form',
    department_id: dept['LOG'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Templates/Logistics/TEMPLATE_LOG_001B_Декларация_Доставка_Монтаж.md'),
  },
  {
    internal_code: 'TMP_LOG_001C',
    title: 'Условия на доставка и разтоварване',
    type: 'form',
    department_id: dept['LOG'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Templates/Logistics/TEMPLATE_LOG_001C_Условия_Доставка.md'),
  },
  {
    internal_code: 'TMP_LOG_001D',
    title: 'Декларация за доставка (без монтаж)',
    type: 'form',
    department_id: dept['LOG'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Templates/Logistics/TEMPLATE_LOG_001D_Декларация_Доставка.md'),
  },
  // ── РЕКЛАМАЦИИ ──────────────────────────────────────────────────────────────
  {
    internal_code: 'SOP_REK_001',
    title: 'Приемане и обработка на рекламации',
    type: 'sop',
    department_id: dept['REK'],
    current_version: '2.0',
    status: 'published',
    content_md: read('Human_Playbooks/REK/SOP_REK_001_Приемане_и_Обработка_Рекламации.md'),
  },
  {
    internal_code: 'TMP_REK_001A',
    title: 'Протокол за решение на комисия',
    type: 'form',
    department_id: dept['REK'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Templates/REK/TEMPLATE_REK_001A_Протокол_Комисия.md'),
  },
  {
    internal_code: 'TMP_REK_001B',
    title: 'Имейли — Рекламации',
    type: 'email_template',
    department_id: dept['REK'],
    current_version: '1.0',
    status: 'published',
    content_md: read('Templates/REK/TEMPLATE_REK_001B_Имейли.md'),
  },
]

// ─── 3. Insert ───────────────────────────────────────────────────────────────
console.log(`\nInserting ${documents.length} documents…`)

for (const doc of documents) {
  const { data, error } = await supabase
    .from('documents')
    .upsert(doc, { onConflict: 'internal_code' })
    .select('id, internal_code, title')

  if (error) {
    console.error(`  ✗ ${doc.internal_code}: ${error.message}`)
  } else {
    console.log(`  ✓ ${doc.internal_code} — ${doc.title}`)
  }
}

console.log('\nDone!')
