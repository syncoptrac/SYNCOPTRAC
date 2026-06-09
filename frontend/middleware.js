import { NextResponse } from 'next/server';

export function middleware(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://syncoptrac-backend.onrender.com';

  // Strict CSP — no unsafe-inline, no unsafe-eval
  // 'strict-dynamic' lets trusted scripts load their own children (Next.js chunks)
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob:`,
    `connect-src 'self' ${apiUrl} https://script.google.com https://script.googleusercontent.com`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Nonce', nonce);

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