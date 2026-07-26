/**
 * AuthStatusPanel — the premium "verifying → verified" stage that replaces the
 * login form's content while a sign-in is in flight.
 *
 * Motion design (mirrors the reference experience):
 *  - verifying: concentric rings breathe outward from a glowing core while a
 *    conic sweep rotates — continuous, calm, never jumpy.
 *  - success:   the sweep resolves into a ring that DRAWS itself, a halo
 *    expands once, then the tick strokes on with a spring overshoot.
 *  - label text cross-fades with a slight rise instead of hard-swapping.
 *
 * The component never invents copy — `label` is always passed in by the caller,
 * so each portal keeps its own exact wording ("Signing in...", "Welcome, X!").
 *
 * phase:   'verifying' | 'success'
 * exiting: true while the panel is playing its exit animation
 */
export default function AuthStatusPanel({ phase, label, exiting = false, subline }) {
  const isSuccess = phase === 'success';
  const fallbackSub = isSuccess ? 'Verified & Secured \u{1F512}' : 'Securing your session\u2026';

  return (
    <div
      className={`panel ${exiting ? 'is-exiting' : ''} ${isSuccess ? 'is-success' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={!isSuccess}
    >
      <div className="stage">
        {isSuccess ? (
          <div className="done">
            <span className="halo" aria-hidden="true" />
            <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
              <circle className="track" cx="32" cy="32" r="27" />
              <circle className="draw" cx="32" cy="32" r="27" />
              <path className="tick" d="M20 33.4 L28.2 41.6 L44.6 24.6" />
            </svg>
          </div>
        ) : (
          <div className="radar">
            <span className="ring ring-1" aria-hidden="true" />
            <span className="ring ring-2" aria-hidden="true" />
            <span className="ring ring-3" aria-hidden="true" />
            <span className="sweep" aria-hidden="true" />
            <span className="core" aria-hidden="true" />
          </div>
        )}
      </div>

      <p className="label">{label}</p>
      <p className="sub">{subline || fallbackSub}</p>

      <style jsx>{`
        .panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          text-align: center;
          opacity: 0;
          transform: scale(0.97);
          animation: panelIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, transform;
        }
        .panel.is-exiting {
          animation: panelOut 0.24s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        @keyframes panelIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes panelOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.02); }
        }

        .stage {
          position: relative;
          width: 76px;
          height: 76px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Verifying ───────────────────────────────────────── */
        .radar,
        .done {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ring {
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          border: 1.5px solid rgba(92, 225, 230, 0.75);
          opacity: 0;
          transform: scale(0.5);
          animation: ringOut 2.1s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          will-change: transform, opacity;
        }
        .ring-2 { animation-delay: 0.7s; }
        .ring-3 { animation-delay: 1.4s; }
        @keyframes ringOut {
          0%   { transform: scale(0.45); opacity: 0; }
          18%  { opacity: 0.85; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        .sweep {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #5ce1e6;
          border-right-color: rgba(92, 225, 230, 0.35);
          animation: sweepSpin 0.95s linear infinite;
          will-change: transform;
        }
        @keyframes sweepSpin {
          to { transform: rotate(360deg); }
        }

        .core {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #5ce1e6;
          box-shadow: 0 0 14px rgba(92, 225, 230, 0.85), 0 0 34px rgba(92, 225, 230, 0.35);
          animation: coreBreathe 1.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform;
        }
        @keyframes coreBreathe {
          0%, 100% { transform: scale(0.82); opacity: 0.85; }
          50%      { transform: scale(1.12); opacity: 1; }
        }

        /* ── Success ────────────────────────────────────────── */
        .halo {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1.5px solid rgba(52, 211, 153, 0.55);
          opacity: 0;
          transform: scale(0.6);
          animation: haloOut 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.12s forwards;
          will-change: transform, opacity;
        }
        @keyframes haloOut {
          0%   { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .mark {
          width: 100%;
          height: 100%;
          overflow: visible;
          transform: scale(0.86);
          animation: markPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform;
        }
        @keyframes markPop {
          from { transform: scale(0.86); }
          to   { transform: scale(1); }
        }
        .track {
          fill: none;
          stroke: rgba(52, 211, 153, 0.16);
          stroke-width: 3;
        }
        .draw {
          fill: none;
          stroke: #34d399;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 170;
          stroke-dashoffset: 170;
          transform: rotate(-90deg);
          transform-origin: 32px 32px;
          filter: drop-shadow(0 0 7px rgba(52, 211, 153, 0.45));
          animation: ringDraw 0.62s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes ringDraw {
          to { stroke-dashoffset: 0; }
        }
        .tick {
          fill: none;
          stroke: #34d399;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.4));
          animation: tickDraw 0.34s cubic-bezier(0.16, 1, 0.3, 1) 0.38s forwards;
        }
        @keyframes tickDraw {
          to { stroke-dashoffset: 0; }
        }

        /* ── Copy ───────────────────────────────────────────── */
        .label {
          color: #eef2f7;
          font-size: 0.925rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1.35;
          margin: 0;
          max-width: 17rem;
          opacity: 0;
          animation: riseIn 0.44s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        .sub {
          margin: 6px 0 0;
          font-size: 0.735rem;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: rgba(148, 163, 184, 0.9);
          opacity: 0;
          animation: riseIn 0.44s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .panel.is-success .sub {
          color: #34d399;
          animation-delay: 0.52s;
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .panel, .ring, .sweep, .core, .halo, .mark, .draw, .tick, .label, .sub {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .draw, .tick { stroke-dashoffset: 0 !important; }
          .ring { opacity: 0.35 !important; }
        }
      `}</style>
    </div>
  );
}
