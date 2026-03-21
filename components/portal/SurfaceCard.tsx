'use client';

import { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export default function SurfaceCard({
  children,
  className,
  inset = false,
}: {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <section
      className={cx(
        'rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[var(--portal-shadow-card)]',
        inset ? 'bg-[var(--portal-surface-muted)]' : '',
        className,
      )}
    >
      {children}
    </section>
  );
}
