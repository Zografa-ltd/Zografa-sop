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
  if (!await requireAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, code } = await req.json()
  if (!name) return Response.json({ error: 'Липсва name' }, { status: 400 })

  const updates: Record<string, string> = { name }
  if (code) updates.code = code.toUpperCase()

  const { data, error } = await supabaseAdmin
    .from('product_models')
    .update(updates)
    .eq('id', id)
    .select('id, department_id, name, code, sort_order')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Unassign documents before deleting
  await supabaseAdmin
    .from('documents')
    .update({ product_model_id: null })
    .eq('product_model_id', id)

  const { error } = await supabaseAdmin
    .from('product_models')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
