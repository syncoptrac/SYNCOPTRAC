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
//
// ---------------------------------------------------------------------------
// WHY THE ACTION ROW WAS STILL HIDDEN BEHIND THE BOTTOM DOCK
// ---------------------------------------------------------------------------
// Two independent causes, both fixed here. z-index alone was never going to do
// it, which is why bumping it previously appeared to change nothing.
//
// 1. STACKING CONTEXT TRAP (this is why the dock painted OVER the dialog).
//    InstituteLayout/AdminLayout declare:
//        .app-shell > main { position: relative; z-index: 1 }
//        .app-shell > nav  { position: relative; z-index: 1 }
//    The dialog rendered inside <main>, so `z-index: 60` was resolved INSIDE
//    main's stacking context. Against the dock it never competed as 60 vs 1 -
//    it competed as main(1) vs nav(1), and nav wins on DOM order because it is
//    the later sibling. No z-index on the dialog could ever escape that; the
//    element has to leave the subtree. It is now rendered in a portal on
//    <body>, a sibling of .app-shell, where `z-index: 60` finally means what it
//    says. That also frees it from `.app-shell { overflow: hidden }` and
//    `main { overflow-y: auto }`, either of which can clip a fixed child.
//
// 2. NO SPACE WAS RESERVED FOR THE DOCK.
//    .host is pinned to the full viewport, and on mobile it bottom-aligns the
//    sheet, so the panel legitimately ended flush with the bottom edge - the
//    exact band the dock occupies. Painting order alone would only have let the
//    sheet cover the dock; the requirement is the opposite, so .host now
//    reserves the dock band as padding and the sheet stops on top of it.
//
// The Header / Scrollable body / pinned Action area contract described above is
// unchanged - it was already correct, and it is what keeps the buttons put once
// the two problems above are gone.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MAXW = { sm: '25rem', md: '34rem', lg: '44rem', xl: '58rem' };

export default function Modal({ open, onClose, title, children, size = 'md', footer = null }) {
  const panelRef = useRef(null);

  // A portal needs a real DOM node, which does not exist during SSR or on the
  // hydrating render. Gating on this keeps server and client markup identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          /* Clearance for the fixed bottom dock.

             LiquidDock measures itself and publishes --sc-dock-h; it is 0px on
             pages that render no dock. That measurement ALREADY INCLUDES
             env(safe-area-inset-bottom), because the nav carries the inset as
             its own padding-bottom.

             Hence max(), never a sum. Adding env() on top would count the inset
             twice and float the sheet above the dock on notched phones:
               dock present -> reserve the whole dock band (inset included)
               no dock      -> reserve just the safe-area inset
             This is derived from the live layout, so it is not a hardcoded
             offset and it self-corrects if the dock ever changes height. */
          --sc-obstruct: max(var(--sc-dock-h, 0px), env(safe-area-inset-bottom, 0px));

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
          /* Pinned locally, not decorative. The panel's max-height of 100%
             resolves against this element's CONTENT box, so the padding below
             is what actually shortens the panel and keeps the action row off
             the dock. Under content-box the content box would stay a full
             100dvh and the padding would merely overflow, letting the panel be
             viewport-tall again. Tailwind's preflight already sets border-box
             globally; this states the dependency so the panel math cannot break
             silently if that ever changes. */
          box-sizing: border-box;
          padding: 20px;
          padding-bottom: calc(20px + var(--sc-obstruct, 0px));
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
            /* The sheet now comes to rest exactly on the dock's top edge
               instead of sliding beneath it. */
            padding-bottom: var(--sc-obstruct, 0px);
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
          /* The home-indicator / gesture-bar clearance that used to live here
             is now reserved once, by .host, via --sc-obstruct. Re-adding env()
             here would double the padding and - worse - would still not have
             helped, because the old gap sat INSIDE a panel that was itself
             underneath the dock. */
          .foot {
            padding: 12px 16px;
          }
          .panel:not(.has-foot) .body {
            padding-bottom: 16px;
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
