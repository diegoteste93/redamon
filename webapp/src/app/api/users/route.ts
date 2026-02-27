import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiUser } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/security'

export async function GET(request: NextRequest) {
  const requester = await getApiUser(request)
  if (!requester || requester.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const requester = await getApiUser(request)
  if (!requester || requester.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, role and password are required' }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: { name, email, role, passwordHash: hashPassword(password), isActive: true }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create user:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
