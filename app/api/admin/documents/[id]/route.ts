import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  return role === 'admin'
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const allowed = ['draft', 'under_review', 'published', 'archived']

  if (body.status !== undefined && !allowed.includes(body.status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (body.status) updates.status = body.status

  const { error } = await supabaseAdmin
    .from('documents')
    .update(updates)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
