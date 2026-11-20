'use client';

/**
 * Portal v2 shell: a 224px sidebar and a 56px top bar; below 1024px the sidebar is a drawer.
 *
 * Deliberately absent until they have a backend (build-readiness review M6/M7):
 * no Sandbox switch (there is no real test mode), no ⌘K search, no notifications and
 * no account switcher. Only loaded when NEXT_PUBLIC_FEATURE_PORTAL_V2 is on.
 */
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@/styles/pivota-tokens.css';
import './portal-v2.css';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, Settings, X } from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import { V2_NAV_BOTTOM, V2_NAV_DEVELOPERS, V2_NAV_MAIN, isNavItemActive, type V2NavItem } from './nav';

type StoredUser = { name?: string; agent_name?: string; email?: string; company?: string } | null;

function readStoredUser(): StoredUser {
  try {
    const raw = window.localStorage.getItem('agent_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initialsOf(value: string) {
  const parts = value.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || '?').slice(0, 2);
  return letters.toUpperCase();
}

function NavLink({ item, pathname }: { item: V2NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isNavItemActive(item, pathname);
  return (
    <Link href={item.href} className="pv2-nav" aria-current={active ? 'page' : undefined}>
      <Icon aria-hidden="true" />
      {item.name}
    </Link>
  );
}

export default function PortalShellV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [user, setUser] = React.useState<StoredUser>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setUser(readStoredUser());
  }, []);

  // Close the drawer and the account menu on every navigation.
  React.useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Phone drawer: move focus into it on open.
  React.useEffect(() => {
    if (drawerOpen) document.querySelector<HTMLElement>('#pv2-sidebar a')?.focus();
  }, [drawerOpen]);

  React.useEffect(() => {
    if (!drawerOpen && !menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        if (menuOpen) {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }
      }
    };
    const onClick = (event: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [drawerOpen, menuOpen]);

  const displayName = user?.agent_name || user?.name || user?.company || 'Your agent';
  const email = user?.email || '';
  const allItems = [...V2_NAV_MAIN, ...V2_NAV_DEVELOPERS, ...V2_NAV_BOTTOM];
  const current = allItems.find((item) => isNavItemActive(item, pathname));

  const signOut = () => {
    agentApi.logout();
    router.push('/login');
  };

  return (
    <div className="pv2" data-drawer={drawerOpen ? 'open' : 'closed'}>
      <div className="pv2-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside className="pv2-side" id="pv2-sidebar" aria-label="Sidebar">
        <div className="pv2-account">
          <span className="pv2-logo" aria-hidden="true">p</span>
          <span className="pv2-account-name">
            <span title={displayName}>{displayName}</span>
            <span>Developer</span>
          </span>
        </div>
        <nav aria-label="Main" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {V2_NAV_MAIN.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <div className="pv2-grp">Developers</div>
          {V2_NAV_DEVELOPERS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="pv2-side-spacer" />
        <nav aria-label="Account" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {V2_NAV_BOTTOM.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>

      <div className="pv2-body">
        <header className="pv2-top">
          <button
            type="button"
            className="pv2-iconbtn pv2-menu-btn"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-controls="pv2-sidebar"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <span className="pv2-top-title">{current?.name || 'Pivota'}</span>
          <div className="pv2-top-spacer" />
          <div className="pv2-acct" ref={menuRef}>
            <button
              ref={menuButtonRef}
              type="button"
              className="pv2-avatar"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {initialsOf(email || displayName)}
            </button>
            {menuOpen ? (
              <div className="pv2-menu" role="menu">
                <div className="pv2-menu-head">
                  <div className="pv2-strong">{displayName}</div>
                  {email ? <div className="pv2-muted pv2-small">{email}</div> : null}
                </div>
                <Link href="/settings" className="pv2-menu-item" role="menuitem">
                  <Settings aria-hidden="true" />
                  Settings
                </Link>
                <button type="button" className="pv2-menu-item" role="menuitem" onClick={signOut}>
                  <LogOut aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
