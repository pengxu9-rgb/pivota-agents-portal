'use client';

import { useState, useEffect } from 'react';
import { agentApi } from '@/lib/api-client';

export default function DebugOrdersPage() {
  const [debug, setDebug] = useState<any>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage
    const token = localStorage.getItem('agent_token');
    const apiKey = localStorage.getItem('agent_api_key');
    const agentId = localStorage.getItem('agent_id');
    
    setDebug({
      hasToken: !!token,
      hasApiKey: !!apiKey,
      agentId,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 20)}...` : 'None',
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'None'
    });
  }, []);

  const testDirectCall = async () => {
    setLoading(true);
    setError('');
    try {
      const apiKey = localStorage.getItem('agent_api_key');
      const response = await fetch('https://web-production-fedb.up.railway.app/agent/v1/orders?limit=100', {
        headers: {
          'x-api-key': apiKey || ''
        }
      });
      
      const data = await response.json();
      console.log('Direct API response:', data);
      
      if (response.ok) {
        setOrders(data?.orders || data || []);
      } else {
        setError(`API Error: ${response.status} - ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      setError(`Fetch Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testViaClient = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await agentApi.getOrders(100);
      console.log('Client API response:', data);
      setOrders(data || []);
    } catch (err: any) {
      setError(`Client Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug Orders API</h1>
        
        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Status</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test API Calls</h2>
          <div className="flex gap-4">
            <button
              onClick={testDirectCall}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Test Direct Fetch
            </button>
            <button
              onClick={testViaClient}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Test via Client
            </button>
          </div>
          {loading && <p className="mt-4 text-gray-600">Loading...</p>}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Orders */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Orders ({orders.length})</h2>
            <div className="space-y-2">
              {orders.slice(0, 5).map((order, idx) => (
                <div key={idx} className="border-b pb-2">
                  <p className="font-mono text-sm">
                    {order.order_id || order.id} - ${order.total} - {order.status}
                  </p>
                </div>
              ))}
              {orders.length > 5 && <p className="text-gray-500">... and {orders.length - 5} more</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}













