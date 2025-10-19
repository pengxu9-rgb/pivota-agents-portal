'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Code, Book, Copy } from 'lucide-react';

export default function IntegrationPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const apiKey = typeof window !== 'undefined' 
    ? localStorage.getItem('agent_api_key') || 'pk_live_...' 
    : 'pk_live_...';

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">API Integration Guide</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Quick Start */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold">Quick Start</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Your API Key:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-gray-900 text-gray-100 rounded font-mono text-sm">
                    {apiKey}
                  </code>
                  <button
                    onClick={() => copyCode(apiKey)}
                    className="px-3 py-2 border rounded hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* API Examples */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Code Examples</h2>
            
            {/* Search Products */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">1. Search Products</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <button
                  onClick={() => copyCode(`curl -X GET "https://web-production-fedb.up.railway.app/agent/search/products?query=laptop" \\
  -H "Authorization: Bearer ${apiKey}"`)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <pre className="text-sm text-gray-100 overflow-x-auto">
{`curl -X GET "https://web-production-fedb.up.railway.app/agent/search/products?query=laptop" \\
  -H "Authorization: Bearer ${apiKey}"`}
                </pre>
              </div>
            </div>

            {/* Create Order */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">2. Create Order</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <button
                  onClick={() => copyCode(`curl -X POST "https://web-production-fedb.up.railway.app/agent/order/create" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant_id": "merchant_123",
    "items": [{"product_id": "prod_456", "quantity": 2}],
    "customer_email": "customer@example.com"
  }'`)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <pre className="text-sm text-gray-100 overflow-x-auto">
{`curl -X POST "https://web-production-fedb.up.railway.app/agent/order/create" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant_id": "merchant_123",
    "items": [{"product_id": "prod_456", "quantity": 2}],
    "customer_email": "customer@example.com"
  }'`}
                </pre>
              </div>
            </div>

            {/* Process Payment */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Process Payment</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <button
                  onClick={() => copyCode(`curl -X POST "https://web-production-fedb.up.railway.app/agent/payment/process" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "order_789",
    "payment_method": "card",
    "amount": 99.99
  }'`)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <pre className="text-sm text-gray-100 overflow-x-auto">
{`curl -X POST "https://web-production-fedb.up.railway.app/agent/payment/process" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "order_789",
    "payment_method": "card",
    "amount": 99.99
  }'`}
                </pre>
              </div>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Book className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Full API Documentation</p>
                <a
                  href="https://web-production-fedb.up.railway.app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View complete API reference →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
