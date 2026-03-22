'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, BarChart3, Gauge, RefreshCw, ShoppingCart } from 'lucide-react';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

type PageMode = 'usage' | 'analytics';

export default function ApiUsagePage({
  mode = 'usage',
}: {
  mode?: PageMode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(24);
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [queryAnalytics, setQueryAnalytics] = useState<any>(null);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    void loadAnalytics(timeRange);
  }, [router, timeRange]);

  const loadAnalytics = async (hours: number) => {
    setLoading(true);

    try {
      const days = Math.max(1, Math.ceil(hours / 24));
      const [summaryResult, timelineResult, analyticsResult, usageResult, funnelResult, queryResult] = await Promise.allSettled([
        agentApi.getMetricsSummary(),
        agentApi.getAgentTimeline(hours),
        agentApi.getAgentAnalytics(days),
        agentApi.getUsageLogs(25),
        agentApi.getConversionFunnel(days),
        agentApi.getQueryAnalytics(),
      ]);

      const nextUnavailable: string[] = [];

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        console.error('Failed to load usage summary:', summaryResult.reason);
        setSummary(null);
        nextUnavailable.push('summary metrics');
      }

      if (timelineResult.status === 'fulfilled') {
        setTimeline(timelineResult.value?.timeline || []);
      } else {
        console.error('Failed to load usage timeline:', timelineResult.reason);
        setTimeline([]);
        nextUnavailable.push('performance timeline');
      }

      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value?.analytics ?? analyticsResult.value ?? null);
      } else {
        console.error('Failed to load analytics rollup:', analyticsResult.reason);
        setAnalytics(null);
        nextUnavailable.push('analytics rollup');
      }

      if (usageResult.status === 'fulfilled') {
        setUsageLogs(usageResult.value?.logs || []);
      } else {
        console.error('Failed to load usage logs:', usageResult.reason);
        setUsageLogs([]);
        nextUnavailable.push('usage logs');
      }

      if (funnelResult.status === 'fulfilled') {
        setFunnel(funnelResult.value);
      } else {
        console.error('Failed to load funnel:', funnelResult.reason);
        setFunnel(null);
        nextUnavailable.push('checkout flow');
      }

      if (queryResult.status === 'fulfilled') {
        setQueryAnalytics(queryResult.value);
      } else {
        console.error('Failed to load query analytics:', queryResult.reason);
        setQueryAnalytics(null);
        nextUnavailable.push('query analytics');
      }

      setUnavailableSources(nextUnavailable);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics(timeRange);
  };

  const pageTitle = mode === 'analytics' ? 'Analytics' : 'API Usage';
  const pageDescription =
    mode === 'analytics'
      ? 'Traffic, order-flow, and query activity across your current developer integration.'
      : 'Endpoint traffic, latency, recent request logs, and supporting query telemetry.';

  const topEndpoints = analytics?.top_endpoints ?? summary?.top_endpoints ?? [];
  const peakRequests = useMemo(
    () => Math.max(1, ...topEndpoints.map((endpoint: any) => endpoint.count ?? 0)),
    [topEndpoints],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        meta={<StatusBadge tone="neutral">Window {timeRange}h</StatusBadge>}
        actions={
          <>
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(Number(event.target.value))}
              className="rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm text-[var(--portal-fg)]"
            >
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 72 hours</option>
              <option value={168}>Last 7 days</option>
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
          <InlineNotice tone="warning" title="Some analytics data is temporarily unavailable">
            The portal could not load {unavailableSources.join(', ')}. Visible usage data below reflects only the feeds that responded successfully.
          </InlineNotice>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Requests"
            value={summary ? (summary?.overview?.requests_last_24h ?? 0).toLocaleString() : 'Unavailable'}
            hint={summary ? 'Last 24 hours' : 'Summary metrics unavailable'}
            icon={<Activity className="h-5 w-5" />}
            tone={summary ? 'info' : 'neutral'}
          />
          <MetricCard
            label="Success rate"
            value={summary ? `${summary?.performance?.success_rate_24h ?? 0}%` : 'Unavailable'}
            hint={summary ? 'Current production traffic' : 'Summary metrics unavailable'}
            icon={<Gauge className="h-5 w-5" />}
            tone={summary ? ((summary?.performance?.success_rate_24h ?? 0) >= 99 ? 'success' : 'warning') : 'neutral'}
          />
          <MetricCard
            label="Average latency"
            value={summary ? `${summary?.performance?.avg_response_time_ms ?? 0}ms` : 'Unavailable'}
            hint={summary ? 'Current average latency' : 'Summary metrics unavailable'}
            icon={<BarChart3 className="h-5 w-5" />}
            tone={summary ? ((summary?.performance?.avg_response_time_ms ?? 0) > 800 ? 'warning' : 'neutral') : 'neutral'}
          />
          <MetricCard
            label="Completed orders"
            value={funnel ? (funnel?.orders_completed ?? 0).toLocaleString() : 'Unavailable'}
            hint={funnel ? `${funnel?.conversion_rate ?? 0}% conversion rate` : 'Checkout flow unavailable'}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone={funnel ? 'success' : 'neutral'}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Performance timeline"
              description="Request volume and average response time across the selected window."
            />
            <div className="mt-5 space-y-3">
              {loading ? (
                [0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
              ) : timeline.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Performance timeline unavailable"
                  description="The selected timeline feed could not be loaded or has no data for this range."
                />
              ) : (
                timeline.map((row: any) => (
                  <div
                    key={row.hour}
                    className="grid gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-3 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--portal-fg)]">{new Date(row.hour).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-[var(--portal-fg-subtle)]">Window rollup</p>
                    </div>
                    <div className="text-sm text-[var(--portal-fg-muted)]">
                      <p className="font-medium text-[var(--portal-fg)]">{row.total_requests}</p>
                      <p>Total requests</p>
                    </div>
                    <div className="text-sm text-[var(--portal-fg-muted)]">
                      <p className="font-medium text-[var(--portal-fg)]">{row.successful_requests}</p>
                      <p>Successful</p>
                    </div>
                    <div className="text-sm text-[var(--portal-fg-muted)]">
                      <p className="font-medium text-[var(--portal-fg)]">{row.avg_response_time_ms}ms</p>
                      <p>Average latency</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader
              title="Query activity"
              description="Derived MCP and product-query usage from the agent activity feed."
            />
            <div className="mt-5 space-y-3">
              {queryAnalytics?.status === 'error' || !queryAnalytics ? (
                <EmptyState
                  icon={<Activity className="h-5 w-5" />}
                  title="Query analytics unavailable"
                  description="Product search, inventory, and pricing query metrics could not be loaded."
                />
              ) : (
                [
                  { label: 'Product searches', value: queryAnalytics.product_searches, change: queryAnalytics.product_searches_change },
                  { label: 'Inventory checks', value: queryAnalytics.inventory_checks, change: queryAnalytics.inventory_checks_change },
                  { label: 'Price queries', value: queryAnalytics.price_queries, change: queryAnalytics.price_queries_change },
                ].map((row) => (
                  <div key={row.label} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--portal-fg)]">{row.label}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--portal-fg)]">{row.value}</p>
                      </div>
                      <StatusBadge tone="neutral">{row.change}% change</StatusBadge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Top endpoints"
              description="Most active request paths during the current reporting window."
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
              {topEndpoints.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-5 w-5" />}
                  title="Endpoint activity unavailable"
                  description="The endpoint activity feed could not be loaded or has no data yet."
                />
              ) : (
                topEndpoints.map((endpoint: any) => {
                  const count = endpoint.count ?? 0;
                  const width = `${Math.max(8, Math.round((count / peakRequests) * 100))}%`;

                  return (
                    <div key={endpoint.endpoint} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-sm text-[var(--portal-fg)]">{endpoint.endpoint}</p>
                          <p className="mt-1 text-xs text-[var(--portal-fg-subtle)]">Live traffic distribution</p>
                        </div>
                        <div className="text-right">
                          <p className="tabular-nums text-lg font-semibold text-[var(--portal-fg)]">{count}</p>
                          <p className="text-xs text-[var(--portal-fg-subtle)]">requests</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-[var(--portal-accent)]" style={{ width }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader
              title="Recent request logs"
              description="Dense request rows from the live usage-log feed."
            />
            <div className="mt-5">
              {usageLogs.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-5 w-5" />}
                  title="Usage logs unavailable"
                  description="Recent request rows could not be loaded from the usage log feed."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--portal-border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">
                        <th className="px-3 py-3 font-semibold">Method</th>
                        <th className="px-3 py-3 font-semibold">Endpoint</th>
                        <th className="px-3 py-3 font-semibold">Status</th>
                        <th className="px-3 py-3 font-semibold">Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageLogs.slice(0, 12).map((row: any) => (
                        <tr key={row.id} className="border-b border-[var(--portal-border)] last:border-b-0">
                          <td className="px-3 py-3 font-mono text-[var(--portal-fg)]">{row.method}</td>
                          <td className="px-3 py-3 font-mono text-[var(--portal-fg)]">{row.endpoint}</td>
                          <td className="px-3 py-3">
                            <StatusBadge tone={(row.status_code ?? 0) < 400 ? 'success' : 'critical'}>{row.status_code}</StatusBadge>
                          </td>
                          <td className="px-3 py-3 tabular-nums text-[var(--portal-fg)]">{row.response_time_ms}ms</td>
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
    </div>
  );
}
