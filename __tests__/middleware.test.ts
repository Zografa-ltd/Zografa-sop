/**
 * @jest-environment node
 */
import { middleware } from '@/middleware'
import { NextRequest } from 'next/server'

function makeRequest(pathname: string, sessionCookie?: string): NextRequest {
  const req = new NextRequest(new URL(`http://localhost:3000${pathname}`))
  if (sessionCookie) {
    req.cookies.set('zografa-sop-session', sessionCookie)
  }
  return req
}

describe('middleware', () => {
  it('redirects unauthenticated user from / to /login', () => {
    const res = middleware(makeRequest('/'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows employee to access /', () => {
    const res = middleware(makeRequest('/', 'employee'))
    expect(res.status).toBe(200)
  })

  it('redirects employee from /admin to /login', () => {
    const res = middleware(makeRequest('/admin', 'employee'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows admin to access /admin', () => {
    const res = middleware(makeRequest('/admin', 'admin'))
    expect(res.status).toBe(200)
  })

  it('redirects logged-in admin from /login to /admin', () => {
    const res = middleware(makeRequest('/login', 'admin'))
    expect(res.headers.get('location')).toContain('/admin')
  })

  it('redirects logged-in employee from /login to /', () => {
    const res = middleware(makeRequest('/login', 'employee'))
    expect(res.headers.get('location')).toContain('localhost:3000/')
  })

  it('passes through API auth routes without redirect', () => {
    const res = middleware(makeRequest('/api/auth/login'))
    expect(res.status).toBe(200)
  })

  it('allows authenticated admin to reach /api/auth/logout', () => {
    const req = makeRequest('/api/auth/logout', 'admin')
    const res = middleware(req)
    expect(res.status).toBe(200)
  })

  it('allows authenticated employee to reach /api/auth/logout', () => {
    const req = makeRequest('/api/auth/logout', 'employee')
    const res = middleware(req)
    expect(res.status).toBe(200)
  })
})
