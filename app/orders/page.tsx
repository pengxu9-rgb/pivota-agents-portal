'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Package, RefreshCw, RotateCcw, Search, ShoppingCart, Truck, XCircle } from 'lucide-react';
import ConfirmDialog from '@/components/portal/ConfirmDialog';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

const STATUS_TONES: Record<string, 'success' | 'warning' | 'critical' | 'info' | 'neutral'> = {
  completed: 'success',
  paid: 'success',
  processing: 'info',
  pending: 'warning',
  refunded: 'neutral',
  cancelled: 'critical',
};

const getOrderErrorMessage = (error: any) =>
  error?.response?.data?.detail || error?.message || 'Failed to load orders.';

const isActiveApiKeyError = (error: any) => {
  const code = String(error?.code || '').toUpperCase();
  const detail = getOrderErrorMessage(error).toLowerCase();

  return (
    code === 'ACTIVE_API_KEY_REQUIRED' ||
    detail.includes('invalid api key') ||
    detail.includes('api key not found') ||
    detail.includes('active api key')
  );
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'critical'; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadErrorKind, setLoadErrorKind] = useState<'active_key_required' | 'unavailable' | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'refund' | 'cancel'; orderId: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEvents, setDetailEvents] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    void loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setLoadErrorKind(null);
      const data = await agentApi.getOrders(100);
      const mappedOrders = (data || []).map((order: any) => ({
        id: order.order_id,
        order_id: order.order_id,
        order_number: order.order_id,
        customer_email: order.customer_email,
        total_amount: Number(order.total ?? order.amount ?? 0) || 0,
        status: order.payment_status || order.status,
        created_at: order.created_at,
        merchant_id: order.merchant_id,
      }));
      setOrders(mappedOrders);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      setOrders([]);
      setLoadError(getOrderErrorMessage(error));
      setLoadErrorKind(isActiveApiKeyError(error) ? 'active_key_required' : 'unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOrderAction = async () => {
    if (!pendingAction) {
      return;
    }

    setActionLoading(true);
    try {
      if (pendingAction.type === 'refund') {
        await agentApi.refundOrder(pendingAction.orderId);
        setStatusMessage({
          tone: 'success',
          text: 'Refund initiated successfully.',
        });
      } else {
        await agentApi.cancelOrder(pendingAction.orderId);
        setStatusMessage({
          tone: 'success',
          text: 'Order cancelled successfully.',
        });
      }

      setPendingAction(null);
      await loadOrders();
    } catch (error: any) {
      setStatusMessage({
        tone: 'critical',
        text:
          pendingAction.type === 'refund'
            ? `Refund failed: ${error.response?.data?.detail || error.message}`
            : `Cancel failed: ${error.response?.data?.detail || error.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const loadOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setDetailError(null);
    setDetailEvents([]);
    setTracking(null);

    try {
      const [eventsResult, trackingResult] = await Promise.allSettled([
        agentApi.getOrderEvents(50, order.order_id),
        agentApi.trackOrder(order.order_id),
      ]);

      const nextDetailErrors: string[] = [];

      if (eventsResult.status === 'fulfilled') {
        setDetailEvents(eventsResult.value?.events || []);
      } else {
        console.error('Failed to load order timeline:', eventsResult.reason);
        setDetailEvents([]);
        nextDetailErrors.push(
          isActiveApiKeyError(eventsResult.reason)
            ? 'Order timeline requires an active API key.'
            : 'Order timeline is temporarily unavailable.',
        );
      }

      if (trackingResult.status === 'fulfilled') {
        setTracking(trackingResult.value || null);
      } else {
        console.error('Failed to load order tracking:', trackingResult.reason);
        setTracking(null);
        nextDetailErrors.push(
          isActiveApiKeyError(trackingResult.reason)
            ? 'Tracking details require an active API key.'
            : 'Tracking details are temporarily unavailable.',
        );
      }

      if (nextDetailErrors.length > 0) {
        setDetailError(nextDetailErrors.join(' '));
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch =
          !searchTerm ||
          order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [orders, searchTerm, statusFilter],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Orders"
        description="Review commerce flow results, refunds, and pending operations without mixing them into the Overview."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        actions={
          <>
            <button
              onClick={() => {
                setRefreshing(true);
                void loadOrders();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {statusMessage ? (
          <InlineNotice tone={statusMessage.tone}>
            {statusMessage.text}
          </InlineNotice>
        ) : null}

        {loadError ? (
          <InlineNotice
            tone="warning"
            title={loadErrorKind === 'active_key_required' ? 'Orders require an active API key' : 'Orders are temporarily unavailable'}
            action={
              loadErrorKind === 'active_key_required' ? (
                <Link
                  href="/api-keys"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
                >
                  Open API keys
                </Link>
              ) : undefined
            }
          >
            {loadError}
          </InlineNotice>
        ) : null}

        <SurfaceCard className="p-5">
          <SectionHeader title="Filters" description="Search orders and narrow by current payment state." />
          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-fg-subtle)]" />
              <input
                type="text"
                placeholder="Search order ID or customer email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)]"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[var(--portal-border)] px-5 py-4">
            <SectionHeader title="Order list" description={`${filteredOrders.length} matching orders`} />
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : loadError ? (
              <EmptyState
                icon={<ShoppingCart className="h-5 w-5" />}
                title={loadErrorKind === 'active_key_required' ? 'Orders require an active API key' : 'Orders unavailable'}
                description={
                  loadErrorKind === 'active_key_required'
                    ? 'Orders use authenticated order APIs. Open API keys to create, rotate, or recover a usable key for this session.'
                    : 'The orders feed could not be loaded, so the commerce operations surface is temporarily unavailable.'
                }
                action={
                  loadErrorKind === 'active_key_required' ? (
                    <Link
                      href="/api-keys"
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
                    >
                      Open API keys
                    </Link>
                  ) : undefined
                }
              />
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-5 w-5" />}
                title="No orders found"
                description="Orders will appear here after your integration starts creating or syncing checkout flow activity."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--portal-border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">
                      <th className="px-3 py-3 font-semibold">Order</th>
                      <th className="px-3 py-3 font-semibold">Customer</th>
                      <th className="px-3 py-3 font-semibold">Amount</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Created</th>
                      <th className="px-3 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[var(--portal-border)] last:border-b-0">
                        <td className="px-3 py-4 font-mono text-[var(--portal-fg)]">{order.order_number || order.id}</td>
                        <td className="px-3 py-4 text-[var(--portal-fg-muted)]">{order.customer_email || 'Guest'}</td>
                        <td className="px-3 py-4 tabular-nums text-[var(--portal-fg)]">${(order.total_amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-4">
                          <StatusBadge tone={STATUS_TONES[(order.status || '').toLowerCase()] || 'neutral'}>
                            {order.status || 'unknown'}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-4 text-[var(--portal-fg-muted)]">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            {(order.status === 'completed' || order.status === 'paid') && (
                              <button
                                onClick={() => setPendingAction({ type: 'refund', orderId: order.order_id })}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Refund</span>
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => setPendingAction({ type: 'cancel', orderId: order.order_id })}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-2.5 py-1.5 text-xs text-[var(--portal-fg-subtle)]">
                              <Package className="h-3.5 w-3.5" />
                              <span>{order.merchant_id || 'Merchant not specified'}</span>
                            </span>
                            <button
                              onClick={() => void loadOrderDetail(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SurfaceCard>

        {selectedOrder ? (
          <SurfaceCard className="p-5">
            <SectionHeader
              title={`Order ${selectedOrder.order_number || selectedOrder.order_id}`}
              description="Tracking and timeline sourced from the live order APIs."
            />
            {detailLoading ? (
              <div className="mt-5 space-y-3">
                {[0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {detailError ? (
                  <InlineNotice tone={detailError.toLowerCase().includes('active api key') ? 'warning' : 'info'}>
                    {detailError}
                  </InlineNotice>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Fulfillment</p>
                      <p className="mt-3 text-sm font-semibold text-[var(--portal-fg)]">
                        {tracking?.fulfillment_status || 'Detail unavailable'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">
                        {tracking?.carrier || 'Tracking unavailable'}
                        {tracking?.tracking_number ? ` · ${tracking.tracking_number}` : ''}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Customer</p>
                      <p className="mt-3 text-sm text-[var(--portal-fg)]">{selectedOrder.customer_email || 'Guest checkout'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {detailEvents.length === 0 ? (
                      <EmptyState
                        icon={<ShoppingCart className="h-5 w-5" />}
                        title="No order timeline available"
                        description="The order event feed did not return timeline entries for this order."
                      />
                    ) : (
                      detailEvents.map((event) => (
                        <div
                          key={`${event.id}-${event.event_type}`}
                          className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={event.status === 'failed' ? 'critical' : event.status === 'succeeded' ? 'success' : 'info'}>
                              {event.status || 'event'}
                            </StatusBadge>
                            <p className="font-mono text-sm text-[var(--portal-fg)]">{event.event_type}</p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--portal-fg-muted)]">
                            <span>{event.currency ? `${event.total_amount ?? 0} ${event.currency}` : 'Amount unavailable'}</span>
                            <span>{event.created_at ? new Date(event.created_at).toLocaleString() : 'Unknown timestamp'}</span>
                          </div>
                          {event.error_message ? <p className="mt-2 text-sm text-rose-600">{event.error_message}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </SurfaceCard>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'refund' ? 'Issue full refund' : 'Cancel order'}
        description={
          pendingAction?.type === 'refund'
            ? `Issue a full refund for ${pendingAction.orderId}?`
            : pendingAction
              ? `Cancel ${pendingAction.orderId}?`
              : ''
        }
        confirmLabel={pendingAction?.type === 'refund' ? 'Issue refund' : 'Cancel order'}
        loading={actionLoading}
        onConfirm={() => void handleOrderAction()}
        onCancel={() => {
          if (!actionLoading) {
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}
