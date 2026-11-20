'use client';

import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';

// New in portal v2: without the build-time flag this route is a 404, as it was before.
const EarningsPageV2: ComponentType | null =
  process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/components/v2/pages/EarningsPage').default
    : null;

export default function Page() {
  if (!EarningsPageV2) notFound();
  return <EarningsPageV2 />;
}
