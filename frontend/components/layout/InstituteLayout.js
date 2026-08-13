import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { clearAuth, getUser, handleDisplaced } from '../../lib/api';
import api from '../../lib/api';
import LiquidDock from '../ui/LiquidDock';
import DesignSystem from '../ds/DesignSystem';

const NAV = [
  { href: '/institute/dashboard', label: 'Home', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: '/institute/students', label: 'Students', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: '/institute/attendance', label: 'Attend.', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  )},
  { href: '/institute/fees', label: 'Fees', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  )},
  { href: '/institute/enquiries', label: 'Enquiries', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  )},
  { href: '/institute/batches', label: 'Batches', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  )},
  { href: '/institute/settings', label: 'Settings', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

// PERF: what each tab needs the moment it opens. Warming these in the
// background means tab switches paint from cache instead of waiting on a
// 1-3s Apps Script + Sheets read. Purely additive - no endpoint, route or
// auth behaviour changes, and every call is a plain GET the page would have
// made anyway a moment later.
// Hover prefetching has been REMOVED, deliberately.
//
// warmFor() fired a real GET for every nav item the pointer merely passed over
// (batches alone asked for three URLs). Google runs ONE execution of a script
// project at a time, so moving the mouse from Home down to Enquiries could queue
// eight speculative reads IN FRONT of the page the user actually clicked. That
// is the reported symptom precisely: every page in a dashboard -> students ->
// fees -> enquiries walk was slower than the one before it, and the dashboard -
// the most expensive read of the seven - timed out at the back of the queue.
//
// It bought roughly 300ms of head start against a 1-3s read, so it was never a
// good trade on this upstream. The hook is kept as a no-op so the dock's wiring
// and props are untouched; warmth comes from the backend cache instead.
const warmFor = () => {};

export default function InstituteLayout({ children, title }) {
  const router = useRouter();
  const user = getUser();

  const logout = () => {
    clearAuth();
    try { sessionStorage.clear(); } catch {}
    window.location.href = '/institute/login';
  };

  // Poll for session displacement. This ran every 4 SECONDS, i.e. 900 requests
  // per hour per open tab, each one a MongoDB lookup - which by itself consumed
  // the backend's entire rate-limit allowance and then made every other request
  // fail with 429. 15s keeps displacement detection effectively immediate from a
  // human perspective at a quarter of the cost.
  useEffect(() => {
    let alive = true;

    const checkSession = async () => {
      if (!alive) return;
      try {
        // Short 6s timeout — don't wait for Render cold start
        await api.get('/api/auth/verify-session', { timeout: 6000 });
      } catch (err) {
        if (!alive) return;
        if (err?.response?.data?.error === 'SESSION_DISPLACED') {
          handleDisplaced();
        }
        // Network timeout / backend sleeping = ignore, try again next tick
      }
    };

    checkSession();
    const timer = setInterval(checkSession, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  // REMOVED - this was a major cause of "everything is slow".
  // On EVERY navigation this walked all six tabs and fired eight Apps Script
  // reads one after another. Google serialises concurrent executions of a
  // single Apps Script project, so those speculative reads queued in front of
  // the request the user was actually waiting for. Right after a save it was
  // worse: the write invalidated the cache, this refetched every module, and
  // the user's own refetch sat behind all of it - which is how a student save
  // reached the 30s client timeout.
  //
  // Speculative prefetching is now gone entirely (see warmFor above). On an
  // upstream that runs one execution at a time, any read we start that the user
  // did not ask for is a read their next click has to wait behind.

  return (
    <div className="app-shell sc-app" style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#F8FAFC',
      overflow: 'hidden',
    }}>

      <DesignSystem />

      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="noise-overlay" style={{
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(135deg, #0a1844 0%, #11245d 100%)',
        borderBottom: '1px solid rgba(92,225,230,0.12)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        padding: '10px 16px 8px',
      }}>
        {/* Row 1: Brand left, Institute chip right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="logo" style={{ height: 28, width: 28, objectFit: 'cover', borderRadius: 7, boxShadow: '0 0 10px rgba(92,225,230,0.25)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
              <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
            </span>
          </div>

          {/* Institute chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(92,225,230,0.07)',
            border: '1px solid rgba(92,225,230,0.15)',
            borderRadius: 20,
            maxWidth: 160,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #f0c040)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800, color: '#11245d', flexShrink: 0,
            }}>
              {(user?.instituteName || 'I')[0].toUpperCase()}
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'rgba(220,235,255,0.85)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.instituteName || 'Institute'}
            </span>
          </div>
        </div>

        {/* Row 2: Page title */}
        {title && (
          <div style={{ marginTop: 6 }}>
            <h1 style={{
              margin: 0, fontSize: '1.05rem', fontWeight: 700,
              color: '#ffffff', letterSpacing: '-0.01em',
            }}>
              {title}
            </h1>
          </div>
        )}
      </header>

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '22px 18px 12px', maxWidth: 1240, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* ── Bottom dock — Apple-style magnification on dark-blue glass ── */}
      <LiquidDock
        items={NAV}
        onLogout={logout}
        onItemHover={warmFor}
       />

      <style jsx global>{`
        html, body {
          height: 100%;
          height: -webkit-fill-available;
        }
        html {
          height: -webkit-fill-available;
        }
        /* ─── LIQUID GLASS DASHBOARD ──────────────────────────────────
           Scoped to .app-shell so it only affects the admin/institute
           dashboards — the marketing pages and both login pages are untouched.
           Only transform/opacity/filter animate, so scrolling stays smooth. */
        .app-shell {
          --glass-ease: cubic-bezier(0.16, 1, 0.3, 1);
          isolation: isolate;
        }

        /* Ambient dark-blue depth behind the frosted panels. Fixed, so it does
           not repaint while the content scrolls. */
        .app-shell::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(1100px 620px at 12% -8%, rgba(92, 225, 230, 0.16), transparent 62%),
            radial-gradient(900px 560px at 92% 4%, rgba(23, 45, 116, 0.2), transparent 60%),
            radial-gradient(760px 620px at 50% 112%, rgba(17, 36, 93, 0.16), transparent 66%);
        }
        .app-shell > header,
        .app-shell > main,
        .app-shell > nav { position: relative; z-index: 1; }

        .app-shell > main { scroll-behavior: smooth; overscroll-behavior-y: contain; }

        /* Phone spacing: the stock card padding made every KPI card twice as
           tall as it needed to be on a 360px screen, which is what pushed the
           content under the dock. Table cards (.p-0) are excluded. */
        @media (max-width: 520px) {
          .app-shell .card:not(.p-0) { padding: 14px; border-radius: 16px; }
          .app-shell > main { padding: 12px 12px 4px; }
        }

        /* Frosted panels. The light page background shows through, so text
           contrast is unchanged — dark ink on near-white, same as before. */
        .app-shell .card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.72) 100%);
          backdrop-filter: blur(20px) saturate(165%);
          -webkit-backdrop-filter: blur(20px) saturate(165%);
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 18px;
          box-shadow:
            0 12px 32px rgba(17, 36, 93, 0.1),
            0 2px 6px rgba(17, 36, 93, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.92);
          transition: transform 460ms var(--glass-ease), box-shadow 460ms var(--glass-ease);
        }
        @media (hover: hover) and (pointer: fine) {
          .app-shell .card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 20px 46px rgba(17, 36, 93, 0.14),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
          }
        }

        /* Content settles in instead of snapping in. */
        .app-shell > main > div > * {
          animation: glass-rise 560ms var(--glass-ease) both;
        }
        .app-shell > main > div > *:nth-child(2) { animation-delay: 60ms; }
        .app-shell > main > div > *:nth-child(3) { animation-delay: 110ms; }
        .app-shell > main > div > *:nth-child(4) { animation-delay: 150ms; }
        .app-shell > main > div > *:nth-child(n + 5) { animation-delay: 180ms; }
        @keyframes glass-rise {
          from { opacity: 0; transform: translate3d(0, 10px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        /* Inputs and buttons get the same material treatment. */
        .app-shell .input-field {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          transition: box-shadow 260ms var(--glass-ease), border-color 260ms var(--glass-ease),
            background 260ms var(--glass-ease);
        }
        .app-shell .input-field:focus {
          background: #fff;
          box-shadow: 0 0 0 4px rgba(92, 225, 230, 0.16);
        }

        .app-shell .btn-primary {
          border-radius: 12px;
          box-shadow: 0 8px 22px rgba(17, 36, 93, 0.18);
          transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 260ms var(--glass-ease), filter 260ms var(--glass-ease);
        }
        .app-shell .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .app-shell .btn-primary:active { transform: scale(0.97); }

        /* Table rows highlight with a cool tint rather than flat grey. */
        .app-shell tbody tr { transition: background 200ms var(--glass-ease); }
        .app-shell tbody tr:hover { background: rgba(92, 225, 230, 0.07); }

        @media (prefers-reduced-motion: reduce) {
          .app-shell > main > div > * { animation: none !important; }
          .app-shell .card,
          .app-shell .btn-primary,
          .app-shell .input-field { transition-duration: 1ms !important; }
          .app-shell > main { scroll-behavior: auto; }
        }

        .app-shell {
          height: 100vh;
          height: 100dvh; /* real visible viewport on mobile — 100vh includes the
            address-bar area, which pushed the bottom nav below the fold until
            the page was scrolled. 100dvh tracks what's actually visible. */
          min-height: -webkit-fill-available;
        }
      `}</style>
    </div>
  );
}