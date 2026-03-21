'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { cx } from '@/lib/cx';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'critical',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'critical' | 'neutral';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[var(--portal-shadow-overlay)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-[var(--portal-border)] px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={cx(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                tone === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700',
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[var(--portal-fg)]">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--portal-fg-muted)]">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cx(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60',
              tone === 'critical' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[var(--portal-accent)] hover:bg-[var(--portal-accent-strong)]',
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
