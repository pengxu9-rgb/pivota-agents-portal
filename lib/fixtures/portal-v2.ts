/**
 * LOCAL-ONLY fixture backend for portal v2 screenshots and manual review.
 *
 * Wired in lib/api-client.ts only when NODE_ENV !== 'production' AND
 * NEXT_PUBLIC_PORTAL_FIXTURES === '1', so `next build` (NODE_ENV=production) never
 * includes this module. With it on, no request leaves the browser.
 *
 * Scenario: localStorage `pv2_fixture` = 'full' (default) | 'empty'.
 * Placeholder names only.
 */
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';

type Scenario = 'full' | 'empty';

const scenario = (): Scenario => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('fixture');
    if (fromUrl === 'empty' || fromUrl === 'full') return fromUrl;
    return window.localStorage.getItem('pv2_fixture') === 'empty' ? 'empty' : 'full';
  } catch {
    return 'full';
  }
};

// A placeholder session, so headless screenshots land on the page instead of /login.
if (typeof window !== 'undefined') {
  try {
    if (!window.localStorage.getItem('agent_token')) {
      window.localStorage.setItem('agent_token', 'fixture-session');
      window.localStorage.setItem('agent_id', 'agt_fixture');
      window.localStorage.setItem(
        'agent_user',
        JSON.stringify({ agent_id: 'agt_fixture', agent_name: 'Example Agent', name: 'Example Agent', email: 'dev@example.test' }),
      );
    }
  } catch {
    // storage blocked: the pages fall back to /login
  }
}

const ORDER_EVENTS = [
  'order.created',
  'order.payment_attempted',
  'order.payment_succeeded',
  'order.payment_failed',
  'order.completed',
  'order.refunded',
  'order.cancelled',
];
const CATALOG = [
  ...ORDER_EVENTS.map((event_type) => ({ event_type, category: 'orders', description: `Fixture ${event_type}` })),
  { event_type: 'purchase.action_required', category: 'purchases', description: 'Fixture' },
  { event_type: 'purchase.completed', category: 'purchases', description: 'Fixture' },
  { event_type: 'purchase.failed', category: 'purchases', description: 'Fixture' },
  { event_type: 'api.auth_failed', category: 'api', description: 'Fixture' },
  { event_type: 'api.rate_limited', category: 'api', description: 'Fixture' },
  { event_type: 'api.request_failed', category: 'api', description: 'Fixture' },
];

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
// API key created_at comes back WITHOUT a zone (see lib/v2/time.ts).
const zoneless = (iso: string) => iso.replace(/\.\d+Z$/, '').replace(/Z$/, '');

let keys: any[] | null = null;
const fixtureKeys = () => {
  if (keys) return keys;
  keys =
    scenario() === 'empty'
      ? []
      : [
          { id: '41', name: 'Server key', key: 'ak_live_3f****', created_at: zoneless(minutesFromNow(-8 * 24 * 60)), last_used: '2 minutes ago', status: 'active', usage_count: 1382, environment: 'live', masked: true },
          { id: '38', name: 'CI tests', key: 'ak_test_b1****', created_at: zoneless(minutesFromNow(-21 * 24 * 60)), last_used: '1 days ago', status: 'active', usage_count: 214, environment: 'test', masked: true },
          { id: '12', name: 'Old laptop key', key: 'ak_live_09****', created_at: zoneless(minutesFromNow(-67 * 24 * 60)), last_used: null, status: 'revoked', usage_count: 9, environment: 'live', masked: true },
        ];
  return keys;
};

let webhookConfig: any = null;
const fixtureWebhookConfig = () => {
  if (webhookConfig) return webhookConfig;
  const configured = scenario() === 'full';
  webhookConfig = {
    enabled: configured,
    destination_url: configured ? 'https://agent.example.test/pivota/events' : null,
    managed_receiver_url: 'https://api.example.test/agents/agt_fixture/webhooks/managed-inbox',
    subscribed_events: configured
      ? ['order.created', 'order.payment_succeeded', 'order.payment_failed', 'order.refunded', 'order.cancelled', 'order.completed']
      : CATALOG.map((item) => item.event_type),
    signing_secret_last4: configured ? 'a41c' : null,
    pending_signing_secret_last4: null,
    pending_secret_activates_at: null,
    last_test_at: null,
    last_test_status: null,
    delivery_summary_24h: configured
      ? { total: 55, succeeded: 53, failed: 0, retrying: 2, success_rate: 96.36, last_delivery_at: minutesFromNow(-3) }
      : { total: 0, succeeded: 0, failed: 0, retrying: 0, success_rate: 0.0, last_delivery_at: null },
    migration_source: null,
  };
  return webhookConfig;
};

