'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Грешка при влизане')
        return
      }

      const redirect = searchParams.get('redirect')
      if (data.role === 'admin') {
        router.push(redirect?.startsWith('/admin') ? redirect : '/admin')
      } else {
        router.push(redirect && !redirect.startsWith('/admin') ? redirect : '/')
      }
    } catch {
      setError('Мрежова грешка. Опитай отново.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            Зографа
          </h1>
          <p className="text-sm text-gray-500 mt-1">Вътрешни процеси</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Парола за достъп
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm"
              style={{ outline: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.2)' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              placeholder="Въведи паролата"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 text-white text-sm font-medium rounded-lg transition-colors"
            style={{ backgroundColor: loading || !password ? '#a5b4fc' : '#4f46e5', cursor: loading || !password ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Влизане...' : 'Вход'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
