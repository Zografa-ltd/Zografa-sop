import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const role = await getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  if (role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('departments')
    .select('id, code, display_name, sort_order')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
