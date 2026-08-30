// Premium dialog shell used by Students, Enquiries, Fees and Batches.
//
// PUBLIC API (backwards compatible):
//   { open, onClose, title, children, size }   <- every existing caller, unchanged
//   { ..., footer }                            <- NEW, optional pinned action area
//
// WHY THIS FILE CHANGED - the "buttons go outside the screen" bug
// ---------------------------------------------------------------
// Old model: `.panel` was a single scroll container (`overflow-y:auto`) and the
// action row lived inside that scrolling content. Two consequences:
//
//   1. The action row could be scrolled out of reach, and on a short viewport
//      it started below the fold with nothing left to scroll against.
//   2. `max-height: 92vh` on mobile is measured against the LARGE viewport
//      (the height the page would have with the URL bar collapsed). While the
//      URL bar is actually visible, 92vh is taller than what you can see, so
//      the bottom edge of the sheet - buttons included - sits physically
//      off-screen. `padding-bottom: env(safe-area-inset-bottom)` did not help
//      because it was applied to the scrolling box (so it became scroll
//      content, not reserved space).
//
// New model: `.panel` is a three-region flex COLUMN.
//   head -> flex: none                                          always visible
//   body -> flex: 1 1 auto; min-height: 0; overflow-y: auto      the ONLY scroller
//   foot -> flex: none                                          always visible
//
// and the height cap uses `dvh` (dynamic viewport height) with a `vh` fallback,
// so the dialog tracks the area that is genuinely visible as browser chrome
// shows/hides and as the on-screen keyboard opens.
//
// No `overflow-x: hidden`, no negative margins, no magic pixel offsets.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MAXW = { sm: '25rem', md: '34rem', lg: '44rem', xl: '58rem' };

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer = null,
}) {
  const panelRef = useRef(null);

  // The dialog is portalled to <body>, which only exists in the browser, so the
  // first client render has to match the server's (null) before we portal or
  // Next.js reports a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Escape to close + scroll lock. Both clean up on unmount.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Move focus into the panel so keyboard users land in the right place.
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const t = setTimeout(() => {
      const first = panelRef.current.querySelector(
        'input:not([type=hidden]), select, textarea, button'
      );
      if (first) first.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  if (!open || !mounted) return null;

  // WHY THIS IS PORTALLED - the "buttons hidden behind the bottom nav" bug
  // ----------------------------------------------------------------------
  // InstituteLayout and AdminLayout both lay the shell out like this:
  //
  //   .app-shell > header,
  //   .app-shell > main,
  //   .app-shell > nav { position: relative; z-index: 1; }
  //
  // The dock is NOT position:fixed - it is an in-flow flex item at the bottom
  // of a 100dvh shell, a sibling of `main`. `main` and `nav` therefore sit in
  // the same stacking context at the SAME z-index, and `nav` comes later in
  // the DOM, so the dock paints above everything inside `main`.
  //
  // A dialog rendered inside `main` is sealed into main's stacking context:
  // its z-index only orders it against its siblings *within* main. No value -
  // 60, 999, 2147483647 - can lift it above the dock, because the comparison
  // never happens at that level. Raising the number is the hack; leaving the
  // subtree is the fix.
  //
  // Portalling to <body> puts the dialog outside .app-shell entirely, so it
  // competes at the root level and covers the dock on every page that uses it.
  return createPortal(
    <div className="host" role="dialog" aria-modal="true" aria-label={title}>
      <div className="scrim" onClick={onClose} />

      <div
        className={footer ? 'panel has-foot' : 'panel'}
        ref={panelRef}
        style={{ maxWidth: MAXW[size] || MAXW.md }}
      >
        <div className="grip" aria-hidden="true" />

        <div className="head">
          <h2 className="title">{title}</h2>
          <button type="button" onClick={onClose} className="close" aria-label="Close dialog">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="body">{children}</div>

        {footer ? <div className="foot">{footer}</div> : null}
      </div>

      <style jsx>{`
        .host {
          position: fixed;
          inset: 0;
          /* Explicit height so the centring math runs against the *visible*
             area. vh first as the fallback for engines without dvh. */
          height: 100vh;
          height: 100dvh;
          /* Above the shell, both login pages (100) and the bespoke overlays in
             admin/institutes (70). Only toasts intentionally sit higher. */
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          /* InstituteLayout applies a page-entry animation to every direct
             child of the content column (.app-shell > main > div > *). Without
             this the dialog replayed that entry animation on each open, which
             is what made modals look like they "flashed at the wrong size". */
          animation: none;
        }
        .scrim {
          position: absolute;
          inset: 0;
          background: rgba(11, 31, 77, 0.42);
          animation: mScrim 200ms ease forwards;
        }
        .panel {
          position: relative;
          width: 100%;
          /* 100% of the host content box == viewport height minus host padding. */
          max-height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden; /* the PANEL never scrolls - .body does */
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(11, 31, 77, 0.18), 0 4px 14px rgba(11, 31, 77, 0.07);
          animation: mPanel 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Drag affordance: only meaningful in the mobile sheet layout. */
        .grip { display: none; flex: none; }

        .head {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 18px 14px;
          background: #ffffff;
          border-bottom: 1px solid #eef2f7;
        }
        .title {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #111827;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .close {
          flex: none;
          width: 44px;
          height: 44px;
          margin: -10px -10px -10px 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          border-radius: 999px;
          color: #6b7280;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }
        .close:hover { background: #eff6ff; color: #111827; }
        .close:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28);
        }

        .body {
          flex: 1 1 auto;
          min-height: 0; /* required, or the flex child refuses to shrink */
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 18px;
        }
        .foot {
          flex: none;
          padding: 14px 18px;
          background: #ffffff;
          border-top: 1px solid #eef2f7;
        }

        @keyframes mScrim { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mPanel {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ---- Mobile: dock to the bottom as a native-feeling sheet ---- */
        @media (max-width: 560px) {
          .host {
            padding: 0;
            align-items: flex-end;
          }
          .panel {
            max-width: none !important;
            /* Leave a sliver of scrim so it still reads as a sheet, and never
               exceed what is actually on screen. */
            max-height: calc(100% - 20px);
            border-radius: 22px 22px 0 0;
            border-bottom: 0;
            animation: mSheet 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .grip {
            display: block;
            width: 40px;
            height: 4px;
            margin: 9px auto 0;
            border-radius: 999px;
            background: #e5e7eb;
          }
          .head { padding: 12px 16px 13px; }
          .body { padding: 16px; }
          .foot {
            padding: 12px 16px;
            /* Reserved space, not scroll content: keeps the action row clear of
               the iOS home indicator / Android gesture bar. */
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          }
          /* Same clearance when the dialog has no dedicated footer. */
          .panel:not(.has-foot) .body {
            padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          }
        }
        @keyframes mSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }

        /* ---- Very short viewports (landscape phones, split screen) ----
           Buy back vertical room for the scrolling body instead of letting the
           chrome squeeze it to nothing. */
        @media (max-height: 460px) {
          .head { padding: 10px 16px; }
          .body { padding: 12px 16px; }
          .foot { padding: 10px 16px; }
          .grip { margin-top: 6px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .scrim, .panel { animation: none; }
        }
      `}</style>
    </div>,
    document.body
  );
}
