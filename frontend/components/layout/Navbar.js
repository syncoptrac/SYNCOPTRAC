import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

/* Premium enterprise chrome - deep dark blue design system.
   header #071A52 / primary #0B1F4D / secondary #12356D
   accent #2563EB / accent hover #3B82F6
   Content is identical to the previous navbar: same links, same labels,
   same order, same routes. Only the presentation changed. */

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/get-started', label: 'Get Started' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  const isActive = (href) => router.pathname === href;

  return (
    <nav className={'nb' + (scrolled ? ' is-stuck' : '')}>
      <span className="nb-hair" aria-hidden="true" />
      <span className="nb-aura" aria-hidden="true" />

      <div className="nb-inner">
        {/* Brand */}
        <Link href="/" className="nb-brand">
          <span className="nb-logo" aria-hidden="true">
            <img src="/logo.png" alt="SYNCOPTRAC" className="nb-logo-img" />
            <span className="nb-logo-ring" />
          </span>
          <span className="nb-word">
            <span className="nb-mark">
              <span className="nb-mark-s">S</span>
              <span className="nb-mark-rest">YNCOPTRAC</span>
            </span>
            <span className="nb-tag">
              WHERE COMMUNICATION GETS ORGANISED AND NOTHING IS MISSED.
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="nb-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={'nb-link' + (isActive(l.href) ? ' is-on' : '')}
            >
              <span className="nb-link-face">{l.label}</span>
              <span className="nb-link-rail" aria-hidden="true" />
              <span className="nb-link-glow" aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="nb-actions">
          <Link href="/institute/login" className="nb-ghost">
            Institute Login
          </Link>
          <Link href="/get-started" className="nb-cta">
            <span className="nb-cta-sheen" aria-hidden="true" />
            <span className="nb-cta-face">Get Started</span>
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          className={'nb-burger' + (open ? ' is-open' : '')}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="nb-bar nb-bar-1" />
          <span className="nb-bar nb-bar-2" />
          <span className="nb-bar nb-bar-3" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={'nb-sheet' + (open ? ' is-open' : '')}>
        <div className="nb-sheet-inner">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className={'nb-mlink' + (isActive(l.href) ? ' is-on' : '')}
              style={{ transitionDelay: (open ? 40 + i * 45 : 0) + 'ms' }}
            >
              <span className="nb-mdot" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
          <div className="nb-msplit" aria-hidden="true" />
          <Link
            href="/institute/login"
            className="nb-mghost"
            style={{ transitionDelay: (open ? 40 + LINKS.length * 45 : 0) + 'ms' }}
          >
            Institute Login
          </Link>
          <Link
            href="/get-started"
            className="nb-mcta"
            style={{ transitionDelay: (open ? 80 + LINKS.length * 45 : 0) + 'ms' }}
          >
            Get Started
          </Link>
        </div>
      </div>

      <style jsx>{`
        .nb {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #071a52;
          transition: background 420ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nb.is-stuck {
          background: rgba(7, 26, 82, 0.82);
          backdrop-filter: blur(22px) saturate(170%);
          -webkit-backdrop-filter: blur(22px) saturate(170%);
          box-shadow: 0 10px 40px rgba(3, 12, 40, 0.45);
        }
        .nb-hair {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(37, 99, 235, 0.55),
            rgba(59, 130, 246, 0.75),
            rgba(37, 99, 235, 0.55),
            transparent
          );
          opacity: 0.5;
          transition: opacity 420ms ease;
        }
        .nb.is-stuck .nb-hair {
          opacity: 1;
        }
        .nb-aura {
          position: absolute;
          top: -60%;
          left: 50%;
          width: 640px;
          height: 180%;
          transform: translateX(-50%);
          background: radial-gradient(
            ellipse at center,
            rgba(37, 99, 235, 0.16) 0%,
            transparent 70%
          );
          pointer-events: none;
          opacity: 0;
          transition: opacity 520ms ease;
        }
        .nb.is-stuck .nb-aura {
          opacity: 1;
        }
        .nb-inner {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .nb-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nb-logo {
          position: relative;
          display: block;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
        }
        .nb-logo-img {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          object-fit: cover;
          display: block;
          position: relative;
          z-index: 2;
          transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .nb-logo-ring {
          position: absolute;
          inset: -4px;
          border-radius: 15px;
          background: linear-gradient(
            135deg,
            rgba(37, 99, 235, 0.55),
            rgba(59, 130, 246, 0.15)
          );
          opacity: 0;
          transition: opacity 420ms ease;
        }
        .nb-brand:hover .nb-logo-img {
          transform: scale(1.07);
        }
        .nb-brand:hover .nb-logo-ring {
          opacity: 1;
        }
        .nb-word {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .nb-mark {
          font-size: 17px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.04em;
        }
        .nb-mark-s {
          color: #5ce1e6;
        }
        .nb-mark-rest {
          color: #ffffff;
        }
        .nb-tag {
          font-size: 9.5px;
          line-height: 1.1;
          letter-spacing: 0.06em;
          color: rgba(190, 209, 247, 0.5);
          display: none;
        }

        .nb-links {
          display: none;
          align-items: center;
          gap: 2px;
        }
        .nb-link {
          position: relative;
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: rgba(199, 215, 245, 0.78);
          text-decoration: none;
          transition: color 260ms ease;
          overflow: hidden;
        }
        .nb-link-face {
          position: relative;
          z-index: 2;
        }
        .nb-link-glow {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: linear-gradient(
            180deg,
            rgba(37, 99, 235, 0.22),
            rgba(37, 99, 235, 0.06)
          );
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nb-link-rail {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 5px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nb-link:hover {
          color: #ffffff;
        }
        .nb-link:hover .nb-link-glow {
          opacity: 1;
          transform: scale(1);
        }
        .nb-link:hover .nb-link-rail {
          transform: scaleX(1);
        }
        .nb-link.is-on {
          color: #ffffff;
        }
        .nb-link.is-on .nb-link-glow {
          opacity: 1;
          transform: scale(1);
        }
        .nb-link.is-on .nb-link-rail {
          transform: scaleX(1);
        }

        .nb-actions {
          display: none;
          align-items: center;
          gap: 10px;
        }
        .nb-ghost {
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(214, 227, 255, 0.85);
          border: 1px solid rgba(147, 197, 253, 0.24);
          background: rgba(255, 255, 255, 0.03);
          text-decoration: none;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 300ms ease, background 300ms ease, color 300ms ease;
        }
        .nb-ghost:hover {
          color: #ffffff;
          border-color: rgba(147, 197, 253, 0.5);
          background: rgba(37, 99, 235, 0.16);
          transform: translateY(-2px);
        }
        .nb-cta {
          position: relative;
          overflow: hidden;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.36),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 320ms ease;
        }
        .nb-cta-face {
          position: relative;
          z-index: 2;
        }
        .nb-cta-sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -60%;
          width: 45%;
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: skewX(-18deg);
        }
        .nb-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(37, 99, 235, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .nb-cta:hover .nb-cta-sheen {
          animation: nbSheen 720ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes nbSheen {
          from {
            left: -60%;
          }
          to {
            left: 130%;
          }
        }

        .nb-burger {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          width: 42px;
          height: 42px;
          padding: 0 10px;
          border-radius: 11px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(147, 197, 253, 0.2);
          transition: background 260ms ease, border-color 260ms ease;
        }
        .nb-burger.is-open {
          background: rgba(37, 99, 235, 0.2);
          border-color: rgba(147, 197, 253, 0.42);
        }
        .nb-bar {
          display: block;
          height: 1.7px;
          width: 100%;
          border-radius: 2px;
          background: rgba(214, 227, 255, 0.9);
          transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 220ms ease, background 260ms ease;
        }
        .nb-burger.is-open .nb-bar {
          background: #93c5fd;
        }
        .nb-burger.is-open .nb-bar-1 {
          transform: translateY(5.7px) rotate(45deg);
        }
        .nb-burger.is-open .nb-bar-2 {
          opacity: 0;
          transform: scaleX(0.4);
        }
        .nb-burger.is-open .nb-bar-3 {
          transform: translateY(-5.7px) rotate(-45deg);
        }

        .nb-sheet {
          position: relative;
          z-index: 2;
          max-height: 0;
          overflow: hidden;
          transition: max-height 480ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nb-sheet.is-open {
          max-height: 460px;
        }
        .nb-sheet-inner {
          padding: 8px 20px 22px;
          background: linear-gradient(180deg, rgba(7, 26, 82, 0.98), rgba(11, 31, 77, 0.98));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(147, 197, 253, 0.14);
        }
        .nb-mlink {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 14px;
          margin-bottom: 2px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          color: rgba(206, 221, 250, 0.82);
          text-decoration: none;
          opacity: 0;
          transform: translateX(-14px);
          transition: opacity 420ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1), background 240ms ease,
            color 240ms ease;
        }
        .nb-sheet.is-open .nb-mlink {
          opacity: 1;
          transform: translateX(0);
        }
        .nb-mdot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(147, 197, 253, 0.35);
          flex-shrink: 0;
          transition: background 240ms ease, transform 240ms ease;
        }
        .nb-mlink.is-on {
          color: #ffffff;
          background: rgba(37, 99, 235, 0.18);
        }
        .nb-mlink.is-on .nb-mdot {
          background: #3b82f6;
          transform: scale(1.5);
        }
        .nb-mlink:active {
          background: rgba(37, 99, 235, 0.24);
        }
        .nb-msplit {
          height: 1px;
          margin: 12px 4px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(147, 197, 253, 0.22),
            transparent
          );
        }
        .nb-mghost,
        .nb-mcta {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          text-decoration: none;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 420ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nb-sheet.is-open .nb-mghost,
        .nb-sheet.is-open .nb-mcta {
          opacity: 1;
          transform: translateY(0);
        }
        .nb-mghost {
          font-weight: 600;
          color: rgba(214, 227, 255, 0.85);
          border: 1px solid rgba(147, 197, 253, 0.24);
          margin-bottom: 10px;
        }
        .nb-mcta {
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
        }

        .nb-brand:focus-visible,
        .nb-link:focus-visible,
        .nb-ghost:focus-visible,
        .nb-cta:focus-visible,
        .nb-burger:focus-visible,
        .nb-mlink:focus-visible,
        .nb-mghost:focus-visible,
        .nb-mcta:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
        }

        @media (min-width: 640px) {
          .nb-tag {
            display: block;
          }
        }
        @media (min-width: 900px) {
          .nb-links,
          .nb-actions {
            display: flex;
          }
          .nb-burger,
          .nb-sheet {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .nb-inner {
            padding: 0 16px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .nb-logo-img,
          .nb-link-rail,
          .nb-link-glow,
          .nb-ghost,
          .nb-cta,
          .nb-mlink,
          .nb-mghost,
          .nb-mcta,
          .nb-bar {
            transition-duration: 1ms !important;
          }
          .nb-cta:hover .nb-cta-sheen {
            animation: none;
          }
        }
      `}</style>
    </nav>
  );
}
