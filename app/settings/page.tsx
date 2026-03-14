'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Key, Save, Copy, RefreshCw, Loader2, CreditCard, ExternalLink, Lock } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.';
  return null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    webhook_url: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const validationError = validatePassword(passwordForm.newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setSavingPassword(true);
    try {
      const result = await agentApi.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordSuccess(result.message || 'Password changed successfully. Redirecting to login...');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      window.setTimeout(() => {
        agentApi.logout();
        router.push('/login');
      }, 1200);
    } catch (error: any) {
      setPasswordError(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to change password.'
      );
    } finally {
      setSavingPassword(false);
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold">Security</h2>
            </div>

            {passwordError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            ) : null}

            {passwordSuccess ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {passwordSuccess}
              </div>
            ) : null}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter your current password"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter a new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Confirm the new password"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Use at least 8 characters with uppercase, lowercase, and a number.
              </p>

              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Bank Account Section */}
          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  Bank Account for Payouts
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Set up your bank account to receive commission payments
                </p>
              </div>
              <Link
                href="/payouts?tab=bank"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                <span>Manage Bank Details</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                💰 Get Paid for Your Commissions
              </p>
              <p className="text-sm text-blue-700 mb-3">
                Add your bank account details to receive commission payments from merchants. 
                You can choose from Wire Transfer, ACH (US), or SEPA (EU).
              </p>
              <Link
                href="/payouts?tab=bank"
                className="text-sm text-blue-700 font-medium underline hover:text-blue-900"
              >
                Set up bank account now →
              </Link>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-8">
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
