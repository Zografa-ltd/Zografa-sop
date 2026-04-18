'use client'

import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { PrintButton } from './PrintButton'
import { CopyButton } from './CopyButton'
import { useToc } from './TocContext'
import { extractH2Headings, parseDocumentContent, parseDocumentType, DocumentFull } from '@/lib/documents'

interface DocumentViewerProps {
  doc: DocumentFull
}

const TYPE_COLORS: Record<string, string> = {
  sop:            'bg-blue-50 text-blue-700',
  form:           'bg-amber-50 text-amber-700',
  email_template: 'bg-violet-50 text-violet-700',
  assignment:     'bg-emerald-50 text-emerald-700',
}

export function DocumentViewer({ doc }: DocumentViewerProps) {
  const { setHeadings } = useToc()
  const { description, cleanContent } = parseDocumentContent(doc.content)
  const headings = extractH2Headings(cleanContent)
  const typeLabel = parseDocumentType(doc.document_type)
  const typeColor = TYPE_COLORS[doc.document_type] ?? 'bg-gray-50 text-gray-600'

  // Register TOC headings in sidebar context
  useEffect(() => {
    setHeadings(headings)
    return () => setHeadings([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id])

  const updatedDate = new Date(doc.updated_at).toLocaleDateString('bg-BG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-5 text-xs text-[#6B6660] print:hidden flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#C41E2A] transition-colors">Документи</Link>
        <svg className="h-3 w-3 text-[#E4E1DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/?dept=${doc.department_id}`} className="hover:text-[#C41E2A] transition-colors">
          {doc.department_name}
        </Link>
        <svg className="h-3 w-3 text-[#E4E1DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[#1A1A1A]">{doc.title}</span>
      </nav>

      {/* Print header — hidden on screen */}
      <div className="print-logo-header hidden print:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Зографа" />
        <div>
          <div className="print-doc-title">{doc.title}</div>
          <div className="print-doc-meta">
            {doc.department_name} · {typeLabel} · Обновен: {updatedDate}
          </div>
        </div>
      </div>

      {/* Screen header */}
      <header className="mb-6 border-b border-[#E4E1DB] pb-5 print:hidden">
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${typeColor}`}>
            {typeLabel}
          </span>
          <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#F0EDE8] text-[#6B6660]">
            {doc.department_name}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] leading-snug">
          {doc.title}
        </h1>
        <p className="mt-1 text-xs text-[#6B6660]">Обновен: {updatedDate}</p>
        <div className="mt-4 flex gap-2">
          <PrintButton />
          <CopyButton content={cleanContent} />
        </div>
      </header>

      {/* Description (if present) */}
      {description && (
        <p className="mb-6 text-sm text-[#6B6660] italic leading-relaxed border-l-2 border-[#E4E1DB] pl-3 print:hidden">
          {description}
        </p>
      )}

      {/* Document body */}
      <article
        className="prose max-w-none
          prose-headings:font-sans prose-headings:text-[#1A1A1A]
          prose-h1:text-[26px] prose-h1:font-bold prose-h1:leading-tight prose-h1:mt-10 prose-h1:mb-4
          prose-h2:text-[20px] prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-3 prose-h2:pt-8 prose-h2:border-t prose-h2:border-[#E4E1DB]
          prose-h3:text-[17px] prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-2
          prose-p:text-[15px] prose-p:text-[#1A1A1A] prose-p:leading-[1.72] prose-p:my-3
          prose-li:text-[15px] prose-li:text-[#1A1A1A] prose-li:leading-[1.72] prose-li:my-1
          prose-ul:my-3 prose-ol:my-3
          prose-strong:text-[#1A1A1A] prose-strong:font-semibold
          prose-table:text-sm
          prose-th:bg-[#F7F6F4] prose-th:font-semibold prose-th:text-sm
          prose-td:py-2 prose-td:px-3 prose-td:text-sm
          prose-a:text-[#C41E2A] prose-a:no-underline hover:prose-a:underline
          prose-hr:border-[#E4E1DB] prose-hr:my-8
          print:max-w-full"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children, ...props }) => {
              const text = String(children)
              const id = text
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\u0400-\u04FF-]/g, '')
              return <h2 id={id} {...props}>{children}</h2>
            },
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </article>

      {/* Related documents */}
      {doc.related_documents.length > 0 && (
        <footer className="mt-12 border-t border-[#E4E1DB] pt-5 print:hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B6660] mb-3">
            Свързани документи
          </h2>
          <ul className="flex flex-col gap-1.5">
            {doc.related_documents.map((rel) => (
              <li key={rel.id}>
                <Link href={`/documents/${rel.id}`} className="text-sm text-[#C41E2A] hover:underline">
                  {rel.title}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  )
}
