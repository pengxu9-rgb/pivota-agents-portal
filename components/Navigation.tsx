'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Code, 
  BarChart3, 
  Store, 
  ShoppingCart, 
  Wallet, 
  Settings,
  FileText,
  BookOpen,
  Terminal,
  Zap
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & metrics'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance insights'
  },
  {
    name: 'Merchants',
    href: '/merchants',
    icon: Store,
    description: 'Manage merchants'
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    description: 'Order history'
  },
  {
    name: 'Integration',
    href: '/integration',
    icon: Terminal,
    description: 'MCP & API setup'
  },
  {
    name: 'Documentation',
    href: '/developers/docs',
    icon: BookOpen,
    description: 'API reference'
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: Wallet,
    description: 'Earnings'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account settings'
  },
];

export default function Navigation() {
  const pathname = usePathname();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Pivota Agent</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/wallet"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              <Wallet className="w-5 h-5" />
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 py-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

