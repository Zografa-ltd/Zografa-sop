import bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'

export const SESSION_COOKIE_NAME = 'zografa-sop-session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type UserRole = 'employee' | 'admin'

function signRole(role: UserRole): string {
  const secret = process.env.COOKIE_SECRET || 'dev-secret-change-in-production'
  const sig = createHmac('sha256', secret).update(role).digest('hex').slice(0, 16)
  return `${role}.${sig}`
}

function verifySignedRole(value: string): UserRole | null {
  const parts = value.split('.')
  if (parts.length !== 2) return null
  const role = parts[0] as UserRole
  if (role !== 'employee' && role !== 'admin') return null
  const expected = signRole(role)
  if (value !== expected) return null
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

export function getSessionRole(cookieValue: string | undefined): UserRole | null {
  if (!cookieValue) return null
  return verifySignedRole(cookieValue)
}

export function createSessionValue(role: UserRole): string {
  return signRole(role)
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
}
