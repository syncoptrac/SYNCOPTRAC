import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAuth, getUser } from '../../lib/api';

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
];

// Sidebar nav items (desktop only) — same set with 16px icons
const NAV_DESKTOP = NAV.map(n => ({
  ...n,
  icon: <span style={{ transform: 'scale(0.73)', display: 'inline-flex' }}>{n.icon}</span>,
}));

function SidebarContent({ user, pathname, onClose, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(92,225,230,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <img src="/logo.png" alt="SYNCOPTRAC" style={{ height: 38, width: 38, objectFit: 'cover', borderRadius: 10, boxShadow: '0 0 14px rgba(92,225,230,0.2)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, boxShadow: 'inset 0 0 0 1px rgba(92,225,230,0.15)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
            </p>
            <p style={{ fontSize: '11px', marginTop: 3, color: 'rgba(160,180,165,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              {user?.instituteName || 'Institute'}
            </p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(160,180,165,0.3)', padding: '4px 10px 8px' }}>Menu</p>
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, marginBottom: 2,
              fontSize: '0.875rem', fontWeight: active ? 600 : 500,
              textDecoration: 'none',
              color: active ? '#ffffff' : 'rgba(180,200,240,0.65)',
              background: active ? 'linear-gradient(135deg, #d4af37, #f0c040)' : 'transparent',
              boxShadow: active ? '0 2px 12px rgba(92,225,230,0.28)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(92,225,230,0.10)'; e.currentTarget.style.color = '#f0c040'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(180,200,240,0.65)'; } }}
            >
              <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'rgba(17,36,93,0.4)' }} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(92,225,230,0.10)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 6, background: 'rgba(92,225,230,0.05)', border: '1px solid rgba(92,225,230,0.10)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0c040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#11245d', flexShrink: 0 }}>
            {(user?.instituteName || 'I')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(220,235,225,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.instituteName || 'Institute'}</p>
            <p style={{ fontSize: '10px', color: 'rgba(160,180,165,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.loginId || ''}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 500, color: 'rgba(180,200,240,0.45)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(180,200,240,0.45)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    </div>
  );
}

export default function InstituteLayout({ children, title }) {
  const router = useRouter();
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.querySelector('main.dashboard-main');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const logout = () => {
    clearAuth();
    try { sessionStorage.clear(); } catch {}
    window.location.href = '/institute/login';
  };

  const sidebarProps = { user, pathname: router.pathname, onClose: () => setSidebarOpen(false), onLogout: logout };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f4ff', overflow: 'hidden' }}>

      {/* ── Desktop Sidebar (unchanged) ─────────────────────────────── */}
      <aside className="hidden md:flex" style={{
        width: 220, flexShrink: 0, flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a1844 0%, #11245d 100%)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        borderRight: '1px solid rgba(92,225,230,0.10)',
      }}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile drawer (swipe-from-left, blur backdrop) ──────────── */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} className="md:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSidebarOpen(false)} />
          <aside style={{
            position: 'absolute', left: 0, top: 0, height: '100%', width: 260,
            background: 'linear-gradient(180deg, #0a1844 0%, #11245d 100%)',
            zIndex: 50, boxShadow: '8px 0 40px rgba(0,0,0,0.4)',
            animation: 'slideInLeft 0.28s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <button onClick={() => setSidebarOpen(false)} style={{
              position: 'absolute', top: 14, right: 14, color: 'rgba(200,215,240,0.5)',
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1,
            }}>✕</button>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar — desktop: full; mobile: minimal like Spotify */}
        <header style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 16px', height: 56,
          background: scrolled ? 'rgba(10,24,68,0.98)' : 'linear-gradient(135deg, #0a1844 0%, #11245d 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(92,225,230,0.15)' : 'rgba(92,225,230,0.10)'}`,
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
        }}>
          {/* Mobile: logo only (no burger — nav is bottom tab bar) */}
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="SYNCOPTRAC" style={{ height: 30, width: 30, objectFit: 'cover', borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
              <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
            </span>
          </div>

          {/* Desktop: page title */}
          {title && (
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{title}</h1>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Mobile: page title right-aligned */}
          {title && (
            <span className="md:hidden" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(220,235,255,0.9)' }}>
              {title}
            </span>
          )}

          {/* Desktop: institute name chip */}
          <div className="hidden md:flex" style={{
            alignItems: 'center', gap: 8, padding: '5px 12px',
            background: 'rgba(92,225,230,0.06)', border: '1px solid rgba(92,225,230,0.14)', borderRadius: 20,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0c040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#11245d' }}>
              {(user?.instituteName || 'I')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(220,235,255,0.85)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.instituteName || 'Institute'}
            </span>
          </div>
        </header>

        {/* Scrollable content — bottom padding on mobile for tab bar */}
        <main className="dashboard-main" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ padding: '16px 16px', maxWidth: 1200, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
            className="md-normal-pad">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Tab Bar (Spotify/Airbnb pattern) ─────────── */}
        <nav className="md:hidden" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
          background: 'rgba(10,18,58,0.97)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(92,225,230,0.12)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {NAV.map(item => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, padding: '10px 4px 8px',
                textDecoration: 'none',
                color: active ? '#5ce1e6' : 'rgba(180,200,240,0.4)',
                transition: 'color 0.2s ease',
                position: 'relative',
              }}>
                {/* Active pill indicator — Spotify style */}
                {active && (
                  <span style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 3, borderRadius: '0 0 3px 3px',
                    background: 'linear-gradient(90deg, #5ce1e6, #d4af37)',
                  }} />
                )}
                <span style={{ fontSize: '1.25rem', lineHeight: 1, filter: active ? 'drop-shadow(0 0 6px rgba(92,225,230,0.6))' : 'none', transition: 'filter 0.2s ease' }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: '9.5px', fontWeight: active ? 700 : 500,
                  letterSpacing: '0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '100%', textAlign: 'center',
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @media (min-width: 768px) {
          .md-normal-pad {
            padding: 24px 20px !important;
            padding-bottom: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}