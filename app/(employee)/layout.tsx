import Link from 'next/link'
import { Toaster } from 'react-hot-toast'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'font-sans text-sm',
          success: { duration: 3000 },
        }}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Top navigation */}
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            {/* Logo / Brand */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
                <span className="font-serif text-sm font-bold text-white">З</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-lg font-bold text-gray-900">Зографа</span>
                <span className="hidden text-xs text-gray-400 sm:block">Вътрешна документация</span>
              </div>
            </Link>

            {/* Logout */}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5
                  text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-all"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Изход
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-[calc(100vh-61px)]">
          {children}
        </div>
      </div>
    </>
  )
}
