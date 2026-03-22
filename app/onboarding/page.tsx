'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, KeyRound, Webhook } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

export default function OnboardingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<
    Array<{ id: string; title: string; description: string; href: string; done: boolean }>
  >([]);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    setAuthenticated(Boolean(token));

    if (!token) {
      setLoading(false);
      return;
    }

    void loadSignals();
  }, []);

  const loadSignals = async () => {
    try {
      setLoading(true);
      const [keysResult, metricsResult, webhookResult, orderEventsResult] = await Promise.allSettled([
        agentApi.getApiKeys(),
        agentApi.getMetricsSummary(),
        agentApi.getWebhookConfig(),
        agentApi.getOrderEvents(10),
      ]);

      const keys = keysResult.status === 'fulfilled' ? keysResult.value?.keys || [] : [];
      const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null;
      const webhook = webhookResult.status === 'fulfilled' ? webhookResult.value?.config : null;
      const orderEvents = orderEventsResult.status === 'fulfilled' ? orderEventsResult.value?.events || [] : [];

      setSteps([
        {
          id: 'key',
          title: 'Create your first API key',
          description: 'Provision a dedicated production or test key for authenticated requests.',
          href: '/api-keys',
          done: keys.some((key: any) => key?.status === 'active'),
        },
        {
          id: 'request',
          title: 'Send your first authenticated request',
          description: 'Confirm that the API key and base URL work from your environment.',
          href: '/docs?tab=quickstart',
          done: (metrics?.overview?.total_requests ?? 0) > 0,
        },
        {
          id: 'webhook',
          title: 'Configure webhook delivery',
          description: 'Set a destination URL and subscribe to the events your integration needs.',
          href: '/webhooks',
          done: Boolean(webhook?.enabled && webhook?.destination_url),
        },
        {
          id: 'test',
          title: 'Send a webhook test event',
          description: 'Verify your destination and signing-secret validation before live traffic.',
          href: '/webhooks',
          done: Boolean(webhook?.last_test_status === 'delivered'),
        },
        {
          id: 'orders',
          title: 'Create your first order and observe events',
          description: 'Validate end-to-end order creation, timeline events, and downstream delivery.',
          href: '/orders',
          done: orderEvents.length > 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[var(--portal-canvas)] px-6 py-10 text-[var(--portal-fg)]">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-4">
            <StatusBadge tone="production">Developer onboarding</StatusBadge>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Start your Pivota integration</h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--portal-fg-muted)]">
              Set up credentials, verify the API, configure webhooks, and validate the first order flow before promoting traffic.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <span>Create developer account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
              >
                <span>Sign in</span>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              'Create a production-ready API key.',
              'Send the first authenticated request.',
              'Configure a webhook destination and event subscriptions.',
              'Send a webhook test event.',
              'Create the first order and observe timeline events.',
            ].map((item, index) => (
              <SurfaceCard key={item} className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Step {index + 1}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--portal-fg-muted)]">{item}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--portal-canvas)] px-6 py-10 text-[var(--portal-fg)]">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-4">
          <StatusBadge tone="production">Production onboarding</StatusBadge>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Complete the developer setup checklist</h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--portal-fg-muted)]">
            This checklist is derived from real portal signals. It updates as you create keys, send requests, configure webhooks, and generate order activity.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step) => (
              <SurfaceCard key={step.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : step.id === 'webhook' || step.id === 'test' ? (
                      <Webhook className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-accent)]" />
                    ) : step.id === 'key' ? (
                      <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-accent)]" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-fg-subtle)]" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-[var(--portal-fg)]">{step.title}</h2>
                        <StatusBadge tone={step.done ? 'success' : 'neutral'}>{step.done ? 'Done' : 'Pending'}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">{step.description}</p>
                    </div>
                  </div>
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                  >
                    <span>Open</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
