'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, BarChart3, Gauge, RefreshCw, ShoppingCart } from 'lucide-react';
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

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    void loadAnalytics(timeRange);
  }, [router, timeRange]);

  const loadAnalytics = async (hours: number) => {
    try {
      setLoading(true);
      const [summaryResponse, timelineResponse] = await Promise.all([
        agentApi.getMetricsSummary(),
        agentApi.getAgentTimeline(hours),
      ]);

      setSummary(summaryResponse);
      setTimeline(timelineResponse?.timeline || []);
    } catch (error) {
      console.error('Failed to load API usage page:', error);
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
      ? 'Traffic and conversion telemetry across your current integration footprint.'
      : 'Endpoint traffic, response performance, and recent request patterns across your integration.';

  const topEndpoints = summary?.top_endpoints ?? [];
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Requests"
            value={(summary?.overview?.requests_last_24h ?? 0).toLocaleString()}
            hint="Last 24 hours"
            icon={<Activity className="h-5 w-5" />}
            tone="info"
          />
          <MetricCard
            label="Success rate"
            value={`${summary?.performance?.success_rate_24h ?? 0}%`}
            hint="Current production traffic"
            icon={<Gauge className="h-5 w-5" />}
            tone={(summary?.performance?.success_rate_24h ?? 0) >= 99 ? 'success' : 'warning'}
          />
          <MetricCard
            label="Average latency"
            value={`${summary?.performance?.avg_response_time_ms ?? 0}ms`}
            hint="P95 will replace this when available"
            icon={<BarChart3 className="h-5 w-5" />}
            tone={(summary?.performance?.avg_response_time_ms ?? 0) > 800 ? 'warning' : 'neutral'}
          />
          <MetricCard
            label="Completed orders"
            value={(summary?.orders?.total_paid_orders ?? 0).toLocaleString()}
            hint="All-time completed flow count"
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="success"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Performance timeline"
              description="Request volume and average response time across the selected window."
            />
            <div className="mt-5 space-y-3">
              {loading ? (
                [0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
              ) : timeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] px-4 py-8 text-center text-sm text-[var(--portal-fg-muted)]">
                  No timeline data available for this range.
                </div>
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
              {loading ? (
                [0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)
              ) : topEndpoints.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] px-4 py-8 text-center text-sm text-[var(--portal-fg-muted)]">
                  No endpoint activity available yet.
                </div>
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
        </div>
      </div>
    </div>
  );
}
