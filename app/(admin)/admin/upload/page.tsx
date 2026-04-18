'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FORM_CODES = [
  { code: 'TMP_SALE_001A',  label: 'Въпросник — Рекламни стелажи' },
  { code: 'TMP_SALE_001A2', label: 'Въпросник — Технически и Логистика' },
  { code: 'TMP_SALE_001C',  label: 'Задание към проектант' },
  { code: 'TMP_LOG_001A',   label: 'Въпросник за доставка и монтаж' },
  { code: 'TMP_LOG_001B',   label: 'Декларация за доставка и монтаж' },
  { code: 'TMP_LOG_001C',   label: 'Условия на доставка' },
  { code: 'TMP_LOG_001D',   label: 'Декларация за доставка (без монтаж)' },
  { code: 'TMP_REK_001A',   label: 'Протокол за решение на комисия' },
]

export default function UploadFormPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState(FORM_CODES[0].code)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setStatus('loading')
    setMessage('')

    const form = new FormData()
    form.append('file', file)
    form.append('internal_code', code)

    const res = await fetch('/api/admin/upload-form', { method: 'POST', body: form })
    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage(`✅ Записано: ${data.title}`)
      setTimeout(() => router.push('/admin'), 1500)
    } else {
      setStatus('error')
      setMessage(`❌ Грешка: ${data.error}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6F4]">
      <div className="px-8 py-8 max-w-xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#6B6660] hover:text-[#C41E2A] transition-colors">
            ← Назад към панела
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-4">Качи формуляр</h1>
          <p className="text-sm text-[#6B6660] mt-1">
            Избери .docx файл — ще се конвертира автоматично към HTML
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E4E1DB] p-6 space-y-5">
          {/* Document select */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Документ
            </label>
            <select
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm text-[#1A1A1A]
                focus:outline-none focus:border-[#C41E2A] bg-white"
            >
              {FORM_CODES.map(f => (
                <option key={f.code} value={f.code}>{f.label} ({f.code})</option>
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

          {/* Status message */}
          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${
              status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || status === 'loading'}
            className="w-full py-2.5 bg-[#C41E2A] text-white text-sm font-medium rounded-lg
              hover:bg-[#A5181F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Конвертиране...' : 'Качи и конвертирай'}
          </button>
        </form>
      </div>
    </main>
  )
}
