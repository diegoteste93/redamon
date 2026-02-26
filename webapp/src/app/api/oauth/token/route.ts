import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Math.floor(Date.now() / 1000)
  return NextResponse.json({
    token_type: 'Bearer',
    access_token: Buffer.from(`${user.id}:${user.role}:${now}`).toString('base64url'),
    expires_in: 3600,
    scope: user.role,
  })
}
