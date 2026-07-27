// Premium dialog shell used by Students, Enquiries, Fees and Batches.
//
// API IS UNCHANGED: { open, onClose, title, children, size }
// Every existing caller keeps working without edits.
//
// Changes vs the old version:
//   - bright surface on a soft navy scrim (was brand-dark/50 + blur)
//   - becomes a bottom sheet under 560px so mobile feels native
//   - Escape closes, body scroll locks, focus moves into the dialog
//   - close button is a 44px target (was 32px)
import { useEffect, useRef } from 'react';

const MAXW = { sm: '25rem', md: '34rem', lg: '44rem', xl: '58rem' };

export default function Modal({ open, onClose, title, children, size = 'md' }) {
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

      <div className="panel" ref={panelRef} style={{ maxWidth: MAXW[size] || MAXW.md }}>
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
      </div>

      <style jsx>{`
        .host {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
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
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(11, 31, 77, 0.18), 0 4px 14px rgba(11, 31, 77, 0.07);
          animation: mPanel 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          -webkit-overflow-scrolling: touch;
        }
        /* Drag affordance: only meaningful in the mobile sheet layout. */
        .grip { display: none; }

        .head {
          position: sticky;
          top: 0;
          z-index: 1;
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
        .body { padding: 18px; }

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
            max-height: 92vh;
            border-radius: 22px 22px 0 0;
            border-bottom: 0;
            padding-bottom: env(safe-area-inset-bottom);
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
        }
        @keyframes mSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .scrim, .panel { animation: none; }
        }
      `}</style>
    </div>
  );
}
