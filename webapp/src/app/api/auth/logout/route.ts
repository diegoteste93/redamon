import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashToken } from '@/lib/auth/security'
import { SESSION_COOKIE } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.authSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { expires: new Date(0), path: '/' })
  response.cookies.set('redamon_role', '', { expires: new Date(0), path: '/' })
  return response
}
