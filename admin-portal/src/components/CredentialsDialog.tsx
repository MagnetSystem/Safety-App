import Modal from './Modal';
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CredentialsDialog({
  title,
  email,
  password,
  onClose,
}: {
  title: string;
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nTemporary password: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal label={title} onClose={onClose} size="sm">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">
          Share these sign-in details now — the password won't be shown again.
        </p>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl border border-border bg-slate-50 p-3 space-y-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="text-sm font-medium text-slate-900 break-all">{email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Temporary password</p>
            <p className="text-sm font-mono font-medium text-slate-900 break-all">{password}</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-border flex justify-end gap-2">
        <button type="button" onClick={copy} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy details"}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700">
          Done
        </button>
      </div>
    </Modal>
  );
}
