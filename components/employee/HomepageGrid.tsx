import Link from 'next/link'
import {
  Department,
  DocumentSummary,
  DEPT_DESCRIPTIONS,
  getDepartmentIconPath,
  parseDocumentType,
  getTypeIcon,
} from '@/lib/documents'

interface HomepageGridProps {
  departments: Department[]
  documents: DocumentSummary[]
}

const MAX_LINKS_PER_CARD = 4

export function HomepageGrid({ departments, documents }: HomepageGridProps) {
  if (departments.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-medium text-[#1A1A1A]">Все още няма публикувани документи</p>
        <p className="mt-1 text-xs text-[#6B6660]">
          Администраторът може да добави документи от административния панел.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {departments.map((dept) => {
        const deptDocs = documents.filter((d) => d.department_id === dept.id)
        const description = DEPT_DESCRIPTIONS[dept.name] ?? ''
        const iconPath = getDepartmentIconPath(dept.name)

        // Build link list: SOPs first individually, then type groups
        type LinkItem =
          | { kind: 'doc'; doc: DocumentSummary }
          | { kind: 'group'; type: string; count: number; deptId: string }

        const links: LinkItem[] = []

        // Individual SOP links
        deptDocs
          .filter((d) => d.document_type === 'sop')
          .forEach((doc) => links.push({ kind: 'doc', doc }))

        // Type group links (non-SOP)
        ;(['form', 'email_template', 'assignment'] as const).forEach((type) => {
          const count = deptDocs.filter((d) => d.document_type === type).length
          if (count > 0) links.push({ kind: 'group', type, count, deptId: dept.id })
        })

        const visibleLinks = links.slice(0, MAX_LINKS_PER_CARD)
        const remaining = links.length - visibleLinks.length

        return (
          <div
            key={dept.id}
            className="flex flex-col overflow-hidden rounded-xl border border-[#E4E1DB] bg-white
              hover:border-[#C41E2A] hover:shadow-sm transition-all duration-150 group"
          >
            {/* Icon area — dotted background */}
            <Link
              href={`/?dept=${dept.id}`}
              className="flex items-center justify-center py-8"
              style={{
                backgroundImage: 'radial-gradient(circle, #D4D0C8 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                backgroundColor: '#F7F6F4',
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl
                bg-white border border-[#E4E1DB] shadow-sm
                group-hover:border-[#C41E2A] group-hover:shadow transition-all">
                <svg
                  className="h-6 w-6 text-[#6B6660] group-hover:text-[#C41E2A] transition-colors"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
              </div>
            </Link>

            {/* Content area */}
            <div className="flex flex-1 flex-col p-5">
              <Link href={`/?dept=${dept.id}`}>
                <h2 className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C41E2A] transition-colors">
                  {dept.name}
                </h2>
              </Link>
              {description && (
                <p className="mt-1 text-xs text-[#6B6660] leading-relaxed">{description}</p>
              )}

              {/* Divider */}
              <div className="my-4 border-t border-[#E4E1DB]" />

              {/* Document links */}
              <ul className="space-y-2">
                {visibleLinks.map((item, idx) => {
                  if (item.kind === 'doc') {
                    return (
                      <li key={idx}>
                        <Link
                          href={`/documents/${item.doc.id}`}
                          className="flex items-start gap-2 text-xs text-[#6B6660] hover:text-[#C41E2A]
                            transition-colors group/link"
                        >
                          <span className="mt-px flex-shrink-0 font-mono text-[10px]">
                            {getTypeIcon(item.doc.document_type)}
                          </span>
                          <span className="line-clamp-2 leading-snug group-hover/link:underline">
                            {item.doc.title}
                          </span>
                          <svg className="ml-auto mt-px h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    )
                  }

                  // Type group link
                  const typeLabels: Record<string, string> = {
                    form: 'Въпросници',
                    email_template: 'Имейл шаблони',
                    assignment: 'Задания',
                  }
                  return (
                    <li key={idx}>
                      <Link
                        href={`/?dept=${item.deptId}&type=${item.type}`}
                        className="flex items-center gap-2 text-xs text-[#6B6660] hover:text-[#C41E2A]
                          transition-colors group/link"
                      >
                        <span className="flex-shrink-0 font-mono text-[10px]">
                          {getTypeIcon(item.type)}
                        </span>
                        <span className="group-hover/link:underline">
                          {typeLabels[item.type]}
                        </span>
                        <span className="ml-1 rounded bg-[#F0EDE8] px-1.5 py-0.5 text-[10px] text-[#6B6660]">
                          {item.count}
                        </span>
                        <svg className="ml-auto h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  )
                })}

                {remaining > 0 && (
                  <li>
                    <Link
                      href={`/?dept=${dept.id}`}
                      className="text-xs text-[#6B6660] hover:text-[#C41E2A] transition-colors"
                    >
                      + още {remaining} {remaining === 1 ? 'документ' : 'документа'}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}
