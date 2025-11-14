import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT Payload type definition
interface JwtPayload {
  id: number;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'INVENTORY_MANAGER' | 'SALES_STAFF';
  iat: number;
  exp: number;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl;

  // Get user info from token (if exists)
  let userRole: string | null = null;
  let userId: number | null = null;
  let isAuthenticated = false;

  if (token) {
    try {
      // SECURITY FIX: Verify JWT token signature instead of just decoding
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );

      const { payload } = await jwtVerify(token, secret);

      // Validate payload structure
      if (
        payload &&
        typeof payload.id === 'number' &&
        typeof payload.email === 'string' &&
        typeof payload.role === 'string'
      ) {
        userRole = payload.role as string;
        userId = payload.id as number;
        isAuthenticated = true;
      }
    } catch (error) {
      // Token is invalid, expired, or signature doesn't match
      console.error('Token verification error:', error);
      isAuthenticated = false;
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/compte', '/admin', '/pos'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Auth routes that authenticated users shouldn't access
  const authRoutes = ['/connexion', '/inscription'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/connexion', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const redirectTo = userRole === 'ADMIN' ? '/admin' : '/compte';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Check role-based access for admin routes
  if (pathname.startsWith('/admin') && isAuthenticated && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/compte', request.url));
  }

  // Check role-based access for POS routes
  if (pathname.startsWith('/pos') && isAuthenticated && userRole !== 'ADMIN' && userRole !== 'STAFF') {
    return NextResponse.redirect(new URL('/compte', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/compte/:path*',
    '/admin/:path*',
    '/pos/:path*',
    '/connexion',
    '/inscription',
  ],
};
