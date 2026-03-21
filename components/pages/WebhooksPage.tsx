'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Settings, Webhook } from 'lucide-react';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

export default function WebhooksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    void loadWebhookState();
  }, [router]);

  const loadWebhookState = async () => {
    try {
      setLoading(true);
      const response = await agentApi.getProfile();
      setProfile(response?.agent ?? null);
    } catch (error) {
      console.error('Failed to load webhook setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const webhookUrl = profile?.webhook_url || '';
  const configured = Boolean(webhookUrl);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Webhook deliveries"
        description="Configuration-first webhook surface until delivery telemetry is promoted to a dedicated backend feed."
        badge={<StatusBadge tone={configured ? 'success' : 'warning'}>{configured ? 'Configured' : 'Setup incomplete'}</StatusBadge>}
        meta={<StatusBadge tone="neutral">Phase 1 telemetry</StatusBadge>}
        actions={
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
          >
            <Settings className="h-4 w-4" />
            <span>Review webhook setup</span>
          </Link>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Configuration"
            value={configured ? 'Ready' : 'Missing'}
            hint={configured ? 'Production endpoint configured' : 'Production endpoint not configured'}
            icon={<Webhook className="h-5 w-5" />}
            tone={configured ? 'success' : 'warning'}
          />
          <MetricCard
            label="Delivery telemetry"
            value="Pending"
            hint="Detailed failures and retries will appear here when backend support lands"
            tone="neutral"
          />
          <MetricCard
            label="Logs entry point"
            value="Available"
            hint="Use recent events as the temporary failure surface"
            tone="info"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Endpoint configuration"
              description="Current webhook target used for production event delivery."
            />
            <div className="mt-5 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
              {loading ? (
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ) : configured ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Destination URL</p>
                  <p className="mt-3 break-all rounded-xl border border-[var(--portal-border)] bg-white px-3 py-3 font-mono text-sm text-[var(--portal-fg)]">
                    {webhookUrl}
                  </p>
                  <p className="mt-3 text-sm text-[var(--portal-fg-muted)]">
                    Delivery health is currently represented by setup state plus recent event logs.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--portal-fg)]">Webhook URL not configured</p>
                  <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                    Configure a production endpoint before you rely on asynchronous event notifications.
                  </p>
                </>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader
              title="Recommended next steps"
              description="Keep the language operational and honest until richer telemetry exists."
            />
            <div className="mt-5 space-y-3">
              {[
                'Verify the destination URL can receive production traffic over HTTPS.',
                'Store webhook events idempotently so retries do not duplicate downstream actions.',
                'Use recent logs to spot request failures until delivery dashboards are available.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-3 text-sm text-[var(--portal-fg-muted)]">
                  {item}
                </div>
              ))}
              <Link
                href="/logs"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>Open recent events</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
