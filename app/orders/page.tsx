'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Download,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
  XCircle,
  Package,
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

export default function OrdersManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getOrders(100);
      // Map backend fields to frontend expected fields
      const mappedOrders = (data || []).map((order: any) => ({
        id: order.order_id,
        order_id: order.order_id,
        order_number: order.order_id, // Use order_id as order_number
        customer_email: order.customer_email,
        total_amount: order.total || order.amount || 0,
        status: order.payment_status || order.status, // Use payment_status first
        created_at: order.created_at,
        merchant_id: order.merchant_id,
        items: order.items,
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Issue a full refund for this order?')) return;
    try {
      const response = await agentApi.refundOrder(orderId);
      alert('✅ Refund initiated successfully!');
      loadOrders(); // Refresh orders
    } catch (error: any) {
      alert(`❌ Refund failed: ${error.response?.data?.detail || error.message}`);
      console.error('Refund error:', error);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    try {
      const response = await agentApi.cancelOrder(orderId);
      alert('✅ Order cancelled successfully!');
      loadOrders(); // Refresh orders
    } catch (error: any) {
      alert(`❌ Cancel failed: ${error.response?.data?.detail || error.message}`);
      console.error('Cancel error:', error);
    }
  };

  const handleTrackShipment = async (orderId: string) => {
    try {
      const tracking = await agentApi.trackOrder(orderId);
      const message = `
📦 Order Tracking

Status: ${tracking.fulfillment_status || 'Unknown'}
Tracking #: ${tracking.tracking_number || 'Not available'}
Carrier: ${tracking.carrier || 'N/A'}

Timeline:
${tracking.timeline?.map((t: any) => `${t.status}: ${t.completed ? '✓' : '○'}`).join('\n') || 'No tracking info'}
      `;
      alert(message);
    } catch (error: any) {
      alert(`❌ Tracking failed: ${error.response?.data?.detail || error.message}`);
      console.error('Tracking error:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = searchTerm === '' ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                onClick={loadOrders}
                className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {order.order_number || order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.customer_email || 'Guest'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          ${(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            order.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {(order.status === 'completed' || order.status === 'paid') && (
                              <>
                                <button
                                  onClick={() => handleRefund(order.order_id)}
                                  className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                  title="Refund"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleTrackShipment(order.order_id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Track Shipment"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleCancel(order.order_id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No orders found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

