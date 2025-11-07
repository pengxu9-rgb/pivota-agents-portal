'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  DollarSign, 
  Download,
  CheckCircle,
  Clock,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Shield,
  TrendingUp,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

interface Payout {
  id: number;
  merchant_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'uploaded' | 'paid';
  payout_reference?: string;
  method?: string;
  provider?: string;
  period_start: string;
  period_end: string;
  confirmed_at?: string;
  created_at: string;
}

interface BankDetails {
  id: number;
  method: string;
  currency: string;
  account_holder_name?: string;
  iban_preview?: string;
  account_number_last4?: string;
  bank_name?: string;
  bank_country?: string;
  verify_status: string;
  allow_share_with_merchants: boolean;
  updated_at: string;
}

interface PayoutSummary {
  total_paid: number;
  total_pending: number;
  total_uploaded: number;
  count_paid: number;
  count_pending: number;
  count_uploaded: number;
  last_payment_date?: string;
}

export default function PayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Read tab from URL - safe way without useSearchParams
  const [activeTab, setActiveTab] = useState<'payouts' | 'bank'>('payouts');
  
  // Set initial tab from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'bank') {
        setActiveTab('bank');
      }
    }
  }, []);
  
  // Payouts state
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('paid');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bank state
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [editingBank, setEditingBank] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [bankForm, setBankForm] = useState({
    method: 'bank_wire',
    currency: 'USD',
    account_holder_name: '',
    iban: '',
    swift_bic: '',
    bank_name: '',
    bank_country: '',
    account_number: '',
    routing_number: '',
    allow_share_with_merchants: false
  });

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const agentId = localStorage.getItem('agent_id');
    if (!agentId) {
      router.push('/login');
      return;
    }
    
    loadPayouts();
    loadBankDetails();
  }, []);

  useEffect(() => {
    if (activeTab === 'payouts') {
      loadPayouts();
    }
  }, [selectedStatus]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) return;

      // Load payouts
      const payoutsResponse = await agentApi.get(
        `/agents/${agentId}/payouts?status=${selectedStatus}`
      );
      setPayouts(payoutsResponse.data.items || []);

      // Load summary
      const summaryResponse = await agentApi.get(
        `/agents/${agentId}/payouts/summary`
      );
      setPayoutSummary(summaryResponse.data);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBankDetails = async () => {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) return;

      const response = await agentApi.get(`/agents/${agentId}/bank`);
      if (response.data.bank_details) {
        setBankDetails(response.data.bank_details);
        
        // Pre-fill form for editing
        const details = response.data.bank_details;
        setBankForm({
          method: details.method || 'bank_wire',
          currency: details.currency || 'USD',
          account_holder_name: details.account_holder_name || '',
          iban: '',  // Don't pre-fill sensitive data
          swift_bic: '',
          bank_name: details.bank_name || '',
          bank_country: details.bank_country || '',
          account_number: '',  // Don't pre-fill sensitive data
          routing_number: '',
          allow_share_with_merchants: details.allow_share_with_merchants || false
        });
      }
    } catch (error) {
      console.error('Failed to load bank details:', error);
    }
  };

  const exportPayouts = async () => {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) return;

      const response = await agentApi.get(
        `/agents/${agentId}/payouts/export/csv?status=${selectedStatus}`
      );
      
      // Convert to CSV
      const data = response.data.data;
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map((row: any) => headers.map(h => row[h]).join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename || 'my_payouts.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payouts:', error);
      alert('Failed to export payouts');
    }
  };

  const handleSaveBank = async () => {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) return;

      // Validate form
      if (!bankForm.account_holder_name) {
        alert('Account holder name is required');
        return;
      }

      if (!bankForm.iban && !bankForm.account_number) {
        alert('Either IBAN or Account Number is required');
        return;
      }

      if (bankForm.account_number && !bankForm.routing_number) {
        alert('Routing number is required for US bank accounts');
        return;
      }

      // Filter out empty strings to avoid validation errors
      const cleanedData: any = {};
      for (const [key, value] of Object.entries(bankForm)) {
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      }

      const response = await agentApi.put(`/agents/${agentId}/bank`, cleanedData);
      
      alert('Bank details saved successfully!');
      setEditingBank(false);
      loadBankDetails();
    } catch (error: any) {
      console.error('Failed to save bank details:', error);
      alert(error.response?.data?.detail || 'Failed to save bank details');
    }
  };

  const toggleSharePermission = async () => {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId || !bankDetails) return;

      const newValue = !bankDetails.allow_share_with_merchants;
      
      await agentApi.patch(
        `/agents/${agentId}/bank/share?allow=${newValue}`
      );
      
      loadBankDetails();
    } catch (error) {
      console.error('Failed to update sharing permission:', error);
      alert('Failed to update sharing permission');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'uploaded':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      uploaded: 'bg-blue-50 text-blue-700 border-blue-200',
      paid: 'bg-green-50 text-green-700 border-green-200'
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${colors[status as keyof typeof colors]}`}>
        {getStatusIcon(status)}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const filteredPayouts = payouts.filter(payout => 
    searchTerm === '' || 
    payout.merchant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.payout_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payouts & Banking</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your earnings and bank details</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'payouts'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Payouts
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'bank'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Bank Details
            </button>
          </div>
        </div>

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <>
            {/* Summary Cards */}
            {payoutSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${payoutSummary.total_paid.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {payoutSummary.count_paid} payouts
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${payoutSummary.total_uploaded.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {payoutSummary.count_uploaded} payouts
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Last Payment</p>
                  <p className="text-lg font-bold text-gray-900">
                    {payoutSummary.last_payment_date
                      ? new Date(payoutSummary.last_payment_date).toLocaleDateString()
                      : 'No payments yet'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="paid">Paid</option>
                  <option value="uploaded">Processing</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  onClick={exportPayouts}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Payouts List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Merchant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          Loading payouts...
                        </td>
                      </tr>
                    ) : filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No payouts found
                        </td>
                      </tr>
                    ) : (
                      filteredPayouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payout.merchant_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ${payout.amount.toFixed(2)} {payout.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payout.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {payout.payout_reference || '-'}
                            </div>
                            {payout.method && (
                              <div className="text-xs text-gray-500">
                                {payout.method}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {payout.confirmed_at
                                ? new Date(payout.confirmed_at).toLocaleDateString()
                                : new Date(payout.created_at).toLocaleDateString()
                              }
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Bank Details Tab */}
        {activeTab === 'bank' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {!editingBank && bankDetails ? (
              <>
                {/* View Mode */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Bank Account Information</h3>
                  <button
                    onClick={() => setEditingBank(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Edit Details
                  </button>
                </div>

                {/* Security Notice */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Bank Details Security</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Your full account details are securely encrypted and never displayed in full.
                        Only authorized payment processors can access complete information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Account Holder</p>
                    <p className="text-lg font-medium text-gray-900">
                      {bankDetails.account_holder_name || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Bank</p>
                    <p className="text-lg font-medium text-gray-900">
                      {bankDetails.bank_name || 'Not provided'}
                      {bankDetails.bank_country && ` (${bankDetails.bank_country})`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-medium text-gray-900">
                        {bankDetails.iban_preview || 
                         (bankDetails.account_number_last4 ? `****${bankDetails.account_number_last4}` : 'Not provided')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">
                      {bankDetails.method.replace('_', ' ')} - {bankDetails.currency}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Verification Status</p>
                    <p className={`text-lg font-medium capitalize ${
                      bankDetails.verify_status === 'verified' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {bankDetails.verify_status}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Share with Merchants</p>
                        <p className="text-xs text-gray-500">
                          Allow merchants to see your bank details for direct payments
                        </p>
                      </div>
                      <button
                        onClick={toggleSharePermission}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          bankDetails.allow_share_with_merchants ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            bankDetails.allow_share_with_merchants ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Edit/Create Mode */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bankDetails ? 'Edit' : 'Add'} Bank Account
                  </h3>
                  {bankDetails && (
                    <button
                      onClick={() => {
                        setEditingBank(false);
                        loadBankDetails();
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveBank(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={bankForm.method}
                        onChange={(e) => setBankForm({ ...bankForm, method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="bank_wire">Bank Wire Transfer</option>
                        <option value="ach">ACH (US Only)</option>
                        <option value="sepa">SEPA (EU Only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={bankForm.currency}
                        onChange={(e) => setBankForm({ ...bankForm, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={bankForm.account_holder_name}
                        onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    {bankForm.method === 'sepa' || bankForm.method === 'bank_wire' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            IBAN *
                          </label>
                          <input
                            type="text"
                            value={bankForm.iban}
                            onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="DE89370400440532013000"
                            required={bankForm.method === 'sepa'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SWIFT/BIC
                          </label>
                          <input
                            type="text"
                            value={bankForm.swift_bic}
                            onChange={(e) => setBankForm({ ...bankForm, swift_bic: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="DEUTDEFF"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            value={bankForm.account_number}
                            onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="123456789"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Routing Number *
                          </label>
                          <input
                            type="text"
                            value={bankForm.routing_number}
                            onChange={(e) => setBankForm({ ...bankForm, routing_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="021000021"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankForm.bank_name}
                        onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Chase Bank"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Country
                      </label>
                      <input
                        type="text"
                        value={bankForm.bank_country}
                        onChange={(e) => setBankForm({ ...bankForm, bank_country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="US"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={bankForm.allow_share_with_merchants}
                        onChange={(e) => setBankForm({ ...bankForm, allow_share_with_merchants: e.target.checked })}
                        className="h-4 w-4 text-purple-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        Allow merchants to see my bank details for direct payments
                      </span>
                    </label>
                  </div>

                  {/* Warning for sensitive data */}
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Security Notice</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your bank details are encrypted and stored securely. Never share your
                          banking information through unsecured channels.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Save Bank Details
                    </button>
                  </div>
                </form>
              </>
            )}

            {!bankDetails && !editingBank && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No bank account configured</p>
                <button
                  onClick={() => setEditingBank(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Bank Account
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
