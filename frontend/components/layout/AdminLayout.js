import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAuth, getUser } from '../../lib/api';

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

  // ── Apple Dock-style magnification for the bottom tab bar ─────────
  // Mirrors InstituteLayout's implementation exactly — refs + rAF, no new
  // dependency, no re-renders, never fires on touch so tapping is untouched.
  const dockIconRefs = useRef([]);
  const dockRafRef = useRef(null);
  const DOCK_RADIUS = 90;
  const DOCK_MAX_SCALE = 1.4;

  const handleDockMove = (e) => {
    const clientX = e.clientX;
    if (dockRafRef.current) return;
    dockRafRef.current = requestAnimationFrame(() => {
      dockRafRef.current = null;
      dockIconRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - center);
        const t = Math.max(0, 1 - dist / DOCK_RADIUS);
        const scale = 1 + (DOCK_MAX_SCALE - 1) * t * t; // ease-out falloff
        const lift = (scale - 1) * 12;
        el.style.transform = `translateY(${-lift}px) scale(${scale})`;
        if (el.parentElement) el.parentElement.style.zIndex = scale > 1.05 ? 5 : 1;
      });
    });
  };

  const handleDockLeave = () => {
    dockIconRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = 'translateY(0px) scale(1)';
      if (el.parentElement) el.parentElement.style.zIndex = 1;
    });
  };

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
      <header style={{
        flexShrink: 0,
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

      {/* ── Bottom Tab Bar — always visible ────────────────────────── */}
      <nav
        onMouseMove={handleDockMove}
        onMouseLeave={handleDockLeave}
        style={{
        flexShrink: 0,
        background: 'rgba(10,18,58,0.97)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(92,225,230,0.12)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV.map((item, i) => {
          const active = router.pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, padding: '10px 2px 9px',
              textDecoration: 'none',
              color: active ? '#5ce1e6' : 'rgba(180,200,240,0.4)',
              transition: 'color 0.2s ease',
              position: 'relative',
            }}>
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 3, borderRadius: '0 0 3px 3px',
                  background: 'linear-gradient(90deg, #5ce1e6, #d4af37)',
                }} />
              )}
              <span
                ref={(el) => (dockIconRefs.current[i] = el)}
                style={{
                  lineHeight: 1,
                  filter: active ? 'drop-shadow(0 0 6px rgba(92,225,230,0.6))' : 'none',
                  transition: 'filter 0.2s ease, transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transformOrigin: 'center bottom',
                  willChange: 'transform',
                }}
              >
                {item.icon}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: active ? 700 : 500,
                letterSpacing: '0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '100%', textAlign: 'center',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Logout tab */}
        <button onClick={logout} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3, padding: '10px 2px 9px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(248,113,113,0.55)', transition: 'color 0.2s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,113,113,0.55)'}
        >
          <span
            ref={(el) => (dockIconRefs.current[NAV.length] = el)}
            style={{
              lineHeight: 1,
              transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'center bottom',
              willChange: 'transform',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <span style={{ fontSize: '9px', fontWeight: 500 }}>Logout</span>
        </button>
      </nav>

      <style jsx global>{`
        html, body {
          height: 100%;
          height: -webkit-fill-available;
        }
        html {
          height: -webkit-fill-available;
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