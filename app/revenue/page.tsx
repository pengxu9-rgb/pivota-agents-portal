'use client';

/**
 * [Phase 5.6] Agent Revenue & Settlement Dashboard
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { agentApi } from '@/lib/api-client';

export default function RevenuePage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [expectations, setExpectations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedAgentId = localStorage.getItem('agent_id');
    if (storedAgentId) {
      setAgentId(storedAgentId);
      fetchData(storedAgentId);
    } else {
      setError('No agent ID found. Please log in again.');
      setLoading(false);
    }
  }, [router]);

  const fetchData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [earningsData, settlementsData, expectationsData] = await Promise.all([
        agentApi.getRevenueEarnings(id, 30),
        agentApi.getSettlements(id),
        agentApi.getRevenueExpectations(id)
      ]);
      
      setEarnings(earningsData);
      setSettlements(settlementsData.settlements || []);
      setExpectations(expectationsData);
    } catch (err: any) {
      console.error('Failed to load revenue data:', err);
      setError(err.response?.data?.detail || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Revenue & Settlement</h1>
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Phase 5.6</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Earned (30d)</div>
            <div className="text-3xl font-bold text-green-700">
              ${earnings?.total_earned?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Pending Settlement</div>
            <div className="text-3xl font-bold text-orange-600">
              ${earnings?.pending_amount?.toFixed(2) || '0.00'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="p-2 bg-gray-100 rounded-lg w-fit mb-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Settled</div>
            <div className="text-3xl font-bold text-gray-700">
              ${earnings?.settled_amount?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Expectations */}
        {expectations?.has_expectations && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Revenue Expectations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-purple-600 mb-1">Expected Rate</div>
                <div className="text-2xl font-bold">
                  {(expectations.expected_commission_rate * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-600 mb-1">Minimum Acceptable</div>
                <div className="text-2xl font-bold">
                  {(expectations.min_acceptable_rate * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settlements */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Settlement History</h2>
          </div>
          <div className="p-6">
            {settlements.length > 0 ? (
              <div className="space-y-3">
                {settlements.map((s) => (
                  <div 
                    key={s.settlement_id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{s.settlement_id}</div>
                      <div className="text-sm text-gray-600">{s.transactions} transactions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-700">${s.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 uppercase">{s.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No settlements yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Settlement history will appear here once you start earning revenue
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}






