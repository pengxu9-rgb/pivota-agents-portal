'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RadioTower, RefreshCw } from 'lucide-react';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

export default function EndpointsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [developerEndpoints, setDeveloperEndpoints] = useState<any[]>([]);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    void loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [summaryResult, endpointsResult] = await Promise.allSettled([
        agentApi.getMetricsSummary(),
        agentApi.getDeveloperEndpoints(),
      ]);

      const nextUnavailable: string[] = [];

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        console.error('Failed to load endpoint summary:', summaryResult.reason);
        setSummary(null);
        nextUnavailable.push('endpoint activity');
      }

      if (endpointsResult.status === 'fulfilled') {
        setDeveloperEndpoints(Array.isArray(endpointsResult.value?.endpoints) ? endpointsResult.value.endpoints : []);
      } else {
        console.error('Failed to load runtime endpoint registry:', endpointsResult.reason);
        setDeveloperEndpoints([]);
        nextUnavailable.push('runtime endpoint registry');
      }

      setUnavailableSources(nextUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const liveCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const endpoint of summary?.top_endpoints ?? []) {
      counts.set(endpoint.endpoint, endpoint.count ?? 0);
    }
    return counts;
  }, [summary]);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Endpoints"
        description="Inspect the live developer endpoint registry without mixing in channel standards or internal protocol layers."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        meta={<StatusBadge tone="neutral">{developerEndpoints.length} endpoints</StatusBadge>}
        actions={
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {unavailableSources.length > 0 ? (
          <InlineNotice tone="warning" title="Some endpoint data is temporarily unavailable">
            The portal could not load {unavailableSources.join(', ')}. Visible content below reflects only the feeds that responded successfully.
          </InlineNotice>
        ) : null}

        <SurfaceCard className="p-5">
          <SectionHeader
            title="Active endpoints"
            description="Developer-callable API surfaces with auth mode, purpose, and current request counts."
            action={
              <Link
                href="/docs?tab=reference"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>Open API reference</span>
              </Link>
            }
          />
          <div className="mt-5 grid gap-3">
            {developerEndpoints.length === 0 ? (
              <EmptyState
                icon={<RadioTower className="h-5 w-5" />}
                title="Endpoint registry unavailable"
                description="The runtime-derived developer endpoint registry could not be loaded."
              />
            ) : (
              developerEndpoints.map((endpoint: any) => {
                const count = liveCounts.get(endpoint.path) ?? liveCounts.get(endpoint.path.replace('/v2/', '/v1/')) ?? 0;
                const authMode = endpoint.path.startsWith('/agent/v1') || endpoint.path.startsWith('/agent/v2') ? 'X-API-Key' : 'JWT / internal';
                return (
                  <div
                    key={`${endpoint.method}-${endpoint.path}`}
                    className="grid gap-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 lg:grid-cols-[0.8fr_2fr_0.8fr]"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={endpoint.method === 'GET' ? 'success' : 'info'}>{endpoint.method}</StatusBadge>
                      <span className="text-xs text-[var(--portal-fg-subtle)]">{authMode}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-[var(--portal-fg)]">{endpoint.path}</p>
                      <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">{endpoint.desc || 'Developer endpoint'}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-lg font-semibold text-[var(--portal-fg)]">{count}</p>
                      <p className="text-xs text-[var(--portal-fg-subtle)]">recent calls</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
