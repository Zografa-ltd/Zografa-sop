'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { CopyButton } from './CopyButton'
import { PrintButton } from './PrintButton'
import {
  parseDocumentContent,
  parseEmailDocument,
  stripFormExplanations,
  autoLayoutFields,
  parseDocumentType,
  DocumentType,
} from '@/lib/documents'

interface GroupDocument {
  id: string
  title: string
  document_type: DocumentType
  updated_at: string
  content: string
  content_html?: string | null
}

interface DocumentGroupViewProps {
  documents: GroupDocument[]
  deptName: string
  type: DocumentType
}

const TYPE_COLORS: Record<string, string> = {
  sop:            'bg-blue-50 text-blue-700',
  form:           'bg-amber-50 text-amber-700',
  email_template: 'bg-violet-50 text-violet-700',
  assignment:     'bg-emerald-50 text-emerald-700',
}

const PROSE =
  'prose prose-sm max-w-none ' +
  'prose-headings:font-sans prose-headings:text-[#1A1A1A] prose-headings:font-semibold ' +
  'prose-h1:text-lg prose-h1:mt-6 prose-h1:mb-3 ' +
  'prose-h2:text-[15px] prose-h2:mt-6 prose-h2:mb-2.5 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#E4E1DB] ' +
  'prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1.5 ' +
  'prose-p:text-[#1A1A1A] prose-p:text-sm prose-p:leading-[1.65] prose-p:my-2 ' +
  'prose-li:text-[#1A1A1A] prose-li:text-sm prose-li:leading-[1.65] prose-li:my-0.5 ' +
  'prose-ul:my-2 prose-ol:my-2 ' +
  'prose-strong:text-[#1A1A1A] prose-strong:font-semibold ' +
  'prose-table:text-xs ' +
  'prose-th:bg-[#F7F6F4] prose-th:font-semibold prose-th:text-xs ' +
  'prose-td:py-1.5 prose-td:px-2 prose-td:text-xs ' +
  'prose-a:text-[#C41E2A] prose-a:no-underline hover:prose-a:underline ' +
  'prose-hr:border-[#E4E1DB] prose-hr:my-4 '

// ── Form field rendering ──────────────────────────────────────────────────────
// Custom ReactMarkdown <p> component that turns ___ fill-field patterns into
// CSS-styled underline fields without needing rehype-raw.
//
// Supported patterns (all must have blank lines above/below in the MD file):
//   **Label:** ___                           → full-width field with label
//   ___                                      → unlabeled fill line
//   **A:** ___ &nbsp;&nbsp; **B:** ___       → two columns
//   **A:** ___ &nbsp;&nbsp; **B:** ___ &nbsp;&nbsp; **C:** ___ → three columns

type CN = React.ReactNode

