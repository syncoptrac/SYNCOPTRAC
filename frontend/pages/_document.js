import { Html, Head, Main, NextScript } from 'next/document';

// Next.js 15 compatible _document — no getInitialProps needed.
// Nonce for CSP is injected by middleware.js per-request.
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="google-site-verification" content="523n7u-m9-4tjldm_7YPMem-UZ5YNveBbQrGxDOl1Zk" />
        <meta name="description" content="SYNCOPTRAC — Where communication gets organised and nothing is missed. Complete management system for coaching centres and institutes." />
        <meta name="keywords" content="SYNCOPTRAC, coaching centre management, institute software, student management, attendance, fee management" />
        <meta property="og:title" content="SYNCOPTRAC — Where communication gets organised" />
        <meta property="og:description" content="Manage students, attendance, fees, and enquiries in one simple dashboard." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/logo.png" type="image/jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}