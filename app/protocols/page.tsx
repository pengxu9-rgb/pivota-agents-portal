'use client';

/**
 * [Phase 6] Agent Protocol Setup Page
 * Displays enabled payment protocols (AP2, ACP, X-402)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle, XCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

interface Protocol {
  protocol_name: string;
  version: string;
  status: string;
  last_verified_at: string | null;
  created_at: string;
  specification?: any;
  endpoints?: any;
}

export default function ProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check auth after mounting
    const token = localStorage.getItem('agent_token');
    if (!token) {
      setError('Please login to view protocols');
      setLoading(false);
      // Redirect after showing message
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    // Fetch protocols
    fetchProtocols();
  }, [router]);

  const fetchProtocols = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) {
        setError('No agent ID found');
        setLoading(false);
        return;
      }

      const data = await agentApi.getProtocols(agentId);
      setProtocols(data.protocols || data || []);
    } catch (err: any) {
      console.error('Failed to load protocols:', err);
      
      // Handle mixed content error specifically
      if (err.message && err.message.includes('Network')) {
        setError('Connection error: Please check your network connection');
      } else if (err.response?.status === 404) {
        // 404 is okay - just means no protocols configured yet
        setProtocols([]);
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to load protocols');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'enabled':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
      case 'disabled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'enabled':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'inactive':
      case 'disabled':
        return <XCircle className="h-6 w-6 text-gray-400" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Protocol Setup</h1>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Phase 6</span>
            </div>
            <button
              onClick={fetchProtocols}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh protocols"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {protocols.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Protocols Configured</h3>
            <p className="text-gray-600 mb-6">
              No payment protocols have been enabled for your agent yet.
            </p>
            <p className="text-sm text-gray-500">
              Contact support to enable AP2, ACP, or X-402 protocols for your integration.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {protocols.map(protocol => (
              <div key={protocol.protocol_name} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{protocol.protocol_name}</h3>
                  {getStatusIcon(protocol.status)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(protocol.status)}`}>
                      {protocol.status || 'Unknown'}
                    </span>
                  </div>
                  
                  {protocol.version && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">{protocol.version}</span>
                    </div>
                  )}
                  
                  {protocol.last_verified_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Tested:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(protocol.last_verified_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {protocol.created_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Enabled Since:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(protocol.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {protocol.endpoints && Object.keys(protocol.endpoints).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-600 mb-2">Endpoints:</p>
                    <div className="space-y-1">
                      {Object.entries(protocol.endpoints).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-gray-500">{key}:</span>
                          <span className="ml-1 text-gray-700 font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Standard Protocols Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Supported Payment Protocols</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-900">AP2 (Agent Payment Protocol v2)</p>
              <p className="text-blue-700 text-xs mt-1">Real-time payment processing with advanced routing</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">ACP (Agent Commission Protocol)</p>
              <p className="text-blue-700 text-xs mt-1">Commission calculation and settlement tracking</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">X-402 (Extended Protocol)</p>
              <p className="text-blue-700 text-xs mt-1">Extended features for enterprise integrations</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
