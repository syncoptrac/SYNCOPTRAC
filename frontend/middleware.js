import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://syncoptrac-backend.onrender.com';

  // Strict CSP — no unsafe-inline, no unsafe-eval
  // 'strict-dynamic' lets trusted scripts load their own children (Next.js chunks)
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${apiUrl} https://script.google.com https://script.googleusercontent.com`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);


  // These headers are already passing but explicitly set for completeness
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  // Apply to all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};