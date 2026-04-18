# Зографа SOP — Глобален план (окончателен)

> **За изпълнение:** Използвай superpowers:executing-plans за task-by-task изпълнение.

**Goal:** Вътрешна SOP система за Зографа — служителски четец, admin панел за управление, AI агент за конвертиране и подобряване на документи.

**Architecture:** Next.js 16 App Router + Supabase PostgreSQL + Tailwind CSS v4. Три слоя: Employee UI (четене), Admin UI (управление), AI/Scripts (конвертиране).

**Tech Stack:** Next.js 16, React 19, Supabase, TypeScript, Tailwind CSS v4, react-markdown, mammoth 1.12.0, JSZip, Gemini API, PM2 + Nginx

**Deployment:** `sop.zografa.com` (VPS, Nginx reverse proxy, PM2, Let's Encrypt SSL)

---

## ТЕКУЩ СТАТУС — 2026-04-18

### ✅ ЗАВЪРШЕНО

#### Инфраструктура
- [x] Supabase DB схема — departments, documents, document_versions, document_relations
- [x] `content_html` колона за HTML форми (docx path)
- [x] Auth — bcrypt пароли, HMAC-SHA256 signed cookies, роли (employee/admin)
- [x] Middleware (proxy.ts) — защита на маршрути по роля
- [x] Deployment инфраструктура — PM2 + nginx + deploy.sh + ecosystem.config.js
- [x] SSL — Let's Encrypt на sop.zografa.com

#### Employee App (служителски интерфейс) — 95% готов
- [x] SidebarShell — две колони, independent scroll, TocProvider, Toaster
- [x] Sidebar — навигация по направления/типове, LocalStorage expand state, TOC
- [x] HomepageGrid — карти по направления с икони и линкове
- [x] DocumentGroupView — WindowBox pattern (форми, имейли, задания)
- [x] DocumentViewer — markdown render, TOC, breadcrumb, related docs footer
- [x] Имейл шаблони — секции с мета (Фаза/Кога/Цел), Copy бутон
- [x] Форми — Markdown path (ff-row fill fields, transformFormFields)
- [x] Форми — HTML path (mammoth-form CSS, dangerouslySetInnerHTML)
- [x] Print CSS — компактен (9pt, 1.2cm, лого header, version history скрит)
- [x] Mobile responsive — hamburger, backdrop overlay
- [x] SearchBar

#### Конвертор (.docx → HTML)
- [x] `scripts/convert-form.mjs` — CLI скрипт
- [x] Word XML парсинг: таблици, параграфи, линии (w:pBdr), shading (w:shd), размери (w:sz), клетъчни марджини (w:tcMar)
- [x] Font size inheritance chain: run → pPr → style → docDefault
- [x] Качени HTML форми: TMP_SALE_001A, TMP_SALE_001A2, TMP_SALE_001C

#### Съдържание (MD документи — 15 файла)
- [x] `scripts/seed-documents.mjs` — upsert по internal_code
- [x] 15 MD документа в `content/` (3 SOPs, 7 форми, 2 имейл шаблона, 1 задание)
- [x] `DOCUMENT_FORMAT.md` — стандарт за форматиране
- [x] 3 направления покрити: SALE, LOG, REK

#### Тестове
- [x] Unit: lib/documents.ts, lib/auth.ts, lib/supabase.ts
- [x] API: /api/documents, /api/documents/[id]
- [x] Components: DocumentCard, TableOfContents, SearchBar, DocumentLibrary

---

### 🔴 НЕЗАВЪРШЕНО — пълен списък

---

## ФАЗА 0: Спешни поправки (преди следващото)

### Task 0.1: Сигурност — премахни hardcoded credentials в seed скрипта

**Проблем:** `scripts/seed-documents.mjs` съдържа Supabase URL и SERVICE_KEY директно в кода — ако файлът се качи в git, ключовете изтичат.

**Files:**
- Modify: `scripts/seed-documents.mjs`

- [ ] Добавяне на .env.local четене (как е в convert-form.mjs):
```javascript
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
```

- [ ] Провери `.gitignore` съдържа `.env.local`
- [ ] Commit: `fix: move seed script credentials to .env.local`

---

### Task 0.2: Git push + deploy на 17 uncommitted commits

- [ ] `git add -A` (всички нови и модифицирани файлове)
- [ ] `git commit -m "feat: complete employee app, sidebar, forms HTML, converter script"`
- [ ] `git push origin main`
- [ ] На VPS: `bash scripts/deploy.sh`
- [ ] Провери на sop.zografa.com

---

### Task 0.3: Изчисти stale тест

**Files:**
- Delete: `__tests__/components/DepartmentNav.test.tsx`

- [ ] Изтрий файла (компонентът е изтрит)
- [ ] `npm test` — всички тестове трябва да минат
- [ ] Commit: `test: remove stale DepartmentNav test`

---

## ФАЗА 1: Admin панел

### Task 1.1: Admin — API ендпойнти за управление

**Files:**
- Create: `app/api/admin/documents/route.ts` (GET всички + PATCH)
- Create: `app/api/admin/documents/[id]/route.ts` (PATCH статус, PUT съдържание)

- [ ] GET `/api/admin/documents` — всички документи (без status filter):
```typescript
export async function GET() {
  const { data } = await supabaseAdmin
    .from('documents')
    .select('id, internal_code, title, type, status, current_version, updated_at, department_id, departments(display_name)')
    .order('updated_at', { ascending: false })
  return Response.json(data ?? [])
}
```

- [ ] PATCH `/api/admin/documents/[id]` — промяна на статус:
```typescript
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const allowed = ['draft', 'under_review', 'published', 'archived']
  if (!allowed.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 })
  const { error } = await supabaseAdmin
    .from('documents').update({ status }).eq('id', params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

- [ ] Commit: `feat: admin document management API routes`

---

### Task 1.2: Admin — Списък с документи (dashboard)

**Files:**
- Modify: `app/(admin)/admin/page.tsx`
- Create: `app/(admin)/admin/components/DocumentTable.tsx`
- Create: `lib/admin-data.ts`

- [ ] `lib/admin-data.ts`:
```typescript
import { supabaseAdmin } from './supabase'

export async function getAllDocumentsAdmin() {
  const { data } = await supabaseAdmin
    .from('documents')
    .select('id, internal_code, title, type, status, current_version, updated_at, department_id, departments(display_name)')
    .order('updated_at', { ascending: false })
  return data ?? []
}
```

- [ ] `DocumentTable.tsx` — server component таблица:
  - Колони: Код | Заглавие | Направление | Тип | Статус | Версия | Обновен
  - Статус badge с цвят (draft=gray, published=green, archived=red)
  - Бутони: Publish / Unpublish (client actions)

- [ ] Замени stub-а в `admin/page.tsx`:
```tsx
export default async function AdminPage() {
  const docs = await getAllDocumentsAdmin()
  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Admin панел</h1>
        <a href="/admin/upload" className="px-4 py-2 bg-[#C41E2A] text-white text-sm rounded-lg">
          + Качи форма
        </a>
      </div>
      <DocumentTable documents={docs} />
    </div>
  )
}
```

- [ ] Commit: `feat: admin dashboard with document list`

---

### Task 1.3: Admin — Upload на .docx (без CLI)

**Files:**
- Create: `lib/docx-converter.ts` (извлечена логика от convert-form.mjs)
- Create: `app/api/admin/upload-form/route.ts`
- Create: `app/(admin)/admin/upload/page.tsx`

- [ ] `npm install jszip` (замяна на shell `unzip` — работи на сървър/Vercel):
```bash
npm install jszip
npm install --save-dev @types/jszip
```

- [ ] `lib/docx-converter.ts` — пренеси логиката от convert-form.mjs, замени `execSync('unzip -p ...')` с JSZip:
```typescript
import JSZip from 'jszip'

