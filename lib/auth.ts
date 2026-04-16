import bcrypt from 'bcryptjs'

export const SESSION_COOKIE_NAME = 'zografa-sop-session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type UserRole = 'employee' | 'admin'

export async function verifyPassword(password: string): Promise<UserRole | null> {
  const employeeHash = process.env.EMPLOYEE_PASSWORD_HASH
  const adminHash = process.env.ADMIN_PASSWORD_HASH

  if (!employeeHash || !adminHash) return null

  const [isEmployee, isAdmin] = await Promise.all([
    bcrypt.compare(password, employeeHash).catch(() => false),
    bcrypt.compare(password, adminHash).catch(() => false),
  ])

  if (isAdmin) return 'admin'
  if (isEmployee) return 'employee'
  return null
}

export function getSessionRole(cookieValue: string | undefined): UserRole | null {
  if (cookieValue === 'employee') return 'employee'
  if (cookieValue === 'admin') return 'admin'
  return null
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
}
