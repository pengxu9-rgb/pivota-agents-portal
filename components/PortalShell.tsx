'use client';

import type { ComponentType, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

const AUTHLESS_ROUTES = new Set(['/', '/login', '/signup', '/forgot-password', '/reset-password', '/onboarding']);

// Portal v2 shell, behind a build-time flag. The literal env comparison lets webpack drop
// the require (and the v2 CSS and fonts it pulls in) from flag-off builds entirely.
const PortalShellV2: ComponentType<{ children: ReactNode }> | null =
  process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/components/v2/PortalShellV2').default
    : null;

export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (AUTHLESS_ROUTES.has(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (PortalShellV2) {
    return <PortalShellV2>{children}</PortalShellV2>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--portal-canvas)] text-[var(--portal-fg)]">
      <Navigation />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
