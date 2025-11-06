'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Store, 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  MapPin
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import CommissionMatchPanel from '@/components/CommissionMatchPanel';

interface MerchantDetail {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  store_url: string;
  platform?: string;
  region?: string;
  total_orders: number;
  total_gmv: number;
  avg_order_value: number;
  commission_rate?: number;
  last_order_date?: string;
  monthly_stats?: Array<{
    month: string;
    orders: number;
    gmv: number;
  }>;
}

export default function MerchantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const merchantId = params.id as string;
  
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadMerchantDetail();
  }, [merchantId, router]);
  
  const loadMerchantDetail = async () => {
    try {
      setLoading(true);
      
      // Get merchant list and find the specific merchant
      const data = await agentApi.getMerchantAuthorizations();
      const merchantList = data?.merchants || [];
      const merchantData = merchantList.find((m: any) => m.merchant_id === merchantId);
      
      if (!merchantData) {
        throw new Error('Merchant not found');
      }
      
      // Format merchant data
      setMerchant({
        id: merchantData.merchant_id,
        name: merchantData.business_name || merchantData.name || 'Unknown Merchant',
        email: merchantData.contact_email || merchantData.email || 'N/A',
        status: merchantData.status || 'active',
        created_at: merchantData.created_at || new Date().toISOString(),
        store_url: merchantData.store_url || '',
        platform: merchantData.platform || 'Unknown',
        region: merchantData.region || 'N/A',
        total_orders: merchantData.total_orders || 0,
        total_gmv: merchantData.total_gmv || 0,
        avg_order_value: merchantData.total_orders > 0 
          ? (merchantData.total_gmv || 0) / merchantData.total_orders 
          : 0,
        commission_rate: merchantData.commission_rate || 0.025, // Default 2.5%
        last_order_date: merchantData.last_order_date,
        monthly_stats: generateMockMonthlyStats() // Mock data for now
      });
      
    } catch (error) {
      console.error('Failed to load merchant detail:', error);
      router.push('/merchants');
    } finally {
      setLoading(false);
    }
  };
  
  const generateMockMonthlyStats = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      orders: Math.floor(Math.random() * 50) + 10,
      gmv: Math.floor(Math.random() * 50000) + 10000
    }));
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">Merchant not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/merchants" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Store className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
                  <p className="text-sm text-gray-500">{merchant.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {merchant.status === 'active' ? (
                <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>Inactive</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('commission')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'commission'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Commission
            </button>
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'routing'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Routing
            </button>
            <button
              onClick={() => setActiveTab('settlement')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'settlement'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Settlement
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Business Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Platform</p>
                    <p className="font-medium">{merchant.platform}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Store URL</p>
                    {merchant.store_url ? (
                      <a 
                        href={merchant.store_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>{merchant.store_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-400">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Region</p>
                    <p className="font-medium flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{merchant.region}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(merchant.created_at)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{merchant.total_orders}</p>
                {merchant.last_order_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last: {formatDate(merchant.last_order_date)}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total GMV</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(merchant.total_gmv)}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(merchant.avg_order_value)}</p>
                <p className="text-xs text-gray-500 mt-1">Per order</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{((merchant.commission_rate || 0.025) * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Current rate</p>
              </div>
            </div>

            {/* Monthly Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Monthly Performance</h2>
              <div className="space-y-4">
                {merchant.monthly_stats?.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{stat.month}</span>
                    <div className="flex items-center space-x-8">
                      <div className="text-sm">
                        <span className="text-gray-500">Orders: </span>
                        <span className="font-medium">{stat.orders}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">GMV: </span>
                        <span className="font-medium">{formatCurrency(stat.gmv)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commission' && (
          <CommissionMatchPanel
            merchantId={merchant.id}
            merchantName={merchant.name}
            currentRate={merchant.commission_rate || 0.025}
            agentExpectation={{
              expected_rate: 0.03, // 3% expected
              min_acceptable_rate: 0.02 // 2% minimum
            }}
            merchantOffers={[
              {
                id: '1',
                rate: merchant.commission_rate || 0.025,
                min_amount: 0,
                status: 'active'
              }
            ]}
          />
        )}

        {activeTab === 'routing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Routing Policies</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Active Routing Policy</span>
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold text-blue-900">Weighted Distribution</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Orders are distributed based on PSP weights
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">PSP Configuration</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Stripe</span>
                      <span className="text-sm text-gray-600">70% weight</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">PayPal</span>
                      <span className="text-sm text-gray-600">30% weight</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Routing Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-blue-600">1.2s</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Settlement Overview</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Total Settled</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(merchant.total_gmv * (merchant.commission_rate || 0.025) * 0.8)}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700 mb-1">Pending</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {formatCurrency(merchant.total_gmv * (merchant.commission_rate || 0.025) * 0.2)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Next Settlement</p>
                  <p className="text-lg font-bold text-blue-900">Dec 1, 2025</p>
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Settlements</h3>
              <div className="space-y-2">
                {[
                  { date: '2025-10-01', amount: 2500, status: 'completed' },
                  { date: '2025-09-01', amount: 3200, status: 'completed' },
                  { date: '2025-08-01', amount: 2800, status: 'completed' },
                ].map((settlement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{formatDate(settlement.date)}</p>
                        <p className="text-xs text-gray-500">Monthly settlement</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(settlement.amount)}</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
