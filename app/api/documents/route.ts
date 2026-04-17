import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('department_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
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

  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  const { data, error } = await query.order('title', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents = (data ?? []).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    document_type: doc.type,
    updated_at: doc.updated_at,
    department_id: doc.department_id,
    department_name: doc.departments?.display_name ?? '',
  }))

  return NextResponse.json(documents)
}
