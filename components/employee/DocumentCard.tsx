'use client'

import Link from 'next/link'
import { parseDocumentType, DocumentSummary } from '@/lib/documents'

interface DocumentCardProps {
  doc: DocumentSummary
}

const TYPE_COLORS: Record<string, string> = {
  sop: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  form: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  email_template: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  assignment: 'bg-green-50 text-green-700 ring-green-600/20',
}

export function DocumentCard({ doc }: DocumentCardProps) {
  const typeLabel = parseDocumentType(doc.document_type)
  const typeColor = TYPE_COLORS[doc.document_type] ?? 'bg-gray-50 text-gray-600 ring-gray-500/20'

  const updatedDate = new Date(doc.updated_at).toLocaleDateString('bg-BG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.origin + `/documents/${doc.id}`)
  }

  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5
      shadow-sm transition-shadow hover:shadow-md">
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeColor}`}>
          {typeLabel}
        </span>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs
          font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
          {doc.department_name}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">
        {doc.title}
      </h3>

      {/* Updated date */}
      <p className="text-xs text-gray-400">Обновен: {updatedDate}</p>

      {/* Action buttons */}
      <div className="mt-auto flex gap-2 pt-1">
        <Link
          href={`/documents/${doc.id}`}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium
            text-white hover:bg-indigo-700 transition-colors"
        >
          Отвори
        </Link>
        <Link
          href={`/documents/${doc.id}?print=1`}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600
            hover:bg-gray-50 transition-colors"
          aria-label="Печат"
        >
          🖨 Печат
        </Link>
        <button
          onClick={handleCopy}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600
            hover:bg-gray-50 transition-colors"
          aria-label="Копирай"
        >
          📋 Копирай
        </button>
      </div>
    </article>
  )
}
