import { verifyPassword, getSessionRole, SESSION_COOKIE_NAME, createSessionValue } from '@/lib/auth'
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
  it('returns null when no cookie', () => {
    expect(getSessionRole(undefined)).toBeNull()
  })

  it('returns employee role for valid signed employee token', () => {
    const value = createSessionValue('employee')
    expect(getSessionRole(value)).toBe('employee')
  })

  it('returns admin role for valid signed admin token', () => {
    const value = createSessionValue('admin')
    expect(getSessionRole(value)).toBe('admin')
  })

  it('returns null for unsigned plain string', () => {
    expect(getSessionRole('employee')).toBeNull()
  })

  it('returns null for forged admin token', () => {
    expect(getSessionRole('admin.0000000000000000')).toBeNull()
  })

  it('returns null for invalid token', () => {
    expect(getSessionRole('hacker')).toBeNull()
  })
})

describe('SESSION_COOKIE_NAME', () => {
  it('is defined', () => {
    expect(SESSION_COOKIE_NAME).toBe('zografa-sop-session')
  })
})
