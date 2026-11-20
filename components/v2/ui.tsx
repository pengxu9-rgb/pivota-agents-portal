'use client';

import React from 'react';
import { AlertTriangle, Check, Copy, Info } from 'lucide-react';

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="pv2-ph">
      <div style={{ minWidth: 0 }}>
        <div className="pv2-ph-title">
          <h1 className="pv2-h1">{title}</h1>
          {badge}
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="pv2-actions">{actions}</div> : null}
    </div>
  );
}

export type BadgeTone = 'ok' | 'warn' | 'err' | 'neu';

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return <span className={`pv2-badge pv2-${tone}`}>{children}</span>;
}

export function Notice({
  tone = 'neutral',
  title,
  children,
  action,
}: {
  tone?: 'neutral' | 'accent' | 'error';
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = tone === 'error' ? AlertTriangle : Info;
  const cls = tone === 'accent' ? ' pv2-notice-accent' : tone === 'error' ? ' pv2-notice-err' : '';
  return (
    <div className={`pv2-notice${cls}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? <div className="pv2-notice-title">{title}</div> : null}
        {children ? <div className={title ? 'pv2-muted' : undefined} style={title ? { marginTop: 2 } : undefined}>{children}</div> : null}
      </div>
      {action ? <div style={{ flex: 'none' }}>{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  actions,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="pv2-empty">
      <div className="pv2-h2">{title}</div>
      {children ? <p>{children}</p> : null}
      {actions ? <div className="pv2-actions">{actions}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="pv2-skel" style={{ width: `${90 - index * 15}%` }} />
      ))}
    </div>
  );
}

export function CopyButton({
  value,
  label = 'Copy',
  primary = false,
  className = '',
}: {
  value: string;
  label?: string;
  primary?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className={`pv2-btn${primary ? ' pv2-btn-pri' : ''} ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  );
}

/** A small accessible modal: focus moves in on open, Escape and the scrim close it. */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  onClose: () => void;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button');
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="pv2-modal-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pv2-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="pv2-modal-head">
          <h2 className="pv2-h2" id={titleId}>{title}</h2>
          {description ? <p className="pv2-muted">{description}</p> : null}
        </div>
        {children ? <div className="pv2-modal-body">{children}</div> : <div style={{ height: 16 }} />}
        <div className="pv2-modal-foot">{footer}</div>
      </div>
    </div>
  );
}

export function errorMessage(error: any, fallback: string) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}
