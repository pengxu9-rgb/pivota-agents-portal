'use client';

import type { ComponentType } from 'react';
import LegacyApiKeysPage from '@/components/pages/legacy/ApiKeysPage';

// Portal v2 behind the build-time flag; the literal comparison keeps it out of flag-off builds.
const KeysPageV2: ComponentType | null =
  process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/components/v2/pages/KeysPage').default
    : null;

export default function ApiKeysPage() {
  return KeysPageV2 ? <KeysPageV2 /> : <LegacyApiKeysPage />;
}
