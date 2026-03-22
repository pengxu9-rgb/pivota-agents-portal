'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, ScrollText, Webhook } from 'lucide-react';
import ConsoleTabs from '@/components/portal/ConsoleTabs';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

type LogTab = 'requests' | 'orders' | 'webhooks';

export default function LogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<LogTab>('requests');
  const [requestEvents, setRequestEvents] = useState<any[]>([]);
  const [orderEvents, setOrderEvents] = useState<any[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);

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
      const [requestResult, orderResult, webhookResult] = await Promise.allSettled([
        agentApi.getRecentActivity(25),
        agentApi.getOrderEvents(50),
        agentApi.getWebhookDeliveries(25),
      ]);

      const nextUnavailable: string[] = [];

      if (requestResult.status === 'fulfilled') {
        setRequestEvents(requestResult.value?.activities || []);
      } else {
        console.error('Failed to load request events:', requestResult.reason);
        setRequestEvents([]);
        nextUnavailable.push('request logs');
      }

      if (orderResult.status === 'fulfilled') {
        setOrderEvents(orderResult.value?.events || []);
      } else {
        console.error('Failed to load order events:', orderResult.reason);
        setOrderEvents([]);
        nextUnavailable.push('order timeline');
      }

      if (webhookResult.status === 'fulfilled') {
        setWebhookEvents(webhookResult.value?.deliveries || []);
      } else {
        console.error('Failed to load webhook deliveries:', webhookResult.reason);
        setWebhookEvents([]);
        nextUnavailable.push('webhook deliveries');
      }

      setUnavailableSources(nextUnavailable);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  const renderRequests = () => {
    if (requestEvents.length === 0) {
      return (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="No request logs"
          description="Authenticated request logs will appear here after your integration starts sending traffic."
        />
      );
    }

    return (
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
            {requestEvents.map((event) => (
              <tr key={event.id} className="border-b border-[var(--portal-border)] last:border-b-0">
                <td className="px-3 py-3 font-mono text-[var(--portal-fg)]">{event.method}</td>
                <td className="px-3 py-3 font-mono text-[var(--portal-fg)]">{event.endpoint}</td>
                <td className="px-3 py-3">
                  <StatusBadge tone={(event.status_code ?? 0) < 400 ? 'success' : 'critical'}>{event.status_code}</StatusBadge>
                </td>
                <td className="px-3 py-3 tabular-nums text-[var(--portal-fg)]">{event.response_time_ms}ms</td>
                <td className="px-3 py-3 text-[var(--portal-fg-muted)]">{new Date(event.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOrders = () => {
    if (orderEvents.length === 0) {
      return (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="No order timeline events"
          description="Order state transitions will appear here after the first order is created."
        />
      );
    }

    return (
      <div className="space-y-3">
        {orderEvents.map((event) => (
          <div
            key={`${event.id}-${event.order_id}`}
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={event.status === 'failed' ? 'critical' : event.status === 'succeeded' ? 'success' : 'info'}>
                {event.status || 'event'}
              </StatusBadge>
              <p className="font-mono text-sm text-[var(--portal-fg)]">{event.event_type}</p>
              <span className="text-xs text-[var(--portal-fg-subtle)]">{event.order_id}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--portal-fg-muted)]">
              <span>Merchant {event.merchant_id}</span>
              <span>{event.currency ? `${event.total_amount ?? 0} ${event.currency}` : 'Amount unavailable'}</span>
              <span>{new Date(event.created_at).toLocaleString()}</span>
            </div>
            {event.error_message ? <p className="mt-2 text-sm text-rose-600">{event.error_message}</p> : null}
          </div>
        ))}
      </div>
    );
  };

  const renderWebhooks = () => {
    if (webhookEvents.length === 0) {
      return (
        <EmptyState
          icon={<Webhook className="h-5 w-5" />}
          title="No webhook deliveries"
          description="Send a webhook test or wait for live order traffic to generate delivery history."
        />
      );
    }

    return (
      <div className="space-y-3">
        {webhookEvents.map((delivery) => (
          <div
            key={delivery.delivery_id}
            className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={delivery.status === 'delivered' ? 'success' : delivery.status === 'retrying' ? 'warning' : 'critical'}>
                {delivery.status}
              </StatusBadge>
              <p className="font-mono text-sm text-[var(--portal-fg)]">{delivery.event_type}</p>
              {delivery.http_status ? <span className="text-xs text-[var(--portal-fg-subtle)]">HTTP {delivery.http_status}</span> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--portal-fg-muted)]">
              <span>{delivery.attempt_count} attempts</span>
              <span>{delivery.latency_ms !== null ? `${delivery.latency_ms}ms` : 'Latency unavailable'}</span>
              <span>{delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'Unknown timestamp'}</span>
            </div>
            {delivery.last_error ? <p className="mt-2 text-sm text-rose-600">{delivery.last_error}</p> : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Logs"
        description="Operational feeds for requests, order timeline events, and webhook deliveries."
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
        {unavailableSources.length > 0 ? (
          <InlineNotice tone="warning" title="Some log feeds are temporarily unavailable">
            The portal could not load {unavailableSources.join(', ')}. Visible content below reflects only the feeds that responded successfully.
          </InlineNotice>
        ) : null}

        <ConsoleTabs
          items={[
            { id: 'requests', label: 'Requests', icon: <ScrollText className="h-4 w-4" /> },
            { id: 'orders', label: 'Orders', icon: <ScrollText className="h-4 w-4" /> },
            { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="h-4 w-4" /> },
          ]}
          activeId={selectedTab}
          onChange={(value) => setSelectedTab(value as LogTab)}
        />

        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[var(--portal-border)] px-5 py-4">
            <SectionHeader
              title={selectedTab === 'requests' ? 'Request logs' : selectedTab === 'orders' ? 'Order timeline' : 'Webhook deliveries'}
              description={
                selectedTab === 'requests'
                  ? 'Method, path, status code, and latency from the latest authenticated requests.'
                  : selectedTab === 'orders'
                    ? 'Chronological order-state changes derived from the order event feed.'
                    : 'Webhook delivery attempts, retries, and destination responses.'
              }
              action={
                selectedTab === 'webhooks' ? (
                  <Link
                    href="/webhooks"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                  >
                    <span>Manage webhooks</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null
              }
            />
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : selectedTab === 'requests' ? (
              renderRequests()
            ) : selectedTab === 'orders' ? (
              renderOrders()
            ) : (
              renderWebhooks()
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
