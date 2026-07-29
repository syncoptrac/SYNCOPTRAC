import { Html, Head, Main, NextScript } from 'next/document';

/* ── First-paint guard (fixes the white flash) ────────────────────────
   On a cold visit the browser was painting the raw HTML before the
   stylesheet had been applied, so a white page with unstyled text
   appeared for a moment. Two inline (non-blocking-free) pieces fix it:

   1. CRITICAL_CSS  – an inline <style>, so it is guaranteed to be in
      effect on the very first paint. It sets the deep navy canvas and
      hides the app subtree while `sc-boot` is on <html>.
   2. BOOT_SCRIPT   – adds `sc-boot`, then removes it as soon as every
      stylesheet has actually been applied (or after a hard 2s cap, so
      the page can never stay hidden).                                  */

const CRITICAL_CSS = `
html{background:#0B1F4D;-webkit-text-size-adjust:100%}
body{margin:0;background:#0B1F4D;color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
#__next{min-height:100vh;background:#0B1F4D;opacity:1;transition:opacity 240ms cubic-bezier(0.16,1,0.3,1)}
html.sc-boot{background:#0B1F4D}
html.sc-boot #__next{opacity:0}
@media (prefers-reduced-motion: reduce){#__next{transition:none}}
`;

const BOOT_SCRIPT = `(function(){try{var d=document,h=d.documentElement,done=0,t=0,iv;
h.className=(h.className?h.className+' ':'')+'sc-boot';
function show(){if(done)return;done=1;if(iv)clearInterval(iv);
h.className=h.className.replace(/(^|\\s)sc-boot(\\s|$)/g,' ').replace(/\\s+/g,' ').replace(/^\\s|\\s$/g,'');}
function ready(){var l=d.querySelectorAll('link[rel="stylesheet"]');if(!l.length)return d.readyState!=='loading';
for(var i=0;i<l.length;i++){var s=null;try{s=l[i].sheet}catch(e){s=1}if(!s)return false}return true}
iv=setInterval(function(){t+=25;if(ready()||t>=1200)show()},25);
d.addEventListener('DOMContentLoaded',function(){if(ready())show()});
window.addEventListener('load',show);
setTimeout(show,2000);}catch(e){}})();`;

export default function Document(props) {
  // Nonce is injected by middleware via X-Nonce response header,
  // then passed through Next.js context so scripts/styles get approved by CSP.
  const nonce = props.__NEXT_DATA__?.props?.nonce;

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
