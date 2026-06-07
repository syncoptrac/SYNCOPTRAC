import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAuth, getUser } from '../../lib/api';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: '/admin/institutes', label: 'Institutes', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  )},
  { href: '/admin/leads', label: 'Leads', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
];

function SidebarContent({ user, pathname, onClose, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(92,225,230,0.1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <img src="/logo.png" alt="SYNCOPTRAC" style={{
              height: 38, width: 38, objectFit: 'cover', borderRadius: 10,
              boxShadow: '0 0 14px rgba(92,225,230,0.2)',
            }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
            </p>
            <p style={{ fontSize: '11px', marginTop: 3, color: 'rgba(160,180,165,0.55)' }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'rgba(160,180,165,0.3)', padding: '4px 10px 8px' }}>
          Management
        </p>
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                color: active ? '#ffffff' : 'rgba(180,200,240,0.65)',
                background: active
                  ? 'linear-gradient(135deg, #d4af37, #f0c040)'
                  : 'transparent',
                boxShadow: active ? '0 2px 12px rgba(92,225,230,0.28)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(92,225,230,0.10)';
                  e.currentTarget.style.color = '#f0c040';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(180,200,240,0.65)';
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {active && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                  background: 'rgba(17,36,93,0.4)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(92,225,230,0.10)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10, marginBottom: 6,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.08)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #f87171)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            A
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(220,235,225,0.85)' }}>
              {user?.username || 'Admin'}
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(239,68,68,0.6)' }}>Super Admin</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 500,
            color: 'rgba(180,200,240,0.45)', background: 'transparent', border: 'none',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(180,200,240,0.45)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children, title }) {
  const router = useRouter();
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const logout = () => {
    clearAuth();
    try { sessionStorage.clear(); } catch {}
    window.location.href = '/admin/login';
  };

  const sidebarProps = { user, pathname: router.pathname, onClose: () => setSidebarOpen(false), onLogout: logout };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f4ff', overflow: 'hidden' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex" style={{
        width: 220, flexShrink: 0, flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a1844 0%, #11245d 100%)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        borderRight: '1px solid rgba(92,225,230,0.10)',
      }}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} className="md:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)} />
          <aside style={{
            position: 'absolute', left: 0, top: 0, height: '100%', width: 240,
            background: 'linear-gradient(180deg, #0a1844 0%, #11245d 100%)',
            zIndex: 50, boxShadow: '8px 0 40px rgba(0,0,0,0.4)',
            animation: 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <button onClick={() => setSidebarOpen(false)} style={{
              position: 'absolute', top: 14, right: 14, color: 'rgba(200,215,240,0.5)',
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem',
            }}>✕</button>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 20px', height: 58,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
        }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{
            padding: 6, borderRadius: 8, border: 'none', background: 'transparent',
            cursor: 'pointer', color: '#374151',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="SYNCOPTRAC" style={{ height: 28, width: 28, objectFit: 'cover', borderRadius: 7 }} />
            <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>
              <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
            </span>
          </div>

          {title && (
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{title}</h1>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Admin badge */}
          <div className="hidden md:flex" style={{
            alignItems: 'center', gap: 8, padding: '5px 12px',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.12)',
            borderRadius: 20,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 800, color: 'white',
            }}>A</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
              {user?.username || 'Admin'}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700, color: '#ef4444',
              background: 'rgba(239,68,68,0.08)', padding: '1px 7px', borderRadius: 20,
            }}>Super Admin</span>
          </div>

          {title && (
            <span className="md:hidden" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginLeft: 'auto' }}>
              {title}
            </span>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ padding: '24px 20px', maxWidth: 1200 }}>
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}