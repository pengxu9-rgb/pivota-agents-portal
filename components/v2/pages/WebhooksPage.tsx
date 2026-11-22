'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import { formatDateTimeSecondsUtc, formatDateTimeUtc, formatRelative, parseUtc } from '@/lib/v2/time';
import { deliveredRate } from '@/lib/webhook-summary';
import { Badge, CopyButton, EmptyState, Modal, Notice, PageHeader, SkeletonRows, errorMessage } from '../ui';
import { useSignedIn } from '../useSignedIn';

/**
 * The order events the portal offers. The backend catalog also has order.payment_attempted,
 * purchase.* and api.* (and subscribes new endpoints to all of them); those are not offered
 * here, but an existing subscription to them is kept on save, never silently dropped.
 */
export const ORDER_EVENTS = [
  { type: 'order.created', label: 'An order was created' },
  { type: 'order.payment_succeeded', label: 'Payment succeeded' },
  { type: 'order.payment_failed', label: 'Payment failed' },
  { type: 'order.refunded', label: 'A refund was issued' },
  { type: 'order.cancelled', label: 'The order was cancelled' },
  { type: 'order.completed', label: 'The order completed' },
] as const;
const ORDER_EVENT_TYPES: string[] = ORDER_EVENTS.map((event) => event.type);

// Backend: MAX_DELIVERY_ATTEMPTS = 6, retry delays 60/300/1800/7200/43200 s (≈ 14.6 h in all).
const RETRY_COPY = 'Failed deliveries retry automatically, up to 6 attempts over about 15 hours.';

type Summary = { total: number; succeeded: number; failed: number; retrying: number; success_rate: number; last_delivery_at: string | null };
type Config = {
  enabled: boolean;
  destination_url: string | null;
  subscribed_events: string[];
  signing_secret_last4: string | null;
  pending_signing_secret_last4: string | null;
  pending_secret_activates_at: string | null;
  delivery_summary_24h?: Summary;
};
type Delivery = {
  delivery_id: string;
  event_type: string;
  status: 'delivered' | 'retrying' | 'failed' | string;
  http_status: number | null;
  attempt_count: number;
  created_at: string | null;
  next_retry_at: string | null;
  last_error: string | null;
};


function ResultBadge({ delivery }: { delivery: Delivery }) {
  if (delivery.status === 'delivered') return <Badge tone="ok">{delivery.http_status ? `${delivery.http_status} OK` : 'Delivered'}</Badge>;
  const label = delivery.http_status ? String(delivery.http_status) : /timed? ?out/i.test(delivery.last_error || '') ? 'Timed out' : 'No response';
  return <Badge tone="err">{label}</Badge>;
}

function attemptsCell(delivery: Delivery, now: number) {
  if (delivery.status === 'retrying' && delivery.next_retry_at) {
    return `${delivery.attempt_count} · next ${formatRelative(delivery.next_retry_at, now)}`;
  }
  if (delivery.status === 'failed') return `${delivery.attempt_count} · gave up`;
  return String(delivery.attempt_count || 1);
}

/** Date and time: a time alone read as "today" for deliveries weeks old. */
function timeCell(value: string | null) {
  return formatDateTimeSecondsUtc(value);
}

/** The 24 h summary has no last delivery when nothing was delivered in 24 h; the list still knows
 * the newest delivered one, so the tile shows that instead of "—". */
export function lastDeliveredAt(summary: Summary | undefined, deliveries: Delivery[]) {
  if (summary?.last_delivery_at) return summary.last_delivery_at;
  let newest: Date | null = null;
  let newestRaw: string | null = null;
  for (const delivery of deliveries) {
    if (delivery.status !== 'delivered') continue;
    const date = parseUtc(delivery.created_at);
    if (date && (!newest || date > newest)) {
      newest = date;
      newestRaw = delivery.created_at;
    }
  }
  return newestRaw;
}

