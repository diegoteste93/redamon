import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSessionToken, hashToken, verifyPassword, verifyTotp } from '@/lib/auth/security'
import { SESSION_COOKIE } from '@/lib/auth/session'

const SESSION_DAYS = 1

export async function POST(request: NextRequest) {
  const { email, password, mfaCode } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (!user.isActive) {
    return NextResponse.json({ error: 'User is deactivated' }, { status: 403 })
  }

  if (user.mfaEnabled) {
    if (!mfaCode || !user.mfaSecret || !verifyTotp(user.mfaSecret, String(mfaCode))) {
      return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 })
    }
  }

  const rawToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
  })

  response.cookies.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })

  response.cookies.set('redamon_role', user.role, {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })

  return response
}
