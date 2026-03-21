'use client';

import { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cx } from '@/lib/cx';

type NoticeTone = 'success' | 'warning' | 'critical' | 'info';

const TONE_STYLES: Record<NoticeTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
};

const TONE_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
  info: Info,
} satisfies Record<NoticeTone, React.ComponentType<{ className?: string }>>;

export default function InlineNotice({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = TONE_ICONS[tone];

  return (
    <div className={cx('rounded-2xl border px-4 py-3', TONE_STYLES[tone], className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <div className={cx('text-sm', title ? 'mt-1' : '')}>{children}</div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
