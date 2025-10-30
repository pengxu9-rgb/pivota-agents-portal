'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Code, 
  BarChart3, 
  Store, 
  ShoppingCart, 
  Wallet, 
  Settings,
  Terminal,
  Zap,
  LogOut,
  User
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Merchants',
    href: '/merchants',
    icon: Store,
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Integration',
    href: '/integration',
    icon: Terminal,
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: Wallet,
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
  // Skip navigation on login/signup pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    return null;
  }
  
  const handleLogout = () => {
    agentApi.logout();
  };
  
  // Get user info from localStorage
  const getUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userRaw = localStorage.getItem('agent_user');
      if (userRaw) {
        try {
          return JSON.parse(userRaw);
        } catch {
          return null;
        }
      }
    }
    return null;
  };
  
  const user = getUserInfo();
  
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Pivota</span>
          </Link>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* This will be filled by page content */}
      </div>
    </div>
  );
}