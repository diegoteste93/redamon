import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hashToken } from './security'

export const SESSION_COOKIE = 'redamon_session'

export const ALL_ROLES = ['ADMIN', 'PENTESTER', 'REDTEAM_OPERATOR', 'CLIENT_READONLY'] as const
export type UserRole = (typeof ALL_ROLES)[number]

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRole
  mfaEnabled: boolean
}

export async function resolveUserByToken(token: string | undefined | null): Promise<AuthenticatedUser | null> {
  if (!token) return null

  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
    include: {
      user: true,
    },
  })

  if (!session || !session.user.isActive) return null

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as UserRole,
    mfaEnabled: session.user.mfaEnabled,
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  return resolveUserByToken(token)
}

export async function getApiUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  return resolveUserByToken(token)
}

export function canAccessPath(role: UserRole, path: string): boolean {
  if (role === 'ADMIN') return true
  if (role === 'CLIENT_READONLY') {
    return path.startsWith('/reports') || path.startsWith('/api/reports') || path.startsWith('/api/auth')
  }

  if (role === 'PENTESTER' || role === 'REDTEAM_OPERATOR') {
    return !path.startsWith('/api/users')
  }

  return false
}

export function requireRole(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role)
}