const fixtureDeliveries = () =>
  scenario() === 'empty' || !fixtureWebhookConfig().destination_url
    ? []
    : [
        { delivery_id: 'whd_01', event_type: 'order.payment_succeeded', status: 'delivered', http_status: 200, attempt_count: 1, latency_ms: 182, created_at: minutesFromNow(-3), delivered_at: minutesFromNow(-3), next_retry_at: null, last_error: null },
        { delivery_id: 'whd_02', event_type: 'order.created', status: 'delivered', http_status: 200, attempt_count: 1, latency_ms: 140, created_at: minutesFromNow(-3), delivered_at: minutesFromNow(-3), next_retry_at: null, last_error: null },
        { delivery_id: 'whd_03', event_type: 'order.refunded', status: 'retrying', http_status: 503, attempt_count: 3, latency_ms: 10_000, created_at: minutesFromNow(-17), delivered_at: null, next_retry_at: minutesFromNow(103), last_error: 'HTTP 503' },
        { delivery_id: 'whd_04', event_type: 'order.payment_failed', status: 'retrying', http_status: null, attempt_count: 2, latency_ms: 10_000, created_at: minutesFromNow(-24), delivered_at: null, next_retry_at: minutesFromNow(4), last_error: 'Timed out after 10s' },
        { delivery_id: 'whd_05', event_type: 'order.completed', status: 'delivered', http_status: 200, attempt_count: 1, latency_ms: 201, created_at: minutesFromNow(-98), delivered_at: minutesFromNow(-98), next_retry_at: null, last_error: null },
        { delivery_id: 'whd_06', event_type: 'order.cancelled', status: 'delivered', http_status: 200, attempt_count: 2, latency_ms: 233, created_at: minutesFromNow(-186), delivered_at: minutesFromNow(-185), next_retry_at: null, last_error: null },
      ];

const ok = (config: AxiosRequestConfig, data: unknown, status = 200): AxiosResponse =>
  ({ data, status, statusText: 'OK', headers: {}, config } as AxiosResponse);

const fail = (config: AxiosRequestConfig, status: number, detail: string) => {
  const error: any = new Error(`Fixture ${status}: ${detail}`);
  error.response = { status, data: { detail }, headers: {}, config };
  error.config = config;
  return error;
};

export const fixtureAdapter: AxiosAdapter = async (config) => {
  const method = String(config.method || 'get').toLowerCase();
  const url = String(config.url || '').replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (/\/agents\/[^/]+\/api-keys$/.test(url)) {
    if (method === 'get') return ok(config, { status: 'success', keys: fixtureKeys() });
    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
      const environment = body.environment === 'test' ? 'test' : 'live';
      const full = `ak_${environment}_FIXTURE0000000000000000000000000000`;
      const record = {
        id: String(100 + fixtureKeys().length),
        name: body.name || 'API Key',
        key: `${full.slice(0, 10)}****`,
        created_at: zoneless(new Date().toISOString()),
        last_used: null,
        status: 'active',
        usage_count: 0,
        environment,
        masked: true,
      };
      fixtureKeys().unshift(record);
      return ok(config, { status: 'success', key: full, key_id: record.id, name: record.name, created_at: record.created_at, environment, masked: false });
    }
  }
  const revoke = url.match(/\/agents\/[^/]+\/api-keys\/([^/]+)$/);
  if (revoke && method === 'delete') {
    const record = fixtureKeys().find((key) => key.id === revoke[1]);
    if (!record) throw fail(config, 404, 'API key not found');
    record.status = 'revoked';
    return ok(config, { status: 'success', message: 'API key revoked successfully' });
  }

  if (/\/webhooks\/config$/.test(url)) {
    if (method === 'get') return ok(config, { status: 'success', config: fixtureWebhookConfig() });
    if (method === 'put') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
      const current = fixtureWebhookConfig();
      webhookConfig = {
        ...current,
        enabled: Boolean(body.enabled && body.destination_url),
        destination_url: body.destination_url || null,
        subscribed_events: body.subscribed_events,
        signing_secret_last4: current.signing_secret_last4 || 'f00d',
      };
      return ok(config, { status: 'success', config: webhookConfig });
    }
  }
  if (/\/webhooks\/events\/catalog$/.test(url)) {
    return ok(config, { status: 'success', events: [...CATALOG, { event_type: 'webhook.test', category: 'testing', description: 'Fixture' }] });
  }
  if (/\/webhooks\/deliveries$/.test(url)) {
    return ok(config, { status: 'success', deliveries: fixtureDeliveries() });
  }
  if (/\/webhooks\/test$/.test(url) && method === 'post') {
    if (!fixtureWebhookConfig().enabled) throw fail(config, 400, 'Configure and enable a webhook destination before sending a test event.');
    return ok(config, { status: 'success', delivery: { delivery_id: 'whd_test', event_type: 'webhook.test', status: 'delivered', http_status: 200 } });
  }
  if (/\/webhooks\/deliveries\/[^/]+\/retry$/.test(url) && method === 'post') {
    return ok(config, { status: 'success', delivery: { status: 'delivered', http_status: 200 } });
  }
  if (/\/webhooks\/signing-secret\/rotate$/.test(url) && method === 'post') {
    const activates = minutesFromNow(24 * 60);
    webhookConfig = { ...fixtureWebhookConfig(), pending_signing_secret_last4: '9e2b', pending_secret_activates_at: activates };
    return ok(config, {
      status: 'success',
      new_signing_secret: 'whsec_FIXTURE00000000000000000000009e2b',
      activates_at: activates,
      overlap_ends_at: activates,
      signing_secret_last4: 'a41c',
      current_signing_secret_last4: 'a41c',
      pending_signing_secret_last4: '9e2b',
    });
  }
  if (/\/agent\/v1\/orders/.test(url)) {
    return ok(config, { orders: [], events: [] });
  }

  throw fail(config, 404, `No fixture for ${method.toUpperCase()} ${url}`);
};
