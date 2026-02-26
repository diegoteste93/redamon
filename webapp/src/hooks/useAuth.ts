'use client'

import { useQuery } from '@tanstack/react-query'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'PENTESTER' | 'REDTEAM_OPERATOR' | 'CLIENT_READONLY'
  mfaEnabled: boolean
}

async function fetchAuthUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me')
  if (response.status === 401) return null
  if (!response.ok) {
    throw new Error('Failed to fetch session')
  }
  return response.json()
}

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthUser,
    staleTime: 30_000,
  })
}
