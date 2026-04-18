'use client'

import { useState } from 'react'
import Link from 'next/link'

interface AdminDoc {
  id: string
  internal_code: string
  title: string
  type: string
  status: string
  current_version: string
  updated_at: string
  departments: { display_name: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  sop: 'Процес',
  form: 'Формуляр',
  email_template: 'Имейл',
  assignment: 'Задание',
}

const STATUS_COLORS: Record<string, string> = {
  published:    'bg-emerald-50 text-emerald-700',
  draft:        'bg-gray-100 text-gray-600',
  under_review: 'bg-amber-50 text-amber-700',
  archived:     'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  published:    'Публикуван',
  draft:        'Чернова',
  under_review: 'За преглед',
  archived:     'Архивиран',
}

export function DocumentTable({ documents }: { documents: AdminDoc[] }) {
  const [docs, setDocs] = useState(documents)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleStatus(id: string, current: string) {
    const next = current === 'published' ? 'draft' : 'published'
    setLoading(id)
    const res = await fetch(`/api/admin/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: next } : d))
    }
    setLoading(null)
  }

  return (
    <div className="rounded-xl border border-[#E4E1DB] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#F7F6F4] text-[#6B6660] text-xs font-semibold uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Код</th>
            <th className="px-4 py-3 text-left">Заглавие</th>
            <th className="px-4 py-3 text-left">Направление</th>
            <th className="px-4 py-3 text-left">Тип</th>
            <th className="px-4 py-3 text-left">Версия</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Обновен</th>
            <th className="px-4 py-3 text-left"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4E1DB] bg-white">
          {docs.map(doc => (
            <tr key={doc.id} className="hover:bg-[#F7F6F4] transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-[#6B6660]">{doc.internal_code}</td>
              <td className="px-4 py-3 font-medium text-[#1A1A1A] max-w-xs truncate">{doc.title}</td>
              <td className="px-4 py-3 text-[#6B6660]">{doc.departments?.display_name ?? '—'}</td>
              <td className="px-4 py-3 text-[#6B6660]">{TYPE_LABELS[doc.type] ?? doc.type}</td>
              <td className="px-4 py-3 text-[#6B6660]">v{doc.current_version}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[doc.status] ?? doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[#6B6660] text-xs">
                {new Date(doc.updated_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(doc.id, doc.status)}
                    disabled={loading === doc.id}
                    className="text-xs px-2.5 py-1 rounded border border-[#E4E1DB] text-[#6B6660]
                      hover:border-[#C41E2A] hover:text-[#C41E2A] transition-colors disabled:opacity-40"
                  >
                    {loading === doc.id ? '...' : doc.status === 'published' ? 'Скрий' : 'Публикувай'}
                  </button>
                  <Link
                    href={`/admin/documents/${doc.id}`}
                    className="text-xs px-2.5 py-1 rounded border border-[#E4E1DB] text-[#6B6660]
                      hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
                  >
                    Редактирай
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {docs.length === 0 && (
        <p className="py-12 text-center text-sm text-[#6B6660]">Няма документи</p>
      )}
    </div>
  )
}
