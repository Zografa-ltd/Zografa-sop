import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { convertDocxToHtml } from '@/lib/docx-converter'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  if (role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const code = form.get('internal_code') as string | null

  if (!file || !code) {
    return Response.json({ error: 'Липсва файл или код' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const html = await convertDocxToHtml(buffer)

  const { data, error } = await supabaseAdmin
    .from('documents')
    .update({ content_html: html })
    .eq('internal_code', code)
    .select('id, title')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data?.length) return Response.json({ error: 'Документът не е намерен' }, { status: 404 })

  return Response.json({ ok: true, title: data[0].title })
}
