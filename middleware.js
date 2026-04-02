import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow login page, API routes, static files
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/tracker.js' ||
    pathname === '/logo.png' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const auth = request.cookies.get('vsl_auth');
  if (!auth || auth.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
