'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Dept {
  id: string
  code: string
  display_name: string
  sort_order: number
}

interface ProductModel {
  id: string
  department_id: string
  name: string
  code: string
  sort_order: number
}

function slugify(name: string, deptCode: string): string {
  return deptCode + '_' + name
    .toUpperCase()
    .replace(/[А-ЯЁ]/g, (c) => CYRILLIC_MAP[c] ?? c)
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20)
}

const CYRILLIC_MAP: Record<string, string> = {
  А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ж:'ZH',З:'Z',И:'I',Й:'Y',
  К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',
  Ф:'F',Х:'H',Ц:'TS',Ч:'CH',Ш:'SH',Щ:'SHT',Ъ:'A',Ь:'',Ю:'YU',Я:'YA',
}

export default function ProductModelsPage() {
  const [depts, setDepts]   = useState<Dept[]>([])
  const [models, setModels] = useState<ProductModel[]>([])
  const [loading, setLoading] = useState(true)

  // Add form state per dept
  const [adding, setAdding] = useState<Record<string, { name: string; code: string }>>({})
  // Rename state per model
  const [renaming, setRenaming] = useState<Record<string, string>>({})
  const [saving, setSaving]     = useState<string | null>(null)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/departments').then(r => r.json()),
      fetch('/api/admin/product-models').then(r => r.json()),
    ]).then(([d, m]) => {
      setDepts(d)
      setModels(m)
      setLoading(false)
    })
  }, [])

  async function addModel(deptId: string, deptCode: string) {
    const form = adding[deptId]
    if (!form?.name) return
    setSaving('add-' + deptId)
    setError('')
    const res = await fetch('/api/admin/product-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_id: deptId, name: form.name, code: form.code || slugify(form.name, deptCode) }),
    })
    const data = await res.json()
    if (res.ok) {
      setModels(prev => [...prev, data])
      setAdding(prev => { const n = { ...prev }; delete n[deptId]; return n })
    } else {
      setError(data.error ?? 'Грешка')
    }
    setSaving(null)
  }

  async function saveRename(modelId: string) {
    const name = renaming[modelId]
    if (!name) return
    setSaving(modelId)
    setError('')
    const res = await fetch(`/api/admin/product-models/${modelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (res.ok) {
      setModels(prev => prev.map(m => m.id === modelId ? data : m))
      setRenaming(prev => { const n = { ...prev }; delete n[modelId]; return n })
    } else {
      setError(data.error ?? 'Грешка')
    }
    setSaving(null)
  }

  async function deleteModel(modelId: string, modelName: string) {
    if (!confirm(`Изтрий "${modelName}"? Документите в него ще останат без продуктов модел.`)) return
    setSaving(modelId)
    setError('')
    const res = await fetch(`/api/admin/product-models/${modelId}`, { method: 'DELETE' })
    if (res.ok) {
      setModels(prev => prev.filter(m => m.id !== modelId))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Грешка при изтриване')
    }
    setSaving(null)
  }

  if (loading) {
    return <main className="min-h-screen bg-[#F7F6F4] flex items-center justify-center">
      <p className="text-sm text-[#6B6660]">Зарежда се...</p>
    </main>
  }

  return (
    <main className="min-h-screen bg-[#F7F6F4]">
      <div className="px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#6B6660] hover:text-[#C41E2A] transition-colors">
            ← Назад към панела
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-4">Продуктови модели</h1>
          <p className="mt-1 text-sm text-[#6B6660]">Управление на йерархията на направленията</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
          {depts.map((dept) => {
            const deptModels = models
              .filter(m => m.department_id === dept.id)
              .sort((a, b) => a.sort_order - b.sort_order)
            const isAdding = dept.id in adding
            const addForm  = adding[dept.id]

            return (
              <div key={dept.id} className="bg-white rounded-xl border border-[#E4E1DB] overflow-hidden">
                {/* Dept header */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#F7F6F4] border-b border-[#E4E1DB]">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                      {dept.display_name}
                    </span>
                    <span className="ml-2 text-[11px] text-[#6B6660] font-mono">{dept.code}</span>
                  </div>
                  {!isAdding && (
                    <button
                      onClick={() => setAdding(prev => ({
                        ...prev,
                        [dept.id]: { name: '', code: '' },
                      }))}
                      className="text-xs text-[#C41E2A] hover:underline"
                    >
                      + Добави модел
                    </button>
                  )}
                </div>

                {/* Models list */}
                <div className="divide-y divide-[#E4E1DB]">
                  {deptModels.length === 0 && !isAdding && (
                    <p className="px-5 py-4 text-sm text-[#6B6660] italic">Няма добавени модели</p>
                  )}

                  {deptModels.map((model) => {
                    const isRenaming = model.id in renaming
                    return (
                      <div key={model.id} className="flex items-center gap-3 px-5 py-3">
                        {isRenaming ? (
                          <>
                            <input
                              autoFocus
                              value={renaming[model.id]}
                              onChange={e => setRenaming(prev => ({ ...prev, [model.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') saveRename(model.id); if (e.key === 'Escape') setRenaming(prev => { const n = { ...prev }; delete n[model.id]; return n }) }}
                              className="flex-1 rounded border border-[#C41E2A] px-2 py-1 text-sm focus:outline-none"
                            />
                            <button
                              onClick={() => saveRename(model.id)}
                              disabled={saving === model.id}
                              className="text-xs px-2.5 py-1 bg-[#C41E2A] text-white rounded hover:bg-[#A5181F] disabled:opacity-40"
                            >
                              {saving === model.id ? '...' : 'Запази'}
                            </button>
                            <button
                              onClick={() => setRenaming(prev => { const n = { ...prev }; delete n[model.id]; return n })}
                              className="text-xs text-[#6B6660] hover:text-[#1A1A1A]"
                            >
                              Отказ
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-[#1A1A1A]">{model.name}</span>
                            <span className="font-mono text-[11px] text-[#6B6660]">{model.code}</span>
                            <button
                              onClick={() => setRenaming(prev => ({ ...prev, [model.id]: model.name }))}
                              className="text-xs text-[#6B6660] hover:text-[#1A1A1A] transition-colors px-1"
                              title="Преименувай"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteModel(model.id, model.name)}
                              disabled={saving === model.id}
                              className="text-xs text-[#6B6660] hover:text-red-600 transition-colors px-1 disabled:opacity-40"
                              title="Изтрий"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}

                  {/* Add form */}
                  {isAdding && (
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          placeholder="Име на модела"
                          value={addForm.name}
                          onChange={e => {
                            const name = e.target.value
                            setAdding(prev => ({
                              ...prev,
                              [dept.id]: { name, code: slugify(name, dept.code) },
                            }))
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') addModel(dept.id, dept.code) }}
                          className="flex-1 rounded border border-[#E4E1DB] px-3 py-1.5 text-sm focus:outline-none focus:border-[#C41E2A]"
                        />
                        <input
                          placeholder="КОД"
                          value={addForm.code}
                          onChange={e => setAdding(prev => ({ ...prev, [dept.id]: { ...prev[dept.id], code: e.target.value.toUpperCase() } }))}
                          className="w-36 rounded border border-[#E4E1DB] px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#C41E2A]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addModel(dept.id, dept.code)}
                          disabled={!addForm.name || saving === 'add-' + dept.id}
                          className="px-3 py-1.5 bg-[#C41E2A] text-white text-xs font-medium rounded hover:bg-[#A5181F] disabled:opacity-40"
                        >
                          {saving === 'add-' + dept.id ? 'Запазва...' : 'Добави'}
                        </button>
                        <button
                          onClick={() => setAdding(prev => { const n = { ...prev }; delete n[dept.id]; return n })}
                          className="px-3 py-1.5 text-xs text-[#6B6660] hover:text-[#1A1A1A]"
                        >
                          Отказ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
