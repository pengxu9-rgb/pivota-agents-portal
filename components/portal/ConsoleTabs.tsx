'use client';

import { ReactNode } from 'react';
import { cx } from '@/lib/cx';

export interface ConsoleTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export default function ConsoleTabs({
  items,
  activeId,
  onChange,
}: {
  items: ConsoleTabItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-1">
      {items.map((item) => {
        const active = item.id === activeId;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cx(
              'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium',
              active
                ? 'bg-[var(--portal-accent)] text-white shadow-[0_10px_24px_rgba(88,53,247,0.18)]'
                : 'text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-fg)]',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
