import { API_CONFIG } from '@/lib/config';

/**
 * The hosted surfaces an agent can connect to with the key issued by this portal.
 *
 * Every endpoint, header and tool name here was exercised against production with a
 * freshly issued portal key (2026-08-19): REST 200, /ucp/mcp tools/list → 6 tools,
 * /mcp tools/list → 13 tools, checkout without a buyer → USER_AUTH_REQUIRED.
 * Keep this file the single place those facts live; the docs page renders from it.
 */

export type AgentDoorId = 'ucp' | 'mcp' | 'public_read' | 'rest';

export type AgentDoor = {
  id: AgentDoorId;
  label: string;
  endpoint: string;
  transport: string;
  auth: string;
  bestFor: string;
  tools: string[];
  discovery?: { label: string; href: string }[];
};

const KEY_PLACEHOLDER = 'ak_live_YOUR_KEY';

export const UCP_RESOURCE = `${API_CONFIG.COMMERCE_MCP_BASE_URL}/ucp/mcp`;
export const NATIVE_MCP_RESOURCE = `${API_CONFIG.COMMERCE_MCP_BASE_URL}/mcp`;

// THESE LISTS GO STALE BY DESIGN. The page renders `door.tools.length`, never a hardcoded number, so a
// stale list reads as fewer tools rather than a wrong count. Update them when a tool joins a door —
// PIVOTA-Agent's canonicalContract (`ucpTool` for UCP, `mcp` for native) and publicReadToolSurface are the
// sources; the live UCP set is readable unauthenticated at https://commerce.mcp.pivota.cc/.well-known/ucp.
export const UCP_TOOLS = ['search_catalog', 'get_product', 'create_checkout', 'update_checkout', 'get_checkout', 'complete_checkout'];

export const NATIVE_MCP_TOOLS = [
  'search_catalog',
  'get_product',
  'get_alternatives',
  'get_offers',
  'get_intel',
  'create_checkout_session',
  'update_checkout_session',
  'get_checkout_session',
  'complete_checkout_session',
  'create_payment_link',
  'cancel_checkout_session',
  'get_order',
  'request_after_sales',
];

export const PUBLIC_READ_TOOLS = ['search_catalog', 'get_product', 'get_intel', 'get_alternatives'];

export const agentDoors: AgentDoor[] = [
  {
    id: 'ucp',
    label: 'UCP door',
    endpoint: UCP_RESOURCE,
    transport: 'MCP over HTTPS (JSON-RPC), UCP 2026-04-08 tool names and argument shapes',
    auth: 'X-Agent-API-Key: ak_live_… — or an OAuth bearer token for checkout (see Buyer identity)',
    bestFor: 'Agents and platforms that speak the Universal Commerce Protocol: spec-shaped catalog search, product lookup, checkout and fulfillment.',
    tools: UCP_TOOLS,
    discovery: [
      { label: 'UCP profile', href: `${API_CONFIG.COMMERCE_MCP_BASE_URL}/.well-known/ucp` },
      { label: 'Protected-resource metadata', href: `${API_CONFIG.COMMERCE_MCP_BASE_URL}/.well-known/oauth-protected-resource/ucp/mcp` },
    ],
  },
  {
    id: 'mcp',
    label: 'Native MCP door',
    endpoint: NATIVE_MCP_RESOURCE,
    transport: 'MCP over HTTPS (JSON-RPC), Pivota-native tool names',
    auth: 'X-Agent-API-Key: ak_live_… — or an OAuth bearer token for checkout',
    bestFor:
      'Agents that want the full surface: search and product reads plus the decision layer (alternatives, cross-merchant offers, reviewed intel), payment links, orders and after-sales. Everything under checkout and orders needs a verified end user; catalog and insights reads run on the key alone.',
    tools: NATIVE_MCP_TOOLS,
    discovery: [{ label: 'Protected-resource metadata', href: `${API_CONFIG.COMMERCE_MCP_BASE_URL}/.well-known/oauth-protected-resource/mcp` }],
  },
  {
    id: 'public_read',
    label: 'Public read door',
    endpoint: `${API_CONFIG.PUBLIC_READ_MCP_BASE_URL}/mcp`,
    transport: 'MCP over HTTPS (JSON-RPC), no credentials',
    auth: 'None. Anonymous, read-only, rate-limited.',
    bestFor: 'Trying the catalog before you have a key, or read-only assistants that never transact.',
    tools: PUBLIC_READ_TOOLS,
  },
  {
    id: 'rest',
    label: 'REST control plane',
    endpoint: API_CONFIG.AGENT_API_V1_BASE_URL,
    transport: 'HTTPS / JSON',
    auth: 'X-API-Key: ak_live_…',
    bestFor: 'Merchants you are authorized for, orders, after-sales, webhooks, usage and analytics — the operational surface behind the agent doors.',
    tools: [],
  },
];

