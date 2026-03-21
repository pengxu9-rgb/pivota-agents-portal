'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

const AUTHLESS_ROUTES = new Set(['/', '/login', '/signup']);

export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (AUTHLESS_ROUTES.has(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--portal-canvas)] text-[var(--portal-fg)]">
      <Navigation />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
