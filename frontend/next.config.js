/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,

  // Next.js 15: Pages Router dependencies are no longer auto-bundled,
  // this flag restores the Next.js 14 behaviour so nothing breaks.
  bundlePagesRouterDependencies: true,

  // Fixes _document PageNotFoundError on Next.js 15
  distDir: '.next',

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.onrender.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;