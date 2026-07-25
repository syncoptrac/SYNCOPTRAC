import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAuth, getUser, handleDisplaced } from '../../lib/api';
import api from '../../lib/api';

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

export default function InstituteLayout({ children, title }) {
  const router = useRouter();
  const user = getUser();

  // ── Apple Dock-style magnification for the bottom tab bar ─────────
  // Icons scale up as the cursor nears them, with a smooth falloff to
  // neighbors — pure refs + rAF, no new dependency, no re-renders, and it
  // never fires on touch, so tapping on mobile is untouched.
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
    window.location.href = '/institute/login';
  };

  // Poll every 4 seconds — forces logout the moment someone else logs in
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
    const timer = setInterval(checkSession, 4000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

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
        <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* ── Bottom Tab Bar — always visible, never needs scrolling ─── */}
      <nav
        onMouseMove={handleDockMove}
        onMouseLeave={handleDockLeave}
        className="noise-overlay"
        style={{
        flexShrink: 0,
        position: 'relative',
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