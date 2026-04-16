import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, getSessionRole } from '@/lib/auth'

export { proxy as middleware }

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const role = getSessionRole(sessionCookie)

  // Public routes — redirect if already logged in
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'employee') return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // Admin routes require admin role
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url))
    }
    return NextResponse.next()
  }

  // All other routes require at least employee role
  if (!role) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$).*)'],
}
