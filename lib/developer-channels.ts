export type DeveloperChannelDefinition = {
  id: string;
  label: string;
  status: 'partner_access' | 'beta' | 'planned';
  audience: 'external_partners' | 'internal';
  summary: string;
  availability: string;
  purpose: string;
  relationToApi: string;
  docsHref: string;
  contactHref: string;
};

export const developerChannels: DeveloperChannelDefinition[] = [
  {
    id: 'google_ucp',
    label: 'Google UCP',
    status: 'partner_access',
    audience: 'external_partners',
    summary: 'Google UCP support is available through partner onboarding and staged rollout.',
    availability: 'Limited availability',
    purpose: 'Use this channel when you need a Google-facing distribution standard layered on top of Pivota-managed commerce flows for approved partner integrations.',
    relationToApi:
      'Google UCP is a channel standard, not a direct REST endpoint. Keep operational integration on the core Pivota APIs and webhooks, then layer Google UCP on top when partner onboarding is approved.',
    docsHref: '/docs?tab=channels',
    contactHref: 'mailto:contact@pivota.cc?subject=Google%20UCP%20Partner%20Access',
  },
];
