'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RadioTower, RefreshCw, Shield } from 'lucide-react';
import ConsoleTabs from '@/components/portal/ConsoleTabs';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

interface Protocol {
  protocol_name: string;
  version: string;
  status: string;
  last_verified_at: string | null;
  created_at: string;
  endpoints?: Record<string, unknown>;
}

export default function EndpointsPage({
  mode = 'endpoints',
}: {
  mode?: 'endpoints' | 'protocols';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [developerEndpoints, setDeveloperEndpoints] = useState<any[]>([]);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'adapters'>(mode === 'protocols' ? 'adapters' : 'active');

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
      const agentId = localStorage.getItem('agent_id');
      const [summaryResult, protocolsResult, endpointsResult] = await Promise.allSettled([
        agentApi.getMetricsSummary(),
        agentId ? agentApi.getProtocols(agentId) : Promise.resolve({ protocols: [] }),
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

      if (protocolsResult.status === 'fulfilled') {
        setProtocols(protocolsResult.value?.protocols || protocolsResult.value || []);
      } else {
        console.error('Failed to load protocol adapters:', protocolsResult.reason);
        setProtocols([]);
        nextUnavailable.push('protocol adapters');
      }

      if (endpointsResult.status === 'fulfilled') {
        setDeveloperEndpoints(endpointsResult.value?.endpoints || []);
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
        title={mode === 'protocols' ? 'Protocol adapters' : 'Endpoints'}
        description="Inspect the live developer endpoint registry and protocol adapters without mixing them into the Overview."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        meta={<StatusBadge tone="neutral">{protocols.length} adapters</StatusBadge>}
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

        <ConsoleTabs
          items={[
            { id: 'active', label: 'Active endpoints', icon: <RadioTower className="h-4 w-4" /> },
            { id: 'adapters', label: 'Protocol adapters', icon: <Shield className="h-4 w-4" /> },
          ]}
          activeId={selectedTab}
          onChange={(value) => setSelectedTab(value as 'active' | 'adapters')}
        />

        {selectedTab === 'active' ? (
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Active endpoints"
              description="Runtime-derived developer endpoints with auth mode, purpose, and current request counts."
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
        ) : (
          <SurfaceCard className="p-5">
            <SectionHeader
              title="Protocol adapters"
              description="Backend protocol capabilities surfaced with external-facing naming."
            />
            <div className="mt-5">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : protocols.length === 0 ? (
                <EmptyState
                  icon={<Shield className="h-5 w-5" />}
                  title="No protocol adapters configured"
                  description="No AP2, ACP, or related adapters are currently exposed for this agent."
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {protocols.map((protocol) => (
                    <div
                      key={protocol.protocol_name}
                      className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--portal-fg)]">{protocol.protocol_name}</h3>
                          <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">Version {protocol.version || 'Unspecified'}</p>
                        </div>
                        <StatusBadge tone={protocol.status?.toLowerCase() === 'active' ? 'success' : 'warning'}>
                          {protocol.status || 'Unknown'}
                        </StatusBadge>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-[var(--portal-fg-muted)]">
                        <div className="flex items-center justify-between">
                          <span>Last verified</span>
                          <span className="text-[var(--portal-fg)]">
                            {protocol.last_verified_at ? new Date(protocol.last_verified_at).toLocaleString() : 'Not verified'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Enabled since</span>
                          <span className="text-[var(--portal-fg)]">
                            {protocol.created_at ? new Date(protocol.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {protocol.endpoints && Object.keys(protocol.endpoints).length > 0 ? (
                        <div className="mt-4 rounded-2xl border border-[var(--portal-border)] bg-white px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">
                            Adapter endpoints
                          </p>
                          <div className="mt-3 space-y-2">
                            {Object.entries(protocol.endpoints)
                              .slice(0, 3)
                              .map(([key, value]) => (
                                <div key={key} className="flex items-start justify-between gap-3 text-sm">
                                  <span className="text-[var(--portal-fg-subtle)]">{key}</span>
                                  <span className="max-w-[65%] break-all font-mono text-right text-[var(--portal-fg)]">
                                    {String(value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SurfaceCard>
        )}
      </div>
    </div>
  );
}
