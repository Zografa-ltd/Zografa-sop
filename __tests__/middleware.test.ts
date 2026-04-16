/**
 * @jest-environment node
 */
import { proxy as middleware } from '@/proxy'
import { NextRequest } from 'next/server'
import { createSessionValue } from '@/lib/auth'

async function makeRequest(pathname: string, role?: 'employee' | 'admin'): Promise<NextRequest> {
  const req = new NextRequest(new URL(`http://localhost:3000${pathname}`))
  if (role) {
    req.cookies.set('zografa-sop-session', await createSessionValue(role))
  }
  return req
}

describe('middleware', () => {
  it('redirects unauthenticated user from / to /login', async () => {
    const res = await middleware(await makeRequest('/'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows employee to access /', async () => {
    const res = await middleware(await makeRequest('/', 'employee'))
    expect(res.status).toBe(200)
  })

  it('redirects employee from /admin to /login', async () => {
    const res = await middleware(await makeRequest('/admin', 'employee'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows admin to access /admin', async () => {
    const res = await middleware(await makeRequest('/admin', 'admin'))
    expect(res.status).toBe(200)
  })

  it('redirects logged-in admin from /login to /admin', async () => {
    const res = await middleware(await makeRequest('/login', 'admin'))
    expect(res.headers.get('location')).toContain('/admin')
  })

  it('redirects logged-in employee from /login to /', async () => {
    const res = await middleware(await makeRequest('/login', 'employee'))
    expect(res.headers.get('location')).toContain('localhost:3000/')
  })

  it('passes through API auth routes without redirect', async () => {
    const res = await middleware(await makeRequest('/api/auth/login'))
    expect(res.status).toBe(200)
  })

  it('allows authenticated admin to reach /api/auth/logout', async () => {
    const res = await middleware(await makeRequest('/api/auth/logout', 'admin'))
    expect(res.status).toBe(200)
  })

  it('allows authenticated employee to reach /api/auth/logout', async () => {
    const res = await middleware(await makeRequest('/api/auth/logout', 'employee'))
    expect(res.status).toBe(200)
  })
})
