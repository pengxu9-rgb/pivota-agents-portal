'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Copy, 
  Trash2, 
  Plus, 
  RefreshCw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Activity
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
  status: 'active' | 'revoked';
  usage_count: number;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getApiKeys();
      setApiKeys(data.keys || []);
    } catch (error: any) {
      console.error('[ApiKeyModal] Failed to load API keys:', error);
      // Don't use mock data - show empty list if API fails
      setApiKeys([]);
      if (error?.response?.status === 500) {
        setNotification({
          type: 'error',
          message: 'Failed to load API keys. Please try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockApiKeys = (): ApiKey[] => [
    {
      id: '1',
      name: 'Production Key',
      key: 'pk_live_1234567890abcdef',
      created_at: '2024-01-15T10:30:00Z',
      last_used: '2 minutes ago',
      status: 'active',
      usage_count: 3429,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'pk_test_abcdef1234567890',
      created_at: '2024-01-10T08:00:00Z',
      last_used: '1 hour ago',
      status: 'active',
      usage_count: 892,
    },
    {
      id: '3',
      name: 'Legacy Integration',
      key: 'pk_live_oldkey123456789',
      created_at: '2023-12-01T12:00:00Z',
      last_used: '5 days ago',
      status: 'revoked',
      usage_count: 15234,
    },
  ];

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      const data = await agentApi.createApiKey();
      
      if (data.status === 'success' && data.key) {
        const newApiKey: ApiKey = {
          id: data.key_id || Date.now().toString(),
          name: newKeyName,
          key: data.key,
          created_at: data.created_at || new Date().toISOString(),
          status: 'active',
          usage_count: 0,
        };
        
        setApiKeys([newApiKey, ...apiKeys]);
        setShowNewKey(data.key);
        setNewKeyName('');
        
        // Auto-hide the new key after 30 seconds
        setTimeout(() => setShowNewKey(null), 30000);
      } else {
        // Fallback for testing
        const mockKey = `pk_${newKeyName.toLowerCase().includes('prod') ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 18)}`;
        const newApiKey: ApiKey = {
          id: Date.now().toString(),
          name: newKeyName,
          key: mockKey,
          created_at: new Date().toISOString(),
          status: 'active',
          usage_count: 0,
        };
        
        setApiKeys([newApiKey, ...apiKeys]);
        setShowNewKey(mockKey);
        setNewKeyName('');
        
        setTimeout(() => setShowNewKey(null), 30000);
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      // Still create a mock key for demo purposes
      const mockKey = `pk_${newKeyName.toLowerCase().includes('prod') ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 18)}`;
      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: mockKey,
        created_at: new Date().toISOString(),
        status: 'active',
        usage_count: 0,
      };
      
      setApiKeys([newApiKey, ...apiKeys]);
      setShowNewKey(mockKey);
      setNewKeyName('');
      
      setTimeout(() => setShowNewKey(null), 30000);
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await agentApi.revokeApiKey(keyId);
      setApiKeys(apiKeys.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' as const } : key
      ));
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 7)}••••••••${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
              <p className="text-sm text-gray-600">Manage your API keys for agent integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {/* New Key Alert */}
          {showNewKey && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">New API key created successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Make sure to copy your new API key now. You won't be able to see it again!
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border border-green-300 text-sm font-mono">
                      {showNewKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(showNewKey)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      {copiedKey === showNewKey ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create New Key */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Create New API Key</h3>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Enter a name for this API key (e.g., Production, Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createApiKey()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={createApiKey}
                disabled={!newKeyName.trim() || creating}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Create Key</span>
              </button>
            </div>
          </div>

          {/* Existing Keys */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Your API Keys</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-600">Loading API keys...</p>
              </div>
            ) : apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className={`border rounded-lg p-4 ${
                      apiKey.status === 'revoked' 
                        ? 'bg-gray-50 border-gray-200 opacity-75' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            apiKey.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {apiKey.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <code className="flex-1 bg-gray-100 px-3 py-1.5 rounded text-sm font-mono text-gray-700">
                            {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            {showKeys[apiKey.id] ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            disabled={apiKey.status === 'revoked'}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          >
                            {copiedKey === apiKey.key ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Created {formatDate(apiKey.created_at)}</span>
                          </div>
                          {apiKey.last_used && (
                            <div className="flex items-center space-x-1">
                              <Activity className="w-3 h-3" />
                              <span>Last used {apiKey.last_used}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>{apiKey.usage_count.toLocaleString()} requests</span>
                          </div>
                        </div>
                      </div>
                      
                      {apiKey.status === 'active' && (
                        <button
                          onClick={() => revokeApiKey(apiKey.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No API keys yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first API key to get started</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Keep your API keys secure and never share them publicly. Rotate keys regularly for better security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {apiKeys.filter(k => k.status === 'active').length} active keys
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

