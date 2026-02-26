import { NextRequest, NextResponse } from 'next/server'
import { getApiUser } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(user)
}
