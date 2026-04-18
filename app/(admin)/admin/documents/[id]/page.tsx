'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Dept { id: string; code: string; display_name: string }
interface ProductModel { id: string; department_id: string; name: string; code: string }
interface Doc {
  id: string
  internal_code: string
  title: string
  type: string
  status: string
  current_version: string
  department_id: string | null
  product_model_id: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Чернова',
  under_review: 'За преглед',
  published: 'Публикуван',
  archived: 'Архивиран',
}

const TYPE_LABELS: Record<string, string> = {
  sop: 'Процес (SOP)',
  form: 'Формуляр',
  email_template: 'Имейл шаблон',
  assignment: 'Задание',
}

export default function DocumentEditPage() {
  const router = useRouter()
  const params = useParams()
  const docId = params.id as string

  const [doc, setDoc]       = useState<Doc | null>(null)
  const [depts, setDepts]   = useState<Dept[]>([])
  const [models, setModels] = useState<ProductModel[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [status, setStatus]     = useState<'idle' | 'saved' | 'error'>('idle')
  const [message, setMessage]   = useState('')

  // Form state
  const [title, setTitle]               = useState('')
  const [deptId, setDeptId]             = useState<string>('')
  const [modelId, setModelId]           = useState<string>('')
  const [docStatus, setDocStatus]       = useState<string>('draft')

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/documents/${docId}`).then(r => r.json()),
      fetch('/api/admin/departments').then(r => r.json()),
      fetch('/api/admin/product-models').then(r => r.json()),
    ]).then(([d, depts, models]) => {
      setDoc(d)
      setTitle(d.title ?? '')
      setDeptId(d.department_id ?? '')
      setModelId(d.product_model_id ?? '')
      setDocStatus(d.status ?? 'draft')
      setDepts(depts)
      setModels(models)
      setLoading(false)
    })
  }, [docId])

  // Product models filtered by selected department
  const filteredModels = models.filter(m => m.department_id === deptId)

  // Reset model when dept changes (if current model doesn't belong to new dept)
  function handleDeptChange(newDeptId: string) {
    setDeptId(newDeptId)
    const stillValid = models.some(m => m.id === modelId && m.department_id === newDeptId)
    if (!stillValid) setModelId('')
  }

  async function handleSave() {
    setSaving(true)
    setStatus('idle')
    const res = await fetch(`/api/admin/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        status: docStatus,
        department_id: deptId || null,
        product_model_id: modelId || null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('saved')
      setMessage('✅ Записано успешно')
      setTimeout(() => router.push('/admin'), 1200)
    } else {
      setStatus('error')
      setMessage(`❌ ${data.error}`)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6F4] flex items-center justify-center">
        <p className="text-sm text-[#6B6660]">Зарежда се...</p>
      </main>
    )
  }

  if (!doc) {
    return (
      <main className="min-h-screen bg-[#F7F6F4] flex items-center justify-center">
        <p className="text-sm text-red-600">Документът не е намерен.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F6F4]">
      <div className="px-8 py-8 max-w-xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#6B6660] hover:text-[#C41E2A] transition-colors">
            ← Назад към панела
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-4">Редактирай документ</h1>
          <p className="mt-1 text-sm text-[#6B6660] font-mono">{doc.internal_code} · {TYPE_LABELS[doc.type] ?? doc.type} · v{doc.current_version}</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E1DB] p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Заглавие</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm
                focus:outline-none focus:border-[#C41E2A]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Статус</label>
            <select
              value={docStatus}
              onChange={e => setDocStatus(e.target.value)}
              className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm
                focus:outline-none focus:border-[#C41E2A] bg-white"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Направление</label>
            <select
              value={deptId}
              onChange={e => handleDeptChange(e.target.value)}
              className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm
                focus:outline-none focus:border-[#C41E2A] bg-white"
            >
              <option value="">— Без направление —</option>
              {depts.map(d => (
                <option key={d.id} value={d.id}>{d.display_name}</option>
              ))}
            </select>
          </div>

          {/* Product model */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Продуктов модел</label>
            <select
              value={modelId}
              onChange={e => setModelId(e.target.value)}
              disabled={!deptId || filteredModels.length === 0}
              className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm
                focus:outline-none focus:border-[#C41E2A] bg-white disabled:opacity-50"
            >
              <option value="">— Без модел —</option>
              {filteredModels.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>
            {deptId && filteredModels.length === 0 && (
              <p className="mt-1 text-xs text-[#6B6660]">
                Няма модели за това направление.{' '}
                <Link href="/admin/product-models" className="text-[#C41E2A] hover:underline">
                  Добави →
                </Link>
              </p>
            )}
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${
              status === 'saved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="w-full py-2.5 bg-[#C41E2A] text-white text-sm font-medium rounded-lg
              hover:bg-[#A5181F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Записва се...' : 'Запази промените'}
          </button>
        </div>
      </div>
    </main>
  )
}
