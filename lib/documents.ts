export type DocumentType = 'sop' | 'form' | 'email_template' | 'assignment' | string

export interface DocumentSummary {
  id: string
  title: string
  department_id: string
  department_name: string
  document_type: DocumentType
  updated_at: string
}

export interface DocumentFull extends DocumentSummary {
  content: string
  related_documents: { id: string; title: string }[]
}

export interface TocEntry {
  id: string
  text: string
}

export interface Department {
  id: string
  name: string
  sort_order: number
}

export interface SidebarData {
  departments: Department[]
  documents: DocumentSummary[]
}

export const DEPT_DESCRIPTIONS: Record<string, string> = {
  'Продажби': 'Управление на клиентски отношения и оферти',
  'Логистика': 'Доставки, складиране и транспорт',
  'Рекламации': 'Обработка на жалби и рекламационни процеси',
  'Производство': 'Производствени процеси и контрол на качеството',
  'Човешки ресурси': 'Назначения, обучения и HR процеси',
  'Финанси': 'Финансови отчети, фактури и плащания',
}

// SVG path data for each department icon
export const DEPT_ICONS: Record<string, string> = {
  'Продажби': 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  'Логистика': 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  'Рекламации': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  'Производство': 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495',
  'Човешки ресурси': 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  'Финанси': 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const DEPT_ICON_DEFAULT = 'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776'

export function getDepartmentIconPath(name: string): string {
  return DEPT_ICONS[name] ?? DEPT_ICON_DEFAULT
}

export function parseDocumentType(type: DocumentType): string {
  const map: Record<string, string> = {
    sop: 'Процес',
    form: 'Форма',
    email_template: 'Имейл шаблон',
    assignment: 'Задание',
  }
  return map[type] ?? 'Документ'
}

export function getTypeIcon(type: DocumentType): string {
  const icons: Record<string, string> = {
    sop: '≡',
    form: '□',
    email_template: '✉',
    assignment: '◎',
  }
  return icons[type] ?? '·'
}

export interface ParsedDocContent {
  description: string   // extracted from **Описание:** field
  cleanContent: string  // metadata block + version history removed
}

/**
 * Strips internal metadata block (Код, Версия, Отговорник, etc.) and
 * version history section from document markdown before rendering.
 * Extracts the **Описание:** value to display separately.
 */
export function parseDocumentContent(markdown: string): ParsedDocContent {
  const lines = markdown.split('\n')
  let description = ''
  let contentStart = 0

  // Scan first ~25 lines for metadata key-value pairs and the closing ---
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const line = lines[i].trim()

    // Extract description
    const descMatch = line.match(/^\*\*Описание:\*\*\s*(.+)/)
    if (descMatch) description = descMatch[1].trim()

    // The metadata block ends at the first --- that follows at least one bold key-value
    if (line === '---' && i > 0) {
      const hasMeta = lines.slice(0, i).some((l) => /^\*\*[А-Яа-яA-Za-z]/.test(l.trim()))
      if (hasMeta) {
        contentStart = i + 1
        break
      }
    }
  }

  let cleanLines = contentStart > 0 ? lines.slice(contentStart) : lines

  // Drop leading blank lines
  while (cleanLines.length > 0 && cleanLines[0].trim() === '') {
    cleanLines = cleanLines.slice(1)
  }

  // Remove version history section
  const vhIdx = cleanLines.findIndex((l) =>
    /^## .*(версионна история|version history)/i.test(l.trim())
  )
  if (vhIdx >= 0) cleanLines = cleanLines.slice(0, vhIdx)

  return { description, cleanContent: cleanLines.join('\n').trim() }
}

export interface ParsedEmailSection {
  title: string
  faza?: string
  koga?: string
  cel?: string
  emailBody: string
}

/**
 * Splits a document that contains multiple ## ИМЕЙЛ X sections into
 * individual email objects with metadata separated from body text.
 * Returns [] if no ИМЕЙЛ sections found (use raw content instead).
 */
