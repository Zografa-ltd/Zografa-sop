'use client'

import Link from 'next/link'
import { parseDocumentType, DocumentSummary } from '@/lib/documents'

interface DocumentCardProps {
  doc: DocumentSummary
}

const TYPE_COLORS: Record<string, string> = {
  sop:            'bg-blue-50 text-blue-700',
  form:           'bg-amber-50 text-amber-700',
  email_template: 'bg-violet-50 text-violet-700',
  assignment:     'bg-emerald-50 text-emerald-700',
}

export function DocumentCard({ doc }: DocumentCardProps) {
  const typeLabel = parseDocumentType(doc.document_type)
  const typeColor = TYPE_COLORS[doc.document_type] ?? 'bg-gray-50 text-gray-600'

  const updatedDate = new Date(doc.updated_at).toLocaleDateString('bg-BG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.origin + `/documents/${doc.id}`)
  }

  return (
    <article className="group flex flex-col gap-2 rounded-lg border border-[#E4E1DB] bg-white p-4
      hover:border-[#C41E2A] hover:shadow-sm transition-all duration-150">

      {/* Type badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${typeColor}`}>
          {typeLabel}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[#1A1A1A] leading-snug group-hover:text-[#C41E2A] transition-colors">
        {doc.title}
      </h3>

      {/* Updated date */}
      <p className="text-[11px] text-[#6B6660]">{updatedDate}</p>

      {/* Actions */}
      <div className="mt-auto pt-2 flex gap-1.5">
        <Link
          href={`/documents/${doc.id}`}
          className="flex-1 rounded border border-[#1A1A1A] bg-[#1A1A1A] px-2.5 py-1.5
            text-center text-[11px] font-medium text-white hover:bg-[#C41E2A] hover:border-[#C41E2A] transition-colors"
        >
          Отвори
        </Link>
        <Link
          href={`/documents/${doc.id}?print=1`}
          className="rounded border border-[#E4E1DB] px-2.5 py-1.5 text-[11px] font-medium
            text-[#6B6660] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
          aria-label="Печат"
          title="Печат"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
        </Link>
        <button
          onClick={handleCopy}
          className="rounded border border-[#E4E1DB] px-2.5 py-1.5 text-[11px] font-medium
            text-[#6B6660] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
          aria-label="Копирай линк"
          title="Копирай линк"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </button>
      </div>
    </article>
  )
}
