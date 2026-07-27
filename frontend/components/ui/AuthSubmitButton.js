/**
 * AuthSubmitButton -- the Sign In button.
 *
 * Behaviour that matters (unchanged from before):
 *  - `loading` disables the button, so a second submit is impossible from the UI
 *    (the page also guards with a ref for keyboard/Enter double-fires).
 *  - The label and the spinner cross-fade in place inside a fixed-height box,
 *    so the button never changes size -- no layout shift, no text jump.
 *  - A light sweep travels across the surface while authenticating.
 *
 * Redesigned surface: deep blue gradient with a lifted accent shadow, so it
 * reads as the single primary action on a bright page.
 */
export default function AuthSubmitButton({
  loading = false,
  label = 'Sign In',
  loadingLabel = 'Signing in...',
  disabled = false,
}) {
  return (
    <button
      type="submit"
      className={`submit ${loading ? 'is-loading' : ''}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-live="polite"
    >
      <span className="sheen" aria-hidden="true" />

      <span className="slot">
        <span className={`face ${loading ? 'is-out' : 'is-in'}`}>
          {label}
          <svg className="arw" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="18" y2="12" />
            <polyline points="12 6 18 12 12 18" />
          </svg>
        </span>
        <span className={`face busy ${loading ? 'is-in' : 'is-out'}`}>
          <span className="spinner" aria-hidden="true" />
          {loadingLabel}
        </span>
      </span>

      <style jsx>{`
        .submit {
          position: relative;
          display: block;
          width: 100%;
          overflow: hidden;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #0b1f4d 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9375rem;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16);
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease,
            filter 0.22s ease;
          will-change: transform;
          -webkit-tap-highlight-color: transparent;
        }
        /* Hover lift is gated to real pointers: on touch, :hover sticks after a
           tap and leaves the button looking permanently raised. */
        @media (hover: hover) and (pointer: fine) {
          .submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(37, 99, 235, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          .submit:hover:not(:disabled) .arw {
            transform: translateX(3px);
          }
        }
        .submit:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }
        .submit:disabled {
          cursor: default;
        }
        .submit.is-loading {
          filter: saturate(0.95);
        }
        .submit:focus-visible {
          outline: 2px solid #0b1f4d;
          outline-offset: 3px;
        }

        /* Fixed-height slot: the two faces are stacked, so swapping them can
           never change the button's height or width. */
        .slot {
          position: relative;
          display: block;
          height: 52px;
        }
        .face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: opacity 0.24s ease, transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .face.is-in {
          opacity: 1;
          transform: translateY(0);
        }
        .face.is-out {
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
        }
        .face.busy.is-out {
          transform: translateY(6px);
        }
        .arw {
          transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.32);
          border-top-color: #ffffff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -40%;
          width: 40%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          opacity: 0;
          pointer-events: none;
        }
        .submit.is-loading .sheen {
          opacity: 1;
          animation: sweep 1.25s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        @keyframes sweep {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(350%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit,
          .face,
          .arw {
            transition: none;
          }
          .spinner,
          .sheen {
            animation: none;
          }
        }
      `}</style>
    </button>
  );
}
