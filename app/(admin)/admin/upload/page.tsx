'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ALL_DOCS = [
  { id: '',              code: 'TMP_SALE_001A',  label: 'Въпросник — Рекламни стелажи',          type: 'form' },
  { id: '',              code: 'TMP_SALE_001A2', label: 'Въпросник — Технически и Логистика',    type: 'form' },
  { id: '',              code: 'TMP_SALE_001C',  label: 'Задание към проектант',                  type: 'assignment' },
  { id: '',              code: 'TMP_LOG_001A',   label: 'Въпросник за доставка и монтаж',         type: 'form' },
  { id: '',              code: 'TMP_LOG_001B',   label: 'Декларация за доставка и монтаж',        type: 'form' },
  { id: '',              code: 'TMP_LOG_001C',   label: 'Условия на доставка',                    type: 'form' },
  { id: '',              code: 'TMP_LOG_001D',   label: 'Декларация за доставка (без монтаж)',    type: 'form' },
  { id: '',              code: 'TMP_REK_001A',   label: 'Протокол за решение на комисия',         type: 'form' },
  { id: '',              code: 'SOP_SALE_001',   label: 'Запитвания Рекламни стелажи',            type: 'sop' },
  { id: '',              code: 'TMP_SALE_001B',  label: 'Шаблонни имейли — Рекламни стелажи',    type: 'email_template' },
  { id: '',              code: 'SOP_LOG_001',    label: 'Управление на Логистика',                type: 'sop' },
  { id: '',              code: 'SOP_REK_001',    label: 'Приемане и обработка на рекламации',     type: 'sop' },
  { id: '',              code: 'TMP_REK_001B',   label: 'Имейли — Рекламации',                   type: 'email_template' },
]

const HTML_TYPES = ['form', 'assignment']
const AI_TYPES   = ['sop', 'email_template', 'assignment']

type Mode = 'html' | 'ai'

export default function UploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('html')
  const [selectedCode, setSelectedCode] = useState(ALL_DOCS[0].code)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const filteredDocs = ALL_DOCS.filter(d =>
    mode === 'html' ? HTML_TYPES.includes(d.type) : AI_TYPES.includes(d.type)
  )
  const selectedDoc = filteredDocs.find(d => d.code === selectedCode) ?? filteredDocs[0]

  function onModeChange(m: Mode) {
    setMode(m)
    setSelectedCode('')
    setFile(null)
    setStatus('idle')
    setMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !selectedDoc) return

    setStatus('loading')
    setMessage('')

    const form = new FormData()
    form.append('file', file)

    if (mode === 'html') {
      form.append('internal_code', selectedDoc.code)
      const res = await fetch('/api/admin/upload-form', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(`✅ Записано: ${data.title}`)
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setStatus('error')
        setMessage(`❌ ${data.error}`)
      }
    } else {
      // AI path — need doc UUID; fetch it first
      const metaRes = await fetch(`/api/admin/documents`)
      const docs = await metaRes.json()
      const match = docs.find((d: { internal_code: string; id: string }) => d.internal_code === selectedDoc.code)
      if (!match) {
        setStatus('error')
        setMessage('❌ Документът не е намерен в базата')
        return
      }
      form.append('doc_id', match.id)
      const res = await fetch('/api/admin/ai-convert', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.setItem(`ai-md-${match.id}`, data.markdown)
        router.push(`/admin/ai-review?doc_id=${match.id}&title=${encodeURIComponent(data.title)}`)
      } else {
        setStatus('error')
        setMessage(`❌ ${data.error}`)
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6F4]">
      <div className="px-8 py-8 max-w-xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#6B6660] hover:text-[#C41E2A] transition-colors">
            ← Назад към панела
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-4">Качи документ</h1>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => onModeChange('html')}
            className={`rounded-xl border p-4 text-left transition-all ${
              mode === 'html'
                ? 'border-[#C41E2A] bg-white shadow-sm'
                : 'border-[#E4E1DB] bg-white hover:border-[#1A1A1A]'
            }`}
          >
            <p className="text-sm font-semibold text-[#1A1A1A]">Формуляр (HTML)</p>
            <p className="text-xs text-[#6B6660] mt-0.5">Точен Word layout → HTML</p>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('ai')}
            className={`rounded-xl border p-4 text-left transition-all ${
              mode === 'ai'
                ? 'border-[#C41E2A] bg-white shadow-sm'
                : 'border-[#E4E1DB] bg-white hover:border-[#1A1A1A]'
            }`}
          >
            <p className="text-sm font-semibold text-[#1A1A1A]">SOP / Имейл (AI)</p>
            <p className="text-xs text-[#6B6660] mt-0.5">Gemini конвертира → Markdown</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E4E1DB] p-6 space-y-5">
          {/* Document select */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Документ</label>
            <select
              value={selectedDoc?.code ?? ''}
              onChange={e => setSelectedCode(e.target.value)}
              className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm
                focus:outline-none focus:border-[#C41E2A] bg-white"
            >
              {filteredDocs.map(d => (
                <option key={d.code} value={d.code}>{d.label} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Word файл (.docx)
            </label>
            <input
              type="file"
              accept=".docx"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[#6B6660] file:mr-3 file:py-1.5 file:px-3
                file:rounded file:border file:border-[#E4E1DB] file:text-xs file:font-medium
                file:text-[#1A1A1A] file:bg-[#F7F6F4] hover:file:bg-[#F0EDE8]"
            />
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${
              status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || status === 'loading'}
            className="w-full py-2.5 bg-[#C41E2A] text-white text-sm font-medium rounded-lg
              hover:bg-[#A5181F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'loading'
              ? (mode === 'ai' ? 'AI конвертира...' : 'Конвертиране...')
              : (mode === 'ai' ? 'Конвертирай с AI →' : 'Качи и конвертирай')}
          </button>
        </form>
      </div>
    </main>
  )
}
