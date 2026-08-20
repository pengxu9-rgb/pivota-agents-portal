export type DeveloperStandardDefinition = {
  id: string;
  label: string;
  kind: 'channel_standard' | 'protocol_layer';
  status: 'live' | 'partner_access' | 'internal_beta';
  audience: 'external_partners' | 'technical_partners_internal';
  availability: string;
  summary: string;
  purpose: string;
  relationToApi: string;
  contactHref?: string;
  docsHref?: string;
};

export const developerStandards: DeveloperStandardDefinition[] = [
  {
    id: 'ucp',
    label: 'UCP (Universal Commerce Protocol)',
    kind: 'channel_standard',
    status: 'live',
    audience: 'external_partners',
    availability: 'Self-serve with your portal API key',
    summary:
      'Pivota runs a hosted UCP seller door. Any UCP-speaking agent or platform can discover it from /.well-known/ucp, search and read the catalog with the key from this portal, and run checkout once a buyer is identified.',
    purpose:
      'Use UCP when your agent already speaks the spec or you want spec-shaped catalog and checkout responses that work the same across every UCP merchant you connect to.',
    relationToApi:
      'The UCP door and the native MCP door share one executor, one catalog, and one set of money safeguards. Keep key management, webhooks, orders and analytics on the REST control plane.',
    docsHref: '/docs?tab=mcp',
  },
  {
    id: 'acp',
    label: 'ACP',
    kind: 'protocol_layer',
    status: 'internal_beta',
    audience: 'technical_partners_internal',
    availability: 'Internal and selected technical-partner beta',
    summary:
      'ACP is an agent-commerce protocol layer used in selected LLM and partner workflows. It is not the default REST integration path for external developers.',
    purpose:
      'Use ACP when a technical partner or internal system needs protocol-level agent-commerce coordination beyond direct endpoint calls.',
    relationToApi:
      'Core APIs and webhooks remain the production control surface. ACP sits above those operational surfaces and should not be treated as a self-serve portal capability.',
  },
  {
    id: 'ap2',
    label: 'AP2',
    kind: 'protocol_layer',
    status: 'internal_beta',
    audience: 'technical_partners_internal',
    availability: 'Internal and selected technical-partner beta',
    summary:
      'AP2 is a payment and security protocol layer used in selected partner and internal integrations. It is not a public self-serve surface in the developer portal.',
    purpose:
      'Use AP2 when a technical partner or internal system needs protocol-level payment coordination above the standard order and webhook flows.',
    relationToApi:
      'Daily operational integration should stay on the core APIs and webhooks. AP2 complements those surfaces for protocol-layer integrations rather than replacing them.',
  },
];
