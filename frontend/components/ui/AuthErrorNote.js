/**
 * AuthErrorNote — inline error message under the form fields.
 *
 * The toast is kept (unchanged wording, unchanged source), but a toast alone is
 * easy to miss and disappears; a persistent inline note is what production SaaS
 * sign-in screens do. It animates in without pushing the button down, because
 * the row it lives in is reserved by the parent's measured min-height.
 */
export default function AuthErrorNote({ message }) {
  return (
    <div className="note" role="alert">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12.5" />
        <line x1="12" y1="16" x2="12" y2="16" />
      </svg>
      <span>{message}</span>

      <style jsx>{`
        .note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #fca5a5;
          font-size: 0.78rem;
          font-weight: 500;
          line-height: 1.45;
          opacity: 0;
          animation: noteIn 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .note :global(svg) {
          flex-shrink: 0;
          margin-top: 1px;
        }
        @keyframes noteIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .note { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
