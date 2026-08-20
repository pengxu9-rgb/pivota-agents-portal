'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Braces, Cable, ExternalLink, FileCode2, Globe2, KeyRound, Package, RefreshCw, Webhook } from 'lucide-react';
import CodePanel from '@/components/portal/CodePanel';
import ConsoleTabs from '@/components/portal/ConsoleTabs';
import EmptyState from '@/components/portal/EmptyState';
import InlineNotice from '@/components/portal/InlineNotice';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/config';
import { developerStandards } from '@/lib/developer-standards';
import { DOOR_EXAMPLES, OAUTH_METADATA_URL, agentDoors } from '@/lib/agent-doors';

const API_BASE = API_CONFIG.AGENT_API_V1_BASE_URL;

const SDK_EXAMPLES = {
  python: {
    install: 'pip install pivota-agent',
    quickstart: `from pivota_agent import PivotaAgentClient\nimport requests\n\nAPI_BASE = "${API_BASE}"\nAPI_KEY = "YOUR_API_KEY"\nMERCHANT_ID = "merch_xxx"\n\nclient = PivotaAgentClient(api_key=API_KEY, base_url=API_BASE)\nsearch = client.search_products(query="coffee mug", merchant_id=MERCHANT_ID, limit=5)\nproduct_id = search["products"][0]["id"]\n\ncart = requests.post(\n    f"{API_BASE}/cart/validate?merchant_id={MERCHANT_ID}&shipping_country=US",\n    headers={"X-API-Key": API_KEY},\n    json=[{"product_id": product_id, "quantity": 1}],\n    timeout=30,\n)\nvariant_id = cart.json()["items"][0]["variant_id"]\n\nintent = requests.post(\n    f"{API_BASE}/checkout/intents",\n    headers={"X-API-Key": API_KEY},\n    json={\n        "items": [{\n            "product_id": product_id,\n            "variant_id": variant_id,\n            "merchant_id": MERCHANT_ID,\n            "quantity": 1,\n        }],\n        "return_url": "https://developer.pivota.cc/return",\n        "buyer_ref": "guest:YOUR_UUID",\n    },\n    timeout=30,\n)\nprint(intent.json()["checkout_url"])`,
  },
  typescript: {
    install: 'npm install pivota-agent axios',
    quickstart: `import axios from 'axios';\nimport { PivotaAgentClient } from 'pivota-agent';\n\nconst API_BASE = '${API_BASE}';\nconst API_KEY = 'YOUR_API_KEY';\nconst MERCHANT_ID = 'merch_xxx';\n\nconst client = new PivotaAgentClient({ apiKey: API_KEY, baseUrl: API_BASE });\nconst search = await client.searchProducts({ query: 'coffee mug', merchant_id: MERCHANT_ID, limit: 5 });\nconst productId = search.products[0].id;\n\nconst cart = await axios.post(\n  \`${API_BASE}/cart/validate?merchant_id=\${MERCHANT_ID}&shipping_country=US\`,\n  [{ product_id: productId, quantity: 1 }],\n  { headers: { 'X-API-Key': API_KEY } },\n);\n\nconst variantId = cart.data.items[0].variant_id;\n\nconst intent = await axios.post(\n  \`${API_BASE}/checkout/intents\`,\n  {\n    items: [{ product_id: productId, variant_id: variantId, merchant_id: MERCHANT_ID, quantity: 1 }],\n    return_url: 'https://developer.pivota.cc/return',\n    buyer_ref: 'guest:YOUR_UUID',\n  },\n  { headers: { 'X-API-Key': API_KEY } },\n);\n\nconsole.log(intent.data.checkout_url);`,
  },
};

const REST_EXAMPLES = {
  auth: `curl ${API_BASE}/merchants \\\n  -H "X-API-Key: YOUR_API_KEY"`,
  orderCreate: `curl -X POST "${API_BASE}/orders/create" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -d '{\n    "merchant_id": "merch_...",\n    "customer_email": "buyer@example.com",\n    "items": [\n      {\n        "product_id": "prod_...",\n        "product_title": "Example Product",\n        "variant_id": "var_...",\n        "quantity": 1,\n        "unit_price": "19.99",\n        "subtotal": "19.99"\n      }\n    ],\n    "shipping_address": {\n      "name": "Alex Doe",\n      "address_line1": "123 Main St",\n      "city": "San Francisco",\n      "state": "CA",\n      "postal_code": "94105",\n      "country": "US"\n    }\n  }'`,
  webhookVerification: `import crypto from 'crypto';\n\nexport function verifyPivotaSignature({ rawBody, timestamp, signature, secret }) {\n  const payload = \`${'${timestamp}.${rawBody}'}\`;\n  const digest = crypto\n    .createHmac('sha256', secret)\n    .update(payload, 'utf8')\n    .digest('hex');\n\n  return signature === \`v1=\${digest}\`;\n}`,
};

