/**
 * ConfirmToast — replaces window.confirm() with a styled toast prompt
 * Usage: const confirmed = await confirmToast('Delete this listing?');
 */
import toast from 'react-hot-toast';

export const confirmToast = (message, options = {}) => {
  const {
    confirmText = 'Yes, confirm',
    cancelText  = 'Cancel',
    icon        = '⚠️',
  } = options;

  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[220px]">
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">{icon}</span>
            <p className="text-sm font-medium leading-snug">{message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              className="flex-1 px-3 py-2 text-xs font-bold bg-eco-500 hover:bg-eco-600 text-white rounded-lg transition-all active:scale-95"
            >
              {confirmText}
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              className="flex-1 px-3 py-2 text-xs font-bold border border-white/10 text-eco-200 rounded-lg hover:bg-white/5 transition-all active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
        style: {
          background: 'rgba(var(--bg-card), 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(var(--border-color), 0.5)',
          borderRadius: '16px',
          padding: '16px',
          color: 'inherit',
          maxWidth: '360px',
        },
      }
    );
  });
};
