import { useId, useState } from 'react';

/**
 * AuthField -- one labelled input for the auth forms.
 *
 * Purely presentational: it owns no credential state and performs no
 * validation, so it can be dropped into either portal without touching
 * authentication logic. Value + onChange stay with the page.
 *
 * Redesigned for the bright design system. The floating label is driven by
 * :placeholder-shown, which means the existing placeholder strings are kept
 * byte-for-byte -- they are simply held transparent until the field is focused,
 * at which point they become the format hint under the raised label. That is
 * why the placeholder text is never removed here.
 *
 * Details it carries over from the previous version:
 *  - password reveal toggle (44px tap target, fully keyboard accessible)
 *  - Caps Lock hint while typing a password
 *  - invalid state that tints the border without shifting layout
 *  - optional no-autofill guard (readOnly until focus)
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

        <label className="label" htmlFor={inputId}>
          {label}
        </label>

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
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

        .shell {
          position: relative;
          height: 60px;
          border-radius: 14px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          transition: border-color 0.2s ease, box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
            background-color 0.2s ease;
          will-change: box-shadow;
        }
        .shell:hover {
          border-color: #cbd5e1;
        }
        .shell:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }
        .shell.is-invalid {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          border: 0;
          outline: none;
          color: #111827;
          font-size: 0.9375rem;
          font-weight: 500;
          line-height: 1.3;
          /* Top padding reserves the lane the raised label moves into. */
          padding: 26px 15px 9px;
          border-radius: 14px;
          -webkit-appearance: none;
          appearance: none;
        }
        .shell.has-toggle .input {
          padding-right: 50px;
        }
        .input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        /* The placeholder is preserved but hidden until focus, so the label can
           own the resting state without any copy being lost. */
        .input::placeholder {
          color: transparent;
          transition: color 0.2s ease;
        }
        .input:focus::placeholder {
          color: #9ca3af;
        }

        /* Autofill on a white field: keep our type colour, kill the yellow wash. */
        .input:-webkit-autofill,
        .input:-webkit-autofill:hover,
        .input:-webkit-autofill:focus {
          -webkit-text-fill-color: #111827;
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset;
          transition: background-color 9999s ease-out 0s;
        }

        .label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          transform-origin: left center;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #6b7280;
          pointer-events: none;
          transition: top 0.2s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), font-size 0.2s ease, color 0.2s ease,
            letter-spacing 0.2s ease;
        }
        .input:focus + .label,
        .input:not(:placeholder-shown) + .label {
          top: 11px;
          transform: translateY(0);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #2563eb;
        }
        .shell.is-invalid .input:focus + .label,
        .shell.is-invalid .input:not(:placeholder-shown) + .label {
          color: #ef4444;
        }

        .toggle {
          position: absolute;
          top: 50%;
          right: 6px;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #9ca3af;
          border-radius: 11px;
          cursor: pointer;
          transition: color 0.18s ease, background-color 0.18s ease, transform 0.16s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .toggle:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        .toggle:active {
          transform: translateY(-50%) scale(0.9);
        }
        .toggle:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .hint {
          display: block;
          height: 15px;
          margin-top: 5px;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #b45309;
          opacity: 0;
          transform: translateY(-2px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .hint.is-shown {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .shell,
          .toggle,
          .hint,
          .label,
          .input::placeholder {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
