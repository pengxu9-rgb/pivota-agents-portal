'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, Search, Eye, BarChart3, CheckCircle } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

export default function MerchantsManagementPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadMerchants();
  }, [router]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getMerchantAuthorizations();
      const merchantList = data?.merchants || [];
      
      // Map to UI format with real data
      const formatted = merchantList.map((m: any) => ({
        id: m.merchant_id,
        name: m.business_name || m.name || 'Unknown Merchant',
        email: m.contact_email || m.email || 'N/A',
        status: m.status || 'active',
        gmv: m.total_gmv || 0,
        orders: m.total_orders || 0,
        store_url: m.store_url,
        region: m.region,
      }));
      
      setMerchants(formatted);
    } catch (error) {
      console.error('Failed to load merchants:', error);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m =>
    searchTerm === '' ||
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Merchants</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search merchants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Merchants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMerchants.map((merchant) => (
              <div key={merchant.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Store className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{merchant.name}</h3>
                      <p className="text-xs text-gray-500">{merchant.email}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">GMV</p>
                    <p className="text-lg font-bold text-gray-900">
                      {merchant.gmv >= 1000 
                        ? `$${(merchant.gmv / 1000).toFixed(1)}k`
                        : `$${merchant.gmv.toFixed(2)}`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Orders</p>
                    <p className="text-lg font-bold text-gray-900">{merchant.orders}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/merchants/${merchant.id}`}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </Link>
                  <Link 
                    href={`/merchants/${merchant.id}?tab=overview`}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Stats</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {merchants.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Store className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-2">No merchants assigned yet</p>
              <p className="text-sm text-gray-500">Contact support to get assigned merchants</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