export default function WebhooksPage() {
  const ready = useSignedIn();
  const [config, setConfig] = React.useState<Config | null>(null);
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [deliveriesError, setDeliveriesError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ tone: 'neutral' | 'error'; text: string } | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [rotateOpen, setRotateOpen] = React.useState(false);
  const [rotating, setRotating] = React.useState(false);
  const [rotateError, setRotateError] = React.useState<string | null>(null);
  // Shown once, held only here, gone on dismiss.
  const [newSecret, setNewSecret] = React.useState<{ secret: string; activatesAt: string | null } | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setDeliveriesError(null);
    const [configResult, deliveriesResult] = await Promise.allSettled([
      agentApi.getWebhookConfig(),
      agentApi.getWebhookDeliveries(25),
    ]);
    if (configResult.status === 'fulfilled') {
      setConfig((configResult.value?.config || null) as Config | null);
    } else {
      setLoadError(errorMessage(configResult.reason, 'Your webhook settings could not be loaded.'));
    }
    if (deliveriesResult.status === 'fulfilled') {
      setDeliveries((deliveriesResult.value?.deliveries || []) as Delivery[]);
    } else {
      setDeliveries([]);
      setDeliveriesError(errorMessage(deliveriesResult.reason, 'Recent deliveries could not be loaded.'));
    }
    setNow(Date.now());
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const sendTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await agentApi.sendWebhookTest();
      const delivery = response?.delivery || {};
      setMessage({
        tone: delivery.status === 'delivered' ? 'neutral' : 'error',
        text:
          delivery.status === 'delivered'
            ? `Test event delivered${delivery.http_status ? ` (HTTP ${delivery.http_status})` : ''}.`
            : `Test event not delivered${delivery.http_status ? ` (HTTP ${delivery.http_status})` : ''}. It will retry like any other delivery.`,
      });
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The test event could not be sent.') });
    } finally {
      setTesting(false);
    }
  };

  const resend = async (delivery: Delivery) => {
    setRetryingId(delivery.delivery_id);
    setMessage(null);
    try {
      await agentApi.retryWebhookDelivery(delivery.delivery_id);
      setMessage({ tone: 'neutral', text: `Resent ${delivery.event_type}.` });
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error, 'The delivery could not be resent.') });
    } finally {
      setRetryingId(null);
    }
  };

  const closeRotate = React.useCallback(() => {
    setRotateOpen(false);
    setRotateError(null);
  }, []);

  const rotate = async () => {
    setRotating(true);
    setRotateError(null);
    try {
      const response = await agentApi.rotateWebhookSigningSecret();
      const secret = String(response?.new_signing_secret || '');
      setNewSecret(secret ? { secret, activatesAt: response?.activates_at || null } : null);
      setRotateOpen(false);
      await load();
    } catch (error) {
      setRotateError(errorMessage(error, 'The signing secret could not be rotated.'));
    } finally {
      setRotating(false);
    }
  };

  const configured = Boolean(config?.destination_url);
  const summary = config?.delivery_summary_24h;
  const subscribed = config?.subscribed_events || [];
  const subscribedOrder = ORDER_EVENT_TYPES.filter((type) => subscribed.includes(type));
  const otherSubscribed = subscribed.filter((type) => !ORDER_EVENT_TYPES.includes(type));

  const ucpNotice = (
    <Notice title="Webhooks don't fire for UCP checkouts yet">
      Orders placed through the UCP door (<span className="pv2-mono">/ucp/mcp</span>) don't send webhooks today. Until they do, check those
      checkouts with <span className="pv2-mono">get_checkout</span>.
    </Notice>
  );

  return (
    <main className="pv2-main">
      {loading && !config ? (
        <>
          <PageHeader title="Webhooks" />
          <section className="pv2-card"><SkeletonRows rows={4} /></section>
        </>
      ) : loadError ? (
        <>
          <PageHeader title="Webhooks" />
          <Notice tone="error" title="Couldn't load webhooks" action={<button type="button" className="pv2-btn" onClick={() => void load()}>Retry</button>}>
            {loadError}
          </Notice>
        </>
      ) : !configured ? (
        <>
          <PageHeader title="Webhooks" description="Pivota POSTs order updates to one HTTPS endpoint you own, so your agent hears about payments and refunds without polling." />
          <section className="pv2-card">
            <EmptyState
              title="No endpoint yet"
              actions={
                <button type="button" className="pv2-btn pv2-btn-pri" onClick={() => setEditOpen(true)}>
                  <Plus aria-hidden="true" />
                  Add endpoint
                </button>
              }
            >
              Add the URL that should receive events. Each request is signed, so you can check it came from Pivota. {RETRY_COPY}
            </EmptyState>
          </section>
          {ucpNotice}
        </>
      ) : (
        <>
          <div className="pv2-ph">
            <div style={{ minWidth: 0 }}>
              <div className="pv2-muted pv2-small" style={{ marginBottom: 4 }}>Webhook endpoint</div>
              <div className="pv2-ph-title">
                <h1 className="pv2-h1" style={{ fontSize: 20, overflowWrap: 'anywhere' }}>{config?.destination_url}</h1>
                {config?.enabled ? <Badge tone="ok">Enabled</Badge> : <Badge tone="neu">Disabled</Badge>}
              </div>
              <p>Order and refund updates for your agent's checkouts.</p>
            </div>
            <div className="pv2-actions">
              <button type="button" className="pv2-btn" onClick={() => void sendTest()} disabled={testing || !config?.enabled} title={config?.enabled ? undefined : 'Enable the endpoint to send a test event'}>
                {testing ? 'Sending…' : 'Send test event'}
              </button>
              <button type="button" className="pv2-btn" onClick={() => setEditOpen(true)}>Edit</button>
            </div>
          </div>

          {message ? (
            <Notice tone={message.tone} action={<button type="button" className="pv2-iconbtn" aria-label="Dismiss" onClick={() => setMessage(null)}><X aria-hidden="true" /></button>}>
              {message.text}
            </Notice>
          ) : null}

          {newSecret ? (
            <section className="pv2-card pv2-notice-accent" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pv2-strong">New signing secret</div>
                  <div className="pv2-muted" style={{ marginTop: 2 }}>
                    Copy it now; it's shown only once. It starts signing deliveries {newSecret.activatesAt ? formatDateTimeUtc(newSecret.activatesAt) : 'in 24 hours'}.
                    Until then deliveries are still signed with the current secret. If you never received that one (it isn't shown when an
                    endpoint is added), deliveries before then can't be verified.
                  </div>
                </div>
                <button type="button" className="pv2-iconbtn" aria-label="Dismiss and hide the secret" onClick={() => setNewSecret(null)}>
                  <X aria-hidden="true" />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="pv2-input" style={{ flex: '1 1 320px' }} aria-label="New signing secret" readOnly value={newSecret.secret} onFocus={(event) => event.currentTarget.select()} />
                <CopyButton value={newSecret.secret} label="Copy secret" primary />
              </div>
            </section>
          ) : null}

          <div className="pv2-stats">
            <div className="pv2-card pv2-stat"><div className="pv2-stat-label">Delivered · 24h</div><div className="pv2-stat-value">{deliveredRate(summary)}</div></div>
            <div className="pv2-card pv2-stat"><div className="pv2-stat-label">Retrying now</div><div className="pv2-stat-value">{summary?.retrying ?? 0}</div></div>
            <div className="pv2-card pv2-stat"><div className="pv2-stat-label">Gave up · 24h</div><div className="pv2-stat-value">{summary?.failed ?? 0}</div></div>
            <div className="pv2-card pv2-stat"><div className="pv2-stat-label">Last delivery</div><div className="pv2-stat-value">{lastDeliveredAt(summary, deliveries) ? formatRelative(lastDeliveredAt(summary, deliveries), now) : '—'}</div></div>
          </div>

          <div className="pv2-grid-2">
            <section className="pv2-card pv2-card-clip">
              <div className="pv2-card-head">
                <h2 className="pv2-h2">Recent deliveries</h2>
                <span className="pv2-muted pv2-small">Times in UTC</span>
              </div>
              {deliveriesError ? (
                <div style={{ padding: 16 }}><Notice tone="error">{deliveriesError}</Notice></div>
              ) : deliveries.length === 0 ? (
                <EmptyState title="No deliveries yet">
                  Deliveries appear here once your agent's orders change. Send a test event to check your endpoint now.
                </EmptyState>
              ) : (
                <div className="pv2-scroll-x">
                  <table className="pv2-tbl">
                    <thead>
                      <tr>
                        <th scope="col">Event</th>
                        <th scope="col">Result</th>
                        <th scope="col">Attempts</th>
                        <th scope="col">Time</th>
                        <th scope="col" className="pv2-r"><span className="pv2-sr">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((delivery) => (
                        <tr key={delivery.delivery_id}>
                          <td className="pv2-mono">{delivery.event_type}</td>
                          <td><ResultBadge delivery={delivery} /></td>
                          <td className={delivery.status === 'delivered' ? undefined : 'pv2-muted'}>{attemptsCell(delivery, now)}</td>
                          <td className="pv2-mono pv2-muted">{timeCell(delivery.created_at)}</td>
                          <td className="pv2-r">
                            {delivery.status === 'delivered' ? null : (
                              <button type="button" className="pv2-btn" onClick={() => void resend(delivery)} disabled={retryingId === delivery.delivery_id}>
                                {retryingId === delivery.delivery_id ? 'Resending…' : 'Resend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="pv2-card pv2-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 className="pv2-h2">Details</h2>
              <dl className="pv2-kv">
                <dt>Signing secret</dt>
                <dd>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="pv2-mono">{config?.signing_secret_last4 ? `••••••••${config.signing_secret_last4}` : 'Not issued'}</span>
                    <button type="button" className="pv2-btn" onClick={() => setRotateOpen(true)}>Rotate</button>
                  </div>
                  <div className="pv2-hint" style={{ marginTop: 4 }}>
                    A secret is shown once, when you rotate. The secret issued with a new endpoint is never shown, so rotate once to get one you can verify with.
                  </div>
                  {config?.pending_signing_secret_last4 ? (
                    <div style={{ marginTop: 8 }}>
                      <Badge tone="warn">Pending</Badge>{' '}
                      <span className="pv2-mono">••••{config.pending_signing_secret_last4}</span>{' '}
                      <span className="pv2-muted">starts signing {formatDateTimeUtc(config.pending_secret_activates_at)}</span>
                    </div>
                  ) : null}
                </dd>
                <dt>Signature header</dt>
                <dd className="pv2-mono">X-Pivota-Signature</dd>
              </dl>
              <div>
                <div className="pv2-strong" style={{ marginBottom: 8 }}>
                  {subscribedOrder.length === 0 ? 'Not listening for order events' : `Listening for ${subscribedOrder.length} order event${subscribedOrder.length === 1 ? '' : 's'}`}
                </div>
                <div className="pv2-chips">
                  {subscribedOrder.map((type) => <span key={type} className="pv2-chip">{type}</span>)}
                </div>
                {otherSubscribed.length ? (
                  <div className="pv2-hint" style={{ marginTop: 8 }}>
                    Also subscribed to {otherSubscribed.length} other event type{otherSubscribed.length === 1 ? '' : 's'} from the full catalog. Saving here keeps them.
                  </div>
                ) : null}
              </div>
              <div className="pv2-muted">{RETRY_COPY} Verify each request with the signing secret before trusting it.</div>
            </section>
          </div>
          {ucpNotice}
        </>
      )}

      {editOpen ? (
        <EditEndpointModal
          config={config}
          onClose={() => setEditOpen(false)}
          onSaved={async (text) => {
            setEditOpen(false);
            setMessage({ tone: 'neutral', text });
            await load();
          }}
        />
      ) : null}

      {rotateOpen ? (
        <Modal
          title="Rotate the signing secret?"
          description="You'll see the new secret once. It starts signing deliveries 24 hours from now; until then deliveries are still signed with the current secret, which you can verify with only if you received it."
          onClose={closeRotate}
          footer={
            <>
              <button type="button" className="pv2-btn" onClick={closeRotate}>Cancel</button>
              <button type="button" className="pv2-btn pv2-btn-pri" onClick={() => void rotate()} disabled={rotating}>
                {rotating ? 'Rotating…' : 'Rotate secret'}
              </button>
            </>
          }
        >
          {rotateError ? <div className="pv2-small" style={{ color: 'var(--error)' }} role="alert">{rotateError}</div> : null}
        </Modal>
      ) : null}
    </main>
  );
}

function EditEndpointModal({
  config,
  onClose,
  onSaved,
}: {
  config: Config | null;
  onClose: () => void;
  onSaved: (message: string) => void | Promise<void>;
}) {
  const firstSetup = !config?.destination_url;
  const [url, setUrl] = React.useState(config?.destination_url || '');
  const [enabled, setEnabled] = React.useState(firstSetup ? true : Boolean(config?.enabled));
  const [events, setEvents] = React.useState<string[]>(() =>
    firstSetup ? [...ORDER_EVENT_TYPES] : ORDER_EVENT_TYPES.filter((type) => (config?.subscribed_events || []).includes(type)),
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = (type: string) =>
    setEvents((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const destination = url.trim();
    if (!/^https:\/\/[^\s/]+\.[^\s]+$/i.test(destination)) {
      setError('Use a public https:// URL.');
      return;
    }
    if (events.length === 0) {
      setError('Pick at least one event.');
      return;
    }
    // First setup subscribes to exactly the chosen order events. On an edit, keep any
    // non-order subscriptions the endpoint already had.
    const keep = firstSetup ? [] : (config?.subscribed_events || []).filter((type) => !ORDER_EVENT_TYPES.includes(type));
    setSaving(true);
    setError(null);
    try {
      await agentApi.updateWebhookConfig({
        enabled,
        destination_url: destination,
        subscribed_events: [...ORDER_EVENT_TYPES.filter((type) => events.includes(type)), ...keep],
      });
      await onSaved(firstSetup ? 'Endpoint added. Rotate the signing secret to get one you can verify deliveries with.' : 'Endpoint saved.');
    } catch (caught) {
      setError(errorMessage(caught, 'The endpoint could not be saved.'));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={firstSetup ? 'Add a webhook endpoint' : 'Edit webhook endpoint'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pv2-btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="pv2-webhook-form" className="pv2-btn pv2-btn-pri" disabled={saving}>
            {saving ? 'Saving…' : firstSetup ? 'Add endpoint' : 'Save'}
          </button>
        </>
      }
    >
      <form id="pv2-webhook-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="pv2-field">
          <span className="pv2-label">Endpoint URL</span>
          <input className="pv2-input" type="url" inputMode="url" placeholder="https://your-agent.example/pivota/events" value={url} onChange={(event) => setUrl(event.target.value)} />
          <span className="pv2-hint">Must be https and reachable from the public internet.</span>
        </label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="pv2-label" style={{ marginBottom: 4 }}>Events</legend>
          {ORDER_EVENTS.map((item) => (
            <label key={item.type} className="pv2-check">
              <input type="checkbox" checked={events.includes(item.type)} onChange={() => toggle(item.type)} />
              <span>
                <span className="pv2-mono">{item.type}</span>
                <span className="pv2-muted"> · {item.label}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="pv2-check">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>Enabled</span>
        </label>
        {error ? <div className="pv2-small" style={{ color: 'var(--error)' }} role="alert">{error}</div> : null}
      </form>
    </Modal>
  );
}
