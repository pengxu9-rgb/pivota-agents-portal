'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Shield,
  Webhook,
} from 'lucide-react';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

type DeliverySummary = {
  total: number;
  succeeded: number;
  failed: number;
  retrying: number;
  success_rate: number;
  last_delivery_at: string | null;
};

type WebhookConfig = {
  enabled: boolean;
  destination_url: string | null;
  managed_receiver_url?: string | null;
  subscribed_events: string[];
  signing_secret_last4: string | null;
  pending_signing_secret_last4?: string | null;
  pending_secret_activates_at?: string | null;
  last_test_at: string | null;
  last_test_status: string | null;
  delivery_summary_24h: DeliverySummary;
  migration_source: string | null;
};

type Delivery = {
  delivery_id: string;
  event_id: string;
  event_type: string;
  status: string;
  http_status: number | null;
  attempt_count: number;
  latency_ms: number | null;
  created_at: string | null;
  delivered_at: string | null;
  next_retry_at: string | null;
  request_id: string | null;
  last_error: string | null;
};

type CatalogEvent = {
  event_type: string;
  category?: string;
  description?: string;
};

function deriveWebhookState(isLoading: boolean, configUnavailable: boolean, config: WebhookConfig | null) {
  if (isLoading && !configUnavailable && !config) {
    return {
      label: 'Checking',
      tone: 'neutral' as const,
    };
  }

  if (configUnavailable) {
    return {
      label: 'Unavailable',
      tone: 'warning' as const,
    };
  }

  if (!config?.enabled || !config.destination_url) {
    return {
      label: 'Missing',
      tone: 'warning' as const,
    };
  }

  const summary = config.delivery_summary_24h;
  if ((summary?.total ?? 0) === 0) {
    return {
      label: 'Ready',
      tone: 'info' as const,
    };
  }

  if ((summary?.failed ?? 0) > 0 || (summary?.retrying ?? 0) > 0 || config.last_test_status === 'failed') {
    return {
      label: 'Degraded',
      tone: 'warning' as const,
    };
  }

  if ((summary?.success_rate ?? 0) >= 95) {
    return {
      label: 'Healthy',
      tone: 'success' as const,
    };
  }

  return {
    label: 'Degraded',
    tone: 'warning' as const,
  };
}

