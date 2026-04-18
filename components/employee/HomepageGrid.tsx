import Link from 'next/link'
import {
  Department,
  DocumentSummary,
  ProductModel,
  DEPT_DESCRIPTIONS,
  getDepartmentIconPath,
  getTypeIcon,
} from '@/lib/documents'

interface HomepageGridProps {
  departments: Department[]
  productModels: ProductModel[]
  documents: DocumentSummary[]
}

const MAX_LINKS_PER_SECTION = 4

const TYPE_LABELS: Record<string, string> = {
  form: 'Въпросници',
  email_template: 'Имейл шаблони',
  assignment: 'Задания',
}

type LinkItem =
  | { kind: 'doc'; doc: DocumentSummary }
  | { kind: 'group'; type: string; count: number; href: string }

function buildLinks(docs: DocumentSummary[], deptId: string, modelId?: string): LinkItem[] {
  const links: LinkItem[] = []
  docs.filter((d) => d.document_type === 'sop').forEach((doc) => links.push({ kind: 'doc', doc }))
  ;(['form', 'email_template', 'assignment'] as const).forEach((type) => {
    const count = docs.filter((d) => d.document_type === type).length
    if (count > 0) {
      const href = modelId
        ? `/?dept=${deptId}&model=${modelId}&type=${type}`
        : `/?dept=${deptId}&type=${type}`
      links.push({ kind: 'group', type, count, href })
    }
  })
  return links
}

function DocLinkList({ links }: { links: LinkItem[] }) {
  const visible = links.slice(0, MAX_LINKS_PER_SECTION)
  return (
    <ul className="space-y-2">
      {visible.map((item, idx) => {
        if (item.kind === 'doc') {
          return (
            <li key={idx}>
              <Link
                href={`/documents/${item.doc.id}`}
                className="flex items-start gap-2 text-xs text-[#6B6660] hover:text-[#C41E2A] transition-colors group/link"
              >
                <span className="mt-px flex-shrink-0 font-mono text-[10px]">{getTypeIcon(item.doc.document_type)}</span>
                <span className="line-clamp-2 leading-snug group-hover/link:underline">{item.doc.title}</span>
                <svg className="ml-auto mt-px h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          )
        }
        return (
          <li key={idx}>
            <Link
              href={item.href}
              className="flex items-center gap-2 text-xs text-[#6B6660] hover:text-[#C41E2A] transition-colors group/link"
            >
              <span className="flex-shrink-0 font-mono text-[10px]">{getTypeIcon(item.type)}</span>
              <span className="group-hover/link:underline">{TYPE_LABELS[item.type]}</span>
              <span className="ml-1 rounded bg-[#F0EDE8] px-1.5 py-0.5 text-[10px] text-[#6B6660]">{item.count}</span>
              <svg className="ml-auto h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        )
      })}
      {links.length > MAX_LINKS_PER_SECTION && (
        <li>
          <span className="text-xs text-[#6B6660]">
            + още {links.length - MAX_LINKS_PER_SECTION} документа
          </span>
        </li>
      )}
    </ul>
  )
}

export function HomepageGrid({ departments, productModels, documents }: HomepageGridProps) {
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
        const deptModels = productModels
          .filter((m) => m.department_id === dept.id)
          .sort((a, b) => a.sort_order - b.sort_order)
        const description = DEPT_DESCRIPTIONS[dept.name] ?? ''
        const iconPath = getDepartmentIconPath(dept.name)
        const useModelHierarchy = deptModels.length >= 2

        return (
          <div
            key={dept.id}
            className="flex flex-col overflow-hidden rounded-xl border border-[#E4E1DB] bg-white
              hover:border-[#C41E2A] hover:shadow-sm transition-all duration-150 group"
          >
            {/* Icon area */}
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

            {/* Content */}
            <div className="flex flex-1 flex-col p-5">
              <Link href={`/?dept=${dept.id}`}>
                <h2 className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C41E2A] transition-colors">
                  {dept.name}
                </h2>
              </Link>
              {description && (
                <p className="mt-1 text-xs text-[#6B6660] leading-relaxed">{description}</p>
              )}

              <div className="my-4 border-t border-[#E4E1DB]" />

              {useModelHierarchy
                ? (
                  <div className="space-y-4">
                    {deptModels.map((model) => {
                      const modelDocs = deptDocs.filter((d) => d.product_model_id === model.id)
                      if (modelDocs.length === 0) return null
                      const links = buildLinks(modelDocs, dept.id, model.id)
                      return (
                        <div key={model.id}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6660] mb-2">
                            {model.name}
                          </p>
                          <DocLinkList links={links} />
                        </div>
                      )
                    })}
                  </div>
                )
                : (
                  <DocLinkList links={buildLinks(deptDocs, dept.id)} />
                )
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}
