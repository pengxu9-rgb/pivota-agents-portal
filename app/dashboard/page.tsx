'use client';

import type { ComponentType } from 'react';
import LegacyDashboardPage from '@/components/pages/legacy/DashboardPage';

// Portal v2 Home behind the build-time flag; the literal comparison keeps it out of flag-off builds.
const HomePageV2: ComponentType | null =
  process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/components/v2/pages/HomePage').default
    : null;

export default function DashboardPage() {
  return HomePageV2 ? <HomePageV2 /> : <LegacyDashboardPage />;
}
