import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  if (role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { doc_id, markdown, changes_summary } = await req.json()
  if (!doc_id || !markdown) {
    return Response.json({ error: 'Липсва doc_id или markdown' }, { status: 400 })
  }

  // Save new content_md
  const { data: doc, error: updateErr } = await supabaseAdmin
    .from('documents')
    .update({ content_md: markdown })
    .eq('id', doc_id)
    .select('id, internal_code, title, current_version')
    .single()

  if (updateErr || !doc) {
    return Response.json({ error: updateErr?.message ?? 'Грешка при запис' }, { status: 500 })
  }

  // Record in document_versions
  await supabaseAdmin.from('document_versions').insert({
    document_id: doc_id,
    version: doc.current_version,
    content_md: markdown,
    ai_changes_summary: changes_summary ?? 'AI конвертиране от Word документ',
    published_by: 'admin',
  })

  return Response.json({ ok: true, title: doc.title, code: doc.internal_code })
}
