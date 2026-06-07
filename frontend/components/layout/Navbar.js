import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/get-started', label: 'Get Started' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [router.pathname]);

  const isActive = (href) => router.pathname === href;

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          background: scrolled ? 'rgba(17,36,93,0.88)' : 'rgba(17,36,93,0.97)',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(0px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(0px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(212,175,55,0.12)' : 'rgba(30,55,120,0.8)'}`,
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.35), 0 1px 0 rgba(212,175,55,0.06)' : 'none',
          transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
              <div style={{
                transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
                filter: 'drop-shadow(0 0 8px rgba(92,225,230,0.25))',
              }}
                className="group-hover:scale-105"
              >
                <img
                  src="/logo.png"
                  alt="SYNCOPTRAC"
                  className="h-9 w-9 object-cover rounded-lg"
                  style={{ boxShadow: '0 0 16px rgba(92,225,230,0.2)', transition: 'box-shadow 0.35s ease' }}
                />
              </div>
              <div>
                <span className="font-bold text-[17px] leading-none tracking-wide">
                  <span style={{ color: '#5ce1e6' }}>S</span><span style={{ color: '#ffffff' }}>YNCOPTRAC</span>
                </span>
                <p className="text-[11px] leading-none mt-0.5 hidden sm:block" style={{ color: 'rgba(200,220,255,0.45)', letterSpacing: '0.02em' }}>
                  WHERE COMMUNICATION GETS ORGANISED AND NOTHING IS MISSED.
                </p>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative px-3.5 py-2 text-sm font-medium rounded-lg group"
                  style={{
                    color: isActive(l.href) ? '#5ce1e6' : 'rgba(200,215,240,0.75)',
                    transition: 'color 0.25s ease, background 0.25s ease',
                    background: isActive(l.href) ? 'rgba(92,225,230,0.07)' : 'transparent',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive(l.href)) {
                      e.currentTarget.style.color = '#5ce1e6';
                      e.currentTarget.style.background = 'rgba(92,225,230,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(l.href)) {
                      e.currentTarget.style.color = 'rgba(200,215,240,0.75)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {l.label}
                  <span style={{
                    position: 'absolute',
                    bottom: '5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    height: '1.5px',
                    background: 'linear-gradient(90deg, #5ce1e6, #d4af37)',
                    borderRadius: '2px',
                    width: isActive(l.href) ? 'calc(100% - 28px)' : '0%',
                    transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1)',
                  }}
                    className="group-hover:!w-[calc(100%-28px)]"
                  />
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/institute/login"
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{
                  color: 'rgba(200,215,240,0.7)',
                  border: '1px solid rgba(92,225,230,0.2)',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#5ce1e6';
                  e.currentTarget.style.borderColor = 'rgba(92,225,230,0.4)';
                  e.currentTarget.style.background = 'rgba(92,225,230,0.06)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(200,215,240,0.7)';
                  e.currentTarget.style.borderColor = 'rgba(92,225,230,0.2)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Institute Login
              </Link>
              <Link
                href="/get-started"
                className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                  color: '#11245d',
                  boxShadow: '0 0 16px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(212,175,55,0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2.5 rounded-lg"
              onClick={() => setOpen(o => !o)}
              style={{
                background: open ? 'rgba(92,225,230,0.08)' : 'transparent',
                border: '1px solid',
                borderColor: open ? 'rgba(92,225,230,0.2)' : 'rgba(92,225,230,0.15)',
                transition: 'all 0.25s ease',
              }}
              aria-label="Toggle menu"
            >
              {[0, 1, 2].map(i => (
                <span key={i} className="block w-5 h-[1.5px] rounded-full" style={{
                  background: open ? '#5ce1e6' : 'rgba(200,215,240,0.7)',
                  marginBottom: i < 2 ? '4px' : '0',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  transform: open
                    ? i === 0 ? 'rotate(45deg) translate(3.5px, 3.5px)'
                    : i === 2 ? 'rotate(-45deg) translate(3.5px, -3.5px)'
                    : 'none'
                    : 'none',
                  opacity: open && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div style={{
          maxHeight: open ? '420px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.45s cubic-bezier(0.16,1,0.3,1)',
          borderTop: open ? '1px solid rgba(92,225,230,0.08)' : '1px solid transparent',
        }}>
          <div className="px-4 pb-5 pt-3 space-y-1" style={{
            background: 'rgba(10,20,70,0.97)',
            backdropFilter: 'blur(20px)',
          }}>
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center px-3.5 py-3 text-sm font-medium rounded-xl"
                style={{
                  color: isActive(l.href) ? '#5ce1e6' : 'rgba(200,215,240,0.75)',
                  background: isActive(l.href) ? 'rgba(92,225,230,0.08)' : 'transparent',
                  transition: `all 0.35s cubic-bezier(0.16,1,0.3,1) ${open ? i * 45 : 0}ms`,
                  transform: open ? 'translateX(0)' : 'translateX(-12px)',
                  opacity: open ? 1 : 0,
                  textDecoration: 'none',
                }}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2.5">
              <Link
                href="/institute/login"
                className="flex justify-center text-sm py-3 rounded-xl"
                style={{
                  color: 'rgba(200,215,240,0.7)',
                  border: '1px solid rgba(92,225,230,0.2)',
                  textDecoration: 'none',
                }}
              >
                Institute Login
              </Link>
              <Link
                href="/get-started"
                className="flex justify-center text-sm font-semibold py-3 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                  color: '#11245d',
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(212,175,55,0.2)',
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}