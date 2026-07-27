import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

/* Premium enterprise chrome - deep dark blue design system.
   header #071A52 / primary #0B1F4D / secondary #12356D
   accent #2563EB / accent hover #3B82F6

   Rebuilt navbar:
   - position: fixed + in-flow spacer, so no ancestor overflow can break it
   - hides on scroll down, reveals on scroll up
   - responsive tiers driven by matchMedia in JS, not CSS media queries,
     so layout can never collapse if a breakpoint fails to apply
   - every structural property is inline; only colour, hover and motion
     live in the stylesheet
   Content is identical to the previous navbar: same links, same labels,
   same order, same routes. Only the presentation changed. */

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/get-started', label: 'Get Started' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const NAV_H = 68;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [away, setAway] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [wide, setWide] = useState(true);
  const openRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* Responsive tiers without CSS media queries */
  useEffect(() => {
    const mqD = window.matchMedia('(min-width: 768px)');
    const mqW = window.matchMedia('(min-width: 1040px)');
    const apply = () => {
      setDesktop(mqD.matches);
      setWide(mqW.matches);
      if (mqD.matches) setOpen(false);
    };
    apply();
    mqD.addEventListener('change', apply);
    mqW.addEventListener('change', apply);
    return () => {
      mqD.removeEventListener('change', apply);
      mqW.removeEventListener('change', apply);
    };
  }, []);

  /* Slide up when scrolling down, slide back down when scrolling up */
  useEffect(() => {
    let lastY = window.scrollY || 0;
    let raf = 0;
    const run = () => {
      raf = 0;
      const y = window.scrollY || 0;
      setScrolled(y > 10);
      if (openRef.current) {
        lastY = y;
        setAway(false);
        return;
      }
      const d = y - lastY;
      if (Math.abs(d) < 7) return;
      if (y < NAV_H + 30) setAway(false);
      else setAway(d > 0);
      lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  const isActive = (href) => router.pathname === href;
  const compact = desktop && !wide;

  const S = {
    bar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transform: away ? 'translateY(-100%)' : 'translateY(0)',
      transition: 'transform 460ms ' + EASE + ', background 420ms ease, box-shadow 420ms ease',
      willChange: 'transform',
    },
    inner: {
      position: 'relative',
      zIndex: 2,
      maxWidth: 1240,
      margin: '0 auto',
      minHeight: NAV_H,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: compact ? 12 : 20,
      padding: desktop ? '0 22px' : '0 16px',
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      textDecoration: 'none',
      flexShrink: 0,
    },
    logo: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      flexShrink: 0,
    },
    logoImg: { width: 30, height: 30, objectFit: 'contain', display: 'block' },
    word: { display: 'flex', flexDirection: 'column', lineHeight: 1.05 },
    mark: {
      fontSize: wide ? 16 : 15,
      fontWeight: 800,
      letterSpacing: '0.045em',
      whiteSpace: 'nowrap',
    },
    tag: {
      display: wide ? 'block' : 'none',
      marginTop: 3,
      fontSize: 7.6,
      fontWeight: 700,
      letterSpacing: '0.085em',
      whiteSpace: 'nowrap',
    },
    links: {
      display: desktop ? 'flex' : 'none',
      alignItems: 'center',
      gap: 1,
      flexShrink: 0,
    },
    link: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      padding: compact ? '8px 10px' : '9px 13px',
      fontSize: compact ? 12.8 : 13.5,
      fontWeight: 600,
      letterSpacing: '0.01em',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    },
    actions: {
      display: desktop ? 'flex' : 'none',
      alignItems: 'center',
      gap: compact ? 7 : 10,
      flexShrink: 0,
    },
    ghost: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: compact ? '8px 11px' : '9px 14px',
      borderRadius: 10,
      fontSize: compact ? 12.4 : 13,
      fontWeight: 600,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    },
    cta: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      overflow: 'hidden',
      padding: compact ? '9px 13px' : '10px 17px',
      borderRadius: 10,
      fontSize: compact ? 12.6 : 13.2,
      fontWeight: 700,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    },
    burger: {
      display: desktop ? 'none' : 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 4.5,
      width: 42,
      height: 42,
      padding: '0 9px',
      borderRadius: 11,
      cursor: 'pointer',
      flexShrink: 0,
    },
    sheet: {
      display: desktop ? 'none' : 'block',
      overflow: 'hidden',
      maxHeight: open ? 480 : 0,
      transition: 'max-height 520ms ' + EASE,
    },
    sheetInner: { padding: '6px 16px 20px' },
    spacer: { height: NAV_H, flexShrink: 0 },
  };

  return (
    <>
      <nav
        className={'nvx' + (scrolled ? ' is-stuck' : '')}
        style={S.bar}
        aria-label="Main"
      >
        <span className="nvx-hair" aria-hidden="true" />

        <div style={S.inner}>
          {/* Brand */}
          <Link href="/" className="nvx-brand" style={S.brand}>
            <span style={S.logo} aria-hidden="true">
              <img src="/logo.png" alt="SYNCOPTRAC" className="nvx-logo-img" style={S.logoImg} />
            </span>
            <span style={S.word}>
              <span style={S.mark}>
                <span className="nvx-mark-s">S</span>
                <span className="nvx-mark-rest">YNCOPTRAC</span>
              </span>
              <span className="nvx-tag" style={S.tag}>
                WHERE COMMUNICATION GETS ORGANISED AND NOTHING IS MISSED.
              </span>
            </span>
          </Link>

          {/* Desktop links */}
          <div style={S.links}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={'nvx-link' + (isActive(l.href) ? ' is-on' : '')}
                style={S.link}
              >
                <span className="nvx-link-face">{l.label}</span>
                <span className="nvx-link-rail" aria-hidden="true" />
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div style={S.actions}>
            <Link href="/institute/login" className="nvx-ghost" style={S.ghost}>
              Institute Login
            </Link>
            <Link href="/get-started" className="nvx-cta" style={S.cta}>
              <span className="nvx-cta-sheen" aria-hidden="true" />
              <span className="nvx-cta-face">Get Started</span>
            </Link>
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            className={'nvx-burger' + (open ? ' is-open' : '')}
            style={S.burger}
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="nvx-bar nvx-bar-1" />
            <span className="nvx-bar nvx-bar-2" />
            <span className="nvx-bar nvx-bar-3" />
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={'nvx-sheet' + (open ? ' is-open' : '')} style={S.sheet}>
          <div className="nvx-sheet-inner" style={S.sheetInner}>
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={'nvx-mlink' + (isActive(l.href) ? ' is-on' : '')}
                style={{ transitionDelay: (open ? 40 + i * 45 : 0) + 'ms' }}
              >
                <span className="nvx-mdot" aria-hidden="true" />
                {l.label}
              </Link>
            ))}
            <span className="nvx-msplit" aria-hidden="true" />
            <Link
              href="/institute/login"
              className="nvx-mghost"
              style={{ transitionDelay: (open ? 40 + LINKS.length * 45 : 0) + 'ms' }}
            >
              Institute Login
            </Link>
            <Link
              href="/get-started"
              className="nvx-mcta"
              style={{ transitionDelay: (open ? 80 + LINKS.length * 45 : 0) + 'ms' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Keeps page content exactly where it was when the bar was in flow */}
      <div style={S.spacer} aria-hidden="true" />

      <style jsx global>{`
        .nvx {
          background: #071a52;
        }
        .nvx.is-stuck {
          background: rgba(7, 26, 82, 0.9);
          backdrop-filter: blur(20px) saturate(170%);
          -webkit-backdrop-filter: blur(20px) saturate(170%);
          box-shadow: 0 10px 38px rgba(3, 12, 40, 0.46);
        }
        .nvx-hair {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(37, 99, 235, 0.5),
            rgba(59, 130, 246, 0.8),
            rgba(37, 99, 235, 0.5),
            transparent
          );
          opacity: 0.55;
          transition: opacity 420ms ease;
        }
        .nvx.is-stuck .nvx-hair {
          opacity: 1;
        }

        .nvx-logo-img {
          transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nvx-brand:hover .nvx-logo-img {
          transform: rotate(-8deg) scale(1.08);
        }
        .nvx-mark-s {
          color: #5ce1e6;
        }
        .nvx-mark-rest {
          color: #ffffff;
        }
        .nvx-tag {
          color: rgba(190, 209, 247, 0.62);
        }

        .nvx-link {
          color: rgba(228, 238, 255, 0.92);
          border-radius: 10px;
          transition: color 240ms ease, background 240ms ease;
        }
        .nvx-link:hover {
          color: #ffffff;
          background: rgba(37, 99, 235, 0.22);
        }
        .nvx-link.is-on {
          color: #ffffff;
          background: rgba(37, 99, 235, 0.3);
        }
        .nvx-link-rail {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 4px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nvx-link:hover .nvx-link-rail,
        .nvx-link.is-on .nvx-link-rail {
          transform: scaleX(1);
        }

        .nvx-ghost {
          color: rgba(233, 241, 255, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.3);
          background: rgba(255, 255, 255, 0.03);
          transition: color 240ms ease, border-color 240ms ease, background 240ms ease;
        }
        .nvx-ghost:hover {
          color: #ffffff;
          border-color: rgba(147, 197, 253, 0.55);
          background: rgba(37, 99, 235, 0.2);
        }

        .nvx-cta {
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.34);
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease;
        }
        .nvx-cta:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 28px rgba(37, 99, 235, 0.48);
        }
        .nvx-cta-face {
          position: relative;
          z-index: 2;
        }
        .nvx-cta-sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -60%;
          width: 45%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: skewX(-18deg);
        }
        .nvx-cta:hover .nvx-cta-sheen {
          animation: nvxSheen 820ms ease;
        }
        @keyframes nvxSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }

        .nvx-burger {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(147, 197, 253, 0.22);
          transition: background 260ms ease, border-color 260ms ease;
        }
        .nvx-burger.is-open {
          background: rgba(37, 99, 235, 0.22);
          border-color: rgba(147, 197, 253, 0.45);
        }
        .nvx-bar {
          display: block;
          height: 1.8px;
          width: 100%;
          border-radius: 2px;
          background: rgba(219, 230, 255, 0.92);
          transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease,
            background 260ms ease;
        }
        .nvx-burger.is-open .nvx-bar {
          background: #93c5fd;
        }
        .nvx-burger.is-open .nvx-bar-1 {
          transform: translateY(6.3px) rotate(45deg);
        }
        .nvx-burger.is-open .nvx-bar-2 {
          opacity: 0;
          transform: scaleX(0.4);
        }
        .nvx-burger.is-open .nvx-bar-3 {
          transform: translateY(-6.3px) rotate(-45deg);
        }

        .nvx-sheet-inner {
          background: linear-gradient(180deg, rgba(7, 26, 82, 0.985), rgba(11, 31, 77, 0.985));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(147, 197, 253, 0.14);
        }
        .nvx-mlink {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 14px;
          border-radius: 11px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          color: rgba(214, 227, 255, 0.9);
          opacity: 0;
          transform: translateX(-10px);
          transition: opacity 420ms ease, transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
            background 220ms ease, color 220ms ease;
        }
        .nvx-sheet.is-open .nvx-mlink {
          opacity: 1;
          transform: translateX(0);
        }
        .nvx-mlink:hover,
        .nvx-mlink.is-on {
          color: #ffffff;
          background: rgba(37, 99, 235, 0.2);
        }
        .nvx-mdot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(147, 197, 253, 0.45);
          transition: background 220ms ease, transform 220ms ease;
        }
        .nvx-mlink.is-on .nvx-mdot,
        .nvx-mlink:hover .nvx-mdot {
          background: #3b82f6;
          transform: scale(1.5);
        }
        .nvx-msplit {
          display: block;
          height: 1px;
          margin: 10px 4px 12px;
          background: rgba(147, 197, 253, 0.14);
        }
        .nvx-mghost,
        .nvx-mcta {
          display: block;
          text-align: center;
          padding: 13px 16px;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 420ms ease, transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nvx-mghost {
          margin-bottom: 9px;
          color: rgba(233, 241, 255, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.3);
        }
        .nvx-mcta {
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.34);
        }
        .nvx-sheet.is-open .nvx-mghost,
        .nvx-sheet.is-open .nvx-mcta {
          opacity: 1;
          transform: translateY(0);
        }

        .nvx-link:focus-visible,
        .nvx-ghost:focus-visible,
        .nvx-cta:focus-visible,
        .nvx-brand:focus-visible,
        .nvx-burger:focus-visible,
        .nvx-mlink:focus-visible,
        .nvx-mghost:focus-visible,
        .nvx-mcta:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .nvx,
          .nvx-logo-img,
          .nvx-link,
          .nvx-link-rail,
          .nvx-ghost,
          .nvx-cta,
          .nvx-bar,
          .nvx-mlink,
          .nvx-mghost,
          .nvx-mcta {
            transition-duration: 1ms !important;
          }
          .nvx-cta:hover .nvx-cta-sheen {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
