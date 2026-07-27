import { useEffect, useRef, useState } from 'react';

/*
 * LiquidSearch — the search interaction from the reference video.
 *
 * Idle it is a compact circular glass button. On click/focus the pill stretches
 * out elastically (overshoots, then settles), the placeholder fades in behind a
 * blinking caret, and a clear (×) button springs in at the right. Blurring an
 * empty field lets it collapse back with the same spring.
 *
 * As with LiquidDock, everything structural (width, opacity, transform,
 * colour, font-size) is an inline style so it cannot be lost to selector
 * scoping; <style jsx> only carries the caret keyframes, placeholder colour and
 * focus ring.
 *
 * Behaviour guarantees:
 *   - The <input> is always mounted, so expanding/collapsing can never drop a
 *     keystroke or move the caret.
 *   - A field containing text never collapses and hides that text.
 *   - `value`/`onChange` pass straight through, so existing filter logic is
 *     untouched.
 */

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export default function LiquidSearch({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel,
  expandedWidth = 340,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(expandedWidth);
  const inputRef = useRef(null);

  const hasValue = String(value || '').length > 0;
  const expanded = open || hasValue; // text in the field keeps it open

  // Never let the pill grow wider than the screen on a phone.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setMaxWidth(Math.min(expandedWidth, Math.round(window.innerWidth * 0.74)));
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [expandedWidth]);

  const expand = () => {
    setOpen(true);
    // Focus on the next frame so the caret lands in a pill that is already
    // growing — focusing first makes the browser scroll-anchor jump.
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.focus();
    });
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

  return (
    <div className={className} role="search" style={{ display: 'inline-flex', minWidth: 0 }}>
      <div
        className="ls-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: expanded ? maxWidth : 46,
          height: 46,
          padding: '0 4px',
          borderRadius: 23,
          overflow: 'hidden',
          border: `1px solid ${expanded ? 'rgba(92,225,230,0.4)' : 'rgba(92,225,230,0.18)'}`,
          boxShadow: expanded
            ? '0 14px 34px rgba(10,24,68,0.32), 0 0 0 4px rgba(92,225,230,0.13), inset 0 1px 0 rgba(255,255,255,0.16)'
            : '0 10px 26px rgba(10,24,68,0.26), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -8px 18px rgba(8,18,52,0.28)',
          // The elastic stretch: overshoots, then settles.
          transition: `width 460ms ${SPRING}, box-shadow 320ms ${EASE}, border-color 320ms ease`,
          willChange: 'width',
        }}
      >
        <button
          type="button"
          className="ls-btn"
          onClick={expand}
          aria-label={ariaLabel || placeholder}
          aria-expanded={expanded}
          tabIndex={expanded ? -1 : 0}
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            border: 'none',
            borderRadius: '50%',
            background: 'transparent',
            color: '#5ce1e6',
            cursor: expanded ? 'default' : 'pointer',
            transform: expanded ? 'scale(0.92)' : 'scale(1)',
            transition: `transform 320ms ${SPRING}`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </button>

        <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
          {expanded && !hasValue && (
            <span
              className="ls-caret"
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 2,
                width: 2,
                height: 18,
                borderRadius: 1,
                background: '#5ce1e6',
                boxShadow: '0 0 6px rgba(92,225,230,0.7)',
                pointerEvents: 'none',
              }}
            />
          )}
          <input
            ref={inputRef}
            className="ls-input"
            type="search"
            value={value}
            onChange={onChange}
            onFocus={() => setOpen(true)}
            onBlur={() => { if (!hasValue) setOpen(false); }}
            onKeyDown={handleKeyDown}
            placeholder={expanded ? placeholder : ''}
            aria-label={ariaLabel || placeholder}
            tabIndex={expanded ? 0 : -1}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              padding: '0 2px',
              // Fades in just after the pill starts stretching, so text never
              // appears to spill out of a container that hasn't grown yet.
              opacity: expanded ? 1 : 0,
              transform: expanded ? 'translateX(0)' : 'translateX(-6px)',
              pointerEvents: expanded ? 'auto' : 'none',
              transition: `opacity 260ms ${EASE} 90ms, transform 380ms ${EASE} 90ms`,
            }}
          />
        </div>

        {hasValue && (
          <button
            type="button"
            className="ls-clear"
            onClick={clear}
            aria-label="Clear search"
            style={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              marginRight: 5,
              border: 'none',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(220,235,255,0.75)',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        )}
      </div>

      <style jsx>{`
        /* Same dark-blue glass material as the dock. */
        .ls-pill {
          background: linear-gradient(180deg, rgba(23, 45, 116, 0.94) 0%, rgba(10, 24, 68, 0.97) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .ls-input::placeholder { color: rgba(186, 205, 245, 0.5); }
        /* Our own × replaces the native one. */
        .ls-input::-webkit-search-cancel-button { display: none; }

        .ls-caret { animation: ls-blink 1.05s steps(1, end) infinite; }
        @keyframes ls-blink {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }

        .ls-clear { animation: ls-pop 340ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        .ls-clear:hover { background: rgba(255, 255, 255, 0.16) !important; color: #fff !important; }
        @keyframes ls-pop {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }

        .ls-btn:focus-visible,
        .ls-clear:focus-visible {
          outline: 2px solid rgba(92, 225, 230, 0.85);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .ls-caret, .ls-clear { animation: none; }
        }
      `}</style>
    </div>
  );
}
