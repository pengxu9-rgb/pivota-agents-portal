'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Code,
  Settings,
  LogOut,
  BarChart3,
  Zap,
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    apiCalls: 0,
    orders: 0,
    gmv: 0,
    successRate: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    const userData = localStorage.getItem('agent_user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      const [statsData, ordersData] = await Promise.all([
        agentApi.getStats(30).catch(() => null),
        agentApi.getOrders(10).catch(() => ({ orders: [] })),
      ]);

      if (statsData) {
        setStats({
          apiCalls: statsData.total_api_calls || 0,
          orders: statsData.total_orders || 0,
          gmv: statsData.total_gmv || 0,
          successRate: statsData.success_rate || 0,
        });
      }

      setRecentOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    agentApi.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.apiCalls}</h3>
              <p className="text-sm text-gray-600">API Calls (30d)</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.orders}</h3>
              <p className="text-sm text-gray-600">Orders Placed</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ${(stats.gmv / 1000).toFixed(1)}k
              </h3>
              <p className="text-sm text-gray-600">GMV Generated</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.successRate}%</h3>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/integration"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow block"
            >
              <Code className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Integration Guide</h3>
              <p className="text-sm text-gray-600">API documentation and code examples</p>
            </Link>

            <Link
              href="/analytics"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow block"
            >
              <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">Detailed performance insights</p>
            </Link>

            <Link
              href="/settings"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow block"
            >
              <Settings className="w-8 h-8 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-sm text-gray-600">Manage your agent configuration</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
            </div>
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.order_number || order.id}</p>
                        <p className="text-sm text-gray-600">${order.total_amount || 0}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No orders yet</p>
                  <p className="text-sm mt-1">Orders placed through the API will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
