'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Fingerprint, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import CodePanel from '@/components/portal/CodePanel';
import InlineNotice from '@/components/portal/InlineNotice';
import SectionHeader from '@/components/portal/SectionHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import SurfaceCard from '@/components/portal/SurfaceCard';
import { agentApi } from '@/lib/api-client';
import { UCP_RESOURCE } from '@/lib/agent-doors';

type IssuerRow = {
  id: number;
  issuer: string;
  jwks_uri: string;
  audience: string;
  algs: string[];
  authorized_party?: string | null;
  required_scopes?: string[] | null;
  status: 'active' | 'disabled';
  last_jwks_ok_at?: string | null;
  updated_at?: string | null;
};

const ALG_CHOICES = ['RS256', 'ES256', 'PS256', 'EdDSA'] as const;

function errorMessage(err: unknown): string {
  const detail = (err as any)?.response?.data?.detail;
  if (detail && typeof detail === 'object') {
    const field = detail.field ? ` (${detail.field})` : '';
    return `${detail.message || detail.error || 'Request failed'}${field}`;
  }
  if (typeof detail === 'string') return detail;
  return (err as any)?.message || 'Request failed';
}

export default function BuyerIdentityIssuers() {
  const [issuers, setIssuers] = useState<IssuerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    issuer: '',
    jwks_uri: '',
    audience: UCP_RESOURCE,
    algs: ['RS256', 'ES256'] as string[],
    authorized_party: '',
    required_scopes: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await agentApi.getIdentityIssuers();
      setIssuers(Array.isArray(data?.issuers) ? data.issuers : []);
    } catch (err) {
      setIssuers([]);
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleAlg = (alg: string) => {
    setForm((prev) => ({
      ...prev,
      algs: prev.algs.includes(alg) ? prev.algs.filter((a) => a !== alg) : [...prev.algs, alg],
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.issuer.trim() || !form.jwks_uri.trim() || !form.audience.trim()) {
      setFormError('Issuer, JWKS URL and audience are required.');
      return;
    }
    if (!/^https:\/\//i.test(form.jwks_uri.trim())) {
      setFormError('The JWKS URL must start with https://.');
      return;
    }
    if (form.algs.length === 0) {
      setFormError('Pick at least one signing algorithm.');
      return;
    }
    try {
      setSaving(true);
      await agentApi.registerIdentityIssuer({
        issuer: form.issuer.trim(),
        jwks_uri: form.jwks_uri.trim(),
        audience: form.audience.trim(),
        algs: form.algs,
        authorized_party: form.authorized_party.trim() || null,
        required_scopes: form.required_scopes.trim()
          ? form.required_scopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
          : null,
      });
      setFormSuccess('Issuer registered. We fetched your JWKS successfully; tokens it signs are accepted with your API key from now on.');
      setShowForm(false);
      setForm((prev) => ({ ...prev, issuer: '', jwks_uri: '', authorized_party: '', required_scopes: '' }));
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (row: IssuerRow) => {
    if (!window.confirm(`Disable ${row.issuer}? Tokens it signs will stop being accepted immediately.`)) return;
    try {
      await agentApi.disableIdentityIssuer(row.id);
      await load();
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  };

  const active = issuers.filter((i) => i.status === 'active');

  return (
    <SurfaceCard className="p-5">
      <SectionHeader
        title="Buyer identity — bring your own users"
        description="Register the token issuer your agent already uses for its users. Checkout calls then accept your user tokens alongside your API key, and your users never leave your UI for a Pivota sign-in."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-3 py-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
            >
              <Plus className="h-4 w-4" />
              <span>{showForm ? 'Cancel' : 'Register issuer'}</span>
            </button>
          </div>
        }
      />

      <div className="mt-5 space-y-4">
        {loadError ? (
          <InlineNotice tone="warning" title="Could not load your issuers">
            {loadError}
          </InlineNotice>
        ) : null}
        {formSuccess ? <InlineNotice tone="success">{formSuccess}</InlineNotice> : null}

        {showForm ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
            {formError ? <InlineNotice tone="critical">{formError}</InlineNotice> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Issuer (exact iss claim)</span>
                <input
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  placeholder="https://id.your-agent.example"
                  className="mt-2 w-full rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">JWKS URL (https)</span>
                <input
                  value={form.jwks_uri}
                  onChange={(e) => setForm({ ...form, jwks_uri: e.target.value })}
                  placeholder="https://id.your-agent.example/.well-known/jwks.json"
                  className="mt-2 w-full rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Audience (aud your tokens carry for Pivota)</span>
                <input
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
              <div className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Signing algorithms (asymmetric only)</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALG_CHOICES.map((alg) => (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => toggleAlg(alg)}
                      className={`rounded-xl px-3 py-1.5 font-mono text-xs ${form.algs.includes(alg) ? 'bg-[var(--portal-accent)] text-white' : 'border border-[var(--portal-border)] bg-white text-[var(--portal-fg-muted)]'}`}
                    >
                      {alg}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Authorized party (optional azp / client_id)</span>
                <input
                  value={form.authorized_party}
                  onChange={(e) => setForm({ ...form, authorized_party: e.target.value })}
                  placeholder="your-app-client-id"
                  className="mt-2 w-full rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Required scopes (optional, space-separated)</span>
                <input
                  value={form.required_scopes}
                  onChange={(e) => setForm({ ...form, required_scopes: e.target.value })}
                  placeholder="pivota.checkout"
                  className="mt-2 w-full rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>
            <p className="text-sm leading-6 text-[var(--portal-fg-muted)]">
              We fetch the JWKS when you save and refuse the registration if it is unreachable or holds no RSA/EC/OKP key. Only this pinned URL is ever used — key URLs inside tokens are ignored. One issuer can be registered by one agent.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)] disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{saving ? 'Verifying JWKS…' : 'Register issuer'}</span>
            </button>
          </form>
        ) : null}

        {!loading && issuers.length === 0 && !loadError ? (
          <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--portal-fg-muted)]">
            No issuer registered. Until you register one, checkout calls identify your users through Pivota&apos;s OAuth sign-in (see Docs → Agent doors → Buyer identity).
          </div>
        ) : null}

        {issuers.map((row) => (
          <div key={row.id} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Fingerprint className="h-4 w-4 text-[var(--portal-fg-subtle)]" />
              <p className="font-mono text-sm text-[var(--portal-fg)]">{row.issuer}</p>
              <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</StatusBadge>
              {row.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => void handleDisable(row)}
                  className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-[var(--portal-fg-muted)] hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Disable</span>
                </button>
              ) : null}
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">JWKS</dt>
                <dd className="break-all font-mono text-xs">{row.jwks_uri}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Audience</dt>
                <dd className="break-all font-mono text-xs">{row.audience}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Algorithms</dt>
                <dd className="font-mono text-xs">{(row.algs || []).join(', ')}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Bindings</dt>
                <dd className="font-mono text-xs">
                  {row.authorized_party ? `azp=${row.authorized_party} ` : ''}
                  {row.required_scopes?.length ? `scopes=${row.required_scopes.join(' ')}` : ''}
                  {!row.authorized_party && !row.required_scopes?.length ? '—' : ''}
                </dd>
              </div>
            </dl>
          </div>
        ))}

        {active.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">How to present a user</p>
            <div className="mt-2">
              <CodePanel
                language="curl"
                code={`curl -sS ${UCP_RESOURCE} \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-API-Key: ak_live_YOUR_KEY" \\
  -H "X-Agent-User-JWT: <token signed by ${active[0].issuer} for aud ${active[0].audience}>" \\
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_checkout","arguments":{"meta":{},"checkout":{"line_items":[{"item":{"id":"sig_PRODUCT_ID"},"quantity":1}]}}}}'`}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
              The token must carry <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">iss</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">sub</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">aud</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">exp</code>, <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">iat</code> and a <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">kid</code> present in your JWKS. Include <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">email</code> + <code className="rounded bg-white px-1.5 py-1 font-mono text-xs">email_verified: true</code> to have the buyer email attested. Tokens from your issuer are accepted only together with your API key.
            </p>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
