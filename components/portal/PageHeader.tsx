'use client';

import { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export default function PageHeader({
  title,
  description,
  badge,
  meta,
  actions,
  className,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx('border-b border-[var(--portal-border)] bg-[var(--portal-surface)]/92 backdrop-blur', className)}>
      <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[var(--portal-fg)]">{title}</h1>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--portal-fg-muted)]">{description}</p>
          ) : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
