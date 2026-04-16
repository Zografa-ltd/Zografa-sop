import { verifyPassword, getSessionRole, SESSION_COOKIE_NAME } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Generate a real hash for testing
const TEST_EMPLOYEE_PASSWORD = 'employee-test-pass'
const TEST_ADMIN_PASSWORD = 'admin-test-pass'

describe('verifyPassword', () => {
  beforeAll(async () => {
    process.env.EMPLOYEE_PASSWORD_HASH = await bcrypt.hash(TEST_EMPLOYEE_PASSWORD, 10)
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10)
  })

  it('returns null for wrong password', async () => {
    const result = await verifyPassword('wrong-password')
    expect(result).toBeNull()
  })

  it('returns employee for correct employee password', async () => {
    const result = await verifyPassword(TEST_EMPLOYEE_PASSWORD)
    expect(result).toBe('employee')
  })

  it('returns admin for correct admin password', async () => {
    const result = await verifyPassword(TEST_ADMIN_PASSWORD)
    expect(result).toBe('admin')
  })

  it('returns null when env vars are missing', async () => {
    const savedEmp = process.env.EMPLOYEE_PASSWORD_HASH
    const savedAdm = process.env.ADMIN_PASSWORD_HASH
    delete process.env.EMPLOYEE_PASSWORD_HASH
    delete process.env.ADMIN_PASSWORD_HASH
    const result = await verifyPassword('any')
    expect(result).toBeNull()
    process.env.EMPLOYEE_PASSWORD_HASH = savedEmp
    process.env.ADMIN_PASSWORD_HASH = savedAdm
  })
})

describe('getSessionRole', () => {
  it('returns null for undefined', () => {
    expect(getSessionRole(undefined)).toBeNull()
  })

  it('returns employee for "employee"', () => {
    expect(getSessionRole('employee')).toBe('employee')
  })

  it('returns admin for "admin"', () => {
    expect(getSessionRole('admin')).toBe('admin')
  })

  it('returns null for invalid values', () => {
    expect(getSessionRole('hacker')).toBeNull()
    expect(getSessionRole('')).toBeNull()
    expect(getSessionRole('ADMIN')).toBeNull()
  })
})

describe('SESSION_COOKIE_NAME', () => {
  it('is defined', () => {
    expect(SESSION_COOKIE_NAME).toBe('zografa-sop-session')
  })
})
