export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0 bg-brand-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`modal-panel glass-panel relative rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-brand-dark/[0.06]">
          <h2 className="text-lg font-bold text-brand-dark tracking-tight">{title}</h2>
          <button onClick={onClose} className="modal-close text-gray-400 hover:text-brand-dark text-xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:bg-brand-dark/5 transition-all">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          animation: modalBackdropIn 0.25s ease forwards;
        }
        .modal-panel {
          animation: modalPanelIn 0.32s cubic-bezier(0.16,1,0.3,1) forwards;
          box-shadow: 0 24px 70px rgba(17,36,93,0.25), 0 4px 20px rgba(0,0,0,0.1);
        }
        @keyframes modalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .modal-backdrop, .modal-panel { animation: none; }
        }
      `}</style>
    </div>
  );
}