'use client';

import { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] px-6 py-12 text-center">
      {icon ? <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/5 text-[var(--portal-fg-muted)]">{icon}</div> : null}
      <h3 className="text-base font-semibold text-[var(--portal-fg)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--portal-fg-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
