import { createSupabaseServerClient } from '@/lib/supabase'
import { DocumentLibrary } from '@/components/employee/DocumentLibrary'
import { DocumentSummary } from '@/lib/documents'

export const dynamic = 'force-dynamic'

export default async function EmployeeHomePage() {
  const supabase = await createSupabaseServerClient()

  // Fetch departments
  const { data: departments } = await supabase
    .from('departments')
    .select('id, display_name')
    .order('sort_order')

  // Fetch all published documents with department names
  const { data: rawDocs } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      type,
      updated_at,
      department_id,
      departments ( display_name )
    `)
    .eq('status', 'published')
    .order('title')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents: DocumentSummary[] = (rawDocs ?? []).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    document_type: doc.type,
    updated_at: doc.updated_at,
    department_id: doc.department_id,
    department_name: doc.departments?.display_name ?? '',
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deptList = (departments ?? []).map((d: any) => ({
    id: d.id,
    name: d.display_name,
  }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10 border-b border-gray-200 pb-8">
        <h1 className="font-serif text-4xl font-bold text-gray-900 tracking-tight">
          Документи
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Процеси, форми и шаблони на Зографа
        </p>

        {/* Stats row */}
        <div className="mt-6 flex gap-6">
          <div className="text-center">
            <span className="block text-2xl font-bold text-indigo-600">{documents.length}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Документа</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-indigo-600">{deptList.length}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Отдела</span>
          </div>
        </div>
      </div>

      <DocumentLibrary
        departments={deptList}
        initialDocuments={documents}
      />
    </main>
  )
}
