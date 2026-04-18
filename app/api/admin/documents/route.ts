import { getSessionRole } from '@/lib/auth'
import { SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  if (role !== 'admin') return false
  return true
}

export async function GET() {
  if (!await requireAdmin()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, internal_code, title, type, status, current_version, updated_at, department_id, departments(display_name)')
    .order('updated_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
