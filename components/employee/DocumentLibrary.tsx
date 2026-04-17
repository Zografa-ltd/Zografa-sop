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
        <div className="py-24 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          {initialDocuments.length === 0 ? (
            <>
              <p className="text-base font-medium text-gray-700">Все още няма публикувани документи</p>
              <p className="mt-1 text-sm text-gray-400">Администраторът може да добави документи от административния панел.</p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-gray-700">Няма намерени документи</p>
              <p className="mt-1 text-sm text-gray-400">Опитайте с друго търсене или изберете различен отдел.</p>
            </>
          )}
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
