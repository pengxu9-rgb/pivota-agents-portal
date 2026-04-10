'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building,
  CheckCircle2,
  Command,
  Key,
  Loader2,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import InlineNotice from '@/components/portal/InlineNotice';
import { agentApi } from '@/lib/api-client';

const signupHighlights = [
  {
    title: 'Production onboarding',
    description: 'Use one account per integration surface or partner environment so production access stays clean and auditable.',
    icon: ShieldCheck,
  },
  {
    title: 'One-time key handoff',
    description: 'If the backend returns a new API key during registration, the portal shows it exactly once on the next screen.',
    icon: Key,
  },
  {
    title: 'Portal controls after setup',
    description: 'Return after registration to manage keys, review usage, check docs, and monitor webhook or order health.',
    icon: Command,
  },
];

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.';
  return null;
}

export default function AgentSignup() {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [formError, setFormError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_email: '',
    password: '',
    confirmPassword: '',
    company: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setCopyMessage('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const validationError = validatePassword(formData.password);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await agentApi.register({
        email: formData.agent_email.trim(),
        password: formData.password,
        agent_name: formData.agent_name.trim(),
        company: formData.company.trim() || null,
      });

      if (!response?.success) {
        setFormError(response?.detail || response?.message || 'Registration failed.');
        return;
      }

      setApiKey(response.api_key || '');
      setRegistrationComplete(true);
    } catch (error: any) {
      setFormError(error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!apiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopyMessage('API key copied. Store it securely now.');
    } catch (error) {
      console.error('Failed to copy API key:', error);
      setCopyMessage('Copy failed. Select the key manually and store it securely.');
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-[var(--portal-canvas)] text-[var(--portal-fg)]">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-10">
          <div className="w-full rounded-[28px] border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] p-7 shadow-[var(--portal-shadow-overlay)] sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Registration complete</h1>
              <p className="mt-3 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Your developer account is ready. Review the one-time credential handoff below, then continue to sign in.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {apiKey ? (
                <InlineNotice tone="warning" title="Store this API key securely">
                  This is the only time the full key will be shown.
                </InlineNotice>
              ) : (
                <InlineNotice tone="info" title="No one-time API key was returned">
                  The account was created successfully, but the backend did not return a new key in this response. Sign in to manage keys from the portal.
                </InlineNotice>
              )}

              {copyMessage ? <InlineNotice tone="success">{copyMessage}</InlineNotice> : null}

              {apiKey ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-violet-900">Primary API key</p>
                      <code className="mt-3 block break-all rounded-xl border border-violet-200 bg-white px-3 py-3 font-mono text-sm text-slate-800">
                        {apiKey}
                      </code>
                    </div>
                    <button
                      onClick={() => void handleCopyApiKey()}
                      className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                    >
                      Copy key
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] p-4">
                <div className="space-y-2 text-sm text-[var(--portal-fg-muted)]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Agent name</span>
                    <span className="font-medium text-[var(--portal-fg)]">{formData.agent_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Email</span>
                    <span className="font-medium text-[var(--portal-fg)]">{formData.agent_email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Company</span>
                    <span className="font-medium text-[var(--portal-fg)]">{formData.company}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--portal-accent)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <span>Continue to sign in</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-fg)]"
              >
                View docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--portal-canvas)] text-[var(--portal-fg)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:items-start lg:gap-12 lg:px-10">
        <section className="hidden lg:block lg:pt-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--portal-border-strong)] bg-white/72 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)] shadow-[var(--portal-shadow-card)]">
              <Bot className="h-3.5 w-3.5 text-[var(--portal-accent)]" />
              Developer onboarding
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-[var(--portal-fg)]">
              Create a production-ready Pivota developer account
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--portal-fg-muted)]">
              Register your agent, receive a one-time API key handoff when available, and continue into the portal for keys, usage, docs, logs, and webhook setup.
            </p>

            <div className="mt-10 grid gap-4">
              {signupHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-5 py-4 shadow-[var(--portal-shadow-card)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] text-[var(--portal-accent)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--portal-fg)]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--portal-fg-muted)]">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-lg flex-col justify-center lg:ml-auto lg:min-h-screen lg:py-8">
          <div className="rounded-[28px] border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] p-7 shadow-[var(--portal-shadow-overlay)] sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] text-[var(--portal-accent)]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.01em] text-[var(--portal-fg)]">Pivota</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Developer Portal</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Register your agent</h2>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4 lg:hidden">
              <p className="text-sm font-medium text-[var(--portal-fg)]">What to expect</p>
              <p className="mt-1 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Register once per production surface, receive a one-time API key handoff when available, then continue into the portal to manage keys and operational controls.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {formError ? <InlineNotice tone="critical">{formError}</InlineNotice> : null}

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--portal-fg)]">
                  <User className="h-4 w-4 text-[var(--portal-fg-subtle)]" />
                  <span>Agent name</span>
                </span>
                <input
                  type="text"
                  required
                  autoComplete="organization-title"
                  value={formData.agent_name}
                  onChange={(event) => setFormData((current) => ({ ...current, agent_name: event.target.value }))}
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  placeholder="My AI Shopping Assistant"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--portal-fg)]">
                  <Mail className="h-4 w-4 text-[var(--portal-fg-subtle)]" />
                  <span>Email</span>
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.agent_email}
                  onChange={(event) => setFormData((current) => ({ ...current, agent_email: event.target.value }))}
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  placeholder="developer@company.com"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--portal-fg)]">
                    <Key className="h-4 w-4 text-[var(--portal-fg-subtle)]" />
                    <span>Password</span>
                  </span>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                    placeholder="••••••••"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Confirm password</span>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                    placeholder="••••••••"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--portal-fg)]">
                  <Building className="h-4 w-4 text-[var(--portal-fg-subtle)]" />
                  <span>Company</span>
                </span>
                <input
                  type="text"
                  required
                  autoComplete="organization"
                  value={formData.company}
                  onChange={(event) => setFormData((current) => ({ ...current, company: event.target.value }))}
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  placeholder="Acme AI Labs"
                />
              </label>

              <InlineNotice tone="info" title="One-time key handoff">
                If the backend returns a new API key during registration, the portal will show it exactly once on the next screen.
              </InlineNotice>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--portal-accent)] px-4 py-3.5 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>Create developer account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-6 text-[var(--portal-fg-subtle)]">
                By registering, you agree to Pivota&apos;s developer terms and production integration policies.
              </p>
            </form>

            <div className="mt-6 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--portal-fg)]">Already have access?</p>
              <p className="mt-1 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Sign in to manage keys, review usage, and monitor production integrations from the portal.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                >
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="https://pivota.cc" className="text-[var(--portal-fg-muted)] hover:text-[var(--portal-fg)]">
                  Back to pivota.cc
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