const jsonRpc = (id: number, method: string, params?: unknown) =>
  JSON.stringify(params === undefined ? { jsonrpc: '2.0', id, method } : { jsonrpc: '2.0', id, method, params }, null, 2);

export const DOOR_EXAMPLES = {
  ucpToolsList: `curl -sS ${UCP_RESOURCE} \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-API-Key: ${KEY_PLACEHOLDER}" \\
  --data '${jsonRpc(1, 'tools/list')}'`,

  ucpSearch: `curl -sS ${UCP_RESOURCE} \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-API-Key: ${KEY_PLACEHOLDER}" \\
  --data '${jsonRpc(2, 'tools/call', {
    name: 'search_catalog',
    arguments: {
      meta: {},
      catalog: {
        query: 'niacinamide serum for sensitive skin',
        pagination: { limit: 10 },
        context: { currency: 'USD' },
        filters: { price: { min: 500, max: 6000 }, available: true },
      },
    },
  })}'`,

  ucpGetProduct: `curl -sS ${UCP_RESOURCE} \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-API-Key: ${KEY_PLACEHOLDER}" \\
  --data '${jsonRpc(3, 'tools/call', { name: 'get_product', arguments: { meta: {}, catalog: { id: 'sig_PRODUCT_ID_FROM_SEARCH' } } })}'`,

  mcpIntel: `curl -sS ${NATIVE_MCP_RESOURCE} \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-API-Key: ${KEY_PLACEHOLDER}" \\
  --data '${jsonRpc(4, 'tools/call', { name: 'get_intel', arguments: { product_id: 'sig_PRODUCT_ID_FROM_SEARCH' } })}'`,

  oauthRegister: `curl -sS -X POST ${API_CONFIG.BASE_URL}/oauth/register \\
  -H "Content-Type: application/json" \\
  --data '{
    "client_name": "Your agent",
    "redirect_uris": ["https://your-agent.example/oauth/pivota/callback"],
    "token_endpoint_auth_method": "none"
  }'`,

  oauthAuthorize: `${API_CONFIG.BASE_URL}/oauth/authorize
  ?response_type=code
  &client_id=mcpc_YOUR_CLIENT_ID
  &redirect_uri=https://your-agent.example/oauth/pivota/callback
  &scope=pivota.checkout
  &code_challenge=S256_CHALLENGE&code_challenge_method=S256
  &resource=${UCP_RESOURCE}
  &state=OPAQUE_STATE`,

  oauthToken: `curl -sS -X POST ${API_CONFIG.BASE_URL}/oauth/token \\
  --data-urlencode "grant_type=authorization_code" \\
  --data-urlencode "client_id=mcpc_YOUR_CLIENT_ID" \\
  --data-urlencode "code=CODE_FROM_REDIRECT" \\
  --data-urlencode "code_verifier=PKCE_VERIFIER" \\
  --data-urlencode "redirect_uri=https://your-agent.example/oauth/pivota/callback" \\
  --data-urlencode "resource=${UCP_RESOURCE}"`,

  bearerCall: `curl -sS ${UCP_RESOURCE} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ACCESS_TOKEN_FOR_THIS_USER" \\
  -H "Mcp-Session-Id: YOUR_STABLE_SESSION_ID" \\
  --data '${jsonRpc(5, 'tools/call', {
    name: 'create_checkout',
    arguments: {
      meta: { 'idempotency-key': 'YOUR_UNIQUE_KEY' },
      checkout: { line_items: [{ item: { id: 'sig_PRODUCT_ID' }, quantity: 1 }] },
    },
  })}'`,

  localStdio: `{
  "mcpServers": {
    "pivota": {
      "command": "npx",
      "args": ["-y", "pivota-mcp-server"],
      "env": {
        "PIVOTA_API_KEY": "${KEY_PLACEHOLDER}"
      }
    }
  }
}`,
};

export const OAUTH_METADATA_URL = `${API_CONFIG.BASE_URL}/.well-known/oauth-authorization-server`;
