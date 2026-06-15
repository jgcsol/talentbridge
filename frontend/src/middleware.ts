import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'tb_auth'

/**
 * Route guard middleware.
 *
 * Rules:
 *  - /candidate/* requires CANDIDATE role
 *  - /employer/*  requires EMPLOYER role
 *  - Both require the auth cookie to exist at all
 *  - Unauthenticated → /login
 *  - Wrong role      → /login (could also redirect to their dashboard)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isCandidateRoute = pathname.startsWith('/candidate')
  const isEmployerRoute  = pathname.startsWith('/employer')

  if (!isCandidateRoute && !isEmployerRoute) {
    return NextResponse.next()
  }

  // Read the auth cookie
  const raw = request.cookies.get(COOKIE_NAME)?.value

  if (!raw) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let role: string | undefined
  try {
    role = JSON.parse(decodeURIComponent(raw)).role
  } catch {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isCandidateRoute && role !== 'CANDIDATE') {
    return NextResponse.redirect(new URL(
      role === 'EMPLOYER' ? '/employer/dashboard' : '/login',
      request.url
    ))
  }

  if (isEmployerRoute && role !== 'EMPLOYER') {
    return NextResponse.redirect(new URL(
      role === 'CANDIDATE' ? '/candidate/dashboard' : '/login',
      request.url
    ))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/candidate/:path*', '/employer/:path*'],
}
