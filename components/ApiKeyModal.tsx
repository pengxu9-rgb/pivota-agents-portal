'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Key,
} from 'lucide-react';
import { agentApi } from '@/lib/api-client';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  status: 'active' | 'revoked';
  usage_count: number;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ id: string; key: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchApiKeys();
    }
  }, [isOpen]);

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agentApi.getApiKeys();
      if (response.status === 'success') {
        setApiKeys(response.keys || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await agentApi.createApiKey(newKeyName);
      if (response.status === 'success') {
        // Show the full key to the user (only shown once)
        setNewlyCreatedKey({
          id: response.key_id,
          key: response.key
        });
        setNewKeyName('');
        // Refresh the list
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      setError('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await agentApi.revokeApiKey(keyId);
      if (response.status === 'success') {
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      setError('Failed to revoke API key');
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">API Key Management</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {newlyCreatedKey && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">New API key created!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="relative">
                  <code className="block w-full px-3 py-3 pr-12 bg-white border border-green-300 rounded text-sm font-mono break-all select-all">
                    {newlyCreatedKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey.key, newlyCreatedKey.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    title={copiedKey === newlyCreatedKey.id ? "Copied!" : "Copy API Key"}
                  >
                    {copiedKey === newlyCreatedKey.id ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create new key form */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Create New API Key</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Enter key name (e.g., Production Key)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createApiKey()}
              />
              <button
                onClick={createApiKey}
                disabled={creating || !newKeyName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{creating ? 'Creating...' : 'Create'}</span>
              </button>
            </div>
          </div>

          {/* API Keys List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your API Keys</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span>Loading API keys...</span>
                </div>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No API keys found</p>
                <p className="text-sm mt-1">Create your first API key to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`p-4 border rounded-lg ${
                      key.status === 'revoked'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{key.name}</h4>
                          {key.status === 'revoked' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                              Revoked
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                          {key.last_used && <span>Last used: {key.last_used}</span>}
                          {key.usage_count > 0 && <span>Used {key.usage_count} times</span>}
                        </div>
                        {key.status === 'active' && (
                          <div className="mt-3 flex items-start space-x-2">
                            <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-sm font-mono break-all overflow-x-auto max-w-full">
                              {showKey[key.id] ? key.key : key.key.substring(0, 10) + '****'}
                            </code>
                            <button
                              onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                              className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              {showKey[key.id] ? (
                                <EyeOff className="w-4 h-4 text-gray-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(key.key, key.id)}
                              className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title={copiedKey === key.id ? "Copied!" : "Copy API Key"}
                            >
                              {copiedKey === key.id ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      {key.status === 'active' && key.id !== 'legacy' && (
                        <button
                          onClick={() => revokeApiKey(key.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            API keys are used to authenticate your requests to the Pivota API. Keep them secure and
            never share them publicly.
          </p>
        </div>
      </div>
    </div>
  );
}