export function parseEmailDocument(content: string): ParsedEmailSection[] {
  const parts = content.split(/(?=^## )/m)
  const result: ParsedEmailSection[] = []

  for (const part of parts) {
    const titleMatch = part.match(/^## (.+)/)
    if (!titleMatch) continue

    const title = titleMatch[1].trim()
    const rest = part.slice(part.indexOf('\n') + 1)

    // Split on first horizontal rule to separate metadata from email body
    const hrIdx = rest.search(/^---\s*$/m)
    const metaBlock = hrIdx >= 0 ? rest.slice(0, hrIdx) : ''
    const emailBody = hrIdx >= 0 ? rest.slice(hrIdx + 4).trim() : rest.trim()

    const faza = metaBlock.match(/\*\*Фаза:\*\*\s*(.+)/)?.[1]?.trim()
    const koga = metaBlock.match(/\*\*Кога:\*\*\s*(.+)/)?.[1]?.trim()
    const cel  = metaBlock.match(/\*\*Цел:\*\*\s*(.+)/)?.[1]?.trim()

    // Strip trailing sign-off (Утвърдил/Дата) that may follow the last --- in the body
    const signOffIdx = emailBody.search(/\n---\s*\n\*\*Утвърдил:/)
    const cleanBody = (signOffIdx >= 0 ? emailBody.slice(0, signOffIdx) : emailBody)
      .replace(/^\*\*Утвърдил:.*\n?/gm, '')
      .replace(/^\*\*Дата:.*\n?/gm, '')
      .trim()

    if (cleanBody) result.push({ title, faza, koga, cel, emailBody: cleanBody })
  }

  return result
}

/**
 * Strips explanatory/instructional italic paragraphs, → arrows, and the
 * signature table from questionnaire/form content for clean print display.
 */
export function stripFormExplanations(content: string): string {
  const lines = content.split('\n')
  const out: string[] = []
  let skip = false
  let prevWasLabeledFill = false

  for (const line of lines) {
    const t = line.trim()

    // Stop at sign-off / awareness table
    if (
      /ЗАПОЗНАТИ С ДОКУМЕНТА/i.test(t) ||
      /^ЗАПОЗНАТ СЪМ/i.test(t) ||
      /Утвърдил:/i.test(t)
    ) {
      skip = true
    }
    if (skip) continue

    // Remove italic explanatory paragraphs (entire line wrapped in * or _)
    if (/^\*[^*].+[^*]\*$/.test(t) || /^_[^_].+[^_]_$/.test(t)) continue

    // Remove inline instruction lines starting with →
    if (t.startsWith('→')) continue

    // Remove standalone horizontal rules — decorative separators between questions
    if (t === '---') continue

    // Remove single anonymous ___ continuation lines that follow a labeled fill field.
    // Multi-line blocks (e.g. 3-line comment area) are kept because prevWasLabeledFill
    // resets to false after the first anonymous line is kept.
    const isAnonymousFill = /^_{3,}$/.test(t)
    const isLabeledFill = t.length > 0 && t.includes('___') && /\*\*[^*]+:\*\*/.test(t)
    if (isAnonymousFill && prevWasLabeledFill) continue

    // Update flag on non-empty, non-skipped lines
    if (t.length > 0) prevWasLabeledFill = isLabeledFill

    out.push(line)
  }

  // Collapse 3+ consecutive blank lines into 2
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// Maximum label length (chars) for a fill field to be eligible for auto two-column pairing.
// Fields with labels ≤ this length will be combined into two-column rows when consecutive.
// Fields exceeding this stay full-width (e.g. "Адрес на доставка и монтаж:" = 27 chars).
const FILL_PAIR_MAX_LABEL = 20

/**
 * Post-processes stripped form content to automatically combine consecutive short
 * labeled fill fields into two-column rows using &nbsp;&nbsp; separator.
 *
 * Rules:
 *   - Two consecutive single-line labeled fill fields where BOTH have label ≤ 20 chars → merge
 *   - Fields already containing &nbsp;&nbsp; (manually paired) are left as-is
 *   - Any non-fill block (heading, question text, etc.) acts as a barrier — resets pairing
 */
export function autoLayoutFields(content: string): string {
  const blocks = content.split(/\n{2,}/)
  const result: string[] = []
  let i = 0

  while (i < blocks.length) {
    const cur = blocks[i].trim()
    const nxt = i + 1 < blocks.length ? blocks[i + 1].trim() : null

    if (nxt !== null && isShortLabeledFill(cur) && isShortLabeledFill(nxt)) {
      result.push(`${cur} &nbsp;&nbsp; ${nxt}`)
      i += 2
    } else {
      result.push(blocks[i])
      i++
    }
  }

  return result.join('\n\n')
}

function isShortLabeledFill(block: string): boolean {
  const lines = block.split('\n').filter(l => l.trim() !== '')
  if (lines.length !== 1) return false
  const t = lines[0].trim()
  // Skip already-paired fields
  if (t.includes('&nbsp;&nbsp;') || t.includes('\u00a0\u00a0')) return false
  const m = t.match(/^\*\*([^*]+)\*\*.*_{3,}/)
  if (!m) return false
  return m[1].trim().length <= FILL_PAIR_MAX_LABEL
}

/**
 * Transforms lines containing ___ fill patterns into styled HTML divs.
 * Requires rehype-raw in ReactMarkdown to render the output.
 *
 * Rules:
 *   **Label:** ___                               → single full-width field
 *   ___                                          → unlabeled fill line (notes area)
 *   **A:** ___ &nbsp;&nbsp; **B:** ___           → two-column
 *   **A:** ___ &nbsp;&nbsp; **B:** ___ &nbsp;&nbsp; **C:** ___ → three-column
 *
 * Skips: list items (- * +), table rows (|), headings (#), blockquotes (>)
 */
export function transformFormFields(content: string): string {
  return content.split('\n').map(transformFieldLine).join('\n')
}

function transformFieldLine(line: string): string {
  const t = line.trim()
  if (!t.includes('___')) return line
  // Skip markdown block markers — only transform standalone paragraph lines
  if (/^[-*+>|#]/.test(t) || /^\d+\./.test(t)) return line

  // Split on &nbsp;&nbsp; separators — two/three column layout
  const parts = t.split(/\s*&nbsp;&nbsp;\s*/)
  if (parts.length > 1 && parts.every(p => p.includes('___'))) {
    return `<div class="ff-row">${parts.map(renderFieldCol).join('')}</div>`
  }

  return `<div class="ff-row">${renderFieldCol(t)}</div>`
}

function renderFieldCol(text: string): string {
  const m = text.match(/^(.*?)_{3,}(.*)$/)
  if (!m) return `<div class="ff"><span class="ff-fill"></span></div>`

  const rawLabel = m[1].trim()
  const suffix   = m[2].trim()

  const label     = rawLabel.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  const labelHtml  = label  ? `<span class="ff-label">${label}</span>`  : ''
  const suffixHtml = suffix ? `<span class="ff-suffix">${suffix}</span>` : ''

  return `<div class="ff">${labelHtml}<span class="ff-fill"></span>${suffixHtml}</div>`
}

export function extractH2Headings(markdown: string): TocEntry[] {
  const lines = markdown.split('\n')
  const headings: TocEntry[] = []
  for (const line of lines) {
    const match = line.match(/^## (.+)/)
    if (match) {
      const text = match[1].trim()
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0400-\u04FF-]/g, '')
      headings.push({ id, text })
    }
  }
  return headings
}

