import Modal from './Modal';
import { Loader2, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <Modal label={title} onClose={onClose} busy={busy} size="sm">
      <div className="p-5 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        </div>
        <button type="button" disabled={busy} onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 bg-slate-50 flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`px-4 py-2 text-sm rounded-lg text-white inline-flex items-center gap-2 disabled:opacity-50 ${
            destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
