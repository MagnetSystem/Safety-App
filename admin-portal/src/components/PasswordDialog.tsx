import Modal from './Modal';
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export default function PasswordDialog({
  title,
  description,
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  title: string;
  description?: string;
  open: boolean;
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");

  useEffect(() => { if (!open) setPassword(""); }, [open]);

  if (!open) return null;

  return (
    <Modal label={title} onClose={onClose} busy={submitting}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (submitting || password.length < 8) return;
          onSubmit(password);
        }}
        className="overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
          </div>
          <button type="button" disabled={submitting} onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}
          <label className="block text-sm">
            New password
            <input
              disabled={submitting}
              autoComplete="new-password"
              type="password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-border text-sm"
              placeholder="At least 8 characters"
            />
          </label>
        </div>
        <div className="p-4 bg-slate-50 border-t border-border flex justify-end gap-2">
          <button type="button" disabled={submitting} onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || password.length < 8}
            className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save password
          </button>
        </div>
      </form>
    </Modal>
  );
}
