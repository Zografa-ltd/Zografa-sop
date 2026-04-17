'use client'

import { TocEntry } from '@/lib/documents'

interface TableOfContentsProps {
  headings: TocEntry[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  if (headings.length === 0) return null

  return (
    <nav aria-label="Съдържание" className="space-y-1">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Съдържание
      </p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="block rounded px-2 py-1 text-sm text-gray-600 hover:bg-indigo-50
                hover:text-indigo-700 transition-colors"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
