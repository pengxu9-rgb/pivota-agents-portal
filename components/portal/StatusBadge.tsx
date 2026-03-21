'use client';

import { ReactNode } from 'react';
import { cx } from '@/lib/cx';

type BadgeTone =
  | 'success'
  | 'warning'
  | 'critical'
  | 'info'
  | 'neutral'
  | 'production'
  | 'inactive';

const TONE_STYLES: Record<BadgeTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-violet-200 bg-violet-50 text-violet-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  production: 'border-violet-200 bg-violet-50 text-violet-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-500',
};

export default function StatusBadge({
  tone = 'neutral',
  children,
  icon,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.01em]',
        TONE_STYLES[tone],
        className,
      )}
    >
      {icon ? <span className="flex h-3.5 w-3.5 items-center justify-center">{icon}</span> : null}
      {children}
    </span>
  );
}
