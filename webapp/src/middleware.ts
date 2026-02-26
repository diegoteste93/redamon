import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'redamon_session'
const ROLE_COOKIE = 'redamon_role'
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/origin', '/api/health', '/api/agent/health']

function canAccessPath(role: string, path: string): boolean {
  if (role === 'ADMIN') return true
  if (role === 'CLIENT_READONLY') {
    return path.startsWith('/reports') || path.startsWith('/api/reports') || path.startsWith('/api/auth')
  }
  if (role === 'PENTESTER' || role === 'REDTEAM_OPERATOR') {
    return !path.startsWith('/api/users')
  }
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const role = request.cookies.get(ROLE_COOKIE)?.value

  if (!token || !role) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!canAccessPath(role, pathname)) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/forbidden', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
}
