import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const role = getSessionRole(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  if (!role) redirect('/login')
  return <>{children}</>
}
