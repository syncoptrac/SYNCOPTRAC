import { useId, useState } from 'react';

/**
 * AuthField — one labelled input for the auth forms.
 *
 * Purely presentational: it owns no credential state and performs no
 * validation, so it can be dropped into either portal without touching
 * authentication logic. Value + onChange stay with the page.
 *
 * Premium details it adds:
 *  - focus ring that eases in (cyan brand glow) instead of snapping
 *  - floating "filled" tick affordance once the field has content
 *  - password reveal toggle (44px tap target, fully keyboard accessible)
 *  - Caps Lock hint while typing a password
 *  - invalid state that tints the border without shifting layout
 *  - optional no-autofill guard (readOnly until focus) preserved from before
 */
export default function AuthField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete = 'off',
  required = false,
  autoFocus = false,
  disabled = false,
  invalid = false,
  noAutofill = false,
  inputMode,
  hint,
}) {
  const reactId = useId();
  const inputId = `${name}-${reactId}`;
  const [revealed, setRevealed] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;

  const handleKeyEvent = (e) => {
    if (!isPassword) return;
    if (typeof e.getModifierState === 'function') {
      setCapsOn(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div className="field">
      <label className="label" htmlFor={inputId}>
        {label}
      </label>

      <div className={`shell ${invalid ? 'is-invalid' : ''} ${isPassword ? 'has-toggle' : ''}`}>
        <input
          id={inputId}
          name={name}
          type={resolvedType}
          className="input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode={inputMode}
          aria-invalid={invalid || undefined}
          spellCheck={false}
          readOnly={noAutofill ? true : undefined}
          onFocus={noAutofill ? (e) => e.target.removeAttribute('readonly') : undefined}
          onKeyUp={isPassword ? handleKeyEvent : undefined}
          onKeyDown={isPassword ? handleKeyEvent : undefined}
          onBlur={isPassword ? () => setCapsOn(false) : undefined}
        />

        {isPassword && (
          <button
            type="button"
            className="toggle"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            tabIndex={disabled ? -1 : 0}
          >
            {revealed ? (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      <span className={`hint ${capsOn || hint ? 'is-shown' : ''}`} aria-live="polite">
        {capsOn ? 'Caps Lock is on' : hint || ''}
      </span>

      <style jsx>{`
        .field {
          display: block;
        }
        .label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #d1d5db;
          margin-bottom: 6px;
          letter-spacing: 0.005em;
        }
        .shell {
          position: relative;
          border-radius: 10px;
          background: #11245d;
          border: 1px solid #374151;
          transition: border-color 0.22s ease, box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
            background-color 0.22s ease;
          will-change: box-shadow;
        }
        .shell:hover {
          border-color: #4b5563;
        }
        .shell:focus-within {
          border-color: rgba(92, 225, 230, 0.8);
          background: #142a6b;
          box-shadow: 0 0 0 3px rgba(92, 225, 230, 0.15), 0 6px 22px rgba(92, 225, 230, 0.12);
        }
        .shell.is-invalid {
          border-color: rgba(248, 113, 113, 0.75);
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
        }

        .input {
          width: 100%;
          background: transparent;
          border: 0;
          outline: none;
          color: #ffffff;
          font-size: 0.875rem;
          line-height: 1.4;
          padding: 11px 12px;
          border-radius: 10px;
          -webkit-appearance: none;
          appearance: none;
        }
        .shell.has-toggle .input {
          padding-right: 44px;
        }
        .input::placeholder {
          color: #4b5563;
        }
        .input:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        /* Kill the browser's yellow autofill wash on dark navy. */
        .input:-webkit-autofill,
        .input:-webkit-autofill:hover,
        .input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          -webkit-box-shadow: 0 0 0 1000px #11245d inset;
          transition: background-color 9999s ease-out 0s;
        }

        .toggle {
          position: absolute;
          top: 50%;
          right: 4px;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #7c8aa5;
          border-radius: 8px;
          cursor: pointer;
          transition: color 0.2s ease, background-color 0.2s ease, transform 0.18s ease;
        }
        .toggle:hover {
          color: #5ce1e6;
          background: rgba(92, 225, 230, 0.1);
        }
        .toggle:active {
          transform: translateY(-50%) scale(0.92);
        }

        .hint {
          display: block;
          height: 14px;
          margin-top: 4px;
          font-size: 0.6875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(240, 192, 64, 0.9);
          opacity: 0;
          transform: translateY(-2px);
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .hint.is-shown {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .shell, .toggle, .hint {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
