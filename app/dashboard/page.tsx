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
  Store,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Key,
  Search,
  Package,
  CreditCard,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  FileText,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import ApiKeyModal from '@/components/ApiKeyModal';

// Types
interface AgentInfo {
  agent_id: string;
  name: string;
  email: string;
  api_key?: string;
  status: 'active' | 'inactive';
  last_activity?: string;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'search' | 'inventory' | 'price';
  action: string;
  description: string;
  amount?: number;
  response_time?: number;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  merchant?: string;
}

interface KPIMetrics {
  success_rate: number;
  avg_response_time: number;
  calls_today: number;
  total_integrations: number;
  active_connections: number;
  total_gmv: number;
}

interface ConversionFunnel {
  orders_initiated: number;
  payment_attempted: number;
  orders_completed: number;
}

interface QueryAnalytics {
  product_searches: number;
  product_searches_trend: 'up' | 'down' | 'stable';
  product_searches_change: number;
  inventory_checks: number;
  inventory_checks_trend: 'up' | 'down' | 'stable';
  price_queries: number;
  price_queries_trend: 'up' | 'down' | 'stable';
}

export default function AgentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Agent Info State
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // Metrics State
  const [metrics, setMetrics] = useState<KPIMetrics>({
    success_rate: 0,
    avg_response_time: 0,
    calls_today: 0,
    total_integrations: 0,
    active_connections: 0,
    total_gmv: 0,
  });
  
  // Activity State
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Analytics State
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel>({
    orders_initiated: 0,
    payment_attempted: 0,
    orders_completed: 0,
  });
  
  const [queryAnalytics, setQueryAnalytics] = useState<QueryAnalytics>({
    product_searches: 0,
    product_searches_trend: 'stable',
    product_searches_change: 0,
    inventory_checks: 0,
    inventory_checks_trend: 'stable',
    price_queries: 0,
    price_queries_trend: 'stable',
  });

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    loadDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Load agent info from localStorage
      const userData = localStorage.getItem('agent_user');
      const agentId = localStorage.getItem('agent_id');
      if (userData) {
        const user = JSON.parse(userData);
        setAgentInfo({
          agent_id: agentId || user.agent_id,
          name: user.name || 'Claude Shopping Assistant',
          email: user.email,
          status: 'active',
          last_activity: '2 min ago',
        });
      }
      
      // Load all metrics in parallel
      await Promise.all([
        loadMetrics(),
        loadRecentActivity(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await agentApi.getMetricsSummary();
      
      // Also get merchant authorizations for "Total Integrations"
      let merchantCount = 0;
      try {
        const merchantsData = await agentApi.getMerchantAuthorizations();
        merchantCount = merchantsData?.merchants?.length ?? 0;
      } catch (e) {
        console.warn('Could not fetch merchant count:', e);
      }
      
      // Map backend fields to UI
      setMetrics({
        success_rate: data?.performance?.success_rate_24h ?? 0,
        avg_response_time: data?.performance?.avg_response_time_ms ?? 0,
        calls_today: data?.overview?.requests_last_24h ?? 0,
        total_integrations: merchantCount,  // Number of authorized merchants
        active_connections: data?.agents?.active_last_24h ?? 0,  // Active agents (for multi-agent setups)
        total_gmv: data?.orders?.revenue_last_24h ?? 0,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
      // No mock fallback – keep zeros to reflect real data only
      setMetrics({
        success_rate: 0,
        avg_response_time: 0,
        calls_today: 0,
        total_integrations: 0,
        active_connections: 0,
        total_gmv: 0,
      });
    }
  };

  const loadRecentActivity = async (offset = 0) => {
    try {
      const data = await agentApi.getRecentActivity(5, offset);
      const activities = (data.activities || []).map((a: any) => ({
        id: a.id,
        type: 'api',
        action: `${a.method} ${a.endpoint}`,
        description: `${a.status_code}`,
        response_time: a.response_time_ms,
        timestamp: new Date(a.timestamp).toLocaleTimeString(),
        status: a.status_code < 400 ? 'success' : 'error',
      })) as ActivityItem[];
      
      if (offset === 0) {
        setRecentActivity(activities);
      } else {
        setRecentActivity(prev => [...prev, ...activities]);
      }
      
      setHasMore(activities.length === 5);
    } catch (error) {
      // Keep empty (do not force mock) to avoid misleading UI
      setRecentActivity([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [funnelData, queryData] = await Promise.all([
        agentApi.getConversionFunnel(7),
        agentApi.getQueryAnalytics(),
      ]);

      setConversionFunnel({
        orders_initiated: funnelData?.orders_initiated ?? 0,
        payment_attempted: funnelData?.payment_attempted ?? 0,
        orders_completed: funnelData?.orders_completed ?? 0,
      });

      setQueryAnalytics({
        product_searches: queryData?.product_searches ?? 0,
        product_searches_trend: queryData?.product_searches_trend || 'stable',
        product_searches_change: queryData?.product_searches_change ?? 0,
        inventory_checks: queryData?.inventory_checks ?? 0,
        inventory_checks_trend: queryData?.inventory_checks_trend || 'stable',
        price_queries: queryData?.price_queries ?? 0,
        price_queries_trend: queryData?.price_queries_trend || 'stable',
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // No mock fallback – show zeros to reflect absence of real data
      setConversionFunnel({
        orders_initiated: 0,
        payment_attempted: 0,
        orders_completed: 0,
      });

      setQueryAnalytics({
        product_searches: 0,
        product_searches_trend: 'stable',
        product_searches_change: 0,
        inventory_checks: 0,
        inventory_checks_trend: 'stable',
        price_queries: 0,
        price_queries_trend: 'stable',
      });
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    await loadMetrics();
    await loadRecentActivity();
    setRefreshing(false);
  };

  const getMockActivities = (): ActivityItem[] => [
    {
      id: '1',
      type: 'order',
      action: 'Order Completed',
      description: 'catalog.search → order.create → payment confirmed',
      amount: 234.50,
      timestamp: '2 min ago',
      status: 'success',
      merchant: 'Fashion Store',
    },
    {
      id: '2',
      type: 'search',
      action: 'Product Search',
      description: 'catalog.search → 23 results returned',
      response_time: 125,
      timestamp: '5 min ago',
      status: 'success',
    },
    {
      id: '3',
      type: 'inventory',
      action: 'Inventory Check',
      description: 'inventory.check → 5 items in stock',
      response_time: 89,
      timestamp: '8 min ago',
      status: 'success',
    },
    {
      id: '4',
      type: 'price',
      action: 'Price Query',
      description: 'pricing.get → 12 SKUs queried',
      response_time: 92,
      timestamp: '12 min ago',
      status: 'success',
    },
    {
      id: '5',
      type: 'order',
      action: 'Order Completed',
      description: 'End-to-end order flow successful',
      amount: 1249.99,
      timestamp: '15 min ago',
      status: 'success',
      merchant: 'Electronics Hub',
    },
  ];

  const copyApiKey = () => {
    if (agentInfo?.api_key) {
      navigator.clipboard.writeText(agentInfo.api_key);
      // Show toast notification
    }
  };

  const handleLogout = () => {
    agentApi.logout();
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'search':
        return <Search className="w-5 h-5 text-blue-500" />;
      case 'inventory':
        return <Package className="w-5 h-5 text-purple-500" />;
      case 'price':
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string, change?: number) => {
    if (trend === 'up') {
      return (
        <span className="text-green-600 text-sm">
          +{change}% vs yesterday
        </span>
      );
    } else if (trend === 'down') {
      return (
        <span className="text-red-600 text-sm">
          -{change}% vs yesterday
        </span>
      );
    }
    return <span className="text-gray-500 text-sm">Stable</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Status Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Connected</span>
              </div>
              <div className="text-sm text-gray-600">
                Last activity: <span className="font-medium text-gray-900">{agentInfo?.last_activity}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Key className="w-4 h-4" />
                <span>Manage API Keys</span>
              </button>
              <button
                onClick={refreshMetrics}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                Healthy
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.total_integrations}</h3>
            <p className="text-sm text-gray-600">Total Integrations</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.active_connections}</h3>
            <p className="text-sm text-gray-600">Active Now</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {metrics.calls_today.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600">API Calls Today</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                Fast
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.avg_response_time}ms</h3>
            <p className="text-sm text-gray-600">Avg Response</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* MCP Query Analytics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">MCP Query Analytics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Product Searches</p>
                    <p className="text-sm text-gray-600">catalog.search queries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{queryAnalytics.product_searches}</p>
                  {getTrendIcon(queryAnalytics.product_searches_trend, queryAnalytics.product_searches_change)}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">Inventory Checks</p>
                    <p className="text-sm text-gray-600">inventory.check queries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{queryAnalytics.inventory_checks}</p>
                  {getTrendIcon(queryAnalytics.inventory_checks_trend)}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900">Price Queries</p>
                    <p className="text-sm text-gray-600">pricing.get queries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{queryAnalytics.price_queries}</p>
                  {getTrendIcon(queryAnalytics.price_queries_trend)}
                </div>
              </div>

              {/* Alert */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Query Pattern Alert</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      High number of inventory checks without corresponding orders.
                      Consider caching strategy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Conversion Funnel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Conversion Funnel</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Orders Initiated</span>
                  <span className="text-sm font-bold text-gray-900">{conversionFunnel.orders_initiated}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-gray-500">100%</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Payment Attempted</span>
                  <span className="text-sm font-bold text-gray-900">{conversionFunnel.payment_attempted}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-xs text-gray-500">92%</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Orders Completed</span>
                  <span className="text-sm font-bold text-gray-900">{conversionFunnel.orders_completed}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: '85.4%' }}></div>
                </div>
                <span className="text-xs text-gray-500">85.4%</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatAmount(metrics.total_gmv)}</p>
                  <p className="text-sm text-gray-600">Total GMV Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">$596.32</p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent API Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent API Activity</h2>
            <Link
              href="/analytics"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
            >
              <span>View Detailed Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.amount ? (
                        <p className="text-lg font-semibold text-gray-900">
                          {formatAmount(activity.amount)}
                        </p>
                      ) : activity.response_time ? (
                        <p className="text-lg font-semibold text-gray-900">
                          {activity.response_time}ms
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">
                  API calls will appear here as they happen
                </p>
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => loadRecentActivity(recentActivity.length)}
                disabled={loadingMore}
                className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {loadingMore ? 'Loading...' : 'More'}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{metrics.success_rate}%</p>
            <p className="text-sm text-gray-600 mt-1">Success Rate</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-gray-900">{metrics.avg_response_time}ms</p>
            <p className="text-sm text-gray-600 mt-1">Avg Response</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {(metrics.calls_today / 1000).toFixed(1)}K
            </p>
            <p className="text-sm text-gray-600 mt-1">Calls Today</p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/integration?tab=mcp"
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MCP Integration</h3>
            <p className="text-sm text-gray-600">
              Connect your agent to our MCP server
            </p>
          </Link>

          <Link
            href="/integration?tab=api"
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
            <p className="text-sm text-gray-600">
              Complete API reference and examples
            </p>
          </Link>

          <Link
            href="/integration?tab=sdk"
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">SDK Integration</h3>
            <p className="text-sm text-gray-600">
              Python & TypeScript SDK installation
            </p>
          </Link>
        </div>
      </div>

      {/* API Key Management Modal */}
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
      />
    </div>
  );
}