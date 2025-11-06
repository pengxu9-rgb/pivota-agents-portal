'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, TrendingUp, Download, DollarSign, Calendar } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(8750.25);
  const [earnings, setEarnings] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Mock earnings data
    setEarnings([
      { id: '1', merchant: 'Test Merchant', amount: 125.50, date: '2024-10-18', status: 'paid' },
      { id: '2', merchant: 'Demo Store', amount: 89.25, date: '2024-10-17', status: 'paid' },
      { id: '3', merchant: 'Test Merchant', amount: 156.00, date: '2024-10-16', status: 'pending' },
    ]);
  }, [router]);

  const handleWithdraw = () => {
    const amount = prompt(`Withdraw amount (Available: $${balance.toFixed(2)}):`);
    if (!amount) return;
    alert('✅ Withdrawal request submitted!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Commission Wallet</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="w-5 h-5" />
                  <p className="text-purple-100">Available Balance</p>
                </div>
                <h2 className="text-4xl font-bold mb-4">${balance.toFixed(2)}</h2>
                <div className="flex items-center text-purple-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+12.5% this month</span>
                </div>
              </div>
              <button
                onClick={handleWithdraw}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50"
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Commission Earnings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Commission Earnings</h2>
              <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {earnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(earning.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {earning.merchant}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                          {earning.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          earning.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {earning.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


