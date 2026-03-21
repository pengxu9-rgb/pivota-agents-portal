'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, ScrollText } from 'lucide-react';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

export default function LogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsUnavailable, setEventsUnavailable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    void loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await agentApi.getRecentActivity(25);
      setEvents(response?.activities || []);
      setEventsUnavailable(false);
    } catch (error) {
      console.error('Failed to load recent events:', error);
      setEvents([]);
      setEventsUnavailable(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Recent logs"
        description="Short-horizon request activity used as the temporary operational log surface."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        actions={
          <button
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {eventsUnavailable ? (
          <InlineNotice tone="warning" title="Recent activity is temporarily unavailable">
            The portal could not load the recent request activity feed. Retry loading when production telemetry is available again.
          </InlineNotice>
        ) : null}

        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[var(--portal-border)] px-5 py-4">
            <SectionHeader
              title="Recent events"
              description="Method, path, status code, and latency from the latest observed requests."
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
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : eventsUnavailable ? (
              <EmptyState
                icon={<ScrollText className="h-5 w-5" />}
                title="Recent events unavailable"
                description="The recent activity feed could not be loaded, so the temporary operational log surface is unavailable."
              />
            ) : events.length === 0 ? (
              <EmptyState
                icon={<ScrollText className="h-5 w-5" />}
                title="No recent events"
                description="Requests will appear here as soon as your integration begins sending traffic."
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
                      <th className="px-3 py-3 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const healthy = (event.status_code ?? 0) < 400;
                      return (
                        <tr key={event.id} className="border-b border-[var(--portal-border)] last:border-b-0">
                          <td className="px-3 py-3 font-mono text-[var(--portal-fg)]">{event.method}</td>
                          <td className="px-3 py-3 font-mono text-[var(--portal-fg)]">{event.endpoint}</td>
                          <td className="px-3 py-3">
                            <StatusBadge tone={healthy ? 'success' : 'critical'}>{event.status_code}</StatusBadge>
                          </td>
                          <td className="px-3 py-3 tabular-nums text-[var(--portal-fg)]">{event.response_time_ms}ms</td>
                          <td className="px-3 py-3 text-[var(--portal-fg-muted)]">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
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
