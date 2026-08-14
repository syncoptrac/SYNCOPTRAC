import { Html, Head, Main, NextScript } from 'next/document';

/* ── First paint ────────────────────────────────────────
   This file is where the "flash of unstyled content" was coming FROM, rather
   than being prevented.

   The previous version hid the entire app (html.sc-boot #__next{opacity:0})
   and un-hid it from JavaScript once every stylesheet reported a .sheet, with
   a 1200ms interval cap and a 2000ms setTimeout as backstops. Two problems:

   1. Those caps are UNCONDITIONAL reveals. If the CSS had not applied within
      1.2s - one cold mobile connection is enough - the timer stripped the
      class and showed the page in whatever state it was in: browser-default
      black 16px text, no flex/grid so content stacked in the top-left corner,
      and a 1600x1600 logo at full intrinsic size. That is precisely the
      reported flash, and it is why it only happened "sometimes".

   2. It was protection the browser already provides. A <link rel=stylesheet>
      in <head> is render-blocking - the browser will not paint the document
      until it has that CSS. Gating visibility on JS instead traded that
      guarantee for a race, and cost every load up to 1.2s of blank canvas
      plus a 240ms fade before anything could appear.

   So the guard is gone. What remains is the part that genuinely earns its
   place: an inline <style> (parsed before any paint, needs no network) that
   sets the correct canvas colour, plus one synchronous line that picks which
   canvas this route uses. /institute/* and /admin/* render on the light app
   canvas and everything else on marketing navy, so without this the app
   routes painted navy and were repainted light the instant globals.css
   applied. Both colours below are already used by the app; nothing is new.

   opacity is also no longer set on #__next. An ancestor with opacity < 1
   becomes the containing block for position:fixed descendants, which put the
   dock, the route veil and the toaster at risk of shifting mid-transition. */

const CRITICAL_CSS = `
html{background:#0B1F4D;-webkit-text-size-adjust:100%}
body{margin:0;background:#0B1F4D;color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
#__next{min-height:100vh;background:#0B1F4D}
html.sc-canvas-app,html.sc-canvas-app body{background:#F8FAFC;color:#111827}
html.sc-canvas-app #__next{background:#F8FAFC}
`;

/* Synchronous, no timers, and it cannot strand the page hidden because it
   never hides anything. */
const BOOT_SCRIPT = `(function(){try{var d=document,h=d.documentElement,p=(d.location&&d.location.pathname)||'';
if(/^\/(institute|admin)(\/|$)/.test(p)&&!/\/login\/?$/.test(p)){h.className=(h.className?h.className+' ':'')+'sc-canvas-app'}}catch(e){}})();`;

export default function Document(props) {
  // Nonce is injected by middleware via X-Nonce response header,
  // then passed through Next.js context so scripts/styles get approved by CSP.
  // getInitialProps below returns the nonce as a top-level prop, so it is read
  // from props directly. It used to be read from props.__NEXT_DATA__.props,
  // where it never existed - so nonce was always undefined and every
  // nonce={...} attribute silently did nothing.
  const nonce = props.nonce || undefined;

  return (
    <Html lang="en">
      <Head nonce={nonce}>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#071A52" />
        <style
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }}
        />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <meta name="google-site-verification" content="523n7u-m9-4tjldm_7YPMem-UZ5YNveBbQrGxDOl1Zk" />
        <meta name="description" content="Manage students, attendance, fees, and enquiries through a single structured system—reducing mental workload, eliminating scattered records, preventing missed follow-ups, and minimizing lost revenue." />
        <meta name="keywords" content="SYNCOPTRAC, coaching centre management, institute software, student management, attendance, fee management" />
        <meta property="og:title" content="SYNCOPTRAC — Where communication gets organised" />
        <meta property="og:description" content="Manage students, attendance, fees, and enquiries through a single structured system—reducing mental workload, eliminating scattered records, preventing missed follow-ups, and minimizing lost revenue." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/logo.png" type="image/jpeg" />
        {/* No web font is loaded anywhere in this app - the UI uses the
            system font stack - so these two preconnects were opening a DNS
            lookup and a TLS handshake per page load for a font request that
            never comes. Nothing renders differently without them. */}
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
