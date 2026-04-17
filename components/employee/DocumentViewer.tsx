'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { TableOfContents } from './TableOfContents'
import { PrintButton } from './PrintButton'
import { CopyButton } from './CopyButton'
import { extractH2Headings, parseDocumentType, DocumentFull } from '@/lib/documents'

interface DocumentViewerProps {
  doc: DocumentFull
}

export function DocumentViewer({ doc }: DocumentViewerProps) {
  const headings = extractH2Headings(doc.content)
  const typeLabel = parseDocumentType(doc.document_type)

  const updatedDate = new Date(doc.updated_at).toLocaleDateString('bg-BG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-400 print:hidden" aria-label="Навигация">
        <Link href="/" className="hover:text-indigo-600">Документи</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{doc.title}</span>
      </nav>

      <div className="flex gap-8">
        {/* Sticky sidebar — TOC */}
        {headings.length > 0 && (
          <aside className="hidden lg:block w-56 flex-shrink-0 print:hidden">
            <div className="sticky top-24">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        )}

        {/* Main document column */}
        <div className="flex-1 min-w-0">
          {/* Document header */}
          <header className="mb-8 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5
                text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                {doc.department_name}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5
                text-xs font-medium text-gray-600">
                {typeLabel}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
              {doc.title}
            </h1>
            <p className="mt-2 text-sm text-gray-400">Обновен: {updatedDate}</p>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2 print:hidden">
              <PrintButton />
              <CopyButton content={doc.content} />
            </div>
          </header>

          {/* Zografa print header (hidden on screen, visible on print) */}
          <div className="hidden print:block mb-8 border-b border-gray-300 pb-4">
            <p className="font-serif text-2xl font-bold text-gray-900">Зографа</p>
            <h1 className="font-serif text-xl font-semibold mt-1">{doc.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Обновен: {updatedDate}</p>
          </div>

          {/* Document body */}
          <article
            className="prose prose-gray max-w-[720px] font-serif
              prose-headings:font-serif prose-headings:text-gray-900
              prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
              prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
              prose-p:leading-relaxed prose-p:text-gray-700
              prose-li:text-gray-700 prose-li:leading-relaxed
              prose-strong:text-gray-900
              prose-table:text-sm
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              print:max-w-full print:font-serif"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Add id to H2 elements for TOC anchor links
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
              {doc.content}
            </ReactMarkdown>
          </article>

          {/* Related documents footer */}
          {doc.related_documents.length > 0 && (
            <footer className="mt-12 border-t border-gray-200 pt-6 print:hidden">
              <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
                Свързани документи
              </h2>
              <ul className="flex flex-col gap-2">
                {doc.related_documents.map((rel) => (
                  <li key={rel.id}>
                    <Link
                      href={`/documents/${rel.id}`}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      {rel.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}
