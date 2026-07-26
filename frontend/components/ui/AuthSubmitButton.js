/**
 * AuthSubmitButton — the Sign In button.
 *
 * Behaviour that matters:
 *  - `loading` disables the button, so a second submit is impossible from the UI
 *    (the page also guards with a ref for keyboard/Enter double-fires).
 *  - The label and the spinner cross-fade in place inside a fixed-height box,
 *    so the button never changes size — no layout shift, no text jump.
 *  - A light sweep travels across the surface while authenticating, which reads
 *    as "work is happening" without a jarring spinner-only state.
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
        <span className={`face ${loading ? 'is-out' : 'is-in'}`}>{label}</span>
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
          border-radius: 12px;
          background: linear-gradient(135deg, #5ce1e6 0%, #43cdd4 100%);
          color: #0a1844;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(92, 225, 230, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.28);
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease,
            filter 0.22s ease;
          will-change: transform;
          -webkit-tap-highlight-color: transparent;
        }
        .submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(92, 225, 230, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.32);
        }
        .submit:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
          box-shadow: 0 0 14px rgba(92, 225, 230, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .submit:disabled {
          cursor: default;
        }
        .submit.is-loading {
          filter: saturate(0.92);
        }

        /* Fixed-height slot: the two faces are stacked, so swapping them can
           never change the button's height or width. */
        .slot {
          position: relative;
          display: block;
          height: 44px;
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

        .spinner {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(10, 24, 68, 0.28);
          border-top-color: #0a1844;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
            rgba(255, 255, 255, 0.45) 50%,
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
          from { transform: translateX(0); }
          to   { transform: translateX(350%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit, .face { transition: none; }
          .spinner, .sheen { animation: none; }
        }
      `}</style>
    </button>
  );
}
