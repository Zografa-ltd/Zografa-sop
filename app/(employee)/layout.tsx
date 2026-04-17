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
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            {/* Logo / Brand */}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold text-indigo-700">Зографа</span>
              <span className="hidden text-sm text-gray-400 sm:block">| Вътрешна документация</span>
            </Link>

            {/* Logout */}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600
                  hover:bg-gray-50 transition-colors"
              >
                Изход
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-[calc(100vh-57px)]">
          {children}
        </div>
      </div>
    </>
  )
}
