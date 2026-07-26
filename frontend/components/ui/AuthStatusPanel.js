/**
 * Replaces the login form's content while `phase` is 'verifying' or 'success'.
 * Text shown is always passed in from the caller — this component never
 * invents its own copy, so each login page keeps its own exact wording
 * ("Signing in...", "Welcome, X!", etc.) unchanged.
 *
 * phase: 'verifying' | 'success'
 */
export default function AuthStatusPanel({ phase, label }) {
  return (
    <div className="auth-status-panel">
      {phase === 'verifying' && (
        <div className="auth-radar">
          <span className="auth-ring" style={{ animationDelay: '0s' }} />
          <span className="auth-ring" style={{ animationDelay: '0.5s' }} />
          <span className="auth-ring" style={{ animationDelay: '1s' }} />
          <span className="auth-dot" />
        </div>
      )}

      {phase === 'success' && (
        <div className="auth-check-wrap">
          <svg viewBox="0 0 52 52" className="auth-check-circle">
            <circle cx="26" cy="26" r="24" fill="none" />
            <path fill="none" d="M14 27l8 8 16-16" className="auth-check-mark" />
          </svg>
        </div>
      )}

      <p className="auth-status-label">{label}</p>

      <style jsx>{`
        .auth-status-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 8px 20px;
          animation: authPanelIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes authPanelIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Verifying: radar pulse ─────────────────────────────────────── */
        .auth-radar {
          position: relative;
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .auth-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #5ce1e6;
          opacity: 0;
          animation: radarPulse 1.6s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        @keyframes radarPulse {
          0%   { transform: scale(0.55); opacity: 0.9; }
          70%  { opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .auth-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #5ce1e6;
          box-shadow: 0 0 12px rgba(92,225,230,0.7);
          animation: dotPulse 1s ease-in-out infinite alternate;
        }
        @keyframes dotPulse {
          from { transform: scale(0.85); }
          to   { transform: scale(1.05); }
        }

        /* ── Success: checkmark draw-in ─────────────────────────────────── */
        .auth-check-wrap {
          width: 68px;
          height: 68px;
          margin-bottom: 18px;
          animation: checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes checkPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .auth-check-circle {
          width: 100%;
          height: 100%;
        }
        .auth-check-circle circle {
          stroke: #34d399;
          stroke-width: 3;
          stroke-dasharray: 151;
          stroke-dashoffset: 151;
          filter: drop-shadow(0 0 6px rgba(52,211,153,0.5));
          animation: circleDraw 0.5s ease-out forwards;
        }
        .auth-check-mark {
          stroke: #34d399;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 34;
          stroke-dashoffset: 34;
          animation: checkDraw 0.35s ease-out 0.35s forwards;
        }
        @keyframes circleDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes checkDraw {
          to { stroke-dashoffset: 0; }
        }

        .auth-status-label {
          color: #e5e7eb;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: center;
          letter-spacing: 0.01em;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-status-panel, .auth-ring, .auth-dot, .auth-check-wrap,
          .auth-check-circle circle, .auth-check-mark {
            animation: none !important;
          }
          .auth-check-circle circle, .auth-check-mark { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}