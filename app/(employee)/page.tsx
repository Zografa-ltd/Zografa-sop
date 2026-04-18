import { getSidebarData } from '@/lib/server-data'
import { HomepageGrid } from '@/components/employee/HomepageGrid'
import { DocumentGroupView } from '@/components/employee/DocumentGroupView'
import { createSupabaseServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ dept?: string; model?: string; type?: string }>
}

export default async function EmployeeHomePage({ searchParams }: PageProps) {
  const { dept, model, type } = await searchParams
  const { departments, productModels, documents } = await getSidebarData()

  // Group view: specific type for a dept (+ optional model filter)
  if (dept && type) {
    const deptObj = departments.find((d) => d.id === dept)
    const deptName = deptObj?.name ?? ''

    const supabase = await createSupabaseServerClient()
    const query = supabase
      .from('documents')
      .select('id, title, type, updated_at, department_id, product_model_id, content_md, content_html')
      .eq('status', 'published')
      .eq('department_id', dept)
      .eq('type', type)
      .order('title')

    if (model) query.eq('product_model_id', model)

    const { data: rawDocs } = await query

    const groupDocs = (rawDocs ?? []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      document_type: doc.type,
      updated_at: doc.updated_at,
      content: doc.content_md ?? '',
      content_html: doc.content_html ?? null,
    }))

    const modelObj = model ? productModels.find((m) => m.id === model) : null

    return (
      <div className="px-8 py-8 max-w-5xl mx-auto">
        <DocumentGroupView
          documents={groupDocs}
          deptName={modelObj ? `${deptName} — ${modelObj.name}` : deptName}
          type={type}
        />
      </div>
    )
  }

  // Dept overview: show dept card (filtered to one dept)
  if (dept) {
    const deptDocs = documents.filter((d) => d.department_id === dept)
    const deptObj = departments.find((d) => d.id === dept)
    const filteredDepts = deptObj ? [deptObj] : []

    return (
      <div className="px-8 py-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E2A] mb-1">
            Направление
          </p>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{deptObj?.name}</h1>
        </div>
        <HomepageGrid
          departments={filteredDepts}
          productModels={productModels}
          documents={deptDocs}
        />
      </div>
    )
  }

  // Homepage: all department cards
  const deptIds = new Set(documents.map((d) => d.department_id))
  const activeDepts = departments.filter((d) => deptIds.has(d.id))

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E2A] mb-1">
          Вътрешна документация
        </p>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Документи и процеси</h1>
        <p className="mt-1 text-sm text-[#6B6660]">
          Процеси, форми и шаблони на Зографа
        </p>
      </div>

      <HomepageGrid
        departments={activeDepts}
        productModels={productModels}
        documents={documents}
      />
    </div>
  )
}
