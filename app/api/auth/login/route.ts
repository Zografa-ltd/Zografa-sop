import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, SESSION_COOKIE_NAME, cookieOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Паролата е задължителна' }, { status: 400 })
    }

    const role = await verifyPassword(password)

    if (!role) {
      return NextResponse.json({ error: 'Грешна парола' }, { status: 401 })
    }

    const response = NextResponse.json({ role, success: true })
    response.cookies.set(SESSION_COOKIE_NAME, role, cookieOptions)
    return response
  } catch {
    return NextResponse.json({ error: 'Грешка при влизане' }, { status: 500 })
  }
}
