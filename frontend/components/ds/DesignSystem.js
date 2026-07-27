import { CSS_VARS } from './tokens';

/* ==========================================================================
   SYNCOPTRAC DESIGN SYSTEM - COMPONENT LAYER

   Injected once per portal layout. Everything is scoped under .sc-app so it
   cannot leak into the public marketing pages (index, about, features...)
   which keep their own look, and cannot fight the existing Tailwind layer.

   Why plain CSS rather than Tailwind classes: this app already carries a
   784-line globals.css plus Tailwind plus per-page styled-jsx. Adding a
   fourth dialect would make it worse. One scoped stylesheet with a real token
   set is the thing a product team would actually ship.

   Motion note: all transitions are CSS/transform-based and GPU-friendly.
   Framer Motion can later replace the entrance and dialog animations without
   touching any of the visual rules below - the class names are the contract.
   ========================================================================== */

export default function DesignSystem() {
  return (
    <style jsx global>{`
      .sc-app { ${CSS_VARS} }

      /* ---------------------------------------------------------------- *
       * CANVAS + TYPOGRAPHY
       * ---------------------------------------------------------------- */
      .sc-app {
        background: var(--sc-bg);
        color: var(--sc-text);
        font-size: var(--sc-f-body);
        -webkit-font-smoothing: antialiased;
      }
      .sc-app *, .sc-app *::before, .sc-app *::after { box-sizing: border-box; }

      /* Figures must never reflow as they count up. */
      .sc-num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; }

      .sc-eyebrow {
        font-size: var(--sc-f-micro);
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--sc-muted);
      }
      .sc-h1 { font-size: var(--sc-f-h1); font-weight: 800; letter-spacing: -0.02em; line-height: 1.12; margin: 0; }
      .sc-h2 { font-size: var(--sc-f-h2); font-weight: 750; letter-spacing: -0.015em; line-height: 1.2; margin: 0; }
      .sc-h3 { font-size: var(--sc-f-h3); font-weight: 700; letter-spacing: -0.01em; margin: 0; }
      .sc-dim { color: var(--sc-muted); }

      /* ---------------------------------------------------------------- *
       * PAGE MASTHEAD - sits directly on the canvas, not in a card, so the
       * page opens with breathing room instead of a wall of panels.
       * ---------------------------------------------------------------- */
      .sc-mast {
        display: flex; align-items: flex-end; justify-content: space-between;
        gap: 16px; flex-wrap: wrap;
        padding: 4px 2px 18px;
        border-bottom: 1px solid var(--sc-border);
        margin-bottom: 22px;
      }
      .sc-mast-l { min-width: 0; }
      .sc-mast-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

      /* ---------------------------------------------------------------- *
       * SURFACES
       * ---------------------------------------------------------------- */
      .sc-card {
        position: relative;
        background: var(--sc-card);
        border: 1px solid var(--sc-border);
        border-radius: var(--sc-r-lg);
        box-shadow: var(--sc-sh-1);
        padding: 20px;
        transition:
          transform var(--sc-d-base) var(--sc-ease),
          box-shadow var(--sc-d-base) var(--sc-ease),
          border-color var(--sc-d-base) var(--sc-ease);
      }
      .sc-card-lg { border-radius: var(--sc-r-xl); padding: 24px; }

      /* Hover lift is gated to real pointers: on touch, :hover sticks after
         a tap and leaves cards looking permanently raised. */
      @media (hover: hover) and (pointer: fine) {
        .sc-card.sc-i:hover {
          transform: translateY(-3px);
          box-shadow: var(--sc-sh-3);
          border-color: rgba(37, 99, 235, 0.28);
        }
      }
      .sc-card.sc-i { cursor: pointer; }
      .sc-card.sc-i:active { transform: translateY(-1px) scale(0.995); }

      /* Tone strip: a 3px accent edge that identifies a card's meaning
         without colouring the whole surface. --sc-tone is set per card. */
      .sc-card .sc-edge {
        position: absolute; inset: 0 auto 0 0; width: 3px;
        border-radius: var(--sc-r-lg) 0 0 var(--sc-r-lg);
        background: var(--sc-tone, var(--sc-accent));
        opacity: 0.9;
      }

      /* ---------------------------------------------------------------- *
       * STAT CARD
       * ---------------------------------------------------------------- */
      .sc-stat { display: flex; flex-direction: column; gap: 12px; }
      .sc-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .sc-ico {
        width: 38px; height: 38px; flex: 0 0 38px;
        display: grid; place-items: center;
        border-radius: 11px;
        background: var(--sc-tone-tint, var(--sc-accent-tint));
        color: var(--sc-tone, var(--sc-accent));
      }
      .sc-ico svg { width: 19px; height: 19px; }
      .sc-stat-val {
        font-size: clamp(1.5rem, 4.6vw, 1.95rem);
        font-weight: 800; letter-spacing: -0.03em; line-height: 1;
        color: var(--sc-text);
      }
      .sc-stat-sub { font-size: var(--sc-f-xs); color: var(--sc-muted); }

      /* ---------------------------------------------------------------- *
       * BUTTONS
       * ---------------------------------------------------------------- */
      .sc-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        min-height: var(--sc-tap);
        padding: 0 18px;
        border-radius: var(--sc-r-pill);
        border: 1px solid transparent;
        font-size: var(--sc-f-sm); font-weight: 650;
        font-family: inherit;
        cursor: pointer;
        white-space: nowrap;
        transition:
          transform var(--sc-d-fast) var(--sc-ease),
          box-shadow var(--sc-d-base) var(--sc-ease),
          background var(--sc-d-base) var(--sc-ease),
          border-color var(--sc-d-base) var(--sc-ease);
      }
      .sc-btn svg { width: 16px; height: 16px; }
      .sc-btn:active { transform: scale(0.97); }
      .sc-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

      .sc-btn-primary {
        background: linear-gradient(135deg, var(--sc-accent) 0%, var(--sc-accent-2) 100%);
        color: #fff;
        box-shadow: var(--sc-sh-accent);
      }
      @media (hover: hover) and (pointer: fine) {
        .sc-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.32);
        }
      }
      .sc-btn-secondary {
        background: var(--sc-card);
        color: var(--sc-navy);
        border-color: var(--sc-border);
        box-shadow: var(--sc-sh-1);
      }
      @media (hover: hover) and (pointer: fine) {
        .sc-btn-secondary:hover:not(:disabled) {
          background: var(--sc-hover);
          border-color: rgba(37, 99, 235, 0.3);
        }
      }
      .sc-btn-ghost { background: transparent; color: var(--sc-accent); }
      @media (hover: hover) and (pointer: fine) {
        .sc-btn-ghost:hover:not(:disabled) { background: var(--sc-accent-tint); }
      }
      .sc-btn-danger { background: var(--sc-danger); color: #fff; }
      .sc-btn-sm { min-height: 34px; padding: 0 13px; font-size: var(--sc-f-xs); }

      /* Inline text link with a travelling arrow. */
      .sc-link {
        display: inline-flex; align-items: center; gap: 4px;
        background: none; border: 0; padding: 0;
        font: inherit; font-size: var(--sc-f-xs); font-weight: 650;
        color: var(--sc-accent); cursor: pointer;
      }
      .sc-link span { transition: transform var(--sc-d-base) var(--sc-ease); }
      @media (hover: hover) and (pointer: fine) {
        .sc-link:hover span { transform: translateX(3px); }
      }

      /* ---------------------------------------------------------------- *
       * ACTION TILE
       * ---------------------------------------------------------------- */
      .sc-action {
        display: flex; align-items: center; gap: 11px;
        width: 100%; min-height: 56px;
        padding: 12px 14px;
        background: var(--sc-card);
        border: 1px solid var(--sc-border);
        border-radius: var(--sc-r-md);
        box-shadow: var(--sc-sh-1);
        font: inherit; font-size: var(--sc-f-sm); font-weight: 650;
        color: var(--sc-text);
        text-align: left; cursor: pointer;
        transition:
          transform var(--sc-d-base) var(--sc-ease),
          box-shadow var(--sc-d-base) var(--sc-ease),
          border-color var(--sc-d-base) var(--sc-ease),
          background var(--sc-d-base) var(--sc-ease);
      }
      .sc-action .sc-ico { width: 32px; height: 32px; flex-basis: 32px; border-radius: 9px; }
      .sc-action .sc-ico svg { width: 16px; height: 16px; }
      .sc-action-arrow { margin-left: auto; color: var(--sc-muted); transition: transform var(--sc-d-base) var(--sc-ease); }
      @media (hover: hover) and (pointer: fine) {
        .sc-action:hover {
          transform: translateY(-2px);
          box-shadow: var(--sc-sh-3);
          border-color: rgba(37, 99, 235, 0.3);
          background: var(--sc-hover);
        }
        .sc-action:hover .sc-action-arrow { transform: translateX(3px); color: var(--sc-accent); }
      }
      .sc-action:active { transform: translateY(0) scale(0.985); }

      /* ---------------------------------------------------------------- *
       * FORM CONTROLS - floating label
       * ---------------------------------------------------------------- */
      .sc-field { position: relative; }
      .sc-field input, .sc-field select, .sc-field textarea {
        width: 100%;
        min-height: 52px;
        padding: 20px 14px 8px;
        font: inherit; font-size: var(--sc-f-body);
        color: var(--sc-text);
        background: var(--sc-card);
        border: 1px solid var(--sc-border);
        border-radius: var(--sc-r-md);
        outline: none;
        transition:
          border-color var(--sc-d-base) var(--sc-ease),
          box-shadow var(--sc-d-base) var(--sc-ease);
      }
      .sc-field label {
        position: absolute; left: 14px; top: 15px;
        font-size: var(--sc-f-body); color: var(--sc-muted);
        pointer-events: none;
        transform-origin: left top;
        transition: transform var(--sc-d-base) var(--sc-ease), color var(--sc-d-base) var(--sc-ease);
      }
      /* :placeholder-shown drives the float, so it works without JS state. */
      .sc-field input:focus + label,
      .sc-field input:not(:placeholder-shown) + label,
      .sc-field textarea:focus + label,
      .sc-field textarea:not(:placeholder-shown) + label {
        transform: translateY(-9px) scale(0.76);
        color: var(--sc-accent);
      }
      .sc-field input:focus, .sc-field select:focus, .sc-field textarea:focus {
        border-color: var(--sc-accent);
        box-shadow: 0 0 0 4px var(--sc-accent-ring);
      }
      .sc-field.is-error input { border-color: var(--sc-danger); }
      .sc-field.is-error input:focus { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.16); }

      /* ---------------------------------------------------------------- *
       * SEARCH + FILTERS
       * ---------------------------------------------------------------- */
      .sc-search {
        display: flex; align-items: center; gap: 9px;
        min-height: var(--sc-tap);
        padding: 0 14px;
        background: var(--sc-card);
        border: 1px solid var(--sc-border);
        border-radius: var(--sc-r-pill);
        box-shadow: var(--sc-sh-1);
        transition: border-color var(--sc-d-base) var(--sc-ease), box-shadow var(--sc-d-base) var(--sc-ease);
      }
      .sc-search:focus-within { border-color: var(--sc-accent); box-shadow: 0 0 0 4px var(--sc-accent-ring); }
      .sc-search svg { width: 16px; height: 16px; color: var(--sc-muted); flex: 0 0 16px; }
      .sc-search input {
        flex: 1; min-width: 0;
        border: 0; outline: none; background: none;
        font: inherit; font-size: var(--sc-f-sm); color: var(--sc-text);
      }
      .sc-search input::-webkit-search-cancel-button { display: none; }

      /* Segmented filter control. */
      .sc-seg {
        display: inline-flex; padding: 3px; gap: 2px;
        background: var(--sc-navy-tint);
        border-radius: var(--sc-r-pill);
      }
      .sc-seg button {
        border: 0; background: none;
        min-height: 34px; padding: 0 14px;
        border-radius: var(--sc-r-pill);
        font: inherit; font-size: var(--sc-f-xs); font-weight: 650;
        color: var(--sc-muted); cursor: pointer;
        transition: background var(--sc-d-base) var(--sc-ease), color var(--sc-d-base) var(--sc-ease);
      }
      .sc-seg button[aria-pressed='true'] {
        background: var(--sc-card);
        color: var(--sc-accent);
        box-shadow: var(--sc-sh-1);
      }

      /* ---------------------------------------------------------------- *
       * BADGES
       * ---------------------------------------------------------------- */
      .sc-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 10px;
        border-radius: var(--sc-r-pill);
        font-size: var(--sc-f-micro); font-weight: 700;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }
      .sc-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

      /* Live indicator. */
      .sc-live {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 5px 12px;
        background: var(--sc-success-tint);
        border-radius: var(--sc-r-pill);
        font-size: var(--sc-f-micro); font-weight: 700;
        color: #15803D;
      }
      .sc-live i {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--sc-success);
        animation: sc-beat 2.4s var(--sc-ease-in-out) infinite;
      }
      @keyframes sc-beat {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(0.78); }
      }

      /* ---------------------------------------------------------------- *
       * TABLES
       * ---------------------------------------------------------------- */
      .sc-table-wrap {
        background: var(--sc-card);
        border: 1px solid var(--sc-border);
        border-radius: var(--sc-r-lg);
        box-shadow: var(--sc-sh-1);
        overflow: hidden;
      }
      .sc-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .sc-table { width: 100%; border-collapse: collapse; font-size: var(--sc-f-sm); }
      .sc-table thead th {
        position: sticky; top: 0; z-index: 1;
        background: #FBFCFE;
        padding: 12px 16px;
        text-align: left;
        font-size: var(--sc-f-micro); font-weight: 700;
        letter-spacing: 0.07em; text-transform: uppercase;
        color: var(--sc-muted);
        border-bottom: 1px solid var(--sc-border);
        white-space: nowrap;
      }
      .sc-table tbody td {
        padding: 13px 16px;
        border-bottom: 1px solid #F1F5F9;
        color: var(--sc-text);
        vertical-align: middle;
      }
      .sc-table tbody tr:last-child td { border-bottom: 0; }
      .sc-table tbody tr { transition: background var(--sc-d-fast) var(--sc-ease); }
      @media (hover: hover) and (pointer: fine) {
        .sc-table tbody tr:hover { background: var(--sc-hover); }
      }
      .sc-table .sc-td-num { text-align: right; font-variant-numeric: tabular-nums; }

      /* ---------------------------------------------------------------- *
       * PAGINATION
       * ---------------------------------------------------------------- */
      .sc-pag {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; flex-wrap: wrap;
        padding: 12px 16px;
        border-top: 1px solid var(--sc-border);
        font-size: var(--sc-f-xs); color: var(--sc-muted);
      }
      .sc-pag-nav { display: flex; align-items: center; gap: 6px; }
      .sc-pag-nav button {
        min-width: 34px; min-height: 34px;
        display: grid; place-items: center;
        border: 1px solid var(--sc-border);
        border-radius: 9px;
        background: var(--sc-card);
        font: inherit; font-size: var(--sc-f-xs); font-weight: 650;
        color: var(--sc-text); cursor: pointer;
        transition: background var(--sc-d-fast) var(--sc-ease), border-color var(--sc-d-fast) var(--sc-ease);
      }
      .sc-pag-nav button[aria-current='page'] {
        background: var(--sc-accent); border-color: var(--sc-accent); color: #fff;
      }
      .sc-pag-nav button:disabled { opacity: 0.4; cursor: not-allowed; }

      /* ---------------------------------------------------------------- *
       * DIALOGS
       * ---------------------------------------------------------------- */
      .sc-scrim {
        position: fixed; inset: 0; z-index: 60;
        display: grid; place-items: center;
        padding: 18px;
        background: rgba(11, 31, 77, 0.42);
        backdrop-filter: blur(6px);
        animation: sc-fade var(--sc-d-base) var(--sc-ease) both;
      }
      .sc-dialog {
        width: 100%; max-width: 520px;
        max-height: calc(100vh - 36px);
        overflow-y: auto;
        background: var(--sc-card);
        border-radius: var(--sc-r-xl);
        box-shadow: var(--sc-sh-4);
        animation: sc-dialog-in 320ms var(--sc-ease-spring) both;
      }
      .sc-dialog-head {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 20px 22px 14px;
        border-bottom: 1px solid var(--sc-border);
      }
      .sc-dialog-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
      .sc-dialog-foot {
        display: flex; justify-content: flex-end; gap: 10px;
        padding: 14px 22px 20px;
      }
      @keyframes sc-fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes sc-dialog-in {
        from { opacity: 0; transform: translateY(14px) scale(0.97); }
        to { opacity: 1; transform: none; }
      }
      /* Phones get a bottom sheet - reachable with a thumb. */
      @media (max-width: 560px) {
        .sc-scrim { place-items: end center; padding: 0; }
        .sc-dialog {
          max-width: none;
          border-radius: var(--sc-r-xl) var(--sc-r-xl) 0 0;
          max-height: 90vh;
          animation: sc-sheet-in 340ms var(--sc-ease) both;
        }
        .sc-dialog-foot { padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
      }
      @keyframes sc-sheet-in {
        from { transform: translateY(100%); }
        to { transform: none; }
      }

      /* ---------------------------------------------------------------- *
       * SKELETONS - a sweep, not an opacity blink. Blinking reads as a
       * broken screen; a sweep reads as loading.
       * ---------------------------------------------------------------- */
      .sc-skel {
        position: relative; overflow: hidden;
        background: #EEF2F7;
        border: 1px solid var(--sc-border);
        border-radius: var(--sc-r-lg);
      }
      .sc-skel::after {
        content: '';
        position: absolute; inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent);
        animation: sc-sweep 1.5s var(--sc-ease-in-out) infinite;
      }
      @keyframes sc-sweep { to { transform: translateX(100%); } }
      .sc-skel-text { height: 12px; border-radius: 6px; border: 0; }

      /* Inline spinner for buttons and small regions. */
      .sc-spin {
        width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,0.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: sc-rot 700ms linear infinite;
      }
      @keyframes sc-rot { to { transform: rotate(360deg); } }

      /* ---------------------------------------------------------------- *
       * EMPTY / ERROR STATES
       * ---------------------------------------------------------------- */
      .sc-empty {
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 40px 20px; text-align: center;
        color: var(--sc-muted);
      }
      .sc-empty-ico {
        width: 46px; height: 46px;
        display: grid; place-items: center;
        border-radius: 14px;
        background: var(--sc-accent-tint);
        color: var(--sc-accent);
      }
      .sc-notice {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px;
        border-radius: var(--sc-r-md);
        font-size: var(--sc-f-xs); font-weight: 600;
      }
      .sc-notice-warn { background: var(--sc-warning-tint); color: #92400E; }
      .sc-notice-error { background: var(--sc-danger-tint); color: #991B1B; }

      /* ---------------------------------------------------------------- *
       * ENTRANCE - staggered, transform-only so it never triggers layout.
       * ---------------------------------------------------------------- */
      .sc-rise { animation: sc-rise var(--sc-d-slow) var(--sc-ease) both; }
      @keyframes sc-rise {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: none; }
      }

      /* ---------------------------------------------------------------- *
       * FOCUS - visible for keyboards, invisible for mice.
       * ---------------------------------------------------------------- */
      .sc-app :focus-visible {
        outline: 2px solid var(--sc-accent);
        outline-offset: 2px;
        border-radius: 6px;
      }

      /* ---------------------------------------------------------------- *
       * REDUCED MOTION - honour the OS setting.
       * ---------------------------------------------------------------- */
      @media (prefers-reduced-motion: reduce) {
        .sc-app *, .sc-app *::before, .sc-app *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }

      /* ---------------------------------------------------------------- *
       * PHONE REFINEMENTS
       * ---------------------------------------------------------------- */
      @media (max-width: 560px) {
        .sc-card { padding: 16px; border-radius: var(--sc-r-md); }
        .sc-card-lg { padding: 18px; border-radius: var(--sc-r-lg); }
        .sc-mast { padding-bottom: 14px; margin-bottom: 16px; }
        .sc-table thead th { padding: 10px 13px; }
        .sc-table tbody td { padding: 11px 13px; }
      }
    `}</style>
  );
}
