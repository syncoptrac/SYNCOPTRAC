import { Html, Head, Main, NextScript } from 'next/document';

export default function Document(props) {
  // Nonce is injected by middleware via X-Nonce response header,
  // then passed through Next.js context so scripts/styles get approved by CSP.
  const nonce = props.__NEXT_DATA__?.props?.nonce;

  return (
    <Html lang="en">
      <Head nonce={nonce}>
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
      </Head>
      <body>
        <Main />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}

// Read the nonce from the middleware-set header and pass it as a prop
Document.getInitialProps = async (ctx) => {
  const initialProps = await ctx.defaultGetInitialProps(ctx);
  const nonce = ctx.res?.getHeader?.('X-Nonce') || '';
  return { ...initialProps, nonce };
};