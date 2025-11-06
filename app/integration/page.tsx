'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, 
  Copy, 
  Check,
  Terminal,
  Book,
  Download,
  ExternalLink,
  Zap,
  Package,
  FileCode,
  BookOpen,
  Plug,
  CheckCircle,
  XCircle,
  Activity,
  Link as LinkIcon
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

// Code examples as constants to avoid JSX parsing issues
const CODE_EXAMPLES = {
  python: {
    install: 'pip install pivota-agent',
    quickstart: `from pivota_agent import PivotaAgentClient

# Initialize client
client = PivotaAgentClient(api_key="YOUR_API_KEY")

# Search products
products = client.search_products(
    query="laptop",
    merchant_id="merch_6b90dc9838d5fd9c"
)

# Create order
order = client.create_order(
    merchant_id="merch_6b90dc9838d5fd9c",
    items=[{"product_id": products[0]["id"], "quantity": 1}],
    customer_email="customer@example.com"
)

print(f"Order created: " + "{order['order_id']}")`,
    full: `from pivota_agent import PivotaAgentClient

client = PivotaAgentClient(api_key="YOUR_API_KEY")

# 1. List available merchants
merchants = client.list_merchants()
print(f"Found {len(merchants)} merchants")

# 2. Search products
products = client.search_products(
    query="coffee mug",
    merchant_id=merchants[0]["merchant_id"],
    limit=10
)

# 3. Get product details
product = client.get_product(
    product_id=products[0]["id"],
    merchant_id=merchants[0]["merchant_id"]
)

# 4. Create an order
order = client.create_order(
    merchant_id=merchants[0]["merchant_id"],
    items=[{
        "product_id": product["id"],
        "quantity": 2,
        "price": product["price"]
    }],
    customer_email="customer@example.com",
    shipping_address={
        "name": "John Doe",
        "line1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94102",
        "country": "US"
    }
)

print(f"✅ Order " + "{order['order_id']}" + " created successfully!")
print(f"💰 Total: $" + "{order['total']}")`
  },
  typescript: {
    install: 'npm install pivota-agent',
    quickstart: 'import { PivotaAgentClient } from \'pivota-agent\';\n\n' +
      '// Initialize client\n' +
      'const client = new PivotaAgentClient({\n' +
      '  apiKey: \'YOUR_API_KEY\'\n' +
      '});\n\n' +
      '// Search products\n' +
      'const products = await client.searchProducts({\n' +
      '  query: \'laptop\',\n' +
      '  merchantId: \'merch_6b90dc9838d5fd9c\'\n' +
      '});\n\n' +
      '// Create order\n' +
      'const order = await client.createOrder({\n' +
      '  merchantId: \'merch_6b90dc9838d5fd9c\',\n' +
      '  items: [{\n' +
      '    productId: products[0].id,\n' +
      '    quantity: 1\n' +
      '  }],\n' +
      '  customerEmail: \'customer@example.com\'\n' +
      '});\n\n' +
      'console.log(`Order created: ${order.orderId}`);',
    full: 'import { PivotaAgentClient } from \'pivota-agent\';\n\n' +
      'const client = new PivotaAgentClient({\n' +
      '  apiKey: \'YOUR_API_KEY\'\n' +
      '});\n\n' +
      'async function main() {\n' +
      '  // 1. List available merchants\n' +
      '  const merchants = await client.listMerchants();\n' +
      '  console.log(`Found ${merchants.length} merchants`);\n\n' +
      '  // 2. Search products\n' +
      '  const products = await client.searchProducts({\n' +
      '    query: \'coffee mug\',\n' +
      '    merchantId: merchants[0].merchantId,\n' +
      '    limit: 10\n' +
      '  });\n\n' +
      '  // 3. Get product details\n' +
      '  const product = await client.getProduct({\n' +
      '    productId: products[0].id,\n' +
      '    merchantId: merchants[0].merchantId\n' +
      '  });\n\n' +
      '  // 4. Create an order\n' +
      '  const order = await client.createOrder({\n' +
      '    merchantId: merchants[0].merchantId,\n' +
      '    items: [{\n' +
      '      productId: product.id,\n' +
      '      quantity: 2,\n' +
      '      price: product.price\n' +
      '    }],\n' +
      '    customerEmail: \'customer@example.com\',\n' +
      '    shippingAddress: {\n' +
      '      name: \'John Doe\',\n' +
      '      line1: \'123 Main St\',\n' +
      '      city: \'San Francisco\',\n' +
      '      state: \'CA\',\n' +
      '      postalCode: \'94102\',\n' +
      '      country: \'US\'\n' +
      '    }\n' +
      '  });\n\n' +
      '  console.log(`✅ Order ${order.orderId} created successfully!`);\n' +
      '  console.log(`💰 Total: $${order.total}`);\n' +
      '}\n\n' +
      'main().catch(console.error);'
  },
  api: {
    auth: `curl https://web-production-fedb.up.railway.app/agent/v1/merchants \\
  -H "x-api-key: YOUR_API_KEY"`
  },
  mcp: {
    config: '{\n' +
      '  "mcpServers": {\n' +
      '    "pivota": {\n' +
      '      "command": "npx",\n' +
      '      "args": [\n' +
      '        "-y",\n' +
      '        "pivota-mcp-server"\n' +
      '      ],\n' +
      '      "env": {\n' +
      '        "PIVOTA_API_KEY": "YOUR_API_KEY"\n' +
      '      }\n' +
      '    }\n' +
      '  }\n' +
      '}'
  }
};

