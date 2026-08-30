import '../styles/globals.css';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Cinematic page progress bar ────────────────────────────────────────
function ProgressBar({ active }) {
  const [width, setWidth] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (active) {
      setWidth(0);
      timerRef.current = setInterval(() => {
        setWidth((w) => {
          if (w >= 85) {
            clearInterval(timerRef.current);
            return 85;
          }
          return w + (85 - w) * 0.12;
        });
      }, 80);
    } else {
      clearInterval(timerRef.current);
      setWidth(100);
    }
    return () => clearInterval(timerRef.current);
  }, [active]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #5ce1e6, #f0c040, #ffe07a)',
          boxShadow: '0 0 12px rgba(92,225,230,0.7), 0 0 4px rgba(240,192,64,0.9)',
          transition: active
            ? 'width 0.4s cubic-bezier(0.4,0,0.2,1)'
            : 'width 0.25s ease, opacity 0.4s ease 0.3s',
          opacity: width === 100 && !active ? 0 : 1,
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  );
}

/* ── Route veil ───────────────────────────────────────────────────────
   The white flash between login and dashboard happens because the outgoing
   navy page unmounts before the incoming light page has painted. A navy veil
   fades in over the old page, covers the swap entirely, and only fades out
   once the new route has committed — so the eye never sees an unpainted frame.

   Timings: 220ms in → hold through the route commit → 420ms out.        */
const VEIL_IN_MS = 220;
const VEIL_HOLD_MS = 140;
const VEIL_OUT_MS = 420;

function RouteVeil({ state }) {
  const visible = state === 'in';
  const active = state !== 'hidden';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
        transition: visible
          ? `opacity ${VEIL_IN_MS}ms cubic-bezier(0.65,0,0.35,1)`
          : `opacity ${VEIL_OUT_MS}ms cubic-bezier(0.16,1,0.3,1)`,
        background:
          'radial-gradient(ellipse 70% 60% at 50% 40%, #16295f 0%, #0d1e55 45%, #0a1844 100%)',
        willChange: 'opacity',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle 220px at 50% 50%, rgba(92,225,230,0.10) 0%, transparent 70%)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
}

// Next.js 15: pageProps type is now Promise<any> in App Router but stays
// the same plain object in Pages Router — no change needed here.
export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [veil, setVeil] = useState('hidden'); // 'hidden' | 'in' | 'out'
  const [pageKey, setPageKey] = useState(router.pathname);
  const veilTimersRef = useRef([]);

  const clearVeilTimers = useCallback(() => {
    veilTimersRef.current.forEach(clearTimeout);
    veilTimersRef.current = [];
  }, []);

  useEffect(() => {
    const handleStart = () => {
      clearVeilTimers();
      setTransitioning(true);
      setVeil('in');
    };

    const handleDone = () => {
      setPageKey(router.pathname);
      setTransitioning(false);

      // Wait for the new route to actually paint before lifting the veil:
      // two frames + a short hold, then fade out and unmount it.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const t1 = setTimeout(() => {
            setVeil('out');
            const t2 = setTimeout(() => setVeil('hidden'), VEIL_OUT_MS);
            veilTimersRef.current.push(t2);
          }, VEIL_HOLD_MS);
          veilTimersRef.current.push(t1);
        });
      });
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
      clearVeilTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* The app had NO viewport meta tag anywhere, which caused two separate
          bugs that both looked like "CSS loaded late":

          1. Without `width=device-width` a mobile browser lays the page out at
             a ~980px desktop width and then scales the result down to fit.
             That is the "text appears tiny / logo appears huge / content in the
             wrong position for a fraction of a second" flash - it is not a
             stylesheet timing problem at all, it is the layout viewport being
             wrong until the browser finishes rescaling.
          2. Without `viewport-fit=cover`, every `env(safe-area-inset-*)` value
             resolves to 0, so the safe-area padding the dock and the modals ask
             for silently did nothing on notched devices.

          It lives here rather than in _document.js because Next.js warns about
          viewport tags in _document, and next/head still server-renders it into
          the initial HTML - so it is correct on the very first paint. */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      <ProgressBar active={transitioning} />
      <RouteVeil state={veil} />

      {/*
        The page itself no longer blurs/translates during navigation. That old
        treatment reflowed the whole tree mid-transition (jank on mobile) and
        was visible as a "jump". The veil now owns the transition, and the page
        only fades — a compositor-only property.
      */}
      <div
        key={pageKey}
        className="route-frame"
        style={{ opacity: transitioning ? 0.985 : 1 }}
      >
        <Component {...pageProps} />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            background: 'rgba(17,36,93,0.95)',
            color: '#f0c040',
            border: '1px solid rgba(92,225,230,0.18)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(92,225,230,0.05)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#5ce1e6', secondary: '#11245d' },
          },
        }}
      />
    </>
  );
}
