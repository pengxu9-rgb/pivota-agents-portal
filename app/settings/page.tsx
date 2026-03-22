'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, RefreshCw, Save, Webhook } from 'lucide-react';
import ConfirmDialog from '@/components/portal/ConfirmDialog';
import InlineNotice from '@/components/portal/InlineNotice';
import PageHeader from '@/components/portal/PageHeader';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
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
  });
  const [webhookConfig, setWebhookConfig] = useState<any>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [loadMessage, setLoadMessage] = useState('');
  const [showResetKeyConfirm, setShowResetKeyConfirm] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [apiKeyUnavailable, setApiKeyUnavailable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedKey = localStorage.getItem('agent_api_key') || '';
    setApiKey(storedKey);

    void loadProfile();
  }, [router]);

  const loadProfile = async () => {
    setLoadMessage('');
    const [profileResult, apiKeyResult, webhookResult] = await Promise.allSettled([
      agentApi.getProfile(),
      agentApi.getApiKeys(),
      agentApi.getWebhookConfig(),
    ]);

    if (profileResult.status === 'fulfilled' && profileResult.value?.agent) {
      setProfile({
        name: profileResult.value.agent.agent_name || '',
        email: profileResult.value.agent.owner_email || '',
        company: profileResult.value.agent.company || '',
      });
    } else if (profileResult.status === 'rejected') {
      console.error('Failed to load profile:', profileResult.reason);
      setLoadMessage('Profile data is temporarily unavailable. You can retry after the backend feed recovers.');
    }

    if (apiKeyResult.status === 'fulfilled') {
      const primaryKey = apiKeyResult.value?.keys?.find((key: any) => key?.status === 'active')?.key || '';
      setApiKey(primaryKey || localStorage.getItem('agent_api_key') || '');
      setApiKeyUnavailable(false);
    } else {
      console.error('Failed to load API key preview:', apiKeyResult.reason);
      setApiKey(localStorage.getItem('agent_api_key') || '');
      setApiKeyUnavailable(true);
      setLoadMessage((current) =>
        current
          ? `${current} API key metadata is also unavailable right now.`
          : 'API key metadata is temporarily unavailable. The portal is showing the current session key preview if one exists.',
      );
    }

    if (webhookResult.status === 'fulfilled') {
      setWebhookConfig(webhookResult.value?.config ?? null);
    } else {
      console.error('Failed to load webhook status:', webhookResult.reason);
      setWebhookConfig(null);
      setLoadMessage((current) =>
        current
          ? `${current} Webhook status is also unavailable right now.`
          : 'Webhook status is temporarily unavailable.',
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await agentApi.updateProfile(profile);
      setSaveMessage('Profile settings saved.');
    } catch (error: any) {
      setSaveMessage(`Failed to save settings: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetKey = async () => {
    setRotatingKey(true);
    try {
      const result = await agentApi.resetApiKey();

      if (result.new_api_key) {
        setApiKey(result.new_api_key);
        localStorage.setItem('agent_api_key', result.new_api_key);
        setSaveMessage('Primary key rotated. Copy the new key from the API Keys page if needed.');
      } else {
        const refreshed = await agentApi.getApiKeys().catch(() => ({ keys: [] }));
        const nextKey = refreshed?.keys?.find((key: any) => key?.status === 'active')?.key || '';
        setApiKey(nextKey);
        setSaveMessage('Primary key rotated. Refresh the API Keys page to confirm the active credential.');
      }
      setShowResetKeyConfirm(false);
    } catch (error: any) {
      setSaveMessage(`Failed to rotate key: ${error.response?.data?.detail || error.message}`);
    } finally {
      setRotatingKey(false);
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

      setPasswordSuccess(result.message || 'Password changed successfully. Redirecting to login…');
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
          'Failed to change password.',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Settings"
        description="Account, webhook, and security settings that support your production integration."
        badge={<StatusBadge tone="production">Production</StatusBadge>}
        actions={
          <button
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving…' : 'Save changes'}</span>
          </button>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {loadMessage ? (
          <InlineNotice tone="warning" title="Some settings data is temporarily unavailable">
            {loadMessage}
          </InlineNotice>
        ) : null}

        {saveMessage ? (
          <InlineNotice tone={saveMessage.startsWith('Failed') ? 'critical' : 'success'}>
            {saveMessage}
          </InlineNotice>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SurfaceCard className="p-5">
            <SectionHeader title="Profile" description="Visible account details used across the developer portal." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Agent name</span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  placeholder="My AI Agent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] px-3 py-2.5 text-sm text-[var(--portal-fg-muted)] outline-none"
                />
                <span className="mt-2 block text-xs text-[var(--portal-fg-subtle)]">Email is managed by your account authentication record.</span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Company</span>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(event) => setProfile({ ...profile, company: event.target.value })}
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                />
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader title="Credential management" description="API keys are now first-class and live outside Settings." />
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--portal-fg)]">Primary key preview</p>
                    <p className="mt-2 break-all font-mono text-sm text-[var(--portal-fg-muted)]">
                      {apiKey ? `${apiKey.slice(0, 16)}••••••••••••` : apiKeyUnavailable ? 'Unavailable' : 'No key loaded'}
                    </p>
                  </div>
                  <StatusBadge tone={apiKeyUnavailable ? 'warning' : 'info'}>
                    {apiKeyUnavailable ? 'Preview unavailable' : 'Managed'}
                  </StatusBadge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/api-keys"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                >
                  <span>Open API keys</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setShowResetKeyConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{rotatingKey ? 'Rotating…' : 'Rotate primary key'}</span>
                </button>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard className="p-5">
            <SectionHeader title="Webhook status" description="Webhook destinations are now managed in the dedicated delivery console." />
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-[var(--portal-accent)]" />
                  <p className="text-sm font-semibold text-[var(--portal-fg)]">
                    {webhookConfig?.enabled && webhookConfig?.destination_url
                      ? webhookConfig?.delivery_summary_24h?.total > 0
                        ? webhookConfig?.delivery_summary_24h?.failed > 0 || webhookConfig?.delivery_summary_24h?.retrying > 0
                          ? 'Webhook delivery needs attention'
                          : 'Webhook delivery healthy'
                        : 'Webhook configured'
                      : 'Webhook configuration missing'}
                  </p>
                </div>
                <p className="mt-2 text-sm text-[var(--portal-fg-muted)]">
                  {webhookConfig?.destination_url
                    ? webhookConfig.destination_url
                    : 'Configure a destination endpoint before you rely on asynchronous event delivery.'}
                </p>
                {webhookConfig?.enabled && webhookConfig?.destination_url ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone="info">
                      {Array.isArray(webhookConfig?.subscribed_events) ? webhookConfig.subscribed_events.length : 0} subscribed events
                    </StatusBadge>
                    <StatusBadge tone={webhookConfig?.delivery_summary_24h?.failed > 0 || webhookConfig?.delivery_summary_24h?.retrying > 0 ? 'warning' : 'success'}>
                      {webhookConfig?.delivery_summary_24h?.success_rate ?? 0}% success rate
                    </StatusBadge>
                  </div>
                ) : null}
              </div>
              <Link
                href="/webhooks"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
              >
                <span>Manage webhooks</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <SectionHeader title="Security" description="Password rotation is still handled here until account flows are fully consolidated." />

            {passwordError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {passwordError}
              </div>
            ) : null}

            {passwordSuccess ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordSuccess}
              </div>
            ) : null}

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Current password</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">New password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Confirm new password</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                <span>{savingPassword ? 'Updating password…' : 'Change password'}</span>
              </button>
            </form>
          </SurfaceCard>
        </div>
      </div>

      <ConfirmDialog
        open={showResetKeyConfirm}
        title="Rotate primary key"
        description="Rotate the current primary API key? Any service still using the existing key will stop authenticating after rotation."
        confirmLabel="Rotate key"
        loading={rotatingKey}
        onConfirm={() => void handleResetKey()}
        onCancel={() => {
          if (!rotatingKey) {
            setShowResetKeyConfirm(false);
          }
        }}
      />
    </div>
  );
}
