import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

// ── Cinematic page progress bar ───────────────────────────────────────────────
function ProgressBar({ active }) {
  const [width, setWidth] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (active) {
      setWidth(0);
      // Simulate progress
      timerRef.current = setInterval(() => {
        setWidth(w => {
          if (w >= 85) { clearInterval(timerRef.current); return 85; }
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
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '2px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${width}%`,
        background: 'linear-gradient(90deg, #5ce1e6, #f0c040, #ffe07a)',
        boxShadow: '0 0 12px rgba(92,225,230,0.7), 0 0 4px rgba(240,192,64,0.9)',
        transition: active
          ? 'width 0.4s cubic-bezier(0.4,0,0.2,1)'
          : 'width 0.25s ease, opacity 0.4s ease 0.3s',
        opacity: width === 100 && !active ? 0 : 1,
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  );
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [pageKey, setPageKey] = useState(router.pathname);

  useEffect(() => {
    const handleStart = () => setTransitioning(true);
    const handleDone = () => {
      setPageKey(router.pathname);
      // Small delay before fading in so the new page renders first
      setTimeout(() => setTransitioning(false), 60);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
    };
  }, [router]);

  return (
    <>
      <ProgressBar active={transitioning} />

      <div
        key={pageKey}
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px) scale(0.995)' : 'translateY(0) scale(1)',
          filter: transitioning ? 'blur(3px)' : 'blur(0px)',
          transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1), filter 0.3s ease',
          willChange: 'opacity, transform, filter',
          minHeight: '100vh',
        }}
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