export async function convertDocxToHtml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const documentXml = await zip.file('word/document.xml')?.async('string') ?? ''
  const stylesXml = await zip.file('word/styles.xml')?.async('string') ?? ''
  // ... same XML parsing logic (szToPx, dxaToPx, loadStyleFontSizes, convertParagraph, etc.)
  return html
}
```

- [ ] `app/api/admin/upload-form/route.ts`:
```typescript
export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File
  const code = form.get('internal_code') as string
  if (!file || !code) return Response.json({ error: 'Missing file or code' }, { status: 400 })
  
  const buffer = Buffer.from(await file.arrayBuffer())
  const html = await convertDocxToHtml(buffer)
  
  const { data, error } = await supabaseAdmin
    .from('documents')
    .update({ content_html: html })
    .eq('internal_code', code)
    .select('id, title')
  
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data?.length) return Response.json({ error: 'Document not found' }, { status: 404 })
  return Response.json({ ok: true, title: data[0].title })
}
```

- [ ] Upload страница (`app/(admin)/admin/upload/page.tsx`):
  - `<select>` с всички форми от DB (само type='form')
  - File input за .docx
  - Submit → POST /api/admin/upload-form
  - Toast успех/грешка → redirect към /admin

- [ ] Тест: качи TMP_SALE_001A.docx от UI → провери content_html в Supabase
- [ ] Commit: `feat: admin upload UI for docx forms (no CLI needed)`

---

### Task 1.4: Admin — Document relations (свързани документи)

**Проблем:** Таблицата `document_relations` е в схемата, но никъде не се попълва — свързаните документи не работят.

**Files:**
- Create: `app/api/admin/documents/[id]/relations/route.ts`
- Create: `app/(admin)/admin/documents/[id]/page.tsx`

- [ ] API за добавяне на релации:
```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { related_id, relation_type } = await req.json()
  const { error } = await supabaseAdmin
    .from('document_relations')
    .insert({ document_id: params.id, related_document_id: related_id, relation_type })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
