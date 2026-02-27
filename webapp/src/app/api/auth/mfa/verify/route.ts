import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTotp } from '@/lib/auth/security'
import { getApiUser } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code, enabled } = await request.json()

  if (enabled === false) {
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaSecret: null },
    })
    return NextResponse.json({ success: true, mfaEnabled: false })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser?.mfaSecret || !verifyTotp(dbUser.mfaSecret, String(code))) {
    return NextResponse.json({ error: 'Invalid MFA code' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaEnabled: true },
  })

  return NextResponse.json({ success: true, mfaEnabled: true })
}
