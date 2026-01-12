import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname.startsWith('/auth') || pathname === '/') {
    return NextResponse.next()
  }

  // Get auth token from cookie
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to sign-in page
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  try {
    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userRole = payload.role as string

    // Admin routes require ADMINISTRATOR role
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'ADMINISTRATOR') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Manager routes require MANAGER or higher role
    if (pathname.startsWith('/manager')) {
      if (!['MANAGER', 'ADMINISTRATOR'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to sign-in
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/manager/:path*',
    '/profile/:path*'
  ]
}
