import type { ComponentType, SVGProps } from 'react';
import { BookOpen, House, KeyRound, ScrollText, Settings, ShoppingCart, Webhook } from 'lucide-react';

export type V2NavItem = {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  aliases?: string[];
};

// Merchants is out of the nav (it is a redirect stub). Usage is held until a per-developer
// MCP call log exists, so it has no entry.
export const V2_NAV_MAIN: V2NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: House },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
];

export const V2_NAV_DEVELOPERS: V2NavItem[] = [
  { name: 'API keys', href: '/api-keys', icon: KeyRound },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Logs', href: '/logs', icon: ScrollText, aliases: ['/api-usage', '/analytics', '/endpoints'] },
  { name: 'Docs', href: '/docs', icon: BookOpen, aliases: ['/integration', '/channels', '/protocols'] },
];

export const V2_NAV_BOTTOM: V2NavItem[] = [{ name: 'Settings', href: '/settings', icon: Settings }];

export function isNavItemActive(item: V2NavItem, pathname: string) {
  return [item.href, ...(item.aliases || [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
