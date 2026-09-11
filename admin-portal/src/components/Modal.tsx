import { useEffect, useRef, type ReactNode } from 'react';

export default function Modal({ children, label, onClose, busy = false, size = 'lg' }: {
  children: ReactNode; label: string; onClose: () => void; busy?: boolean; size?: 'sm' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={label} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className={`m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] ${size === 'sm' ? 'max-w-lg' : 'max-w-2xl'} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50`}>
    {children}
  </dialog>;
}
