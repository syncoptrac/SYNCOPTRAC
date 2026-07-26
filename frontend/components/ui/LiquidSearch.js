import { useEffect, useRef, useState } from 'react';

/*
 * LiquidSearch — the search interaction from the reference video.
 *
 * Idle it is a compact circular glass button. On click/focus the pill stretches
 * out elastically (overshoots a few px, then settles), the placeholder fades
 * in behind a blinking caret, and a clear (×) button springs in at the right.
 * Blurring an empty field lets it collapse back with the same spring.
 *
 * Deliberate implementation notes:
 *   - The <input> is always mounted, so expanding/collapsing can never drop a
 *     keystroke or reset the caret position.
 *   - Only width/opacity/transform animate — no layout thrash, and the
 *     surrounding row does not jump because the pill grows into space that is
 *     already reserved by the flex row.
 *   - `value`/`onChange` are passed straight through, so the page's existing
 *     filter logic is untouched.
 */

export default function LiquidSearch({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel,
  expandedWidth = 340,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const hasValue = String(value || '').length > 0;

  // A field with text in it must never collapse and hide that text.
  const expanded = open || hasValue;

  const expand = () => {
    setOpen(true);
    // Focus after the growth has started so the caret lands in a pill that is
    // already moving — focusing first makes the browser scroll-anchor jump.
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.focus();
    });
  };

  const handleBlur = () => {
    if (!hasValue) setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (hasValue) onChange({ target: { value: '' } });
      setOpen(false);
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const clear = () => {
    onChange({ target: { value: '' } });
    setOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  // Keep the pill open while the user is still interacting via keyboard.
  useEffect(() => {
    if (hasValue) setOpen(true);
  }, [hasValue]);

  return (
    <div className={`ls-wrap ${expanded ? 'is-open' : ''} ${className}`} role="search">
      <div className="ls-pill">
        <button
          type="button"
          className="ls-trigger"
          onClick={expand}
          aria-label={ariaLabel || placeholder}
          aria-expanded={expanded}
          tabIndex={expanded ? -1 : 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </button>

        <div className="ls-field">
          {/* Blinking caret shown only while empty, matching the reference. */}
          {expanded && !hasValue && <span className="ls-caret" aria-hidden="true" />}
          <input
            ref={inputRef}
            className="ls-input"
            type="search"
            value={value}
            onChange={onChange}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={expanded ? placeholder : ''}
            aria-label={ariaLabel || placeholder}
            tabIndex={expanded ? 0 : -1}
          />
        </div>

        {hasValue && (
          <button type="button" className="ls-clear" onClick={clear} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        .ls-wrap {
          display: inline-flex;
          min-width: 0;
        }

        /* Dark-blue liquid glass, same material as the dock so the two read as
           one design language. */
        .ls-pill {
          display: flex;
          align-items: center;
          gap: 0;
          width: 46px;
          height: 46px;
          padding: 0 4px;
          border-radius: 23px;
          background: linear-gradient(180deg, rgba(23, 45, 116, 0.94) 0%, rgba(10, 24, 68, 0.97) 100%);
          border: 1px solid rgba(92, 225, 230, 0.18);
          box-shadow:
            0 10px 26px rgba(10, 24, 68, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.14),
            inset 0 -8px 18px rgba(8, 18, 52, 0.28);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          overflow: hidden;
          /* The elastic stretch: overshoots, then settles. */
          transition: width 460ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 320ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 320ms ease;
          will-change: width;
        }
        .ls-wrap.is-open .ls-pill {
          width: ${expandedWidth}px;
          border-color: rgba(92, 225, 230, 0.4);
          box-shadow:
            0 14px 34px rgba(10, 24, 68, 0.32),
            0 0 0 4px rgba(92, 225, 230, 0.13),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }
        @media (max-width: 460px) {
          .ls-wrap.is-open .ls-pill { width: min(${expandedWidth}px, 74vw); }
        }

        .ls-trigger {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: none;
          background: transparent;
          color: #5ce1e6;
          cursor: pointer;
          border-radius: 50%;
          transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), color 200ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .ls-wrap:not(.is-open) .ls-trigger:hover { transform: scale(1.12); }
        .ls-wrap.is-open .ls-trigger { cursor: default; transform: scale(0.92); }
        .ls-trigger:focus-visible {
          outline: 2px solid rgba(92, 225, 230, 0.85);
          outline-offset: 2px;
        }

        .ls-field {
          position: relative;
          flex: 1 1 auto;
          min-width: 0;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .ls-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          padding: 0 2px;
          /* Fades in slightly after the pill starts stretching, so text never
             appears to spill out of a container that hasn't grown yet. */
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 260ms cubic-bezier(0.16, 1, 0.3, 1) 90ms,
            transform 380ms cubic-bezier(0.16, 1, 0.3, 1) 90ms;
          pointer-events: none;
        }
        .ls-wrap.is-open .ls-input {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }
        .ls-input::placeholder { color: rgba(186, 205, 245, 0.5); }
        /* Hide the browser's native clear affordance — we render our own. */
        .ls-input::-webkit-search-cancel-button { display: none; }

        .ls-caret {
          position: absolute;
          left: 2px;
          width: 2px;
          height: 18px;
          border-radius: 1px;
          background: #5ce1e6;
          box-shadow: 0 0 6px rgba(92, 225, 230, 0.7);
          animation: ls-blink 1.05s steps(1, end) infinite;
          pointer-events: none;
        }
        @keyframes ls-blink {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }

        .ls-clear {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          margin-right: 5px;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(220, 235, 255, 0.75);
          cursor: pointer;
          animation: ls-pop 340ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ls-clear:hover { background: rgba(255, 255, 255, 0.16); color: #fff; }
        .ls-clear:focus-visible {
          outline: 2px solid rgba(92, 225, 230, 0.85);
          outline-offset: 2px;
        }
        @keyframes ls-pop {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ls-pill, .ls-input, .ls-trigger { transition-duration: 1ms !important; }
          .ls-caret { animation: none; }
          .ls-clear { animation: none; }
        }
      `}</style>
    </div>
  );
}
