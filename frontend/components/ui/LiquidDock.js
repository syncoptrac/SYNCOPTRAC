import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/*
 * LiquidDock — the original full-width bottom tab bar, rebuilt as liquid glass.
 *
 * GEOMETRY IS DELIBERATELY THE PRE-UPDATE ONE:
 *   - edge-to-edge bar, square corners, no side margins, no floating pill
 *   - same height, same 22px icons at natural size, same 9px labels
 *   - active tab marked by the original 28x3 gradient bar along the top edge
 * Only the *material* changed: layered dark-blue translucency, a saturated
 * backdrop blur, a specular top edge and an inner bottom shadow so the bar
 * reads as a thick pane of glass instead of a flat panel.
 *
 * Kept from the dock work: Apple-style cursor magnification, the hover plate
 * behind the icon, the press squash and the active glow.
 *
 * WHY GEOMETRY IS INLINE: an earlier version put tab sizing in <style jsx> and
 * on the real build the decoration applied but the tab layout rules did not
 * win, so labels kept their natural width and collided
 * ("HomeStudentsAttend.Fees"). Anything structural — width, flex, overflow,
 * font-size, colour — is inline now, because inline styles cannot be lost to
 * selector scoping or ordering. <style jsx> carries decoration only.
 *
 * Motion: refs + rAF, so no React re-render while the cursor moves.
 * Magnification is gated behind (hover: hover) and (pointer: fine), so a tap on
 * a phone never leaves an icon stuck mid-scale.
 */

const DOCK_RADIUS = 90;      // px of cursor influence either side of an icon
const DOCK_MAX_SCALE = 1.4;  // scale of the icon directly under the cursor
const DOCK_MAX_LIFT = 12;    // px the magnified icon rises out of the bar

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const CYAN = '#5ce1e6';
const IDLE = 'rgba(180, 200, 240, 0.4)';
const HOVER = '#9fd8f5';
const DANGER_IDLE = 'rgba(248, 113, 113, 0.55)';
const DANGER = '#f87171';

