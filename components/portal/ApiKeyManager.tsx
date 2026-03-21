'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, KeyRound, Plus, Trash2 } from 'lucide-react';
import EmptyState from '@/components/portal/EmptyState';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
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

export default function ApiKeyManager({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ id: string; key: string } | null>(null);

  useEffect(() => {
    void fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agentApi.getApiKeys();
      if (response.status === 'success') {
        setApiKeys(response.keys || []);
      }
    } catch (requestError) {
      console.error('Failed to fetch API keys:', requestError);
      setError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Enter a label for the new API key.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await agentApi.createApiKey(newKeyName.trim());
      if (response.status === 'success') {
        setNewlyCreatedKey({
          id: response.key_id,
          key: response.key,
        });
        setNewKeyName('');
        await fetchApiKeys();
      }
    } catch (requestError) {
      console.error('Failed to create API key:', requestError);
      setError('Failed to create API key.');
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await agentApi.revokeApiKey(keyId);
      if (response.status === 'success') {
        await fetchApiKeys();
      }
    } catch (requestError) {
      console.error('Failed to revoke API key:', requestError);
      setError('Failed to revoke API key.');
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      window.setTimeout(() => setCopiedKey(null), 2200);
    } catch (requestError) {
      console.error('Failed to copy API key:', requestError);
    }
  };

  return (
    <div className="space-y-5">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {newlyCreatedKey ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800">New API key created</p>
              <p className="mt-1 text-sm text-emerald-700">
                Copy this key now. It will not be shown in full again.
              </p>
              <div className="mt-3 flex items-start gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-emerald-200 bg-white px-3 py-3 font-mono text-sm text-slate-800">
                  {newlyCreatedKey.key}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey.key, newlyCreatedKey.id)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
                  title={copiedKey === newlyCreatedKey.id ? 'Copied' : 'Copy API key'}
                >
                  {copiedKey === newlyCreatedKey.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SurfaceCard className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Create new key</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              placeholder="Production key"
              className="w-full rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2.5 text-sm text-[var(--portal-fg)] outline-none ring-0 focus:border-[var(--portal-accent)]"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void createApiKey();
                }
              }}
            />
          </div>
          <button
            onClick={() => void createApiKey()}
            disabled={creating || !newKeyName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{creating ? 'Creating…' : 'Create key'}</span>
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[var(--portal-border)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--portal-fg)]">API keys</h2>
              <p className="mt-1 text-sm text-[var(--portal-fg-muted)]">
                Use separate keys for production, test automation, and partner environments.
              </p>
            </div>
            {!compact ? (
              <button
                onClick={() => void fetchApiKeys()}
                className="rounded-xl border border-[var(--portal-border-strong)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
              >
                Refresh
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-5 w-5" />}
              title="No API keys available"
              description="Create your first key to authenticate requests from production services or partner tooling."
            />
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--portal-fg)]">{key.name}</h3>
                        <StatusBadge tone={key.status === 'revoked' ? 'inactive' : 'success'}>
                          {key.status === 'revoked' ? 'Revoked' : 'Active'}
                        </StatusBadge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--portal-fg-subtle)]">
                        <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                        <span>Last used {key.last_used ? key.last_used : 'Never'}</span>
                        <span>{key.usage_count} requests tracked</span>
                      </div>
                      {key.status === 'active' ? (
                        <div className="mt-3 flex items-start gap-2">
                          <code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-sm text-slate-800">
                            {showKey[key.id] ? key.key : `${key.key.slice(0, 10)}••••••••••••`}
                          </code>
                          <button
                            onClick={() => setShowKey((current) => ({ ...current, [key.id]: !current[key.id] }))}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-white text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                            title={showKey[key.id] ? 'Hide key' : 'Show key'}
                          >
                            {showKey[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => void copyToClipboard(key.key, key.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-white text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
                            title={copiedKey === key.id ? 'Copied' : 'Copy key'}
                          >
                            {copiedKey === key.id ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {key.status === 'active' ? (
                      <button
                        onClick={() => void revokeApiKey(key.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Revoke</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
