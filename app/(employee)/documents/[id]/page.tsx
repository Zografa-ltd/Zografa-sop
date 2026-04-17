import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { DocumentViewer } from '@/components/employee/DocumentViewer'
import { DocumentFull } from '@/lib/documents'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: data?.title ? `${data.title} | Зографа Документи` : 'Документ | Зографа',
  }
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      type,
      updated_at,
      department_id,
      content_md,
      departments ( display_name )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !doc) {
    notFound()
  }

  // Fetch related documents
  const { data: relations } = await supabase
    .from('document_relations')
    .select('related_document_id, documents:related_document_id ( id, title )')
    .eq('document_id', id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const related = (relations ?? []).map((r: any) => ({
    id: r.documents?.id ?? r.related_document_id,
    title: r.documents?.title ?? '',
  }))

  const fullDoc: DocumentFull = {
    id: doc.id,
    title: doc.title,
    document_type: (doc as any).type,
    updated_at: doc.updated_at,
    department_id: doc.department_id,
    department_name: (doc as any).departments?.display_name ?? '',
    content: (doc as any).content_md ?? '',
    related_documents: related,
  }

  return <DocumentViewer doc={fullDoc} />
}