function flatText(n: CN): string {
  if (typeof n === 'string') return n
  if (typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(flatText).join('')
  if (React.isValidElement(n)) return flatText((n.props as { children?: CN }).children)
  return ''
}

// Split a flat child array at &nbsp;&nbsp; column separators within text nodes.
// &nbsp; is decoded to \u00a0 by remark; we also check for the literal string as a fallback.
function splitColumns(nodes: CN[]): CN[][] {
  const SEP1 = '\u00a0\u00a0'
  const SEP2 = '&nbsp;&nbsp;'
  const cols: CN[][] = [[]]

  for (const node of nodes) {
    if (typeof node === 'string') {
      const sep = node.includes(SEP1) ? SEP1 : node.includes(SEP2) ? SEP2 : null
      if (sep) {
        const parts = node.split(sep)
        cols[cols.length - 1].push(parts[0].trimEnd())
        for (let i = 1; i < parts.length; i++) {
          cols.push([parts[i].trimStart()])
        }
        continue
      }
    }
    cols[cols.length - 1].push(node)
  }

  return cols.filter(col => flatText(col).replace(/\s/g, '').length > 0)
}

// Render one column: collect label nodes before ___, fill span, optional suffix.
function FormCol({ nodes, colKey }: { nodes: CN[]; colKey: number }): React.ReactElement {
  const label: CN[] = []
  let suffix = ''
  let found = false

  for (const node of nodes) {
    if (found) {
      if (typeof node === 'string') suffix += node
      continue
    }
    if (typeof node === 'string' && node.includes('___')) {
      const idx = node.search(/_{3,}/)
      const before = node.slice(0, idx).trim()
      const after  = node.slice(idx).replace(/^_{3,}/, '').trim()
      if (before) label.push(before)
      if (after)  suffix = after
      found = true
    } else {
      label.push(node)
    }
  }

  const trimmedLabel = label.filter(n => typeof n !== 'string' || (n as string).trim() !== '')

  return (
    <div key={colKey} className="ff">
      {trimmedLabel.length > 0 && <span className="ff-label">{trimmedLabel}</span>}
      <span className="ff-fill" />
      {suffix && <span className="ff-suffix">{suffix}</span>}
    </div>
  )
}

// ── Checkbox list multi-column ────────────────────────────────────────────────
// When a <ul> contains only ☐ checkbox items (- ☐ text) and all items are short:
//   3–4 items → 2 columns
//   5+ items  → 3 columns
// Long items (> 40 chars) keep single-column to avoid wrapping.

const CB_MAX_ITEM_LEN = 40

function CheckboxUl({ children, ...rest }: React.ComponentPropsWithoutRef<'ul'> & { children?: CN }) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  if (items.length < 3) return <ul {...rest}>{children}</ul>

  const texts = items.map(item =>
    flatText((item as React.ReactElement<{ children?: CN }>).props?.children ?? '')
  )
  const allCheckbox = texts.every(t => t.includes('☐'))
  const maxLen = Math.max(...texts.map(t => t.replace('☐', '').trim().length))

  if (!allCheckbox || maxLen > CB_MAX_ITEM_LEN) return <ul {...rest}>{children}</ul>

  const cols = items.length >= 5 ? 3 : 2

  return (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        columnGap: cols === 3 ? '0.75rem' : '1.5rem',
        rowGap: '0.15rem',
        listStyle: 'none',
        paddingLeft: 0,
        margin: '0.5rem 0',
      }}
    >
      {children}
    </ul>
  )
}

function FormParagraph({ children, ...rest }: React.ComponentPropsWithoutRef<'p'> & { children?: CN }) {
  if (!flatText(children).includes('___')) {
    return <p {...rest}>{children}</p>
  }
  const cols = splitColumns(React.Children.toArray(children as React.ReactNode))
  return (
    <div className="ff-row">
      {cols.map((col, i) => <FormCol key={i} nodes={col} colKey={i} />)}
    </div>
  )
}

// ── Window box ────────────────────────────────────────────────────────────────
interface WindowBoxProps {
  content: string
  actionSlot: React.ReactNode
  headerLabel?: string
  title?: string
  htmlContent?: string | null
}

function WindowBox({ content, actionSlot, headerLabel, title, htmlContent }: WindowBoxProps) {
  return (
    <div className="rounded-xl border border-[#E4E1DB] bg-white overflow-hidden shadow-sm">
      {/* header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#F7F6F4] border-b border-[#E4E1DB]">
        <span className="text-[11px] text-[#6B6660]">{headerLabel ?? ''}</span>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Зографа" className="h-[18px] w-auto opacity-50 print:opacity-70" />
          <div className="flex items-center gap-1.5 print:hidden">{actionSlot}</div>
        </div>
      </div>
      {/* content */}
      <div className="px-6 py-5">
        {title && (
          <div className="text-center mb-5 pb-4 border-b border-[#E4E1DB]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6B6660]">
              {title}
            </p>
          </div>
        )}
        {htmlContent ? (
          <div
            className="mammoth-form"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <article className={PROSE}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: FormParagraph, ul: CheckboxUl }}>
              {content}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  )
}

