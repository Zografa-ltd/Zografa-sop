'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AiReviewContent() {
  const router = useRouter()
  const params = useSearchParams()

  const docId = params.get('doc_id') ?? ''
  const title = params.get('title') ?? ''

  const [markdown, setMarkdown] = useState('')
  const [summary, setSummary] = useState('AI конвертиране от Word документ')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem(`ai-md-${docId}`)
    if (stored) setMarkdown(stored)
  }, [docId])

  async function handleSave() {
    setStatus('saving')
    const res = await fetch('/api/admin/ai-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, markdown, changes_summary: summary }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('saved')
      setMessage(`✅ Записано: ${data.title} (${data.code})`)
      sessionStorage.removeItem(`ai-md-${docId}`)
      setTimeout(() => router.push('/admin'), 1500)
    } else {
      setStatus('error')
      setMessage(`❌ ${data.error}`)
    }
  }

  if (!docId || !markdown) {
    return (
      <div className="py-20 text-center text-sm text-[#6B6660]">
        Няма данни за преглед.{' '}
        <Link href="/admin/upload" className="text-[#C41E2A] hover:underline">
          Назад към upload
        </Link>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/upload" className="text-sm text-[#6B6660] hover:text-[#C41E2A] transition-colors">
            ← Назад
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mt-3">Преглед на AI конверсия</h1>
          <p className="text-sm text-[#6B6660] mt-1">{title} — провери и коригирай преди запис</p>
        </div>
        <button
          onClick={handleSave}
          disabled={status === 'saving' || status === 'saved'}
          className="px-5 py-2.5 bg-[#C41E2A] text-white text-sm font-medium rounded-lg
            hover:bg-[#A5181F] transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {status === 'saving' ? 'Записва се...' : '✓ Запиши в базата'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
          status === 'saved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Summary field */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#6B6660] mb-1">
          Описание на промените (за версионна история)
        </label>
        <input
          type="text"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          className="w-full rounded-lg border border-[#E4E1DB] px-3 py-2 text-sm
            focus:outline-none focus:border-[#C41E2A]"
        />
      </div>

      {/* Markdown editor */}
      <div className="rounded-xl border border-[#E4E1DB] overflow-hidden">
        <div className="bg-[#F7F6F4] border-b border-[#E4E1DB] px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-[#6B6660]">Markdown — редактирай ако е нужно</span>
          <span className="text-xs text-[#6B6660]">{markdown.split('\n').length} реда</span>
        </div>
        <textarea
          value={markdown}
          onChange={e => {
            setMarkdown(e.target.value)
            sessionStorage.setItem(`ai-md-${docId}`, e.target.value)
          }}
          className="w-full h-[600px] p-4 font-mono text-xs text-[#1A1A1A] resize-none
            focus:outline-none bg-white leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

export default function AiReviewPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F4]">
      <Suspense fallback={<div className="py-20 text-center text-sm text-[#6B6660]">Зарежда се...</div>}>
        <AiReviewContent />
      </Suspense>
    </main>
  )
}
