'use client';

import { ReactNode } from 'react';

export default function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--portal-fg)]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
