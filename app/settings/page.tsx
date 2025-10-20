'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Key, Bell, Save, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    webhook_url: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const mockKey = localStorage.getItem('agent_api_key') || 'pk_live_' + Math.random().toString(36).substring(2, 15);
    setApiKey(mockKey);
    localStorage.setItem('agent_api_key', mockKey);
    
    loadProfile();
  }, [router]);

  const loadProfile = async () => {
    try {
      const data = await agentApi.getProfile();
      if (data?.agent) {
        setProfile({
          name: data.agent.agent_name || '',
          email: data.agent.owner_email || '',
          company: data.agent.company || '',
          webhook_url: data.agent.webhook_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await agentApi.updateProfile(profile);
      alert('✅ Settings saved!');
    } catch (error: any) {
      alert('❌ Failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleResetKey = async () => {
    if (!confirm('Reset API key? This will invalidate your current key.')) return;
    
    try {
      const result = await agentApi.resetApiKey();
      setApiKey(result.new_api_key);
      localStorage.setItem('agent_api_key', result.new_api_key);
      alert('✅ New API key generated!');
    } catch (error: any) {
      alert('❌ Failed: ' + (error.response?.data?.detail || error.message));
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
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Profile */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="My AI Agent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={profile.webhook_url}
                  onChange={(e) => setProfile({ ...profile, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://your-domain.com/webhook"
                />
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Key className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold">API Credentials</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    alert('Copied!');
                  }}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetKey}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Use this key to authenticate your API requests</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}


