import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { extractDocxText, convertTextToMd } from '@/lib/ai-agent'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  if (role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const docId = form.get('doc_id') as string | null

  if (!file || !docId) {
    return Response.json({ error: 'Липсва файл или документ' }, { status: 400 })
  }

  // Fetch doc metadata from Supabase
  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .select('id, internal_code, title, type, current_version')
    .eq('id', docId)
    .single()

  if (docErr || !doc) {
    return Response.json({ error: 'Документът не е намерен' }, { status: 404 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Extract text from docx
  const rawText = await extractDocxText(buffer)
  if (!rawText.trim()) {
    return Response.json({ error: 'Не може да се извлече текст от файла' }, { status: 400 })
  }

  // Convert with Gemini
  const markdown = await convertTextToMd(
    rawText,
    doc.type as 'sop' | 'email_template' | 'assignment' | 'form',
    doc.internal_code,
    doc.title,
    doc.current_version
  )

  return Response.json({ ok: true, markdown, doc_id: docId, title: doc.title })
}
