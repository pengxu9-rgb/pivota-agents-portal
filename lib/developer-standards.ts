export type DeveloperStandardDefinition = {
  id: string;
  label: string;
  kind: 'channel_standard' | 'protocol_layer';
  status: 'partner_access' | 'internal_beta';
  audience: 'external_partners' | 'technical_partners_internal';
  availability: string;
  summary: string;
  purpose: string;
  relationToApi: string;
  contactHref?: string;
};

export const developerStandards: DeveloperStandardDefinition[] = [
  {
    id: 'google_ucp',
    label: 'Google UCP',
    kind: 'channel_standard',
    status: 'partner_access',
    audience: 'external_partners',
    availability: 'Limited availability',
    summary: 'Google UCP support is available through partner onboarding and staged rollout for approved integrations.',
    purpose:
      'Use Google UCP when a partner-approved distribution or catalog standard needs to sit on top of Pivota-managed commerce flows.',
    relationToApi:
      'Google UCP is not a default REST integration path. Keep order operations, API keys, and webhooks on the core Pivota APIs, then layer Google UCP on top when onboarding is approved.',
    contactHref: 'mailto:contact@pivota.cc?subject=Google%20UCP%20Partner%20Access',
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
