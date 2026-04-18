'use client'

import { useState, useMemo } from 'react'
import { DocumentCard } from './DocumentCard'
import { SearchBar } from './SearchBar'
import { DocumentSummary } from '@/lib/documents'

interface Department {
  id: string
  name: string
}

interface DocumentLibraryProps {
  departments: Department[]
  initialDocuments: DocumentSummary[]
}

export function DocumentLibrary({ initialDocuments }: DocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return initialDocuments
    const q = searchQuery.toLowerCase()
    return initialDocuments.filter((doc) =>
      `${doc.title} ${doc.department_name}`.toLowerCase().includes(q)
    )
  }, [initialDocuments, searchQuery])

  return (
    <div className="space-y-4">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#6B6660]">Няма намерени документи</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}
