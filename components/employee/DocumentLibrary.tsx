'use client'

import { useState, useMemo } from 'react'
import { DocumentCard } from './DocumentCard'
import { SearchBar } from './SearchBar'
import { DepartmentNav } from './DepartmentNav'
import { DocumentSummary } from '@/lib/documents'

interface Department {
  id: string
  name: string
}

interface DocumentLibraryProps {
  departments: Department[]
  initialDocuments: DocumentSummary[]
}

type TypeFilter = 'all' | 'sop' | 'form' | 'email_template' | 'assignment'

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Всички' },
  { key: 'sop', label: 'Процеси' },
  { key: 'form', label: 'Форми' },
  { key: 'email_template', label: 'Имейл шаблони' },
  { key: 'assignment', label: 'Задания' },
]

export function DocumentLibrary({ departments, initialDocuments }: DocumentLibraryProps) {
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    return initialDocuments.filter((doc) => {
      if (activeDepartment && doc.department_id !== activeDepartment) return false
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const haystack = `${doc.title} ${doc.department_name}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [initialDocuments, activeDepartment, typeFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        {/* Type filter pills */}
        <div className="flex gap-1 flex-wrap" role="group" aria-label="Тип документ">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors
                ${typeFilter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department tabs */}
      <DepartmentNav
        departments={departments}
        activeId={activeDepartment}
        onSelect={setActiveDepartment}
      />

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-lg">Няма намерени документи</p>
          <p className="text-sm mt-1">Опитайте с друго търсене или изберете различен отдел.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}
