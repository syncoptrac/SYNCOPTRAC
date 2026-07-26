import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/*
 * LiquidDock — Apple Dock magnification on a dark-blue liquid-glass pill.
 *
 * Shared by InstituteLayout and AdminLayout so both bottom bars behave
 * identically. Everything here is refs + rAF + CSS transforms:
 *   - no new dependency
 *   - no React re-render while the cursor moves (the old inline version also
 *     avoided this; the press state is the only piece of React state, and it
 *     only changes on pointer down/up)
 *   - only `transform` and `opacity` animate, so it stays on the compositor
 *
 * Magnification is gated behind `(hover: hover) and (pointer: fine)`, so a
 * touch device never gets a stuck-scaled icon after a tap.
 */

const DOCK_RADIUS = 96;      // px of cursor influence either side of an icon
const DOCK_MAX_SCALE = 1.45; // scale of the icon directly under the cursor
const DOCK_MAX_LIFT = 14;    // px the magnified icon rises out of the dock

const LogoutIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function LiquidDock({ items = [], onLogout, onItemHover }) {
  const router = useRouter();
  const iconRefs = useRef([]);
  const rafRef = useRef(null);
  const pointerFine = useRef(false);
  const reduceMotion = useRef(false);
  const [pressed, setPressed] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    pointerFine.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const reset = () => {
    iconRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = 'translate3d(0,0,0) scale(1)';
      el.style.setProperty('--glow', '0');
      if (el.parentElement) el.parentElement.style.zIndex = 1;
    });
  };

  const handleMove = (e) => {
    if (!pointerFine.current || reduceMotion.current) return;
    const clientX = e.clientX;
    if (rafRef.current) return; // coalesce to one update per frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      iconRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const t = Math.max(0, 1 - Math.abs(clientX - center) / DOCK_RADIUS);
        const eased = t * t; // ease-out falloff, so neighbours trail off softly
        const scale = 1 + (DOCK_MAX_SCALE - 1) * eased;
        el.style.transform = `translate3d(0,${-DOCK_MAX_LIFT * eased}px,0) scale(${scale})`;
        el.style.setProperty('--glow', String(eased));
        if (el.parentElement) el.parentElement.style.zIndex = eased > 0.05 ? 5 : 1;
      });
    });
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Collapse magnification when navigating, so the new page never inherits a
  // half-scaled icon.
  useEffect(() => { reset(); }, [router.pathname]);

  const tabs = [...items, { href: '__logout', label: 'Logout', icon: LogoutIcon, danger: true }];

  return (
    <nav className="dock-wrap" onMouseMove={handleMove} onMouseLeave={reset}>
      <div className="dock">
        <span className="dock-sheen" aria-hidden="true" />

        {tabs.map((item, i) => {
          const isLogout = item.href === '__logout';
          const active = !isLogout && router.pathname === item.href;
          const inner = (
            <>
              <span className={`dock-plate${active ? ' is-active' : ''}`} aria-hidden="true" />
              <span
                className="dock-icon"
                ref={(el) => { iconRefs.current[i] = el; }}
              >
                {item.icon}
              </span>
              <span className="dock-label">{item.label}</span>
              {active && <span className="dock-dot" aria-hidden="true" />}
            </>
          );

          const shared = {
            className: `dock-tab${item.danger ? ' is-danger' : ''}${active ? ' is-current' : ''}${pressed === i ? ' is-pressed' : ''}`,
            onPointerDown: () => setPressed(i),
            onPointerUp: () => setPressed(null),
            onPointerCancel: () => setPressed(null),
            onMouseLeave: () => setPressed(null),
          };

          if (isLogout) {
            return (
              <button key="logout" type="button" onClick={onLogout} aria-label="Logout" {...shared}>
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => onItemHover && onItemHover(item.href)}
              onTouchStart={() => onItemHover && onItemHover(item.href)}
              {...shared}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        /* The bar itself is transparent and fades into the page, so the dock
           reads as a floating object rather than a docked strip. */
        .dock-wrap {
          flex-shrink: 0;
          position: relative;
          padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 0px));
          background: linear-gradient(
            180deg,
            rgba(240, 244, 255, 0) 0%,
            rgba(240, 244, 255, 0.78) 42%,
            rgba(240, 244, 255, 0.96) 100%
          );
        }

        /* Liquid glass: a dark-blue translucent body, a saturated blur so
           content behind it bleeds through as colour, a bright 1px top edge
           for the specular line, and an inner highlight for thickness. */
        .dock {
          position: relative;
          display: flex;
          align-items: stretch;
          gap: 2px;
          max-width: 560px;
          margin: 0 auto;
          padding: 6px 8px;
          border-radius: 26px;
          background:
            linear-gradient(180deg, rgba(23, 45, 116, 0.82) 0%, rgba(10, 24, 68, 0.92) 100%);
          backdrop-filter: blur(26px) saturate(190%);
          -webkit-backdrop-filter: blur(26px) saturate(190%);
          border: 1px solid rgba(92, 225, 230, 0.16);
          box-shadow:
            0 18px 44px rgba(8, 18, 52, 0.42),
            0 2px 10px rgba(8, 18, 52, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.16),
            inset 0 -12px 26px rgba(8, 18, 52, 0.32);
        }

        /* Specular sweep across the top third — this is what sells "glass"
           rather than "dark panel". */
        .dock-sheen {
          position: absolute;
          inset: 1px 1px auto 1px;
          height: 46%;
          border-radius: 25px 25px 40% 40%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.06) 55%,
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
        }

        .dock-tab {
          flex: 1 1 0;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          min-width: 0;
          padding: 9px 2px 8px;
          border: none;
          background: transparent;
          text-decoration: none;
          cursor: pointer;
          color: rgba(186, 205, 245, 0.52);
          transition: color 220ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
          -webkit-tap-highlight-color: transparent;
        }
        .dock-tab:hover { color: #9fd8f5; }
        .dock-tab.is-current { color: #5ce1e6; }
        .dock-tab.is-danger { color: rgba(248, 113, 113, 0.6); }
        .dock-tab.is-danger:hover { color: #f87171; }

        /* Press feedback: a short squash, then a spring back out. */
        .dock-tab.is-pressed { transform: scale(0.93); }

        .dock-tab:focus-visible {
          outline: 2px solid rgba(92, 225, 230, 0.8);
          outline-offset: 2px;
          border-radius: 18px;
        }

        /* The rounded-square plate that appears behind the hovered/active icon,
           exactly like the dock in the reference. */
        .dock-plate {
          position: absolute;
          top: 4px;
          left: 50%;
          width: 40px;
          height: 40px;
          margin-left: -20px;
          border-radius: 13px;
          background: linear-gradient(180deg, rgba(92, 225, 230, 0.16), rgba(92, 225, 230, 0.06));
          border: 1px solid rgba(92, 225, 230, 0.22);
          opacity: 0;
          transform: scale(0.7);
          transition: opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        .dock-tab:hover .dock-plate { opacity: 1; transform: scale(1); }
        .dock-plate.is-active { opacity: 1; transform: scale(1); }
        .dock-tab.is-danger:hover .dock-plate {
          background: linear-gradient(180deg, rgba(248, 113, 113, 0.18), rgba(248, 113, 113, 0.06));
          border-color: rgba(248, 113, 113, 0.28);
        }

        .dock-icon {
          --glow: 0;
          position: relative;
          line-height: 1;
          transform: translate3d(0, 0, 0) scale(1);
          transform-origin: center bottom;
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
            filter 220ms ease;
          filter: drop-shadow(0 0 calc(8px * var(--glow)) rgba(92, 225, 230, calc(0.55 * var(--glow))));
          will-change: transform;
        }
        .dock-tab.is-current .dock-icon {
          filter: drop-shadow(0 0 7px rgba(92, 225, 230, 0.55));
        }

        .dock-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.01em;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
        .dock-tab.is-current .dock-label { font-weight: 700; }

        /* Active indicator: a small glowing dot under the label. */
        .dock-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          width: 4px;
          height: 4px;
          margin-left: -2px;
          border-radius: 50%;
          background: linear-gradient(90deg, #5ce1e6, #d4af37);
          box-shadow: 0 0 6px rgba(92, 225, 230, 0.8);
        }

        @media (max-width: 380px) {
          .dock { gap: 0; padding: 5px 5px; border-radius: 22px; }
          .dock-label { font-size: 8px; }
        }

        /* Respect the OS setting: keep the states, drop the motion. */
        @media (prefers-reduced-motion: reduce) {
          .dock-tab,
          .dock-icon,
          .dock-plate {
            transition-duration: 1ms !important;
          }
        }
      `}</style>
    </nav>
  );
}
