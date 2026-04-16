import bcrypt from 'bcryptjs'

export const SESSION_COOKIE_NAME = 'zografa-sop-session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type UserRole = 'employee' | 'admin'

async function signRole(role: UserRole): Promise<string> {
  const secret = process.env.COOKIE_SECRET || 'dev-secret-change-in-production'
  const enc = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(role))
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
  return `${role}.${hex}`
}

export async function createSessionValue(role: UserRole): Promise<string> {
  return signRole(role)
}

export async function getSessionRole(cookieValue: string | undefined): Promise<UserRole | null> {
  if (!cookieValue) return null
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null
  const role = parts[0] as UserRole
  if (role !== 'employee' && role !== 'admin') return null
  const expected = await signRole(role)
  if (cookieValue !== expected) return null
  return role
}

export async function verifyPassword(password: string): Promise<UserRole | null> {
  const employeeHash = process.env.EMPLOYEE_PASSWORD_HASH!
  const adminHash = process.env.ADMIN_PASSWORD_HASH!

  const [isEmployee, isAdmin] = await Promise.all([
    bcrypt.compare(password, employeeHash).catch(() => false),
    bcrypt.compare(password, adminHash).catch(() => false),
  ])

  if (isAdmin) return 'admin'
  if (isEmployee) return 'employee'
  return null
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
}
