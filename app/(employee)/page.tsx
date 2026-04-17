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

  // Map departments to the { id, name } shape expected by DocumentLibrary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deptList = (departments ?? []).map((d: any) => ({
    id: d.id,
    name: d.display_name,
  }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Документи</h1>
        <p className="mt-1 text-gray-500">Процеси, форми и шаблони на Зографа</p>
      </div>
      <DocumentLibrary
        departments={deptList}
        initialDocuments={documents}
      />
    </main>
  )
}
