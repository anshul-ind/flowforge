import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/auth/')
  const isPublicPage = pathname === '/'
  const isApiRoute = pathname.startsWith('/api/')

  if (!session && !isAuthPage && !isPublicPage && !isApiRoute) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