export default function WebhooksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [rotatingSecret, setRotatingSecret] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [catalog, setCatalog] = useState<CatalogEvent[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [configUnavailable, setConfigUnavailable] = useState(false);
  const [deliveriesUnavailable, setDeliveriesUnavailable] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning' | 'critical'; title?: string; body: string } | null>(null);
  const [newSecret, setNewSecret] = useState<{ value: string; activatesAt: string | null } | null>(null);
  const [copiedNewSecret, setCopiedNewSecret] = useState(false);
  const [form, setForm] = useState({
    enabled: false,
    destinationUrl: '',
    subscribedEvents: [] as string[],
  });

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
      const [configResult, catalogResult, deliveriesResult] = await Promise.allSettled([
        agentApi.getWebhookConfig(),
        agentApi.getWebhookEventsCatalog(),
        agentApi.getWebhookDeliveries(25),
      ]);

      if (configResult.status === 'fulfilled') {
        const nextConfig = configResult.value?.config ?? null;
        setConfig(nextConfig);
        setForm({
          enabled: Boolean(nextConfig?.enabled),
          destinationUrl: nextConfig?.destination_url || '',
          subscribedEvents: Array.isArray(nextConfig?.subscribed_events) ? nextConfig.subscribed_events : [],
        });
        setConfigUnavailable(false);
      } else {
        console.error('Failed to load webhook config:', configResult.reason);
        setConfig(null);
        setConfigUnavailable(true);
      }

      if (catalogResult.status === 'fulfilled') {
        setCatalog(Array.isArray(catalogResult.value?.events) ? catalogResult.value.events : []);
      } else {
        console.error('Failed to load webhook catalog:', catalogResult.reason);
        setCatalog([]);
      }

      if (deliveriesResult.status === 'fulfilled') {
        setDeliveries(Array.isArray(deliveriesResult.value?.deliveries) ? deliveriesResult.value.deliveries : []);
        setDeliveriesUnavailable(false);
      } else {
        console.error('Failed to load webhook deliveries:', deliveriesResult.reason);
        setDeliveries([]);
        setDeliveriesUnavailable(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    await loadWebhookState();
  };

  const handleToggleEvent = (eventType: string) => {
    setForm((current) => ({
      ...current,
      subscribedEvents: current.subscribedEvents.includes(eventType)
        ? current.subscribedEvents.filter((item) => item !== eventType)
        : [...current.subscribedEvents, eventType],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await agentApi.updateWebhookConfig({
        enabled: form.enabled,
        destination_url: form.destinationUrl.trim(),
        subscribed_events: form.subscribedEvents,
      });
      const nextConfig = response?.config ?? null;
      setConfig(nextConfig);
      setForm({
        enabled: Boolean(nextConfig?.enabled),
        destinationUrl: nextConfig?.destination_url || '',
        subscribedEvents: Array.isArray(nextConfig?.subscribed_events) ? nextConfig.subscribed_events : [],
      });
      setMessage({
        tone: 'success',
        title: 'Webhook configuration saved',
        body: 'Destination, enabled state, and event subscriptions were updated.',
      });
      await loadWebhookState();
    } catch (error: any) {
      setMessage({
        tone: 'critical',
        title: 'Failed to save webhook configuration',
        body: error?.response?.data?.detail || error?.message || 'The webhook configuration could not be updated.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    setMessage(null);
    try {
      await agentApi.sendWebhookTest();
      setMessage({
        tone: 'success',
        title: 'Test event sent',
        body: 'A webhook.test delivery was queued and recorded in recent deliveries.',
      });
      await loadWebhookState();
    } catch (error: any) {
      setMessage({
        tone: 'critical',
        title: 'Failed to send test event',
        body: error?.response?.data?.detail || error?.message || 'The test delivery could not be sent.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleRotateSecret = async () => {
    setRotatingSecret(true);
    setMessage(null);
    setCopiedNewSecret(false);
    try {
      const response = await agentApi.rotateWebhookSigningSecret();
      setNewSecret({
        value: response?.new_signing_secret || '',
        activatesAt: response?.activates_at || null,
      });
      setMessage({
        tone: 'success',
        title: 'Signing secret rotated',
        body: 'A new pending signing secret was generated. Copy it now and update your verifier before the overlap window ends.',
      });
      await loadWebhookState();
    } catch (error: any) {
      setMessage({
        tone: 'critical',
        title: 'Failed to rotate signing secret',
        body: error?.response?.data?.detail || error?.message || 'The signing secret could not be rotated.',
      });
    } finally {
      setRotatingSecret(false);
    }
  };

  const handleCopyNewSecret = async () => {
    if (!newSecret?.value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(newSecret.value);
      setCopiedNewSecret(true);
    } catch (error: any) {
      setMessage({
        tone: 'warning',
        title: 'Copy failed',
        body: error?.message || 'The signing secret could not be copied. Copy it manually from the field below.',
      });
    }
  };

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    setMessage(null);
    try {
      await agentApi.retryWebhookDelivery(deliveryId);
      setMessage({
        tone: 'success',
        title: 'Delivery retried',
        body: `Webhook delivery ${deliveryId} was re-sent.`,
      });
      await loadWebhookState();
    } catch (error: any) {
      setMessage({
        tone: 'critical',
        title: 'Retry failed',
        body: error?.response?.data?.detail || error?.message || 'The webhook delivery could not be retried.',
      });
    } finally {
      setRetryingId(null);
    }
  };

  const summary = config?.delivery_summary_24h ?? {
    total: 0,
    succeeded: 0,
    failed: 0,
    retrying: 0,
    success_rate: 0,
    last_delivery_at: null,
  };
  const webhookState = deriveWebhookState(loading, configUnavailable, config);
  const subscribedCount = form.subscribedEvents.length;
  const managedReceiverUrl = config?.managed_receiver_url || null;
  const currentSecretLast4 = config?.signing_secret_last4 || null;
  const pendingSecretLast4 =
    config?.pending_signing_secret_last4 || (newSecret?.value ? newSecret.value.slice(-4) : null);
  const pendingSecretActivatesAt = config?.pending_secret_activates_at || newSecret?.activatesAt || null;
  const formattedPendingActivation = pendingSecretActivatesAt ? new Date(pendingSecretActivatesAt).toLocaleString() : null;

  const availableEvents = useMemo(
    () => catalog.filter((item) => item.event_type !== 'webhook.test'),
    [catalog],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Webhook deliveries"
        description="Configure destination, manage event subscriptions, send test events, and inspect delivery health."
        badge={<StatusBadge tone={webhookState.tone}>{webhookState.label}</StatusBadge>}
        meta={
          loading && !config && !configUnavailable ? (
            <StatusBadge tone="neutral">Loading webhook configuration</StatusBadge>
          ) : config?.last_test_at ? (
            <StatusBadge tone={config.last_test_status === 'delivered' ? 'success' : config.last_test_status ? 'warning' : 'neutral'}>
              Last test {new Date(config.last_test_at).toLocaleString()}
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">No test sent yet</StatusBadge>
          )
        }
        actions={
          <>
            <button
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => void handleSendTest()}
              disabled={sendingTest || configUnavailable || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{sendingTest ? 'Sending…' : 'Send test'}</span>
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving…' : 'Save configuration'}</span>
            </button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {message ? (
          <InlineNotice tone={message.tone} title={message.title}>
            {message.body}
          </InlineNotice>
        ) : null}

        {newSecret?.value ? (
          <InlineNotice
            tone="success"
            title="New signing secret"
            action={
              <button
                onClick={() => void handleCopyNewSecret()}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                {copiedNewSecret ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedNewSecret ? 'Copied' : 'Copy'}</span>
              </button>
            }
          >
            <p>Copy this secret now. It will not be shown in full again.</p>
            <code className="mt-3 block overflow-x-auto rounded-xl border border-emerald-200 bg-white px-3 py-3 font-mono text-sm text-slate-800">
              {newSecret.value}
            </code>
            <p className="mt-2 text-sm">
              It becomes active {newSecret.activatesAt ? new Date(newSecret.activatesAt).toLocaleString() : 'after the overlap window'}.
            </p>
            <p className="mt-2 text-sm">
              If you lose this value, the portal cannot reveal it again. Generate a new one by rotating the signing secret again.
            </p>
          </InlineNotice>
        ) : null}

        {configUnavailable ? (
          <InlineNotice tone="warning" title="Webhook data is temporarily unavailable">
            The portal could not load the webhook configuration feed. Deliveries and controls below reflect only the data that responded successfully.
          </InlineNotice>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Configuration"
            value={webhookState.label}
            hint={
              loading && !config && !configUnavailable
                ? 'Loading webhook configuration'
                : configUnavailable
                  ? 'Webhook API unavailable'
                  : form.destinationUrl
                    ? 'Destination configured'
                    : 'Destination missing'
            }
            icon={<Webhook className="h-5 w-5" />}
            tone={
              webhookState.tone === 'success'
                ? 'success'
                : webhookState.tone === 'warning'
                  ? 'warning'
                  : webhookState.tone === 'neutral'
                    ? 'neutral'
                    : 'info'
            }
          />
          <MetricCard
            label="Subscribed events"
            value={loading && !config && !configUnavailable ? 'Checking' : configUnavailable ? 'Unavailable' : subscribedCount.toString()}
            hint={
              loading && !config && !configUnavailable
                ? 'Loading webhook configuration'
                : configUnavailable
                  ? 'Webhook API unavailable'
                  : 'Current production subscriptions'
            }
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone={loading && !config && !configUnavailable ? 'neutral' : configUnavailable ? 'neutral' : subscribedCount > 0 ? 'info' : 'warning'}
          />
          <MetricCard
            label="24h success rate"
            value={loading && !config && !configUnavailable ? 'Checking' : configUnavailable ? 'Unavailable' : `${summary.success_rate}%`}
            hint={
              loading && !config && !configUnavailable
                ? 'Loading delivery summary'
                : configUnavailable
                  ? 'Webhook API unavailable'
                  : `${summary.total} deliveries in the last 24 hours`
            }
            icon={<Shield className="h-5 w-5" />}
            tone={
              loading && !config && !configUnavailable
                ? 'neutral'
                : configUnavailable
                  ? 'neutral'
                  : summary.total === 0
                    ? 'neutral'
                    : summary.success_rate >= 95
                      ? 'success'
                      : 'warning'
            }
          />
          <MetricCard
            label="Retrying deliveries"
            value={loading && !config && !configUnavailable ? 'Checking' : configUnavailable ? 'Unavailable' : summary.retrying.toString()}
            hint={
              loading && !config && !configUnavailable
                ? 'Loading delivery summary'
                : configUnavailable
                  ? 'Webhook API unavailable'
                  : summary.last_delivery_at
                    ? `Last delivery ${new Date(summary.last_delivery_at).toLocaleString()}`
                    : 'No delivery history yet'
            }
            icon={<RotateCcw className="h-5 w-5" />}
            tone={loading && !config && !configUnavailable ? 'neutral' : configUnavailable ? 'neutral' : summary.retrying > 0 ? 'warning' : 'neutral'}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Endpoint configuration"
              description="Define the HTTPS destination and the event types this agent should receive."
            />
            <div className="mt-5 space-y-4">
              {managedReceiverUrl ? (
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--portal-fg)]">Pivota-managed receiver</p>
                      <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">
                        Use this hosted receiver to validate delivery and keep webhook health active before you switch to your own endpoint.
                      </p>
                      <code className="mt-3 block overflow-x-auto rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-xs text-[var(--portal-fg)]">
                        {managedReceiverUrl}
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          enabled: true,
                          destinationUrl: managedReceiverUrl,
                        }))
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                    >
                      <Webhook className="h-4 w-4" />
                      <span>Use managed receiver</span>
                    </button>
                  </div>
                </div>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Destination URL</span>
                <input
                  type="url"
                  value={form.destinationUrl}
                  onChange={(event) => setForm((current) => ({ ...current, destinationUrl: event.target.value }))}
                  placeholder="https://your-domain.com/webhooks/pivota"
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--portal-fg)]">Enable production deliveries</p>
                  <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">
                    Deliveries are sent only when a destination URL is present and production delivery is enabled.
                  </p>
                </div>
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader
              title="Signing secret"
              description="Verify incoming webhook signatures using X-Pivota-Timestamp and X-Pivota-Signature."
            />
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Current active secret</p>
                <p className="mt-3 font-mono text-sm text-[var(--portal-fg)]">
                  {currentSecretLast4 ? `••••${currentSecretLast4}` : 'No signing secret provisioned yet'}
                </p>
                <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                  {formattedPendingActivation
                    ? `This secret continues verifying deliveries until ${formattedPendingActivation}.`
                    : 'This is the secret currently used to verify incoming webhook deliveries.'}
                </p>
              </div>
              {pendingSecretLast4 ? (
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Pending secret</p>
                  <p className="mt-3 font-mono text-sm text-[var(--portal-fg)]">••••{pendingSecretLast4}</p>
                  <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                    {formattedPendingActivation
                      ? `This secret becomes active at ${formattedPendingActivation}.`
                      : 'A pending signing secret exists but its activation time is not available.'}
                  </p>
                  {newSecret?.value ? (
                    <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                      The full value is shown once above. Copy it before you leave this page.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                      Only the last 4 characters are shown here. The full value is only returned once when you rotate it. If it was not saved, rotate again to generate a new secret.
                    </p>
                  )}
                </div>
              ) : null}
              <button
                onClick={() => void handleRotateSecret()}
                disabled={rotatingSecret}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{rotatingSecret ? 'Rotating…' : 'Rotate signing secret'}</span>
              </button>
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm text-[var(--portal-fg-muted)]">
                Rotating creates a new pending secret immediately, keeps the current active secret valid during the overlap window, and then promotes the new secret automatically.
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                The portal never stores a re-openable copy of the full signing secret. After this page is dismissed or refreshed, only masked last-4 values remain visible.
              </div>
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm text-[var(--portal-fg-muted)]">
                Signatures are computed as HMAC-SHA256 of <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">{'${timestamp}.${raw_body}'}</code>.
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="p-5">
          <SectionHeader
            title="Event subscriptions"
            description="Webhook event categories prioritized for order flow and API failure visibility."
            action={
              <Link
                href="/docs?tab=api"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>View webhook docs</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {availableEvents.length === 0 ? (
              <EmptyState
                icon={<Webhook className="h-5 w-5" />}
                title="Event catalog unavailable"
                description="The event catalog could not be loaded from the webhook API."
              />
            ) : (
              availableEvents.map((event) => (
                <label
                  key={event.event_type}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
                >
                  <input
                    type="checkbox"
                    checked={form.subscribedEvents.includes(event.event_type)}
                    onChange={() => handleToggleEvent(event.event_type)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm text-[var(--portal-fg)]">{event.event_type}</p>
                      {event.category ? <StatusBadge tone="neutral">{event.category}</StatusBadge> : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">{event.description || 'No description available.'}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[var(--portal-border)] px-5 py-4">
            <SectionHeader
              title="Recent deliveries"
              description="Latest delivery attempts with retry status, latency, and destination response."
            />
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : deliveriesUnavailable ? (
              <EmptyState
                icon={<Webhook className="h-5 w-5" />}
                title="Webhook deliveries unavailable"
                description="The delivery feed could not be loaded from the webhook API."
              />
            ) : deliveries.length === 0 ? (
              <EmptyState
                icon={<Webhook className="h-5 w-5" />}
                title="No webhook deliveries yet"
                description="Configure a destination and send a test event to create the first delivery record."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--portal-border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">
                      <th className="px-3 py-3 font-semibold">Event</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Attempts</th>
                      <th className="px-3 py-3 font-semibold">Latency</th>
                      <th className="px-3 py-3 font-semibold">Created</th>
                      <th className="px-3 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.delivery_id} className="border-b border-[var(--portal-border)] last:border-b-0">
                        <td className="px-3 py-4">
                          <div>
                            <p className="font-mono text-sm text-[var(--portal-fg)]">{delivery.event_type}</p>
                            <p className="mt-1 text-xs text-[var(--portal-fg-subtle)]">{delivery.delivery_id}</p>
                            {delivery.last_error ? (
                              <p className="mt-2 text-xs text-rose-600">{delivery.last_error}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge
                            tone={
                              delivery.status === 'delivered'
                                ? 'success'
                                : delivery.status === 'retrying'
                                  ? 'warning'
                                  : 'critical'
                            }
                          >
                            {delivery.status}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-4 tabular-nums text-[var(--portal-fg)]">{delivery.attempt_count}</td>
                        <td className="px-3 py-4 tabular-nums text-[var(--portal-fg)]">
                          {delivery.latency_ms !== null ? `${delivery.latency_ms}ms` : 'Unavailable'}
                        </td>
                        <td className="px-3 py-4 text-[var(--portal-fg-muted)]">
                          {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'Unknown'}
                        </td>
                        <td className="px-3 py-4">
                          {delivery.status !== 'delivered' ? (
                            <button
                              onClick={() => void handleRetry(delivery.delivery_id)}
                              disabled={retryingId === delivery.delivery_id}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>{retryingId === delivery.delivery_id ? 'Retrying…' : 'Retry'}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[var(--portal-fg-subtle)]">Delivered</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
