import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // If we are on the login page, bypass
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Check for our auth cookie
  const authCookie = request.cookies.get('auth_token')
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
