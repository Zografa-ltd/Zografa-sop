import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params

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
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    document_type: (doc as any).type,
    updated_at: doc.updated_at,
    department_id: doc.department_id,
    department_name: (doc as any).departments?.display_name ?? '',
    content: (doc as any).content_md ?? '',
    related_documents: related,
  })
}
