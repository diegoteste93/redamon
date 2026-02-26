import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { buildOtpAuthUri, generateBase32Secret } from '@/lib/auth/security'
import { getApiUser } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = generateBase32Secret()
  const otpauth = buildOtpAuthUri(user.email, secret)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaSecret: secret,
      mfaEnabled: false,
    },
  })

  return NextResponse.json({ secret, otpauth })
}
