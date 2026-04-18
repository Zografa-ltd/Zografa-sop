'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Toaster } from 'react-hot-toast'
import { Sidebar } from './Sidebar'
import { TocProvider } from './TocContext'
import { SidebarData } from '@/lib/documents'

interface SidebarShellProps {
  sidebarData: SidebarData
  children: React.ReactNode
}

export function SidebarShell({ sidebarData, children }: SidebarShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TocProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'font-sans text-sm',
          success: { duration: 3000 },
        }}
      />

      {/* Full-height container — both columns scroll independently */}
      <div className="flex h-screen overflow-hidden">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — independent scroll */}
        <Sidebar
          departments={sidebarData.departments}
          documents={sidebarData.documents}
          isMobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main content column — independent scroll */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <header
            data-mobile-header="true"
            className="flex-shrink-0 flex items-center justify-between
              border-b border-[#E4E1DB] bg-white px-4 py-3 lg:hidden print:hidden"
          >
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Отвори меню"
              className="rounded p-1 text-[#6B6660] hover:text-[#1A1A1A] hover:bg-[#F7F6F4] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <Image src="/logo.png" alt="Зографа" width={100} height={26} className="h-6 w-auto object-contain" />
            <div className="w-7" />
          </header>

          {/* Scrollable main area */}
          <main className="flex-1 overflow-y-auto bg-[#F7F6F4]">
            {children}
          </main>
        </div>
      </div>
    </TocProvider>
  )
}
