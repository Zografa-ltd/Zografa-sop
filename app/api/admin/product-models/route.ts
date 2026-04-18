import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  return role === 'admin'
}

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('product_models')
    .select('id, department_id, name, code, sort_order, departments(display_name, code)')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { department_id, name, code, sort_order } = await req.json()
  if (!department_id || !name || !code) {
    return Response.json({ error: 'Липсват задължителни полета' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('product_models')
    .insert({ department_id, name, code: code.toUpperCase(), sort_order: sort_order ?? 0 })
    .select('id, department_id, name, code, sort_order')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
