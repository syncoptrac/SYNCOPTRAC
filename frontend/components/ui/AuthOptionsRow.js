/**
 * AuthOptionsRow -- "Remember me" + "Forgot password?" beneath the credentials.
 *
 * Both affordances are frontend-only by design:
 *  - Remember me stores nothing but the Login ID (never the password) in
 *    localStorage, so it cannot affect the session, the token, or any auth call.
 *  - Forgot password opens an informational dialog owned by the page. There is
 *    no password-reset endpoint in this product, so this deliberately does not
 *    pretend to send anything.
 */
export default function AuthOptionsRow({ remember, onRememberChange, onForgot, disabled = false }) {
  return (
    <div className="row">
      <label className="remember">
        <input
          type="checkbox"
          className="cb"
          checked={remember}
          onChange={(e) => onRememberChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="box" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 12.5 10 17.5 19 7" />
          </svg>
        </span>
        <span className="txt">Remember me</span>
      </label>

      <button type="button" className="forgot" onClick={onForgot} disabled={disabled}>
        Forgot password?
      </button>

      <style jsx>{`
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .remember {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          /* 44px tap height without visually inflating the row */
          padding: 11px 0;
          margin: -11px 0;
        }
        .cb {
          position: absolute;
          opacity: 0;
          width: 1px;
          height: 1px;
          pointer-events: none;
        }
        .box {
          width: 19px;
          height: 19px;
          flex-shrink: 0;
          border-radius: 6px;
          border: 1.5px solid #d1d5db;
          background: #ffffff;
          color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease,
            transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .remember:hover .box {
          border-color: #2563eb;
        }
        .cb:checked + .box {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          transform: scale(1.04);
        }
        .cb:focus-visible + .box {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
        .txt {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #4b5563;
          user-select: none;
        }

        .forgot {
          border: 0;
          background: transparent;
          padding: 11px 0;
          margin: -11px 0;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #2563eb;
          cursor: pointer;
          border-radius: 6px;
          transition: color 0.18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .forgot:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .forgot:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 3px;
        }
        .forgot:disabled,
        .cb:disabled + .box {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .box,
          .forgot {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
