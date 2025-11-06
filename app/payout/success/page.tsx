'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function PayoutSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
  const [message, setMessage] = useState('Verifying your Stripe connection...');
  const [accountDetails, setAccountDetails] = useState<any>(null);

  useEffect(() => {
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const agentId = localStorage.getItem('agent_id');
      const token = localStorage.getItem('agent_token');

      if (!agentId || !token) {
        setStatus('error');
        setMessage('Authentication required');
        return;
      }

      // Check Stripe Connect status
      const response = await fetch(
        `https://web-production-fedb.up.railway.app/stripe-connect/status/${agentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const data = await response.json();

      if (data.connected && data.payouts_enabled) {
        setStatus('success');
        setMessage('Stripe account successfully connected!');
        setAccountDetails(data);
      } else if (data.connected && data.onboarding_complete) {
        setStatus('pending');
        setMessage('Stripe account connected. Waiting for payout approval...');
        setAccountDetails(data);
      } else if (data.connected) {
        setStatus('pending');
        setMessage('Stripe onboarding in progress. Please complete all required steps.');
        setAccountDetails(data);
      } else {
        setStatus('error');
        setMessage('Stripe connection not found. Please try again.');
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setStatus('error');
      setMessage('Failed to verify connection. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Status Icon */}
        <div className="text-center mb-6">
          {status === 'checking' && (
            <Loader2 className="w-16 h-16 mx-auto text-purple-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
          )}
          {status === 'pending' && (
            <AlertCircle className="w-16 h-16 mx-auto text-yellow-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
          )}
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-center mb-4">
          {status === 'checking' && 'Checking Status...'}
          {status === 'success' && 'Stripe Connected!'}
          {status === 'pending' && 'Almost There'}
          {status === 'error' && 'Connection Issue'}
        </h1>

        <p className="text-center text-gray-600 mb-6">{message}</p>

        {/* Account Details */}
        {accountDetails && status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-green-900 mb-2">Account Details</p>
            <div className="space-y-1 text-sm text-green-800">
              <p>• Account ID: {accountDetails.account_id}</p>
              <p>• Country: {accountDetails.country}</p>
              <p>• Payouts: {accountDetails.payouts_enabled ? 'Enabled ✓' : 'Pending'}</p>
              <p>• Status: Ready to receive commission payments</p>
            </div>
          </div>
        )}

        {accountDetails && status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-yellow-900 mb-2">Next Steps</p>
            <div className="space-y-1 text-sm text-yellow-800">
              {accountDetails.requirements?.currently_due?.length > 0 && (
                <div>
                  <p className="font-medium">Information needed:</p>
                  <ul className="list-disc list-inside ml-2">
                    {accountDetails.requirements.currently_due.map((req: string, index: number) => (
                      <li key={index}>{req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-2">Please complete the Stripe onboarding process to enable payouts.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/settings/payout"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            Go to Payout Settings
          </Link>
          
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Additional Info */}
        {status === 'success' && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600 text-center">
              You're all set! Commission payments will be sent to your connected Stripe account on the 15th of each month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
