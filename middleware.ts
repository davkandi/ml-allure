import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  const { pathname } = request.nextUrl;

  // Get user info from token (if exists)
  let userRole: string | null = null;
  let isAuthenticated = false;

  if (token) {
    try {
      // Decode JWT token to get user role
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.role;
      isAuthenticated = true;
    } catch (error) {
      console.error('Token parsing error:', error);
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
