import { Html, Head, Main, NextScript } from 'next/document';

/* First paint
   ------------------------------------------------------------------
   HISTORY, because this file has now been wrong twice in opposite
   directions and the reasoning matters more than the code.

   Round 1 hid the whole app (html.sc-boot #__next{opacity:0}) and un-hid it
   from JavaScript once every stylesheet reported a .sheet, with a 1200ms
   interval cap and a 2000ms setTimeout backstop. Those caps were
   UNCONDITIONAL reveals: if CSS had not applied within 1.2s the timer showed
   the page unstyled anyway. That was a real defect.

   Round 14 therefore deleted the guard outright, on the theory that a
   <link rel=stylesheet> in <head> is render-blocking, so the browser would
   never paint unstyled content by itself. A screen recording of a cold load
   in an Android in-app browser disproved that. The page painted the DOM with
   only this inline critical CSS applied - dark 16px text stacked against the
   left edge, bare links where the buttons belong - and held that frame for
   roughly 270ms until the stylesheet landed. Render-blocking is not a
   guarantee you can lean on in every embedded browser.

   So the gate is back, without a timer and without a poll. The reveal is
   expressed in CSS, which ties it to the exact event whose absence causes
   the flash:

     here           html.sc-pre #__next        { visibility: hidden }
     globals.css    html.sc-pre.sc-pre #__next { visibility: visible }

   The release rule repeats the class, so it wins on specificity whichever
   order the two sheets land in. Consequences:

     - Before globals.css applies, the canvas paints in the correct brand
       colour and the content is hidden. An unstyled frame is impossible.
     - The moment globals.css applies, both rules are evaluated in the same
       style recalculation, so content becomes visible already styled. There
       is nothing to guess at and no fade.
     - visibility, not opacity and not display, is deliberate: layout is
       still computed so nothing shifts on reveal, and unlike opacity it does
       not turn #__next into the containing block for the fixed dock, route
       veil and toaster.
     - If globals.css never loads at all, the load handler below finds the
       --sc-css-ready sentinel missing and drops the class, so a broken
       deploy degrades to unstyled content instead of a blank screen. That is
       a failure path, not a timeout.
*/
const CRITICAL_CSS = `
html{background:#0B1F4D;-webkit-text-size-adjust:100%}
body{margin:0;background:#0B1F4D;color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
#__next{min-height:100vh;background:#0B1F4D}
html.sc-pre #__next{visibility:hidden}
html.sc-canvas-app,html.sc-canvas-app body{background:#F8FAFC;color:#111827}
html.sc-canvas-app #__next{background:#F8FAFC}
`;

/* Synchronous and timer-free. It adds the gate class, and registers exactly
   one listener whose only job is to detect a stylesheet that never applied.
   Nothing here reveals content on a schedule - CSS does the reveal. */
const BOOT_SCRIPT = `(function(){try{var d=document,h=d.documentElement,p=(d.location&&d.location.pathname)||'',c='sc-pre';
if(/^\/(institute|admin)(\/|$)/.test(p)&&!/\/login\/?$/.test(p)){c+=' sc-canvas-app'}
h.className=(h.className?h.className+' ':'')+c;
var drop=function(){var a=h.className.split(/\s+/),o=[],i=0;for(;i<a.length;i++){if(a[i]&&a[i]!=='sc-pre'){o.push(a[i])}}h.className=o.join(' ')};
window.addEventListener('load',function(){var ok=false;try{var v=getComputedStyle(h).getPropertyValue('--sc-css-ready');ok=!!(v&&v.replace(/\s/g,''))}catch(e){ok=false}if(!ok){drop()}});}catch(e){}})();`;

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