// ── Email group ───────────────────────────────────────────────────────────────
function EmailGroup({ doc }: { doc: GroupDocument }) {
  const { cleanContent } = parseDocumentContent(doc.content)
  const sections = parseEmailDocument(cleanContent)

  // If no parsed sections, fall back to one box for the whole doc
  if (sections.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-[#1A1A1A]">{doc.title}</h2>
        <WindowBox
          content={cleanContent}
          actionSlot={<CopyButton content={cleanContent} />}
          headerLabel="Имейл шаблон"
        />
      </div>
    )
  }

  return (
    <div className="space-y-14">
      {sections.map((s, i) => (
        <div key={i} className="space-y-3">
          {/* Title above box */}
          <h2 className="text-lg font-semibold text-[#1A1A1A]">{s.title}</h2>

          {/* Meta above box */}
          {(s.faza || s.koga || s.cel) && (
            <div className="space-y-1 text-sm text-[#6B6660]">
              {s.faza && <p><span className="font-medium text-[#1A1A1A]">Фаза:</span> {s.faza}</p>}
              {s.koga && <p><span className="font-medium text-[#1A1A1A]">Кога:</span> {s.koga}</p>}
              {s.cel  && <p><span className="font-medium text-[#1A1A1A]">Цел:</span> {s.cel}</p>}
            </div>
          )}

          {/* Window box — email body only */}
          <WindowBox
            content={s.emailBody}
            actionSlot={<CopyButton content={s.emailBody} />}
            headerLabel="Имейл шаблон"
          />
        </div>
      ))}
    </div>
  )
}

// ── Form/questionnaire group ──────────────────────────────────────────────────
function FormItem({ doc }: { doc: GroupDocument }) {
  const { description, cleanContent } = parseDocumentContent(doc.content)
  const formContent = doc.document_type === 'assignment'
    ? cleanContent
    : autoLayoutFields(stripFormExplanations(cleanContent))

  const updatedDate = new Date(doc.updated_at).toLocaleDateString('bg-BG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-2">
      {/* Title + date above box */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{doc.title}</h2>
        <p className="text-[11px] text-[#6B6660] mt-0.5 print:hidden">Обновен: {updatedDate}</p>
      </div>

      {/* Description above box — only for markdown forms (HTML forms embed their own title) */}
      {description && !doc.content_html && (
        <p className="text-sm text-[#6B6660] italic leading-relaxed">
          {description}
        </p>
      )}

      {/* Window box — HTML (from AI agent) or legacy markdown */}
      <WindowBox
        content={formContent}
        htmlContent={doc.content_html}
        title={doc.content_html ? undefined : doc.title}
        actionSlot={
          <>
            <Link
              href={`/documents/${doc.id}`}
              className="text-[11px] text-[#6B6660] hover:text-[#C41E2A] transition-colors"
            >
              Отвори
            </Link>
            <PrintButton />
          </>
        }
        headerLabel="Формуляр"
      />
    </div>
  )
}

// ── Main DocumentGroupView ────────────────────────────────────────────────────
export function DocumentGroupView({ documents, deptName, type }: DocumentGroupViewProps) {
  const typeLabel = parseDocumentType(type)
  const typeColor = TYPE_COLORS[type] ?? 'bg-gray-50 text-gray-600'
  const isEmail = type === 'email_template'

  if (documents.length === 0) {
    return <p className="py-20 text-sm text-[#6B6660]">Няма документи от този тип</p>
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 border-b border-[#E4E1DB] pb-6 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${typeColor}`}>
            {typeLabel}
          </span>
          <span className="text-xs text-[#6B6660]">{deptName}</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {deptName} — {typeLabel}
        </h1>
        <p className="mt-1 text-xs text-[#6B6660]">
          {documents.length} {documents.length === 1 ? 'документ' : 'документа'}
        </p>
      </div>

      {/* Documents */}
      <div className="space-y-12">
        {documents.map((doc, idx) => (
          <section key={doc.id}>
            {idx > 0 && <div className="mb-12 border-t border-[#E4E1DB]" />}
            {isEmail
              ? <EmailGroup doc={doc} />
              : <FormItem doc={doc} />
            }
          </section>
        ))}
      </div>
    </div>
  )
}
