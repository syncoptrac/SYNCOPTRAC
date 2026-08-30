// Premium dialog shell used by Students, Enquiries, Fees and Batches.
//
// API IS BACKWARDS COMPATIBLE: { open, onClose, title, children, size } behave
// exactly as before, so every existing caller keeps working untouched.
// `footer` is new and optional - when supplied, the node is pinned OUTSIDE the
// scrolling region so its buttons can never be pushed off screen.
//
// Layout contract (this is the actual fix for "buttons go outside the screen"):
//   .panel is a flex column that is never taller than the viewport
//   .head and .foot are flex:none
//   .body is the ONLY scroll container (flex:1 + min-height:0 + overflow-y:auto)
// Because the panel is bounded by the viewport rather than by its content, the
// action row is always on screen - which also means the fixed bottom dock has
// nothing to cover, since the sheet no longer extends underneath it.
//
// Heights use dvh with a vh fallback. On mobile browsers vh resolves to the
// LARGE viewport (as if the URL bar were hidden); measuring against it while
// the URL bar is actually visible is precisely what pushed the buttons under
// the fold. dvh tracks the real, currently-visible height.
import { useEffect, useRef } from 'react';

const MAXW = { sm: '25rem', md: '34rem', lg: '44rem', xl: '58rem' };

export default function Modal({ open, onClose, title, children, size = 'md', footer = null }) {
  const panelRef = useRef(null);

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

  if (!open) return null;

  return (
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
          /* Bound to the *small* viewport so the sheet is measured against what
             is actually visible, not the URL-bar-expanded height. */
          height: 100vh;
          height: 100dvh;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          /* InstituteLayout animates every direct child of <main>. Without this
             the dialog replays that entry animation and visibly flashes at the
             wrong size when it opens. */
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
          /* Never taller than .host, which is itself the visible viewport. */
          max-height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(11, 31, 77, 0.18), 0 4px 14px rgba(11, 31, 77, 0.07);
          animation: mPanel 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* Drag affordance: only meaningful in the mobile sheet layout. */
        .grip { display: none; }
        .head {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px 14px;
          background: #ffffff;
          border-bottom: 1px solid #eef2f7;
        }
        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #111827;
          /* Long titles ("Assign Students - JEE Morning Batch") must not force
             the header wider than the panel on a 320px screen. */
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .close {
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          margin: -6px -8px -6px 0;
          color: #6b7280;
          background: transparent;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }
        .close:hover { background: #f3f4f6; color: #111827; }
        .close:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28); }
        .body {
          /* The one and only scroll container in the dialog. min-height:0 is
             what lets a flex child shrink below its content height - without it
             the panel grows past the viewport instead of scrolling. */
          flex: 1 1 auto;
          min-height: 0;
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
               the iOS home indicator / Android gesture bar. Resolves to a real
               value now that _app.js ships viewport-fit=cover. */
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
    </div>
  );
}
