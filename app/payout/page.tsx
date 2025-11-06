'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CreditCard, 
  Building2, 
  Globe, 
  Wallet,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Shield,
  Info
} from 'lucide-react';

export default function PayoutSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Payout method selection
  const [payoutMethod, setPayoutMethod] = useState<string>('stripe_connect');
  
  // Form data
  const [formData, setFormData] = useState({
    // Stripe Connect
    stripeConnected: false,
    stripeAccountId: '',
    
    // PayPal
    paypalEmail: '',
    paypalVerified: false,
    
    // Bank Transfer (US)
    usBankAccountHolder: '',
    usBankAccountNumber: '',
    usBankRoutingNumber: '',
    usBankAccountType: 'checking',
    usBankName: '',
    
    // Bank Transfer (International)
    intlBankAccountHolder: '',
    intlIban: '',
    intlSwiftBic: '',
    intlBankName: '',
    intlBankCountry: '',
    intlBankCurrency: 'USD',
    
    // Wire Transfer
    wireBeneficiaryName: '',
    wireBankName: '',
    wireAccountNumber: '',
    wireSwiftCode: '',
    
    // Cryptocurrency
    cryptoWalletAddress: '',
    cryptoNetwork: 'ethereum',
    cryptoStablecoin: 'USDC',
    
    // Tax Information
    taxCountry: 'USA',
    taxIdNumber: '',
    taxIdType: 'ssn',
    businessType: 'individual',
    businessLegalName: '',
    
    // Preferences
    minimumPayoutAmount: 50,
    payoutFrequency: 'monthly',
    preferredCurrency: 'USD',
    autoPayoutEnabled: true
  });
  
  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadPayoutSettings();
  }, [router]);
  
  const loadPayoutSettings = async () => {
    try {
      // Load existing payout settings
      // TODO: API call to get agent payout settings
      setLoading(false);
    } catch (error) {
      console.error('Failed to load payout settings:', error);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // TODO: API call to save payout settings
      // POST /agents/{agentId}/payout/settings
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save payout settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStripeConnect = async () => {
    try {
      setLoading(true);
      
      const agentId = localStorage.getItem('agent_id');
      const token = localStorage.getItem('agent_token');
      
      if (!agentId || !token) {
        alert('Please login first');
        return;
      }
      
      console.log('Stripe Connect: Sending request with agentId:', agentId);
      console.log('Stripe Connect: Token present:', !!token);
      
      // Call via Next.js proxy to avoid CORS issues
      const response = await fetch(`/api/stripe/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          refresh_url: window.location.href,
          return_url: `${window.location.origin}/payout/success`
        })
      });
      
      console.log('Stripe Connect response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to initiate Stripe Connect');
      }
      
      const data = await response.json();
      
      // Redirect to Stripe onboarding
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
      
    } catch (error: any) {
      console.error('Stripe Connect error:', error);
      alert('Failed to connect with Stripe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const renderPayoutMethodContent = () => {
    switch (payoutMethod) {
      case 'stripe_connect':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Recommended Method</p>
                  <p className="text-sm text-green-700 mt-1">
                    Fast, secure, and automated. Used by Uber, Shopify, and major platforms.
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Payouts in 1-2 business days</li>
                    <li>• Automatic tax compliance (1099 forms)</li>
                    <li>• No manual bank account entry needed</li>
                    <li>• Fee: ~0.25% or $0.25 per payout</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {!formData.stripeConnected ? (
              <button
                onClick={handleStripeConnect}
                className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Connect with Stripe</span>
              </button>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">✓ Stripe Connected</p>
                <p className="text-xs text-blue-700 mt-1">Account ID: {formData.stripeAccountId}</p>
              </div>
            )}
          </div>
        );
        
      case 'bank_transfer_us':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">US Bank Transfer (ACH)</p>
                  <p className="mt-1">For US-based agents only. Payouts in 3-5 business days.</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
              <input
                type="text"
                value={formData.usBankAccountHolder}
                onChange={(e) => setFormData({...formData, usBankAccountHolder: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="John Doe"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                <input
                  type="text"
                  value={formData.usBankRoutingNumber}
                  onChange={(e) => setFormData({...formData, usBankRoutingNumber: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="121000248"
                  maxLength={9}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="password"
                  value={formData.usBankAccountNumber}
                  onChange={(e) => setFormData({...formData, usBankAccountNumber: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
              <input
                type="text"
                value={formData.usBankName}
                onChange={(e) => setFormData({...formData, usBankName: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Chase Bank"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <select
                value={formData.usBankAccountType}
                onChange={(e) => setFormData({...formData, usBankAccountType: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>
        );
        
      case 'bank_transfer_international':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">International Bank Transfer (SWIFT/IBAN)</p>
                  <p className="mt-1">For non-US agents. Payouts in 3-7 business days.</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
              <input
                type="text"
                value={formData.intlBankAccountHolder}
                onChange={(e) => setFormData({...formData, intlBankAccountHolder: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Full name as on bank account"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
              <input
                type="text"
                value={formData.intlIban}
                onChange={(e) => setFormData({...formData, intlIban: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="GB29 NWBK 6016 1331 9268 19"
              />
              <p className="text-xs text-gray-500 mt-1">International Bank Account Number</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT/BIC Code</label>
              <input
                type="text"
                value={formData.intlSwiftBic}
                onChange={(e) => setFormData({...formData, intlSwiftBic: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="NWBKGB2L"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={formData.intlBankName}
                  onChange={(e) => setFormData({...formData, intlBankName: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Country</label>
                <select
                  value={formData.intlBankCountry}
                  onChange={(e) => setFormData({...formData, intlBankCountry: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select country</option>
                  <option value="GBR">United Kingdom</option>
                  <option value="DEU">Germany</option>
                  <option value="FRA">France</option>
                  <option value="CAN">Canada</option>
                  <option value="AUS">Australia</option>
                  <option value="JPN">Japan</option>
                  <option value="CHN">China</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payout Settings</h1>
              <p className="text-sm text-gray-600">Configure how you receive commission payments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Payout Method Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Select Payout Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPayoutMethod('stripe_connect')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  payoutMethod === 'stripe_connect'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-medium">Stripe Connect</p>
                    <p className="text-xs text-gray-600">Recommended - Fast & automated</p>
                  </div>
                </div>
                {payoutMethod === 'stripe_connect' && (
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-2" />
                )}
              </button>
              
              <button
                onClick={() => setPayoutMethod('bank_transfer_us')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  payoutMethod === 'bank_transfer_us'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium">US Bank (ACH)</p>
                    <p className="text-xs text-gray-600">Direct deposit</p>
                  </div>
                </div>
                {payoutMethod === 'bank_transfer_us' && (
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-2" />
                )}
              </button>
              
              <button
                onClick={() => setPayoutMethod('bank_transfer_international')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  payoutMethod === 'bank_transfer_international'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium">International Bank</p>
                    <p className="text-xs text-gray-600">SWIFT/IBAN</p>
                  </div>
                </div>
                {payoutMethod === 'bank_transfer_international' && (
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-2" />
                )}
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              💡 <strong>Recommended:</strong> Stripe Connect provides the fastest setup and payouts in 40+ countries.
            </p>
          </div>

          {/* Selected Method Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payout Details</h2>
            {renderPayoutMethodContent()}
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Tax Information</span>
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Country</label>
                  <select
                    value={formData.taxCountry}
                    onChange={(e) => setFormData({...formData, taxCountry: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="USA">United States</option>
                    <option value="GBR">United Kingdom</option>
                    <option value="CAN">Canada</option>
                    <option value="DEU">Germany</option>
                    <option value="FRA">France</option>
                    <option value="JPN">Japan</option>
                    <option value="CHN">China</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="individual">Individual</option>
                    <option value="sole_proprietor">Sole Proprietor</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
              </div>
              
              {formData.businessType !== 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Legal Name</label>
                  <input
                    type="text"
                    value={formData.businessLegalName}
                    onChange={(e) => setFormData({...formData, businessLegalName: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Your Company LLC"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID Number ({formData.taxCountry === 'USA' ? 'SSN/EIN' : 'VAT/Tax ID'})
                </label>
                <input
                  type="password"
                  value={formData.taxIdNumber}
                  onChange={(e) => setFormData({...formData, taxIdNumber: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="•••-••-••••"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for tax reporting. Encrypted and stored securely.
                </p>
              </div>
            </div>
          </div>

          {/* Payout Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payout Preferences</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Payout Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.minimumPayoutAmount}
                    onChange={(e) => setFormData({...formData, minimumPayoutAmount: parseFloat(e.target.value)})}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg"
                    min="10"
                    step="10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Earnings below this amount will accumulate
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Frequency
                </label>
                <select
                  value={formData.payoutFrequency}
                  onChange={(e) => setFormData({...formData, payoutFrequency: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="monthly">Monthly</option>
                  <option value="bi_weekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoPayoutEnabled}
                  onChange={(e) => setFormData({...formData, autoPayoutEnabled: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  Enable automatic payouts when minimum amount is reached
                </span>
              </label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Security & Privacy</p>
                <ul className="space-y-1">
                  <li>• All sensitive information is encrypted before storage</li>
                  <li>• Bank account numbers are never shown in full</li>
                  <li>• Tax documents are stored securely and only used for compliance</li>
                  <li>• Payout verification required before first payment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Payout Settings</span>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

