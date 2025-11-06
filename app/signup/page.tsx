'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ArrowRight, Mail, User, Key, Building, FileText, CheckCircle } from 'lucide-react';

export default function AgentSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_email: '',
    password: '',
    confirmPassword: '',
    company: '',
    description: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('❌ Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      alert('❌ Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('https://web-production-fedb.up.railway.app/agent/account/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.agent_email,
          password: formData.password,
          agent_name: formData.agent_name,
          company: formData.company || null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.api_key) {
        setApiKey(data.api_key);
        setStep(2);
      } else {
        alert(`❌ Registration failed: ${data.detail || data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('✅ API Key copied to clipboard!');
  };

  const handleContinueToDashboard = () => {
    // Store API key
    localStorage.setItem('agent_api_key', apiKey);
    router.push('/login');
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Registration Complete!
              </h2>
              <p className="text-gray-600">
                Your API key has been generated successfully
              </p>
            </div>

            {/* API Key Display */}
            <div className="bg-gray-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Your API Key</h3>
                </div>
                <button
                  onClick={handleCopyApiKey}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Copy
                </button>
              </div>
              <code className="block text-sm bg-white p-3 rounded border border-gray-200 break-all font-mono">
                {apiKey}
              </code>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Save this key securely. You won't be able to see it again!
              </p>
            </div>

            {/* Agent Info */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Agent Name:</span>
                <span className="font-medium">{formData.agent_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{formData.agent_email}</span>
              </div>
              {formData.company && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium">{formData.company}</span>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Save your API key in a secure location</li>
                <li>Read the API documentation</li>
                <li>Start integrating with our unified API</li>
                <li>Test your first transaction</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleContinueToDashboard}
                className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Continue to Dashboard
              </button>
              <a
                href="https://docs.pivota.com/agent-api"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 text-center border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
              >
                View API Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Pivota as an AI Agent
          </h1>
          <p className="text-lg text-gray-600">
            Get your API key and start building commerce experiences
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Agent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.agent_name}
                onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="My AI Shopping Assistant"
              />
              <p className="text-xs text-gray-500 mt-1">
                A descriptive name for your AI agent
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.agent_email}
                onChange={(e) => setFormData({ ...formData, agent_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="developer@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="w-4 h-4 inline mr-2" />
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Company/Organization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Acme AI Labs"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your organization or company name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+1 (234) 567-8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Use Case Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="I'm building a conversational shopping assistant that helps users find products..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-1">API Key Generation</h4>
                  <p className="text-sm text-purple-700">
                    Upon registration, you'll receive your unique API key. Save it securely as you won't be able to see it again after leaving this page.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating API Key...</span>
                  </>
                ) : (
                  <>
                    <span>Get API Key & Register</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By registering, you agree to Pivota's{' '}
              <a href="#" className="text-purple-600 hover:underline">API Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
            </p>
          </form>
        </div>

        {/* Links */}
        <div className="text-center mt-6 space-y-2">
          <a
            href="/login"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            Already have an API key? Sign in
          </a>
          <a
            href="https://pivota.cc"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
