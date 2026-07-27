import { useRouter } from 'next/router';
import { clearAuth, getUser } from '../../lib/api';
import LiquidDock from '../ui/LiquidDock';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: '/admin/institutes', label: 'Institutes', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  )},
  { href: '/admin/leads', label: 'Leads', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
];

export default function AdminLayout({ children, title }) {
  const router = useRouter();
  const user = getUser();

  const logout = () => {
    clearAuth();
    try { sessionStorage.clear(); } catch {}
    window.location.href = '/admin/login';
  };

  return (
    <div className="app-shell" style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f4ff',
      overflow: 'hidden',
    }}>

      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="noise-overlay" style={{
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(135deg, #0a1844 0%, #11245d 100%)',
        borderBottom: '1px solid rgba(92,225,230,0.12)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        padding: '10px 16px 8px',
      }}>
        {/* Row 1: Brand left, Admin badge right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="logo" style={{ height: 28, width: 28, objectFit: 'cover', borderRadius: 7, boxShadow: '0 0 10px rgba(92,225,230,0.25)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
              <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
            </span>
          </div>

          {/* Admin badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 20,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800, color: 'white', flexShrink: 0,
            }}>A</div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(220,235,255,0.85)' }}>
              {user?.username || 'Admin'}
            </span>
            <span style={{
              fontSize: '9px', fontWeight: 700, color: '#ef4444',
              background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 10,
            }}>Super Admin</span>
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
        <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* ── Bottom dock — Apple-style magnification on dark-blue glass ── */}
      <LiquidDock
        items={NAV}
        onLogout={logout}
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