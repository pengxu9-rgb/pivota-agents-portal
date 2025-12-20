'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    void loadAnalytics();
    const t = setInterval(loadAnalytics, 30000);
    return () => clearInterval(t);
  }, [router, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [summary, tline] = await Promise.all([
        agentApi.getMetricsSummary(),
        agentApi.getAgentTimeline(24),
      ]);
      setStats({
        total_api_calls: summary?.overview?.total_requests ?? 0,  // Use total_requests instead of non-existent requests_last_7d
        total_orders: summary?.orders?.total_orders ?? 0,  // Use all-time total_orders
        total_gmv: summary?.orders?.total_revenue ?? 0,  // Use all-time total_revenue
        success_rate: summary?.performance?.success_rate_24h ?? 0,
        endpoint_usage: summary?.top_endpoints?.map((e: any) => ({ path: e.endpoint, method: 'GET', count: e.count })) ?? [],
      });
      setTimeline(tline?.timeline || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          {loading && (
            <p className="mt-2 text-sm text-gray-500">Updating analytics…</p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="p-2 bg-purple-100 rounded-lg w-fit mb-4">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.total_api_calls || 0}
              </h3>
              <p className="text-sm text-gray-600">Total API Calls</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="p-2 bg-blue-100 rounded-lg w-fit mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.total_orders || 0}
              </h3>
              <p className="text-sm text-gray-600">Orders Placed</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="p-2 bg-green-100 rounded-lg w-fit mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {(stats?.total_gmv || 0) >= 1000 
                  ? `$${((stats?.total_gmv || 0) / 1000).toFixed(1)}k`
                  : `$${(stats?.total_gmv || 0).toFixed(2)}`
                }
              </h3>
              <p className="text-sm text-gray-600">GMV Generated</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="p-2 bg-orange-100 rounded-lg w-fit mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.success_rate || 0}%
              </h3>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>

          {/* Performance Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Performance Timeline (past 24h)</h2>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <p className="text-gray-500">No timeline data yet.</p>
              ) : (
                timeline.map((row: any) => (
                  <div key={row.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{new Date(row.hour).toLocaleString()}</span>
                    <div className="flex items-center space-x-6">
                      <span className="text-gray-800">Total: {row.total_requests}</span>
                      <span className="text-green-700">OK: {row.successful_requests}</span>
                      <span className="text-purple-700">Avg: {row.avg_response_time_ms}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* API Usage by Endpoint */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">API Usage by Endpoint</h2>
            <div className="space-y-3">
              {stats?.endpoint_usage && stats.endpoint_usage.length > 0 ? (
                stats.endpoint_usage.map((endpoint: any) => (
                  <div
                    key={endpoint.path}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{endpoint.path}</p>
                      <p className="text-sm text-gray-600">{endpoint.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{endpoint.count || 0}</p>
                      <p className="text-xs text-gray-500">calls</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No usage data available</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
