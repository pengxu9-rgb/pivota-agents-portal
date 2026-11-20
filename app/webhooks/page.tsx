'use client';

import type { ComponentType } from 'react';
import WebhooksPage from '@/components/pages/WebhooksPage';

// Portal v2 behind the build-time flag; the literal comparison keeps it out of flag-off builds.
const WebhooksPageV2: ComponentType | null =
  process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/components/v2/pages/WebhooksPage').default
    : null;

export default function Page() {
  return WebhooksPageV2 ? <WebhooksPageV2 /> : <WebhooksPage />;
}
