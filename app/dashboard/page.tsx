'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  RefreshCw,
  ScrollText,
  Server,
  Webhook,
} from 'lucide-react';
import ApiKeyModal from '@/components/ApiKeyModal';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

interface AgentInfo {
  name?: string;
  email?: string;
  last_activity?: string;
}

function formatShortDate(value: string | undefined) {
  if (!value) {
    return 'No recent traffic';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [windowDays, setWindowDays] = useState(1);
  const [summary, setSummary] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = localStorage.getItem('agent_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setAgentInfo({
          name: parsed.name,
          email: parsed.email,
          last_activity: parsed.last_activity,
        });
      } catch {
        setAgentInfo(null);
      }
    }

    void loadDashboard(windowDays);
  }, [router, windowDays]);

  const loadDashboard = async (days: number) => {
    setLoading(true);

    try {
      const agentId = localStorage.getItem('agent_id');
      const [summaryResult, activityResult, funnelResult, profileResult, agentDetailsResult] = await Promise.allSettled([
        agentApi.getMetricsSummary(),
        agentApi.getRecentActivity(8),
        agentApi.getConversionFunnel(days),
        agentApi.getProfile(),
        agentId ? agentApi.getAgentDetails(agentId) : Promise.resolve(null),
      ]);

      const nextUnavailableSources: string[] = [];

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        console.error('Failed to load summary metrics:', summaryResult.reason);
        setSummary(null);
        nextUnavailableSources.push('summary metrics');
      }

      if (activityResult.status === 'fulfilled') {
        setRecentActivity(activityResult.value?.activities || []);
      } else {
        console.error('Failed to load recent activity:', activityResult.reason);
        setRecentActivity([]);
        nextUnavailableSources.push('recent events');
      }

      if (funnelResult.status === 'fulfilled') {
        setFunnel(funnelResult.value);
      } else {
        console.error('Failed to load checkout flow telemetry:', funnelResult.reason);
        setFunnel(null);
        nextUnavailableSources.push('checkout flow');
      }

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value?.agent || null);
      } else {
        console.error('Failed to load profile state:', profileResult.reason);
        setProfile(null);
        nextUnavailableSources.push('webhook configuration');
      }

      if (agentDetailsResult.status === 'fulfilled' && agentDetailsResult.value?.agent) {
        setAgentInfo((current) => ({
          name: agentDetailsResult.value.agent.agent_name || agentDetailsResult.value.agent.name || current?.name,
          email: agentDetailsResult.value.agent.owner_email || agentDetailsResult.value.agent.email || current?.email,
          last_activity: agentDetailsResult.value.agent.last_active || current?.last_activity,
        }));
      } else if (agentDetailsResult.status === 'rejected') {
        console.error('Failed to load agent details:', agentDetailsResult.reason);
      }

      setUnavailableSources(nextUnavailableSources);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(windowDays);
  };

  const summaryUnavailable = unavailableSources.includes('summary metrics');
  const activityUnavailable = unavailableSources.includes('recent events');
  const funnelUnavailable = unavailableSources.includes('checkout flow');
  const profileUnavailable = unavailableSources.includes('webhook configuration');
  const requestCount = summary?.overview?.requests_last_24h ?? null;
  const successRate = summary?.performance?.success_rate_24h ?? null;
  const avgLatency = summary?.performance?.avg_response_time_ms ?? null;
  const ordersCompleted = funnel?.orders_completed ?? null;
  const topEndpoints = summary?.top_endpoints ?? [];
  const webhookConfigured = profileUnavailable ? null : Boolean(profile?.webhook_url);
  const latestEvent = activityUnavailable ? null : recentActivity[0];
  const errorEvents = activityUnavailable ? [] : recentActivity.filter((event) => (event.status_code ?? 0) >= 400);

  const attentionItems = useMemo(() => {
    const items: Array<{ title: string; body: string; tone: 'critical' | 'warning' | 'info'; href: string }> = [];

    if (unavailableSources.length > 0) {
      items.push({
        title: 'Some production data is unavailable',
        body: `Unable to load ${unavailableSources.join(', ')}. Refresh to retry those feeds.`,
        tone: 'warning',
        href: '/dashboard',
      });
    }

    if (!activityUnavailable && errorEvents.length > 0) {
      const first = errorEvents[0];
      items.push({
        title: `${errorEvents.length} recent request failure${errorEvents.length > 1 ? 's' : ''}`,
        body: `${first.method} ${first.endpoint} returned ${first.status_code}.`,
        tone: 'critical',
        href: '/logs',
      });
    }

    if (!profileUnavailable && !webhookConfigured) {
      items.push({
        title: 'Webhook setup incomplete',
        body: 'No production webhook URL is configured yet.',
        tone: 'warning',
        href: '/webhooks',
      });
    }

    if (!summaryUnavailable && avgLatency !== null && avgLatency > 800) {
      items.push({
        title: 'Latency warning',
        body: `Average latency increased to ${avgLatency}ms over the last 24 hours.`,
        tone: 'warning',
        href: '/api-usage',
      });
    }

    if (!summaryUnavailable && requestCount === 0) {
      items.push({
        title: 'Traffic has been idle',
        body: 'No API requests were observed in the last 24 hours.',
        tone: 'info',
        href: '/docs?tab=quickstart',
      });
    } else if (!summaryUnavailable && successRate !== null && successRate < 99) {
      items.push({
        title: 'Elevated error rate',
        body: `${Math.max(0, 100 - successRate).toFixed(2)}% of requests did not complete successfully in the last 24 hours.`,
        tone: 'warning',
        href: '/api-usage',
      });
    }

    return items.slice(0, 4);
  }, [activityUnavailable, avgLatency, errorEvents, profileUnavailable, requestCount, successRate, summaryUnavailable, unavailableSources, webhookConfigured]);

  const healthTone = attentionItems.some((item) => item.tone === 'critical')
    ? 'critical'
    : attentionItems.length > 0
      ? 'warning'
      : 'success';

  const healthTitle =
    unavailableSources.length > 0
      ? 'Production data partially unavailable'
      : healthTone === 'success'
      ? 'All systems operational'
      : healthTone === 'critical'
        ? 'Attention required'
        : 'Monitor production health';

  const initiated = funnel?.orders_initiated ?? null;
  const attempted = funnel?.payment_attempted ?? null;
  const completed = funnel?.orders_completed ?? null;

  const flowRows = [
    { label: 'Orders initiated', value: initiated, width: 100 },
    {
      label: 'Payment attempted',
      value: attempted,
      width: initiated && attempted !== null && initiated > 0 ? Math.max(8, Math.round((attempted / initiated) * 100)) : 0,
    },
    {
      label: 'Orders completed',
      value: completed,
      width: initiated && completed !== null && initiated > 0 ? Math.max(8, Math.round((completed / initiated) * 100)) : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Overview"
        description="Production health, key actions, and the operational surfaces external developers need first."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        meta={
          <>
            <StatusBadge tone={healthTone}>{healthTitle}</StatusBadge>
            <StatusBadge tone="neutral">Last activity {activityUnavailable ? 'Unavailable' : latestEvent ? formatShortDate(latestEvent.timestamp) : agentInfo?.last_activity || 'Unknown'}</StatusBadge>
          </>
        }
        actions={
          <>
            <select
              value={windowDays}
              onChange={(event) => setWindowDays(Number(event.target.value))}
              className="rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm text-[var(--portal-fg)]"
            >
              <option value={1}>Flow window: 24h</option>
              <option value={7}>Flow window: 7d</option>
            </select>
            <button
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {unavailableSources.length > 0 ? (
          <InlineNotice tone="warning" title="Some production data is temporarily unavailable">
            The portal could not load {unavailableSources.join(', ')}. The visible data below reflects only the feeds that responded successfully.
          </InlineNotice>
        ) : null}

        <SurfaceCard className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={healthTone}>
                  {healthTone === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {healthTitle}
                </StatusBadge>
                <StatusBadge tone="neutral">{agentInfo?.email || 'Developer workspace'}</StatusBadge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--portal-fg)]">Production status</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--portal-fg-muted)]">
                {activityUnavailable
                  ? 'Recent request activity is temporarily unavailable. Use the docs and retry loading telemetry after your connection stabilizes.'
                  : latestEvent
                  ? `Latest request ${latestEvent.method} ${latestEvent.endpoint} was observed at ${formatShortDate(latestEvent.timestamp)}.`
                  : 'No recent production events are available yet. Use the docs and test request entry points to validate your setup.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--portal-fg-subtle)]">
                <span>Environment: Production</span>
                <span>•</span>
                <span>Webhook: {profileUnavailable ? 'Unavailable' : webhookConfigured ? 'Configured' : 'Missing'}</span>
                <span>•</span>
                <span>{requestCount === null ? 'Request volume unavailable' : `${requestCount.toLocaleString()} requests in the last 24h`}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <KeyRound className="h-4 w-4" />
                <span>Manage API keys</span>
              </button>
              <Link
                href="/docs?tab=quickstart"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-2.5 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
              >
                <span>View docs</span>
              </Link>
              <Link
                href="/logs"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-[var(--portal-accent)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-accent-strong)]"
              >
                <ScrollText className="h-4 w-4" />
                <span>Open logs</span>
              </Link>
              <Link
                href="/docs?tab=api"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-[var(--portal-accent)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>Run test request</span>
              </Link>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <SectionHeader
            title="Attention needed today"
            description="Issues are derived from recent request failures, latency, traffic, and webhook configuration."
          />
          <div className="mt-5 space-y-3">
            {loading ? (
              [0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
            ) : attentionItems.length === 0 ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">All systems operational</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    No critical issues were detected across requests, webhook setup, or checkout flow.
                  </p>
                </div>
              </div>
            ) : (
              attentionItems.map((item) => (
                <Link
                  key={`${item.title}-${item.href}`}
                  href={item.href}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 hover:border-[var(--portal-border-strong)] hover:bg-white"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={item.tone}>{item.tone === 'critical' ? 'Critical' : item.tone === 'warning' ? 'Warning' : 'Info'}</StatusBadge>
                      <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">{item.body}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--portal-fg-subtle)]" />
                </Link>
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="API requests"
            value={requestCount === null ? 'Unavailable' : requestCount.toLocaleString()}
            hint={summaryUnavailable ? 'Summary metrics unavailable' : 'Last 24 hours'}
            tone={summaryUnavailable ? 'neutral' : 'info'}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            label="Success rate"
            value={successRate === null ? 'Unavailable' : `${successRate}%`}
            hint={summaryUnavailable ? 'Summary metrics unavailable' : 'Current production success rate'}
            tone={summaryUnavailable ? 'neutral' : successRate >= 99 ? 'success' : 'warning'}
            icon={<Server className="h-5 w-5" />}
          />
          <MetricCard
            label="Average latency"
            value={avgLatency === null ? 'Unavailable' : `${avgLatency}ms`}
            hint={summaryUnavailable ? 'Summary metrics unavailable' : 'P95 will replace this when backend percentiles are available'}
            tone={summaryUnavailable ? 'neutral' : avgLatency > 800 ? 'warning' : 'neutral'}
            icon={<Clock3 className="h-5 w-5" />}
          />
          <MetricCard
            label="Orders completed"
            value={ordersCompleted === null ? 'Unavailable' : ordersCompleted.toLocaleString()}
            hint={funnelUnavailable ? 'Checkout flow unavailable' : windowDays === 1 ? 'Last 24 hours' : 'Last 7 days'}
            tone={funnelUnavailable ? 'neutral' : 'success'}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="API activity"
              description="Top active endpoints and their recent request volume."
              action={
                <Link
                  href="/api-usage"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                >
                  <span>Inspect API usage</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="mt-5 space-y-3">
              {loading ? (
                [0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
              ) : summaryUnavailable ? (
                <EmptyState
                  icon={<Activity className="h-5 w-5" />}
                  title="API activity unavailable"
                  description="The request summary feed could not be loaded, so endpoint traffic is temporarily unavailable."
                />
              ) : topEndpoints.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] px-4 py-8 text-center text-sm text-[var(--portal-fg-muted)]">
                  No endpoint traffic has been recorded yet.
                </div>
              ) : (
                topEndpoints.slice(0, 5).map((endpoint: any) => (
                  <div
                    key={endpoint.endpoint}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-[var(--portal-fg)]">{endpoint.endpoint}</p>
                      <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">Live request volume from current summary metrics</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-lg font-semibold text-[var(--portal-fg)]">{endpoint.count ?? 0}</p>
                      <p className="text-xs text-[var(--portal-fg-subtle)]">requests</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader
              title="Webhook status"
              description="Setup-first webhook surface until delivery telemetry is promoted to a dedicated feed."
            />
            <div className="mt-5 space-y-3">
              {profileUnavailable ? (
                <EmptyState
                  icon={<Webhook className="h-5 w-5" />}
                  title="Webhook status unavailable"
                  description="The portal could not load your current webhook configuration. Refresh and retry once the profile feed is available."
                />
              ) : (
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-[var(--portal-accent)]" />
                    <p className="text-sm font-semibold text-[var(--portal-fg)]">
                      {webhookConfigured ? 'Webhook configured' : 'Webhook setup incomplete'}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                    {webhookConfigured
                      ? profile?.webhook_url
                      : 'No production webhook URL is configured yet. Add one before relying on asynchronous delivery.'}
                  </p>
                </div>
              )}
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm text-[var(--portal-fg-muted)]">
                Detailed retry and failure telemetry is still pending backend support. Use recent logs as the temporary operational surface.
              </div>
              <Link
                href="/webhooks"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>Review webhook setup</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Checkout flow"
              description="Current order-flow health using the selected flow window."
            />
            <div className="mt-5 space-y-4">
              {funnelUnavailable ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Checkout flow unavailable"
                  description="The order-flow telemetry feed could not be loaded for the selected window."
                />
              ) : (
                flowRows.map((row, index) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--portal-fg)]">{row.label}</span>
                      <span className="tabular-nums text-[var(--portal-fg-muted)]">{row.value ?? 'Unavailable'}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className={`h-2 rounded-full ${index === 0 ? 'bg-[var(--portal-accent)]' : index === 1 ? 'bg-sky-500' : 'bg-emerald-500'}`}
                        style={{ width: `${row.width}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader
              title="Recent events"
              description="Latest request activity with status code and response time."
              action={
                <Link
                  href="/logs"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                >
                  <span>Open logs</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="mt-5 space-y-3">
              {loading ? (
                [0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)
              ) : activityUnavailable ? (
                <EmptyState
                  icon={<ScrollText className="h-5 w-5" />}
                  title="Recent events unavailable"
                  description="The recent activity feed could not be loaded, so the temporary log surface is unavailable right now."
                />
              ) : recentActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] px-4 py-8 text-center text-sm text-[var(--portal-fg-muted)]">
                  Recent events will appear here as soon as production traffic starts flowing.
                </div>
              ) : (
                recentActivity.map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 lg:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={(event.status_code ?? 0) < 400 ? 'success' : 'critical'}>{event.status_code}</StatusBadge>
                        <p className="truncate font-mono text-sm text-[var(--portal-fg)]">
                          {event.method} {event.endpoint}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">{formatShortDate(event.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-lg font-semibold text-[var(--portal-fg)]">{event.response_time_ms}ms</p>
                      <p className="text-xs text-[var(--portal-fg-subtle)]">response time</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
    </div>
  );
}
