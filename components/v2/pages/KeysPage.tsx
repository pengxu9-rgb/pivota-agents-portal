'use client';

import React from 'react';
import { Check, Plus, X } from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import { formatDateUtc } from '@/lib/v2/time';
import { Badge, CopyButton, EmptyState, Modal, Notice, PageHeader, SkeletonRows, errorMessage } from '../ui';
import { useSignedIn } from '../useSignedIn';

type KeyRecord = {
  id: string;
  name: string;
  key: string;
  created_at: string | null;
  last_used: string | null;
  status: 'active' | 'revoked';
  environment: 'live' | 'test' | 'unknown';
  source: 'api' | 'session';
};

/** The stored prefix only (`ak_live_3f…`), never more, whatever the record carries. */
export function keyPrefix(value: string) {
  const visible = value.split(/[*•]/)[0];
  return `${visible.slice(0, 10)}…`;
}

function EnvironmentBadge({ environment }: { environment: KeyRecord['environment'] }) {
  if (environment === 'live') return <Badge tone="ok">Production</Badge>;
  if (environment === 'test') return <Badge tone="warn">Sandbox</Badge>;
  return <Badge tone="neu">Unknown</Badge>;
}

export default function KeysPage() {
  const ready = useSignedIn();
  const [keys, setKeys] = React.useState<KeyRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  // The full secret lives only in this state, only until dismissed. It is never stored.
  const [created, setCreated] = React.useState<{ name: string; secret: string } | null>(null);
  const [pendingRevoke, setPendingRevoke] = React.useState<KeyRecord | null>(null);
  const [revoking, setRevoking] = React.useState(false);
  const [revokeError, setRevokeError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await agentApi.getApiKeys();
      setKeys((response?.keys || []) as KeyRecord[]);
    } catch (error) {
      setLoadError(errorMessage(error, 'Your API keys could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const closeCreate = React.useCallback(() => {
    setCreateOpen(false);
    setCreateError(null);
  }, []);
  const closeRevoke = React.useCallback(() => {
    setPendingRevoke(null);
    setRevokeError(null);
  }, []);

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setCreateError('Give the key a name, so you can tell it apart later.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // Production only: there is no real test mode yet, so no sandbox keys are issued here.
      const response = await agentApi.createApiKey(name, 'live');
      const secret = String(response?.key || response?.api_key || response?.new_api_key || '');
      setCreated(secret ? { name, secret } : null);
      setNotice(
        secret
          ? null
          : `"${name}" was created, but its full value wasn't returned, so it can't be shown. Revoke it and create another.`,
      );
      setCreateOpen(false);
      setNewName('');
      await load();
    } catch (error) {
      setCreateError(errorMessage(error, 'The key could not be created. Try again.'));
    } finally {
      setCreating(false);
    }
  };

  const confirmRevoke = async () => {
    if (!pendingRevoke) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      await agentApi.revokeApiKey(pendingRevoke.id);
      setNotice(`"${pendingRevoke.name}" was revoked.`);
      setPendingRevoke(null);
      await load();
    } catch (error) {
      setRevokeError(errorMessage(error, 'The key could not be revoked. Try again.'));
    } finally {
      setRevoking(false);
    }
  };

  return (
    <main className="pv2-main">
      <PageHeader
        title="API keys"
        description="Keys authenticate your agent's calls. Keep them on your server, never in a browser or app."
        actions={
          <button type="button" className="pv2-btn pv2-btn-pri" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            Create key
          </button>
        }
      />

      {created ? (
        <section className="pv2-card pv2-notice-accent" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--success)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
              <Check aria-hidden="true" style={{ width: 12, height: 12 }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pv2-strong">&ldquo;{created.name}&rdquo; was created</div>
              <div className="pv2-muted" style={{ marginTop: 2 }}>
                Copy it now. For your security we only show the full key once; after you dismiss this, only its prefix is shown.
              </div>
            </div>
            <button type="button" className="pv2-iconbtn" aria-label="Dismiss and hide the key" onClick={() => setCreated(null)}>
              <X aria-hidden="true" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="pv2-input" style={{ flex: '1 1 320px' }} aria-label="New API key" readOnly value={created.secret} onFocus={(event) => event.currentTarget.select()} />
            <CopyButton value={created.secret} label="Copy key" primary />
          </div>
        </section>
      ) : null}

      {notice ? (
        <Notice action={<button type="button" className="pv2-iconbtn" aria-label="Dismiss" onClick={() => setNotice(null)}><X aria-hidden="true" /></button>}>
          {notice}
        </Notice>
      ) : null}

      {loadError ? (
        <Notice tone="error" title="Couldn't load your keys" action={<button type="button" className="pv2-btn" onClick={() => void load()}>Retry</button>}>
          {loadError}
        </Notice>
      ) : null}

      <section className="pv2-card pv2-card-clip">
        {loading ? (
          <SkeletonRows rows={3} />
        ) : keys.length === 0 && !loadError ? (
          <EmptyState
            title="No API keys yet"
            actions={
              <button type="button" className="pv2-btn pv2-btn-pri" onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden="true" />
                Create key
              </button>
            }
          >
            Create a key for your agent's server. You'll see the full key once, right after you create it.
          </EmptyState>
        ) : keys.length > 0 ? (
          <div className="pv2-scroll-x">
            <table className="pv2-tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Key</th>
                  <th scope="col">Environment</th>
                  <th scope="col">Last used</th>
                  <th scope="col">Created (UTC)</th>
                  <th scope="col" className="pv2-r"><span className="pv2-sr">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((record) => {
                  const revoked = record.status === 'revoked';
                  return (
                    <tr key={record.id} className={revoked ? 'pv2-dim' : undefined}>
                      <td>
                        <span style={{ fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {record.name}
                          {revoked ? <Badge tone="neu">Revoked</Badge> : null}
                        </span>
                      </td>
                      <td className="pv2-mono pv2-muted">{keyPrefix(record.key)}</td>
                      <td><EnvironmentBadge environment={record.environment} /></td>
                      <td className={record.last_used ? undefined : 'pv2-muted'}>{record.last_used || 'Never'}</td>
                      <td className="pv2-muted">{formatDateUtc(record.created_at)}</td>
                      <td className="pv2-r">
                        {revoked ? null : record.source === 'session' ? (
                          <span className="pv2-muted pv2-small">Held by this browser</span>
                        ) : (
                          <button type="button" className="pv2-btn pv2-btn-danger" aria-label={`Revoke ${record.name}`} onClick={() => setPendingRevoke(record)}>
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="pv2-card pv2-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="pv2-strong">Production and sandbox keys</div>
        <div className="pv2-muted">
          Production keys (<span className="pv2-mono">ak_live_…</span>) place real orders with merchants. A real test mode is still being
          built, so new keys are always production keys. Older keys marked Sandbox (<span className="pv2-mono">ak_test_…</span>) aren't
          isolated from live traffic yet.
        </div>
      </section>

      {createOpen ? (
        <Modal
          title="Create an API key"
          description="The full key is shown once, right after it's created. Store it on your server."
          onClose={closeCreate}
          footer={
            <>
              <button type="button" className="pv2-btn" onClick={closeCreate}>Cancel</button>
              <button type="submit" form="pv2-create-key" className="pv2-btn pv2-btn-pri" disabled={creating}>
                {creating ? 'Creating…' : 'Create key'}
              </button>
            </>
          }
        >
          <form id="pv2-create-key" onSubmit={submitCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="pv2-field">
              <span className="pv2-label">Name</span>
              <input
                className="pv2-input"
                value={newName}
                maxLength={80}
                placeholder="Production server"
                onChange={(event) => setNewName(event.target.value)}
                aria-invalid={Boolean(createError)}
              />
            </label>
            <div className="pv2-field">
              <span className="pv2-label">Environment</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge tone="ok">Production</Badge>
                <span className="pv2-hint">Sandbox keys arrive with test mode.</span>
              </div>
            </div>
            {createError ? <div className="pv2-small" style={{ color: 'var(--error)' }} role="alert">{createError}</div> : null}
          </form>
        </Modal>
      ) : null}

      {pendingRevoke ? (
        <Modal
          title={`Revoke "${pendingRevoke.name}"?`}
          description={
            <>
              Calls signed with <span className="pv2-mono">{keyPrefix(pendingRevoke.key)}</span> stop working right away. This can't be undone.
            </>
          }
          onClose={closeRevoke}
          footer={
            <>
              <button type="button" className="pv2-btn" onClick={closeRevoke}>Cancel</button>
              <button type="button" className="pv2-btn pv2-btn-danger-solid" onClick={() => void confirmRevoke()} disabled={revoking}>
                {revoking ? 'Revoking…' : 'Revoke key'}
              </button>
            </>
          }
        >
          {revokeError ? <div className="pv2-small" style={{ color: 'var(--error)' }} role="alert">{revokeError}</div> : null}
        </Modal>
      ) : null}
    </main>
  );
}
