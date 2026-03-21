'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Braces, Cable, ExternalLink, FileCode2, KeyRound, Package, RefreshCw } from 'lucide-react';
import CodePanel from '@/components/portal/CodePanel';
import ConsoleTabs from '@/components/portal/ConsoleTabs';
import InlineNotice from '@/components/portal/InlineNotice';
import MetricCard from '@/components/portal/MetricCard';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';

const API_BASE = 'https://web-production-fedb.up.railway.app/agent/v1';

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
  checkoutIntent: `curl -X POST "${API_BASE}/checkout/intents" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -d '{\n    "items": [\n      {\n        "product_id": "prod_...",\n        "variant_id": "var_...",\n        "merchant_id": "merch_...",\n        "quantity": 1\n      }\n    ],\n    "return_url": "https://developer.pivota.cc/return",\n    "buyer_ref": "guest:YOUR_UUID"\n  }'`,
  mcp: `{\n  "mcpServers": {\n    "pivota": {\n      "command": "npx",\n      "args": ["-y", "pivota-mcp-server"],\n      "env": {\n        "PIVOTA_API_KEY": "YOUR_API_KEY"\n      }\n    }\n  }\n}`,
};

const VALID_TABS = new Set(['quickstart', 'sdk', 'api', 'mcp', 'reference']);

export default function DocsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('quickstart');
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'typescript'>('python');
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [integrationUnavailable, setIntegrationUnavailable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab && VALID_TABS.has(tab)) {
        setSelectedTab(tab);
      }
    }

    void loadIntegrationStatus();
  }, [router]);

  const loadIntegrationStatus = async () => {
    try {
      setLoading(true);
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) {
        setIntegrationStatus(null);
        setIntegrationUnavailable(true);
        return;
      }
      const response = await agentApi.getIntegrationStatus(agentId);
      setIntegrationStatus(response);
      setIntegrationUnavailable(false);
    } catch (error) {
      console.error('Failed to load docs integration status:', error);
      setIntegrationStatus(null);
      setIntegrationUnavailable(true);
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
        label: 'Active protocols',
        value: integrationUnavailable ? 'Unavailable' : integrationStatus?.active_protocols ?? 0,
        tone: 'neutral' as const,
        icon: <Braces className="h-5 w-5" />,
        hint: integrationUnavailable ? 'Integration status unavailable' : 'Protocol adapters available',
      },
    ],
    [integrationStatus, integrationUnavailable],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Docs"
        description="Quickstart, SDK usage, REST reference, and MCP configuration in one production-facing docs surface."
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
              onClick={() => void loadIntegrationStatus()}
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
            The docs content below is still usable, but live connection status, merchant counts, and protocol counts could not be loaded from the backend.
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
            { id: 'mcp', label: 'MCP', icon: <Cable className="h-4 w-4" /> },
            { id: 'reference', label: 'API Reference', icon: <FileCode2 className="h-4 w-4" /> },
          ]}
          activeId={selectedTab}
          onChange={setSelectedTab}
        />

        {selectedTab === 'quickstart' ? (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SurfaceCard className="p-5">
              <SectionHeader
                title="Quickstart"
                description="Three steps to move from credentials to a production-ready checkout request."
              />
              <div className="mt-5 space-y-3">
                {[
                  'Create a dedicated production key and keep it out of source control.',
                  'Install the SDK or authenticate directly against the REST API.',
                  'Validate cart state before minting checkout intents.',
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
              <SectionHeader title="REST API" description="Base URL, auth header, and the endpoints most teams use first." />
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
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Common endpoints</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {['GET /merchants', 'POST /checkout/intents', 'GET /orders', 'POST /orders/{order_id}/refund', 'GET /orders/{order_id}/track'].map((endpoint) => (
                      <p key={endpoint} className="font-mono text-[var(--portal-fg)]">{endpoint}</p>
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <SectionHeader title="Checkout intent example" description="Recommended hosted checkout flow for production integrations." />
              <div className="mt-5">
                <CodePanel code={REST_EXAMPLES.checkoutIntent} language="curl" />
              </div>
            </SurfaceCard>
          </div>
        ) : null}

        {selectedTab === 'mcp' ? (
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <SurfaceCard className="p-5">
              <SectionHeader title="MCP setup" description="Connect local tooling to Pivota with an API key-backed MCP server config." />
              <div className="mt-5 space-y-3">
                {[
                  'Run the server through npx in your MCP host.',
                  'Set PIVOTA_API_KEY in the server env block.',
                  'Restart the MCP client after updating configuration.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-3 text-sm text-[var(--portal-fg-muted)]">
                    {item}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <SectionHeader title="Example MCP configuration" description="Template for Claude Desktop or another compatible MCP host." />
              <div className="mt-5">
                <CodePanel code={REST_EXAMPLES.mcp} language="json" />
              </div>
            </SurfaceCard>
          </div>
        ) : null}

        {selectedTab === 'reference' ? (
          <SurfaceCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--portal-border)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--portal-fg)]">API reference</h2>
                <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">
                  Embedded backend reference for complete request and response details.
                </p>
              </div>
              <a
                href="https://web-production-fedb.up.railway.app/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
              >
                <span>Open in new tab</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <iframe
              src="https://web-production-fedb.up.railway.app/docs"
              className="h-[760px] w-full border-0 bg-white"
              title="Pivota API reference"
            />
          </SurfaceCard>
        ) : null}
      </div>
    </div>
  );
}
