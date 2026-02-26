import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateTemporaryPassword, hashPassword } from '@/lib/auth/security'
import { getApiUser } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const requester = await getApiUser(request)
  if (!requester || requester.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const temporaryPassword = generateTemporaryPassword()

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(temporaryPassword) },
  })

  return NextResponse.json({ temporaryPassword })
}
