'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Department, DocumentSummary, parseDocumentType } from '@/lib/documents'
import { useToc } from './TocContext'

interface SidebarProps {
  departments: Department[]
  documents: DocumentSummary[]
  isMobileOpen: boolean
  onMobileClose: () => void
}

const TYPE_ORDER = ['sop', 'form', 'email_template', 'assignment'] as const

const TYPE_LABELS: Record<string, string> = {
  form: 'Въпросници',
  email_template: 'Имейл шаблони',
  assignment: 'Задания',
}

const TYPE_ICONS: Record<string, string> = {
  sop: '≡',
  form: '□',
  email_template: '✉',
  assignment: '◎',
}

function SidebarInner({ departments, documents, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { headings } = useToc()

  const activeDeptParam = searchParams.get('dept')
  const activeTypeParam = searchParams.get('type')

  // Which document is open (from pathname /documents/[id])
  const activeDocId = pathname.startsWith('/documents/')
    ? pathname.replace('/documents/', '').split('?')[0]
    : null

  // Find dept of active document
  const activeDoc = documents.find((d) => d.id === activeDocId)
  const highlightedDeptId = activeDoc?.department_id ?? activeDeptParam ?? null

  // Expand/collapse state per department — persisted in localStorage
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-expanded')
      if (saved) {
        setExpanded(new Set(JSON.parse(saved)))
      } else {
        // Default: expand all departments
        setExpanded(new Set(departments.map((d) => d.id)))
      }
    } catch {
      setExpanded(new Set(departments.map((d) => d.id)))
    }
  }, [departments])

  // Auto-expand the active department
  useEffect(() => {
    if (highlightedDeptId) {
      setExpanded((prev) => {
        if (prev.has(highlightedDeptId)) return prev
        const next = new Set(prev)
        next.add(highlightedDeptId)
        return next
      })
    }
  }, [highlightedDeptId])

  const toggleDept = (deptId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(deptId)) {
        next.delete(deptId)
      } else {
        next.add(deptId)
      }
      try {
        localStorage.setItem('sidebar-expanded', JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  // Documents that have published content, grouped by dept
  const deptIds = new Set(documents.map((d) => d.department_id))
  const activeDepts = departments.filter((d) => deptIds.has(d.id))

  return (
    <aside
      data-sidebar="true"
      className={`
        z-50 flex w-64 flex-shrink-0 flex-col bg-white border-r border-[#E4E1DB] h-full
        lg:translate-x-0
        fixed inset-y-0 left-0 transition-transform duration-200 ease-in-out
        lg:static lg:z-auto lg:h-full
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        print:hidden
      `}
    >
      {/* Logo */}
      <div className="flex-shrink-0 border-b border-[#E4E1DB] px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" onClick={onMobileClose}>
          <Image
            src="/logo.png"
            alt="Зографа"
            width={110}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav flex-1 overflow-y-auto px-2 py-3">
        {/* Home link */}
        <Link
          href="/"
          onClick={onMobileClose}
          className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors mb-1
            ${pathname === '/' && !activeDeptParam
              ? 'bg-[#FEF2F2] text-[#C41E2A] font-medium'
              : 'text-[#6B6660] hover:text-[#1A1A1A] hover:bg-[#F7F6F4]'
            }`}
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Начало
        </Link>

        <div className="my-2 border-t border-[#E4E1DB]" />

        {/* Department sections */}
        {activeDepts.map((dept) => {
          const deptDocs = documents.filter((d) => d.department_id === dept.id)
          const sops = deptDocs.filter((d) => d.document_type === 'sop')
          const isExpanded = expanded.has(dept.id)
          const isDeptHighlighted = highlightedDeptId === dept.id

          // Non-SOP type groups for this dept
          const typeGroups = TYPE_ORDER.filter((t) => t !== 'sop')
            .filter((t) => deptDocs.some((d) => d.document_type === t))

          return (
            <div key={dept.id} className="mb-1">
              {/* Dept header */}
              <button
                onClick={() => toggleDept(dept.id)}
                className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-xs font-semibold
                  uppercase tracking-wider transition-colors
                  ${isDeptHighlighted
                    ? 'text-[#C41E2A]'
                    : 'text-[#1A1A1A] hover:text-[#C41E2A]'
                  }`}
              >
                <span className="truncate">{dept.name}</span>
                <svg
                  className={`h-3.5 w-3.5 flex-shrink-0 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="mt-0.5 ml-2 space-y-0.5">
                  {/* SOP documents — listed individually */}
                  {sops.map((doc) => {
                    const isActive = doc.id === activeDocId
                    return (
                      <div key={doc.id}>
                        <Link
                          href={`/documents/${doc.id}`}
                          onClick={onMobileClose}
                          className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs transition-colors
                            ${isActive
                              ? 'border-l-2 border-[#C41E2A] bg-[#FEF2F2] text-[#C41E2A] font-medium pl-2'
                              : 'text-[#6B6660] hover:text-[#1A1A1A] hover:bg-[#F7F6F4]'
                            }`}
                          title={doc.title}
                        >
                          <span className="flex-shrink-0 mt-px font-mono text-[10px]">≡</span>
                          <span className="leading-snug line-clamp-2">{doc.title}</span>
                        </Link>

                        {/* TOC headings — only shown for active document */}
                        {isActive && headings.length > 0 && (
                          <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[#E4E1DB] pl-2">
                            {headings.map((h) => (
                              <a
                                key={h.id}
                                href={`#${h.id}`}
                                className="block truncate text-[11px] text-[#6B6660] hover:text-[#C41E2A] py-0.5 transition-colors"
                              >
                                {h.text}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Type group links */}
                  {typeGroups.map((type) => {
                    const count = deptDocs.filter((d) => d.document_type === type).length
                    const isActive = activeDeptParam === dept.id && activeTypeParam === type
                    return (
                      <Link
                        key={type}
                        href={`/?dept=${dept.id}&type=${type}`}
                        onClick={onMobileClose}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors
                          ${isActive
                            ? 'border-l-2 border-[#C41E2A] bg-[#FEF2F2] text-[#C41E2A] font-medium pl-2'
                            : 'text-[#6B6660] hover:text-[#1A1A1A] hover:bg-[#F7F6F4]'
                          }`}
                      >
                        <span className="flex-shrink-0 font-mono text-[10px]">{TYPE_ICONS[type]}</span>
                        <span className="truncate">{TYPE_LABELS[type]}</span>
                        <span className="ml-auto flex-shrink-0 text-[10px] text-[#6B6660]">
                          {count}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 border-t border-[#E4E1DB] p-3">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-[#6B6660]
              hover:text-[#C41E2A] hover:bg-[#FEF2F2] transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Изход
          </button>
        </form>
      </div>
    </aside>
  )
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarInner {...props} />
    </Suspense>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-[#E4E1DB] print:hidden">
      <div className="border-b border-[#E4E1DB] px-4 py-3 h-[52px]" />
      <div className="flex-1 p-3 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-6 rounded bg-[#F7F6F4] animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
        ))}
      </div>
    </aside>
  )
}
