'use client';

import Link from 'next/link';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import ApiKeyManager from '@/components/portal/ApiKeyManager';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';

export default function ApiKeysPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="API Keys"
        description="Create, rotate, and revoke credentials for production services, partner tooling, and internal automation."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        actions={
          <Link
            href="/docs?tab=api"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
          >
            <span>View API auth docs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Credential posture"
            value="Managed"
            hint="Separate keys by environment and partner use case"
            icon={<KeyRound className="h-5 w-5" />}
            tone="info"
          />
          <MetricCard
            label="Rotation policy"
            value="Recommended"
            hint="Rotate keys on a schedule and after incidents"
            icon={<ShieldCheck className="h-5 w-5" />}
            tone="success"
          />
          <MetricCard
            label="Best practice"
            value="Scoped usage"
            hint="Avoid sharing production keys across services"
            tone="neutral"
          />
        </div>

        <ApiKeyManager />
      </div>
    </div>
  );
}