export default function IntegrationPage() {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'sdk' | 'api' | 'mcp'>('sdk');
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'typescript'>('python');
  
  // [Phase 6] Integration Status
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Check URL params for tab selection
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['sdk', 'api', 'mcp'].includes(tab)) {
        setSelectedTab(tab as 'sdk' | 'api' | 'mcp');
      }
    }
    
    // [Phase 6] Fetch integration status
    fetchIntegrationStatus();
  }, [router]);
  
  const fetchIntegrationStatus = async () => {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) return;
      
      const status = await agentApi.getIntegrationStatus(agentId);
      setIntegrationStatus(status);
    } catch (err) {
      console.error('Failed to load integration status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tabs = [
    { id: 'sdk', label: 'SDK Integration', icon: Package },
    { id: 'api', label: 'REST API', icon: Terminal },
    { id: 'mcp', label: 'MCP Integration', icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Integration Guide</h1>
          <p className="text-sm text-gray-600 mt-1">
            Everything you need to integrate with Pivota Agent API
          </p>
        </div>
      </div>

      {/* [Phase 6] Connection Status */}
      {!statusLoading && integrationStatus && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                Connection Status
              </h2>
              <span className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* API Connection */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">API Connection</span>
                  {integrationStatus.api_connected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {integrationStatus.api_connected ? 'Connected' : 'Disconnected'}
                </p>
                {integrationStatus.last_api_call && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last call: {new Date(integrationStatus.last_api_call).toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Merchant Connections */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Connected Merchants</span>
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {integrationStatus.connected_merchants || 0}
                </p>
                <p className="text-xs text-gray-600">
                  Active integrations
                </p>
              </div>
              
              {/* Protocol Status */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Protocols</span>
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {integrationStatus.active_protocols || 0}
                </p>
                <p className="text-xs text-gray-600">
                  Active protocols
                </p>
              </div>
            </div>
            
            {integrationStatus.last_sync && (
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-medium">Last sync:</span> {new Date(integrationStatus.last_sync).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* SDK Integration Tab */}
        {selectedTab === 'sdk' && (
          <div className="max-w-4xl space-y-6">
            {/* Language Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Choose your language:</span>
              <div className="inline-flex rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setSelectedLanguage('python')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedLanguage === 'python'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedLanguage('typescript')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedLanguage === 'typescript'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  TypeScript/Node.js
                </button>
              </div>
            </div>

            {/* Python SDK */}
            {selectedLanguage === 'python' && (
              <>
                {/* Installation */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Download className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">1. Installation</h2>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES.python.install, 'install-py')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                    >
                      {copiedCode === 'install-py' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="text-sm text-gray-100">{CODE_EXAMPLES.python.install}</pre>
                  </div>
                </div>

                {/* Quick Start */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">2. Quick Start</h2>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES.python.quickstart, 'quickstart-py')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                    >
                      {copiedCode === 'quickstart-py' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="text-sm text-gray-100 overflow-x-auto whitespace-pre-wrap">{CODE_EXAMPLES.python.quickstart}</pre>
                  </div>
                </div>

                {/* Full Example */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileCode className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">3. Complete Example</h2>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 relative max-h-96 overflow-y-auto">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES.python.full, 'full-example-py')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                    >
                      {copiedCode === 'full-example-py' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="text-sm text-gray-100 whitespace-pre-wrap">{CODE_EXAMPLES.python.full}</pre>
                  </div>
                </div>
              </>
            )}

            {/* TypeScript SDK */}
            {selectedLanguage === 'typescript' && (
              <>
                {/* Installation */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Download className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">1. Installation</h2>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES.typescript.install, 'install-ts')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                    >
                      {copiedCode === 'install-ts' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="text-sm text-gray-100">{CODE_EXAMPLES.typescript.install}</pre>
                  </div>
                </div>

                {/* Quick Start */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">2. Quick Start</h2>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <button
                      onClick={() => copyCode(CODE_EXAMPLES.typescript.quickstart, 'quickstart-ts')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                    >
                      {copiedCode === 'quickstart-ts' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="text-sm text-gray-100 overflow-x-auto whitespace-pre-wrap">{CODE_EXAMPLES.typescript.quickstart}</pre>
                  </div>
                </div>

                {/* Full Example */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileCode className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">3. Complete Example</h2>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 relative max-h-96 overflow-y-auto">
                  <button
                      onClick={() => copyCode(CODE_EXAMPLES.typescript.full, 'full-example-ts')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                  >
                      {copiedCode === 'full-example-ts' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                    <pre className="text-sm text-gray-100 whitespace-pre-wrap">{CODE_EXAMPLES.typescript.full}</pre>
                  </div>
                </div>
              </>
            )}

            {/* SDK Resources */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">SDK Documentation & Examples</h3>
                  <div className="space-y-2">
                    <a
                      href="https://github.com/your-org/pivota-sdk-python"
                      target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      Python SDK on GitHub
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    <a
                      href="https://github.com/your-org/pivota-sdk-typescript"
                      target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      TypeScript SDK on GitHub
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    <Link
                      href="/developers/docs"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      Full API Documentation
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REST API Tab */}
        {selectedTab === 'api' && (
          <div className="max-w-4xl space-y-6">
            {/* API Base URL */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Base URL</h2>
              <div className="bg-gray-100 rounded-lg p-3">
                <code className="text-sm text-gray-900">
                  https://web-production-fedb.up.railway.app/agent/v1
                </code>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h2>
              <p className="text-sm text-gray-600 mb-3">
                Include your API key in the <code className="bg-gray-100 px-2 py-1 rounded text-xs">x-api-key</code> header:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <button
                  onClick={() => copyCode(CODE_EXAMPLES.api.auth, 'auth-example')}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                >
                  {copiedCode === 'auth-example' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-sm text-gray-100">{CODE_EXAMPLES.api.auth}</pre>
              </div>
            </div>

            {/* Key Endpoints */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Endpoints</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">GET</span>
                    <code className="text-sm font-mono">/merchants</code>
                  </div>
                  <p className="text-sm text-gray-600">List all available merchants</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">GET</span>
                    <code className="text-sm font-mono">/catalog/search</code>
                  </div>
                  <p className="text-sm text-gray-600">Search for products across merchants</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">POST</span>
                    <code className="text-sm font-mono">/orders/create</code>
                  </div>
                  <p className="text-sm text-gray-600">Create a new order</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">GET</span>
                    <code className="text-sm font-mono">/orders/:order_id</code>
                  </div>
                  <p className="text-sm text-gray-600">Get order details</p>
                </div>
              </div>
            </div>

            {/* OpenAPI Spec */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">OpenAPI Specification</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Download the complete OpenAPI spec for API documentation tools
                  </p>
                  <a
                    href="https://web-production-fedb.up.railway.app/agent/v1/openapi.json"
                    target="_blank"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Download openapi.json
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MCP Integration Tab */}
        {selectedTab === 'mcp' && (
          <div className="max-w-4xl space-y-6">
            {/* What is MCP */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">What is MCP?</h2>
              <p className="text-sm text-gray-700 mb-3">
                Model Context Protocol (MCP) is a standard for connecting AI models to external data sources and tools.
                Pivota provides MCP servers that enable AI assistants like Claude to search products, create orders, and manage e-commerce workflows.
              </p>
              <div className="flex items-start space-x-2 text-sm text-purple-800">
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Perfect for Claude Desktop, ChatGPT plugins, and other AI assistants</span>
              </div>
            </div>

            {/* Claude Desktop Setup */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Claude Desktop Setup</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add Pivota MCP server to your Claude Desktop configuration:
              </p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">1. Open Claude Desktop config file:</p>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <code className="text-xs text-gray-900">
                      ~/Library/Application Support/Claude/claude_desktop_config.json
                    </code>
                  </div>
                </div>

            <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">2. Add Pivota MCP server:</p>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <button
                      onClick={() => copyCode(CODE_EXAMPLES.mcp.config, 'mcp-config')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded"
                    >
                      {copiedCode === 'mcp-config' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                    <pre className="text-sm text-gray-100 whitespace-pre-wrap">{CODE_EXAMPLES.mcp.config}</pre>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">3. Restart Claude Desktop</p>
                  <p className="text-sm text-gray-600">
                    The Pivota tools will now be available in your Claude conversations
                  </p>
                </div>
              </div>
            </div>

            {/* Available MCP Tools */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available MCP Tools</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">catalog.search</p>
                    <p className="text-xs text-gray-600">Search for products by query</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">inventory.check</p>
                    <p className="text-xs text-gray-600">Check product availability</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">order.create</p>
                    <p className="text-xs text-gray-600">Create a new order</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">order.status</p>
                    <p className="text-xs text-gray-600">Check order status and tracking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Usage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Example Claude Conversation</h2>
              <div className="space-y-3">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">You:</span> &quot;Find me a coffee mug under $20&quot;
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Claude:</span> &quot;I&apos;ll search for coffee mugs in that price range... 
                    I found 5 options. The &apos;Ceramic Coffee Mug&apos; from ChydanTest Store is $15.99 and has great reviews. 
                    Would you like me to create an order?&quot;
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">You:</span> &quot;Yes, please order it&quot;
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Claude:</span> &quot;✅ Order created successfully! Order ID: ord_abc123. 
                    Total: $15.99. You&apos;ll receive a confirmation email shortly.&quot;
                  </p>
              </div>
            </div>
          </div>

            {/* Resources */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                  <h3 className="font-semibold text-blue-900 mb-2">MCP Resources</h3>
                  <div className="space-y-2">
                    <a
                      href="https://modelcontextprotocol.io"
                      target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      MCP Documentation
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    <a
                      href="https://github.com/your-org/pivota-mcp-server"
                  target="_blank"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                      Pivota MCP Server on GitHub
                      <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}