const VALID_TABS = new Set(['quickstart', 'sdk', 'api', 'mcp', 'reference', 'standards']);

const normalizeDocsTab = (tab: string | null) => {
  if (!tab) {
    return null;
  }

  if (tab === 'channels') {
    return 'standards';
  }

  // Older links and the onboarding checklist call the agent-doors tab "connect" / "ucp".
  if (tab === 'connect' || tab === 'ucp') {
    return 'mcp';
  }

  return VALID_TABS.has(tab) ? tab : null;
};

const STANDARD_STATUS_LABELS = {
  live: 'Live · self-serve',
  partner_access: 'Partner access',
  internal_beta: 'Internal beta',
} as const;

const STANDARD_STATUS_TONES = {
  live: 'success',
  partner_access: 'warning',
  internal_beta: 'neutral',
} as const;

const STANDARD_KIND_LABELS = {
  channel_standard: 'Channel standard',
  protocol_layer: 'Protocol layer',
} as const;

const STANDARD_AUDIENCE_LABELS = {
  external_partners: 'External partners',
  technical_partners_internal: 'Technical partners / internal',
} as const;

export default function DocsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('quickstart');
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'typescript'>('python');
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [developerEndpoints, setDeveloperEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrationUnavailable, setIntegrationUnavailable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (typeof window !== 'undefined') {
      const tab = normalizeDocsTab(new URLSearchParams(window.location.search).get('tab'));
      if (tab) {
        setSelectedTab(tab);

        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }

    void loadDocsState();
  }, [router]);

  const handleTabChange = (tab: string) => {
    const normalized = normalizeDocsTab(tab);
    if (!normalized) {
      return;
    }

    setSelectedTab(normalized);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (normalized === 'quickstart') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', normalized);
      }
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const loadDocsState = async () => {
    try {
      setLoading(true);
      const agentId = localStorage.getItem('agent_id');
      const [integrationResult, endpointsResult] = await Promise.allSettled([
        agentId ? agentApi.getIntegrationStatus(agentId) : Promise.resolve(null),
        agentApi.getDeveloperEndpoints(),
      ]);

      if (integrationResult.status === 'fulfilled') {
        setIntegrationStatus(integrationResult.value);
        setIntegrationUnavailable(false);
      } else {
        console.error('Failed to load docs integration status:', integrationResult.reason);
        setIntegrationStatus(null);
        setIntegrationUnavailable(true);
      }

      if (endpointsResult.status === 'fulfilled') {
        setDeveloperEndpoints(Array.isArray(endpointsResult.value?.endpoints) ? endpointsResult.value.endpoints : []);
      } else {
        console.error('Failed to load developer endpoints:', endpointsResult.reason);
        setDeveloperEndpoints([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const docsMetrics = useMemo(
    () => [
      {
        label: 'API connection',
        value: integrationUnavailable ? 'Unavailable' : integrationStatus?.api_connected ? 'Connected' : 'Pending',
        tone: integrationUnavailable ? ('neutral' as const) : integrationStatus?.api_connected ? ('success' as const) : ('warning' as const),
        icon: <Cable className="h-5 w-5" />,
        hint: integrationUnavailable ? 'Integration status unavailable' : 'Backend connection status',
      },
      {
        label: 'Connected merchants',
        value: integrationUnavailable ? 'Unavailable' : integrationStatus?.connected_merchants ?? 0,
        tone: integrationUnavailable ? ('neutral' as const) : ('info' as const),
        icon: <BookOpen className="h-5 w-5" />,
        hint: integrationUnavailable ? 'Integration status unavailable' : 'Current connected merchants',
      },
      {
        label: 'Documented endpoints',
        value: developerEndpoints.length || 'Unavailable',
        tone: developerEndpoints.length > 0 ? ('neutral' as const) : ('warning' as const),
        icon: <FileCode2 className="h-5 w-5" />,
        hint: developerEndpoints.length > 0 ? 'Runtime-derived from the agent API surface' : 'Endpoint registry unavailable',
      },
    ],
    [developerEndpoints.length, integrationStatus, integrationUnavailable],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Docs"
        description="Quickstart, SDK usage, REST patterns, webhook verification, standards guidance, and runtime-derived endpoint reference."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        meta={
          loading ? (
            <StatusBadge tone="neutral">Loading status</StatusBadge>
          ) : integrationUnavailable ? (
            <StatusBadge tone="warning">Status unavailable</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">
              Last sync {integrationStatus?.last_sync ? new Date(integrationStatus.last_sync).toLocaleTimeString() : 'Unavailable'}
            </StatusBadge>
          )
        }
        actions={
          <>
            <Link
              href="/api-keys"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
            >
              <KeyRound className="h-4 w-4" />
              <span>Manage API keys</span>
            </Link>
            <button
              onClick={() => void loadDocsState()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {integrationUnavailable ? (
          <InlineNotice tone="warning" title="Integration status is temporarily unavailable">
            The docs content below is still usable, but live integration status could not be loaded from the backend.
          </InlineNotice>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {docsMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
              tone={metric.tone}
              icon={metric.icon}
            />
          ))}
        </div>

        <ConsoleTabs
          items={[
            { id: 'quickstart', label: 'Quickstart', icon: <BookOpen className="h-4 w-4" /> },
            { id: 'sdk', label: 'SDK', icon: <Package className="h-4 w-4" /> },
            { id: 'api', label: 'REST API', icon: <Braces className="h-4 w-4" /> },
            { id: 'mcp', label: 'Agent doors (UCP / MCP)', icon: <Cable className="h-4 w-4" /> },
            { id: 'standards', label: 'Standards & Protocols', icon: <Globe2 className="h-4 w-4" /> },
            { id: 'reference', label: 'API Reference', icon: <FileCode2 className="h-4 w-4" /> },
          ]}
          activeId={selectedTab}
          onChange={handleTabChange}
        />

        {selectedTab === 'quickstart' ? (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SurfaceCard className="p-5">
              <SectionHeader
                title="Quickstart"
                description="Five production steps from credentials to webhook-confirmed order flow."
              />
              <div className="mt-5 space-y-3">
                {[
                  'Create a dedicated production key and keep it out of source control.',
                  'Verify the key with a simple authenticated request — the REST call on the right, or tools/list on the UCP / MCP door (Agent doors tab).',
                  'Create your first order.',
                  'Configure a webhook destination and subscribe to order and API failure events.',
                  'Send a webhook test event before promoting traffic.',
                ].map((step, index) => (
                  <div key={step} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Step {index + 1}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{step}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <SectionHeader
                title="First authenticated call"
                description="Use this request to verify credentials and network connectivity."
              />
              <div className="mt-5">
                <CodePanel code={REST_EXAMPLES.auth} language="curl" />
              </div>
            </SurfaceCard>
          </div>
        ) : null}

        {selectedTab === 'sdk' ? (
          <div className="space-y-6">
            <div className="inline-flex gap-2 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-1">
              {(['python', 'typescript'] as const).map((language) => (
                <button
                  key={language}
                  onClick={() => setSelectedLanguage(language)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium ${selectedLanguage === language ? 'bg-[var(--portal-accent)] text-white' : 'text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-fg)]'}`}
                >
                  {language === 'python' ? 'Python' : 'TypeScript'}
                </button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Published package</p>
                <p className="mt-2 font-mono text-sm text-[var(--portal-fg)]">pivota-agent</p>
                <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                  Use the published package name above. Older references to <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">pivota-agent-sdk</code> or <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">@pivota/agent-sdk</code> should be treated as outdated.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">SDK scope</p>
                <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                  The SDK is a convenience wrapper around the same production REST API and API key flow. It is real and usable, but it does not replace the REST contract or add separate control-plane capabilities.
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
              <SurfaceCard className="p-5">
                <SectionHeader title="Install" description="Use the supported SDK package for your runtime." />
                <div className="mt-5">
                  <CodePanel code={SDK_EXAMPLES[selectedLanguage].install} language="shell" />
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-5">
                <SectionHeader title="SDK quickstart" description="Search, validate, then create a hosted checkout session." />
                <div className="mt-5">
                  <CodePanel code={SDK_EXAMPLES[selectedLanguage].quickstart} language={selectedLanguage} />
                </div>
              </SurfaceCard>
            </div>
          </div>
        ) : null}

        {selectedTab === 'api' ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SurfaceCard className="p-5">
              <SectionHeader title="REST API" description="Base URL, auth header, and the flows most teams use first." />
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Base URL</p>
                  <p className="mt-2 break-all font-mono text-sm text-[var(--portal-fg)]">{API_BASE}</p>
                </div>
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Authentication</p>
                  <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                    Send your key in the <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">X-API-Key</code> header for authenticated requests.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Webhook headers</p>
                  <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                    Pivota sends <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">X-Pivota-Event</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">X-Pivota-Delivery</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">X-Pivota-Timestamp</code>, and <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">X-Pivota-Signature</code>.
                  </p>
                </div>
              </div>
            </SurfaceCard>

            <div className="space-y-6">
              <SurfaceCard className="p-5">
                <SectionHeader title="Create order" description="Validate the end-to-end commerce flow before sending production traffic." />
                <div className="mt-5">
                  <CodePanel code={REST_EXAMPLES.orderCreate} language="curl" />
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-5">
                <SectionHeader title="Verify webhook signatures" description="Use the timestamp plus raw body when verifying webhook authenticity." />
                <div className="mt-5">
                  <CodePanel code={REST_EXAMPLES.webhookVerification} language="typescript" />
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  Pivota returns the full webhook signing secret only once, at the moment you rotate it in the developer portal. After that, the portal shows only masked last-4 values. If the full secret was not saved, rotate again to generate a new one.
                </div>
                <div className="mt-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm text-[var(--portal-fg-muted)]">
                  Automatic retries occur for timeouts, network errors, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">408</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">429</code>, and <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">5xx</code> responses. Non-retryable <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">4xx</code> responses are marked failed immediately.
                </div>
              </SurfaceCard>
            </div>
          </div>
        ) : null}

        {selectedTab === 'mcp' ? (
          <div className="space-y-6">
            <SurfaceCard className="p-5">
              <SectionHeader
                title="Connect your agent"
                description="Your portal key opens every hosted door. Pick the one that matches how your agent talks; they all read the same catalog and share the same checkout safeguards."
              />
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {agentDoors.map((door) => (
                  <div key={door.id} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--portal-fg)]">{door.label}</p>
                      <StatusBadge tone={door.id === 'public_read' ? 'neutral' : 'success'}>
                        {door.id === 'public_read' ? 'No key needed' : 'Works with your key'}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 break-all font-mono text-sm text-[var(--portal-fg)]">{door.endpoint}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{door.bestFor}</p>
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Transport</dt>
                        <dd className="mt-1 text-[var(--portal-fg-muted)]">{door.transport}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Auth</dt>
                        <dd className="mt-1 font-mono text-xs text-[var(--portal-fg)]">{door.auth}</dd>
                      </div>
                      {door.tools.length > 0 ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Tools ({door.tools.length})</dt>
                          <dd className="mt-1 flex flex-wrap gap-1.5">
                            {door.tools.map((tool) => (
                              <code key={tool} className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">
                                {tool}
                              </code>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                      {door.discovery?.length ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Discovery</dt>
                          <dd className="mt-1 flex flex-wrap gap-3">
                            {door.discovery.map((item) => (
                              <a
                                key={item.href}
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                              >
                                <span>{item.label}</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <SurfaceCard className="p-5">
                <SectionHeader title="1. List the tools" description="Replace the placeholder with the key from API keys. A 200 with a tools array means you are connected." />
                <div className="mt-5">
                  <CodePanel code={DOOR_EXAMPLES.ucpToolsList} language="curl" />
                </div>
              </SurfaceCard>
              <SurfaceCard className="p-5">
                <SectionHeader
                  title="2. Search the catalog"
                  description="UCP nests the query under catalog. Prices in filters are minor units of context.currency; the response is the spec catalog_search envelope with a cursor for the next page."
                />
                <div className="mt-5">
                  <CodePanel code={DOOR_EXAMPLES.ucpSearch} language="curl" />
                </div>
              </SurfaceCard>
              <SurfaceCard className="p-5">
                <SectionHeader title="3. Read one product" description="Use an id from the search results." />
                <div className="mt-5">
                  <CodePanel code={DOOR_EXAMPLES.ucpGetProduct} language="curl" />
                </div>
              </SurfaceCard>
              <SurfaceCard className="p-5">
                <SectionHeader
                  title="4. Add the decision layer (native door)"
                  description="get_intel, get_alternatives and get_offers return reviewed reasons, alternatives and cross-merchant offers for a product you already found."
                />
                <div className="mt-5">
                  <CodePanel code={DOOR_EXAMPLES.mcpIntel} language="curl" />
                </div>
              </SurfaceCard>
            </div>

            <SurfaceCard className="p-5">
              <SectionHeader
                title="Buyer identity for checkout"
                description="Catalog and insights reads run on your key alone. Everything under checkout and orders — create/update/get/complete_checkout on UCP, and get_order, request_after_sales, cancel_checkout_session, create_payment_link on the native door — is refused with USER_AUTH_REQUIRED until the call carries a verified end user. Use OAuth: your agent registers once, then each user signs in with Pivota and you hold a per-user token."
              />
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Register your agent once</p>
                  <CodePanel code={DOOR_EXAMPLES.oauthRegister} language="curl" />
                  <p className="text-sm leading-6 text-[var(--portal-fg-muted)]">
                    Returns a <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">client_id</code>. Public client + PKCE; no secret to store.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Per user: authorize</p>
                  <CodePanel code={DOOR_EXAMPLES.oauthAuthorize} language="url" />
                  <p className="text-sm leading-6 text-[var(--portal-fg-muted)]">
                    <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">resource</code> is required and must match the door exactly. PKCE S256 is required. The user signs in on Pivota and is redirected back with a code.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Exchange, then call with Bearer</p>
                  <CodePanel code={DOOR_EXAMPLES.oauthToken} language="curl" />
                  <CodePanel code={DOOR_EXAMPLES.bearerCall} language="curl" />
                  <p className="text-sm leading-6 text-[var(--portal-fg-muted)]">
                    Two headers matter beyond the token: <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">Mcp-Session-Id</code>, which must stay the same across create → update → complete for one checkout, and a client-generated <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">meta[&quot;idempotency-key&quot;]</code> on every state-changing call (Pivota never generates one — that is what makes a retry return the original result instead of a second quote). A bearer token gets you quote, update and read; <em>completing a charge</em> additionally requires payment authorization.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--portal-fg-muted)]">
                  The bearer token is both the channel credential and the user identity: do not also send your API key on that request. Mint one token per door (<code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">resource=…/ucp/mcp</code> or <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">…/mcp</code>).
                </div>
                <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--portal-fg-muted)]">
                  Grants: authorization_code + refresh_token (refresh rotates). Scope <code className="rounded bg-white px-1.5 py-1 font-mono text-xs text-[var(--portal-fg)]">pivota.checkout</code>. Server metadata:{' '}
                  <a href={OAUTH_METADATA_URL} target="_blank" rel="noreferrer" className="font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]">
                    oauth-authorization-server
                  </a>
                  .
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                  Bringing your own user identity (your JWKS registered here, users never leave your UI) is on the roadmap. Until then, OAuth is the checkout path. Contact us if you need it for a launch.
                </div>
              </div>
            </SurfaceCard>

            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <SurfaceCard className="p-5">
                <SectionHeader title="Local MCP (stdio)" description="For desktop MCP clients that spawn a local process. Same key, same catalog, fewer tools than the hosted doors." />
                <div className="mt-5">
                  <CodePanel code={DOOR_EXAMPLES.localStdio} language="json" />
                </div>
                <div className="mt-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Published package</p>
                  <p className="mt-2 font-mono text-sm text-[var(--portal-fg)]">pivota-mcp-server</p>
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-5">
                <SectionHeader title="Good to know" description="Behaviour you will see on the hosted doors." />
                <div className="mt-5 space-y-3">
                  {[
                    'Once authenticated, a tools/call answers HTTP 200 and tool errors ride inside the JSON-RPC result (isError + error.code). Read the body, not the status. An unauthenticated call is still a 401, and a door that is switched off answers 404.',
                    'Anonymous tools/list on both authenticated doors is 401 by design. Read capabilities from /.well-known/ucp, then authenticate.',
                    'Long searches stream a heartbeat. Keep client read timeouts at 30 seconds or more.',
                    'Your REST control-plane key defaults to 100 requests per minute and 10,000 per day. Ask for a partner tier before launch traffic.',
                    'Treat API keys as server-only credentials. Keep webhook management, key rotation and order operations in this portal or your backend.',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--portal-fg-muted)]">
                      {item}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>
          </div>
        ) : null}

        {selectedTab === 'standards' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SurfaceCard className="p-5">
              <SectionHeader
                title="Standards & protocols"
                description="Channel standards and protocol layers that relate to the developer platform without redefining the core API surface."
              />
              <div className="mt-5 space-y-4">
                {developerStandards.map((standard) => (
                  <div key={standard.id} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--portal-fg)]">{standard.label}</p>
                      <StatusBadge tone={STANDARD_STATUS_TONES[standard.status]}>
                        {STANDARD_STATUS_LABELS[standard.status]}
                      </StatusBadge>
                      <StatusBadge tone="neutral">{STANDARD_KIND_LABELS[standard.kind]}</StatusBadge>
                      <StatusBadge tone="neutral">{STANDARD_AUDIENCE_LABELS[standard.audience]}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{standard.summary}</p>
                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                      <div className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Availability</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{standard.availability}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">What it is for</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{standard.purpose}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Relation to APIs</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">{standard.relationToApi}</p>
                      </div>
                    </div>
                    {standard.docsHref ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleTabChange('mcp')}
                          className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
                        >
                          <Cable className="h-4 w-4" />
                          <span>Connect over UCP</span>
                        </button>
                      </div>
                    ) : null}
                    {standard.contactHref ? (
                      <div className="mt-4">
                        <a
                          href={standard.contactHref}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                        >
                          <Globe2 className="h-4 w-4" />
                          <span>Contact Pivota</span>
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <div className="space-y-6">
              <SurfaceCard className="p-5">
                <SectionHeader
                  title="Default integration path"
                  description="Core APIs and webhooks remain the production contract even when higher-level standards or protocols are involved."
                />
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Core contract</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                      Your API key is the one credential. Agents talk to the hosted UCP or MCP door; key management, webhooks, orders and analytics stay on the REST control plane in this portal.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">UCP</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                      Live and self-serve. Discover the door at /.well-known/ucp, authenticate with your key for catalog reads, and use OAuth buyer identity for checkout. See{' '}
                      <Link href="/docs?tab=mcp" className="font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]">
                        Agent doors
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">ACP / AP2</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                      ACP and AP2 are protocol-layer capabilities. They exist in the platform, but they should not be interpreted as public, self-serve portal surfaces for general developers.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">When to engage</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                      Start on the UCP or MCP door with your key and confirm tools/list, then add OAuth buyer identity when you are ready to check out. ACP and AP2 are introduced only when a partner program or technical review requires them.
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        ) : null}

        {selectedTab === 'reference' ? (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SurfaceCard className="p-5">
              <SectionHeader title="Webhook event catalog" description="Core events prioritized for order flow and operational failure visibility." />
              <div className="mt-5 space-y-3">
                {[
                  'order.created',
                  'order.payment_attempted',
                  'order.payment_succeeded',
                  'order.payment_failed',
                  'order.completed',
                  'order.refunded',
                  'order.cancelled',
                  'api.rate_limited',
                  'api.request_failed',
                  'webhook.test',
                ].map((eventType) => (
                  <div key={eventType} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-3">
                    <p className="font-mono text-sm text-[var(--portal-fg)]">{eventType}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <SectionHeader
                title="Runtime-derived endpoint registry"
                description="Live endpoints derived from the current agent API surface."
                action={
                  <Link
                    href="/developers/openapi.json"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                  >
                    <span>Open OpenAPI</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                }
              />
              <div className="mt-5 space-y-3">
                {developerEndpoints.length === 0 ? (
                  <EmptyState
                    icon={<FileCode2 className="h-5 w-5" />}
                    title="Endpoint registry unavailable"
                    description="The runtime-derived endpoint summary could not be loaded."
                  />
                ) : (
                  developerEndpoints.slice(0, 16).map((endpoint: any) => (
                    <div
                      key={`${endpoint.method}-${endpoint.path}`}
                      className="grid gap-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 lg:grid-cols-[0.7fr_2fr]"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={endpoint.method === 'GET' ? 'success' : 'info'}>{endpoint.method}</StatusBadge>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-[var(--portal-fg)]">{endpoint.path}</p>
                        <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">{endpoint.desc || 'Agent endpoint'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