```

- [ ] Admin страница за единичен документ с UI за добавяне на релации
- [ ] Seed начални релации: SOP_SALE_001 → TMP_SALE_001A, TMP_SALE_001A2, TMP_SALE_001B, TMP_SALE_001C

- [ ] Commit: `feat: document relations management in admin`

---

## ФАЗА 2: AI агент

> `GEMINI_API_KEY` вече е в `.env.local`. `mammoth 1.12.0` вече е инсталиран.

### Task 2.1: AI конвертор — .docx текст → форматиран Markdown

**Случай на употреба:** SOPs и имейл шаблони идват като Word файлове → Gemini ги форматира по DOCUMENT_FORMAT.md стандарта.

**Files:**
- Create: `lib/ai-agent.ts`
- Create: `app/api/admin/ai-convert/route.ts`
- Modify: `app/(admin)/admin/upload/page.tsx` (нов режим)

- [ ] `npm install @google/generative-ai`

- [ ] `lib/ai-agent.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import mammoth from 'mammoth'

const DOCUMENT_FORMAT = `/* paste key rules from DOCUMENT_FORMAT.md */`

export async function convertDocxToMd(buffer: Buffer, docType: 'sop' | 'email_template' | 'assignment'): Promise<string> {
  // 1. Extract raw text from docx
  const { value: rawText } = await mammoth.extractRawText({ buffer })
  
  // 2. Send to Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  const prompt = `Конвертирай следния документ в Markdown за Зографа SOP система.

ФОРМАТ (задължителен):
${DOCUMENT_FORMAT}

Тип документ: ${docType}
Документ:
${rawText}

Върни САМО markdown, без обяснения.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
```

- [ ] API `/api/admin/ai-convert`:
  - Приема .docx + docType
  - Извлича текст с mammoth
  - Изпраща на Gemini
  - Връща форматиран MD за преглед (НЕ записва автоматично)

- [ ] Upload страница — два режима:
  - "HTML форма (точен Word layout)" → съществуващия docx→HTML path
  - "SOP / Имейл (AI форматиране)" → новия Gemini path

- [ ] Commit: `feat: AI docx-to-markdown converter via Gemini`

---

### Task 2.2: AI review — преглед преди записване

**Files:**
- Create: `app/(admin)/admin/ai-review/page.tsx`

- [ ] Страница с две колони: оригинален текст | AI предложение
- [ ] Редактор (textarea) за корекции преди запис
- [ ] Бутон "Запиши" → PATCH content_md в Supabase + запис в document_versions
- [ ] Commit: `feat: AI review page — preview before saving`

---

### Task 2.3: AI подобряване на съществуващи документи

**Files:**
- Create: `app/api/admin/ai-improve/route.ts`
- Modify: `app/(admin)/admin/documents/[id]/page.tsx`

- [ ] API `/api/admin/ai-improve`:
```typescript
// Input: { content_md: string, docType: string }
// Output: { improved_md: string, changes_summary: string }
const prompt = `Подобри следния ${docType} документ. 
Провери: яснота, консистентност с формата, пропуски.
Върни: improved_md (подобреното съдържание) и changes_summary (кратко описание на промените на BG).`
```

- [ ] "Подобри с AI" бутон на admin документ страницата
- [ ] Ако се одобри → записва в content_md + нов ред в document_versions с ai_changes_summary
- [ ] Commit: `feat: AI document improvement with version tracking`

---

## ФАЗА 3: Продуктова йерархия

### Task 3.1: DB — product_models таблица

**Files:**
- Modify: `supabase/schema.sql`

- [ ] SQL в Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS product_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS product_model_id uuid REFERENCES product_models(id) ON DELETE SET NULL;

INSERT INTO product_models (department_id, name, code, sort_order) VALUES
  ('d504e75c-70d3-406c-9e0d-ac93aad59604', 'Рекламни стелажи', 'SALE_REK', 1),
  ('d504e75c-70d3-406c-9e0d-ac93aad59604', 'Магазинни стелажи', 'SALE_MAG', 2),
  ('09fe078c-e529-488f-976b-ab278e9b6303', 'Доставка и монтаж', 'LOG_DOM', 1),
  ('20fe1993-e532-47c7-90e0-1a4e9f829c53', 'Рекламации', 'REK_GEN', 1)
ON CONFLICT DO NOTHING;
```

- [ ] Обнови schema.sql референцния файл
- [ ] Commit: `feat: product_models table and document FK`

---

### Task 3.2: UI — навигация по продуктов модел

**Files:**
- Modify: `lib/server-data.ts`
- Modify: `components/employee/Sidebar.tsx`
- Modify: `components/employee/HomepageGrid.tsx`
- Modify: `app/(employee)/page.tsx`

- [ ] `getSidebarData()` → добавяне на product_models в query
- [ ] Sidebar: нов level — Направление → Продуктов модел → Тип документ
- [ ] URL структура: `/?dept=[id]&model=[id]&type=form`
- [ ] HomepageGrid: карти по продуктов модел вместо директно по тип
- [ ] Commit: `feat: product model hierarchy in navigation and sidebar`

---

## ФАЗА 4: E2E тестове

> `@playwright/test` е инсталиран, но няма написани тестове.

### Task 4.1: Playwright E2E — основни flows

**Files:**
- Create: `e2e/auth.spec.ts`
- Create: `e2e/employee.spec.ts`
- Create: `playwright.config.ts`

- [ ] `playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true }
})
```

- [ ] `e2e/auth.spec.ts`:
```typescript
test('employee login and redirect', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type=password]', process.env.E2E_EMPLOYEE_PASSWORD!)
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/')
})

test('admin login redirects to /admin', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type=password]', process.env.E2E_ADMIN_PASSWORD!)
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/admin')
})
```

- [ ] `e2e/employee.spec.ts` — тества: homepage карти, sidebar навигация, document viewer, print button
- [ ] `npm run test:e2e` в package.json
- [ ] Commit: `test: add Playwright E2E tests for auth and employee flow`

---

## ИЗВЕСТНИ БЪГОВЕ (за оправяне)

| Бъг | Файл | Приоритет |
|-----|------|-----------|
| DepartmentNav.test.tsx тества изтрит компонент | `__tests__/components/DepartmentNav.test.tsx` | Висок — Task 0.3 |
| Hardcoded credentials в seed скрипта | `scripts/seed-documents.mjs` | Висок — Task 0.1 |
| Sidebar TOC headings не се ресетват при навигация | `components/employee/TocContext.tsx` | Среден |
| Mobile SearchBar не затваря sidebar | `components/employee/SearchBar.tsx` | Нисък |

---

## ПРИОРИТЕТЕН РЕД И ОЦЕНКА

| Фаза | Задача | Стойност | Сложност | Статус |
|------|--------|----------|----------|--------|
| 0 | Credentials fix (seed script) | 🔴 Критично | Ниска | ❌ |
| 0 | Git push + deploy | 🔴 Критично | Ниска | ❌ |
| 0 | Stale test cleanup | Средна | Ниска | ❌ |
| 1 | Admin API ендпойнти | Висока | Ниска | ❌ |
| 1 | Admin dashboard | Висока | Ниска | ❌ |
| 1 | Admin upload .docx UI | Висока | Средна | ❌ |
| 1 | Document relations seed | Средна | Ниска | ❌ |
| 2 | AI конвертор (Gemini) | Висока | Средна | ❌ |
| 2 | AI review UI | Висока | Средна | ❌ |
| 2 | AI подобряване | Средна | Висока | ❌ |
| 3 | Product model DB | Средна | Ниска | ❌ |
| 3 | Product model UI | Средна | Висока | ❌ |
| 4 | E2E тестове | Ниска | Средна | ❌ |

---

## ПРЕПОРЪЧАН РЕД

1. **Днес:** Фаза 0 — спешни поправки + push + deploy (30 мин)
2. **След това:** Фаза 1 — Admin панел (2-3 сесии)
3. **После:** Фаза 2 — AI агент (2-3 сесии, GEMINI_API_KEY вече готов)
4. **Когато расте бизнесът:** Фаза 3 — Продуктова йерархия
5. **Паралелно:** Фаза 4 — E2E тестове (може да върви с всичко)
