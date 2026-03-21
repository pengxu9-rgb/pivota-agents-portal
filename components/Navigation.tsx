'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  KeyRound,
  Activity,
  BarChart3,
  ShoppingCart,
  Settings,
  BookOpen,
  LogOut,
  Webhook,
  RadioTower,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import { cx } from '@/lib/cx';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  aliases?: string[];
};

const primaryNavigationItems: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'API Keys',
    href: '/api-keys',
    icon: KeyRound,
  },
  {
    name: 'API Usage',
    href: '/api-usage',
    icon: Activity,
    aliases: ['/analytics'],
  },
  {
    name: 'Webhooks',
    href: '/webhooks',
    icon: Webhook,
  },
  {
    name: 'Endpoints',
    href: '/endpoints',
    icon: RadioTower,
    aliases: ['/protocols'],
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Docs',
    href: '/docs',
    icon: BookOpen,
    aliases: ['/integration'],
  },
];

const secondaryNavigationItems: NavigationItem[] = [
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedCollapsed = window.localStorage.getItem('portal_sidebar_collapsed');

    setCollapsed(savedCollapsed === 'true');
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('portal_sidebar_collapsed', String(collapsed));
  }, [collapsed]);
  
  // Skip navigation on login/signup pages - AFTER hooks
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    return null;
  }
  
  const handleLogout = () => {
    agentApi.logout();
    router.push('/login');
  };
  
  // Get user info from localStorage
  const getUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userRaw = localStorage.getItem('agent_user');
      const agentIdRaw = localStorage.getItem('agent_id');
      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw);
          return {
            ...parsed,
            agent_id: agentIdRaw || parsed.agent_id
          };
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const user = getUserInfo();

  const isActive = (item: NavigationItem) =>
    pathname === item.href ||
    (item.href !== '/' && pathname.startsWith(item.href)) ||
    item.aliases?.some((alias) => pathname === alias || pathname.startsWith(alias));

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <Link
        key={item.name}
        href={item.href}
        title={collapsed ? item.name : undefined}
        className={cx(
          'group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium',
          collapsed ? 'justify-center' : 'gap-3',
          active
            ? 'bg-[var(--portal-sidebar-active)] text-[var(--portal-sidebar-fg-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            : 'text-[var(--portal-sidebar-fg)] hover:bg-white/5 hover:text-[var(--portal-sidebar-fg-strong)]',
        )}
      >
        {active ? <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[var(--portal-accent)]" /> : null}
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed ? <span className="truncate">{item.name}</span> : null}
      </Link>
    );
  };

  const renderSection = (
    label: string,
    items: NavigationItem[],
  ) => {
    const content = (
      <div className="space-y-1">
        {items.map((item) => renderNavItem(item))}
      </div>
    );

    if (collapsed) {
      return <div className="space-y-1">{content}</div>;
    }

    return (
      <div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {content}
      </div>
    );
  };

  return (
    <aside
      className={cx(
        'sticky top-0 hidden h-screen shrink-0 border-r border-white/8 bg-[var(--portal-sidebar)] lg:flex lg:flex-col',
        collapsed ? 'w-20' : 'w-60',
      )}
    >
      <div className="border-b border-white/8 px-4 py-4">
        <div className={cx('flex items-center justify-between', collapsed ? 'justify-center' : '')}>
          <Link href="/dashboard" className={cx('flex min-w-0 items-center', collapsed ? 'justify-center' : 'gap-3')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-[var(--portal-sidebar-fg-strong)]">
              <Command className="h-5 w-5" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[0.02em] text-[var(--portal-sidebar-fg-strong)]">Pivota</p>
                <p className="truncate text-xs text-slate-400">Developer Portal</p>
              </div>
            ) : null}
          </Link>
          {!collapsed ? (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-2 text-[var(--portal-sidebar-fg)] hover:bg-white/5 hover:text-[var(--portal-sidebar-fg-strong)]"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg p-2 text-[var(--portal-sidebar-fg)] hover:bg-white/5 hover:text-[var(--portal-sidebar-fg-strong)]"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {!collapsed && user ? (
          <div className="mt-4 rounded-xl border border-white/8 bg-white/5 px-3 py-3">
            <p
              className="truncate text-[12px] font-medium leading-5 text-[var(--portal-sidebar-fg-strong)]"
              title={user.email || undefined}
            >
              {user.email || 'No login email'}
            </p>
            <p
              className="break-all pt-0.5 font-mono text-[11px] leading-5 text-slate-500"
              title={user.agent_id || undefined}
            >
              {user.agent_id ? `ID ${user.agent_id}` : 'ID unavailable'}
            </p>
          </div>
        ) : null}
      </div>

      <nav className="portal-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {renderSection('Primary', primaryNavigationItems)}
          {renderSection('Secondary', secondaryNavigationItems)}
        </div>
      </nav>

      <div className="border-t border-white/8 p-3">
        <button
          onClick={handleLogout}
          className={cx(
            'flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-100',
            collapsed ? 'justify-center' : 'gap-3',
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}
