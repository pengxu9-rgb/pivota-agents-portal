'use client';

import { ReactNode } from 'react';
import SurfaceCard from '@/components/portal/SurfaceCard';
import StatusBadge from '@/components/portal/StatusBadge';
import { cx } from '@/lib/cx';

type MetricTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

const ACCENT_MAP: Record<MetricTone, string> = {
  neutral: 'bg-slate-900/6 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-rose-50 text-rose-700',
  info: 'bg-violet-50 text-violet-700',
};

export default function MetricCard({
  label,
  value,
  hint,
  delta,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: { label: string; tone?: Exclude<MetricTone, 'neutral'> };
  tone?: MetricTone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={cx('p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--portal-fg-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--portal-fg)]">{value}</p>
        </div>
        {icon ? (
          <div className={cx('flex h-10 w-10 items-center justify-center rounded-xl', ACCENT_MAP[tone])}>
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {delta ? <StatusBadge tone={delta.tone ?? 'info'}>{delta.label}</StatusBadge> : null}
        {hint ? <span className="text-sm text-[var(--portal-fg-subtle)]">{hint}</span> : null}
      </div>
    </SurfaceCard>
  );
}