// useLayoutEffect logs an SSR warning in Next; this component is pre-rendered.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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
  const navRef = useRef(null);

  // Publish the dock's real rendered height as --sc-dock-h so overlays can keep
  // clear of it.
  //
  // THIS IS MEASUREMENT ONLY. Nothing here moves, resizes, restyles, re-renders
  // or otherwise touches the dock - it only reports how tall the dock already
  // is. The bar's geometry, material and behaviour are byte-for-byte unchanged.
  //
  // The nav carries padding-bottom: env(safe-area-inset-bottom), so the value
  // published here ALREADY INCLUDES the safe-area inset. Consumers must take a
  // max() against env(), never a sum, or the inset gets counted twice.
  useIsoLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const root = document.documentElement;

    // Runs before paint, so a dialog opening on this same frame is laid out
    // against the correct value and never visibly jumps.
    const publish = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      root.style.setProperty('--sc-dock-h', `${h}px`);
    };
    publish();

    // Keeps up with orientation changes, dynamic browser toolbars collapsing,
    // and the safe-area inset resolving a beat late on iOS.
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(publish);
      ro.observe(el);
    }
    window.addEventListener('resize', publish);
    window.addEventListener('orientationchange', publish);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', publish);
      window.removeEventListener('orientationchange', publish);
      // Pages that render no dock must not reserve a phantom band.
      root.style.setProperty('--sc-dock-h', '0px');
    };
  }, []);

  const [hovered, setHovered] = useState(null);
  const [pressed, setPressed] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    pointerFine.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const tabs = [...items, { href: '__logout', label: 'Logout', icon: LogoutIcon, danger: true }];

  const reset = () => {
    iconRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = 'translate3d(0,0,0) scale(1)';
      el.style.filter = 'none';
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
        const eased = t * t; // quadratic falloff — neighbours trail off softly
        const scale = 1 + (DOCK_MAX_SCALE - 1) * eased;
        el.style.transform = `translate3d(0,${-DOCK_MAX_LIFT * eased}px,0) scale(${scale})`;
        el.style.filter = eased > 0.02
          ? `drop-shadow(0 0 ${8 * eased}px rgba(92, 225, 230, ${0.6 * eased}))`
          : 'none';
        if (el.parentElement) el.parentElement.style.zIndex = eased > 0.05 ? 5 : 1;
      });
    });
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Never let a new page inherit a half-magnified icon.
  useEffect(() => { reset(); }, [router.pathname]);

  return (
    <nav
      ref={navRef}
      className="dock-bar"
      onMouseMove={handleMove}
      onMouseLeave={() => { reset(); setHovered(null); setPressed(null); }}
      style={{
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Specular top edge — the single strongest "this is glass" cue. */}
      <span className="dock-sheen" aria-hidden="true" />

      {tabs.map((item, i) => {
        const isLogout = item.href === '__logout';
        const active = !isLogout && router.pathname === item.href;
        const isHovered = hovered === i;
        const showPlate = active || isHovered;

        const color = item.danger
          ? (isHovered ? DANGER : DANGER_IDLE)
          : active
            ? CYAN
            : isHovered
              ? HOVER
              : IDLE;

        // Hard cap: N tabs can never overflow the bar, on any screen width.
        const tabStyle = {
          flex: '1 1 0',
          minWidth: 0,
          maxWidth: `${100 / tabs.length}%`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '8px 2px 6px',
          border: 'none',
          background: 'transparent',
          textDecoration: 'none',
          cursor: 'pointer',
          color,
          transform: pressed === i ? 'scale(0.93)' : 'scale(1)',
          transition: `color 220ms ${EASE}, transform 260ms ${SPRING}`,
          WebkitTapHighlightColor: 'transparent',
        };

        const inner = (
          <>
            {/* Original active marker: a 28x3 gradient bar on the top edge. */}
            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: 28,
                  height: 3,
                  marginLeft: -14,
                  borderRadius: '0 0 3px 3px',
                  background: 'linear-gradient(90deg, #5ce1e6, #d4af37)',
                  boxShadow: '0 0 8px rgba(92, 225, 230, 0.6)',
                }}
              />
            )}

            {/* Fixed slot keeps the icon centred and stops it from ever widening
                the tab; the plate is anchored to the slot so it cannot drift. */}
            <span
              style={{
                position: 'relative',
                flex: '0 0 auto',
                width: 34,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -3,
                  left: 1,
                  right: 1,
                  bottom: -3,
                  borderRadius: 11,
                  background: item.danger
                    ? 'linear-gradient(180deg, rgba(248,113,113,0.18), rgba(248,113,113,0.05))'
                    : 'linear-gradient(180deg, rgba(92,225,230,0.16), rgba(92,225,230,0.05))',
                  border: `1px solid ${item.danger ? 'rgba(248,113,113,0.26)' : 'rgba(92,225,230,0.2)'}`,
                  opacity: showPlate ? 1 : 0,
                  transform: showPlate ? 'scale(1)' : 'scale(0.7)',
                  transition: `opacity 240ms ${EASE}, transform 320ms ${SPRING}`,
                  pointerEvents: 'none',
                }}
              />
              <span
                ref={(el) => { iconRefs.current[i] = el; }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  lineHeight: 1,
                  transform: 'translate3d(0,0,0) scale(1)',
                  transformOrigin: 'center bottom',
                  transition: `transform 180ms ${SPRING}, filter 220ms ease`,
                  filter: active ? 'drop-shadow(0 0 6px rgba(92,225,230,0.6))' : 'none',
                  willChange: 'transform',
                }}
              >
                {item.icon}
              </span>
            </span>

            {/* Block + width:100% + ellipsis is what prevents label collisions. */}
            <span
              style={{
                display: 'block',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                fontSize: 9,
                lineHeight: 1.15,
                letterSpacing: '0.01em',
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.label}
            </span>
          </>
        );

        const shared = {
          className: 'dock-tab',
          style: tabStyle,
          onMouseEnter: () => {
            setHovered(i);
            if (!isLogout && onItemHover) onItemHover(item.href);
          },
          onMouseLeave: () => { setHovered(null); setPressed(null); },
          onPointerDown: () => setPressed(i),
          onPointerUp: () => setPressed(null),
          onPointerCancel: () => setPressed(null),
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
            onTouchStart={() => onItemHover && onItemHover(item.href)}
            {...shared}
          >
            {inner}
          </Link>
        );
      })}

      <style jsx>{`
        /* Liquid glass, applied to the original edge-to-edge bar shape:
           layered dark-blue translucency + saturated blur so colour from the
           page bleeds through, a bright inner top line, and an inner bottom
           shadow for thickness. Square corners, full bleed — unchanged shape. */
        .dock-bar {
          background:
            linear-gradient(180deg, rgba(23, 45, 116, 0.86) 0%, rgba(10, 24, 68, 0.94) 100%);
          backdrop-filter: blur(26px) saturate(190%);
          -webkit-backdrop-filter: blur(26px) saturate(190%);
          border-top: 1px solid rgba(92, 225, 230, 0.14);
          box-shadow:
            0 -4px 24px rgba(8, 18, 52, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.14),
            inset 0 -14px 28px rgba(8, 18, 52, 0.3);
        }

        /* Glass highlight sweeping across the top of the bar. */
        .dock-sheen {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 44%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.13) 0%,
            rgba(255, 255, 255, 0.04) 55%,
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
        }

        .dock-tab:focus-visible {
          outline: 2px solid rgba(92, 225, 230, 0.85);
          outline-offset: -2px;
        }
      `}</style>
    </nav>
  );
}
