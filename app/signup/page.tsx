'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Bot, Building, CheckCircle2, Key, Mail, User } from 'lucide-react';
import InlineNotice from '@/components/portal/InlineNotice';
import { agentApi } from '@/lib/api-client';

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
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#ffffff_100%)] px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Registration complete</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <span>Agent name</span>
                    <span className="font-medium text-slate-900">{formData.agent_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Email</span>
                    <span className="font-medium text-slate-900">{formData.agent_email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Company</span>
                    <span className="font-medium text-slate-900">{formData.company}</span>
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
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#ffffff_100%)] px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <Bot className="h-4 w-4 text-[var(--portal-accent)]" />
            <span>Developer onboarding</span>
          </div>
          <div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-slate-950">
              Create a production-ready Pivota developer account
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Register your agent, receive a one-time API key handoff when available, and continue into the portal for keys, usage, docs, logs, and webhook setup.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              'Use one account per integration surface or partner environment.',
              'Store production API keys outside source control and rotate after incidents.',
              'Return to the portal after registration to manage keys and monitor production health.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--portal-accent)]/10 text-[var(--portal-accent)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Pivota</p>
              <p className="text-sm text-slate-500">Developer Portal</p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Register your agent</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create a public developer account for your production integration. Registration currently supports name, email, password, and company only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {formError ? <InlineNotice tone="critical">{formError}</InlineNotice> : null}

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4" />
                <span>Agent name</span>
              </span>
              <input
                type="text"
                required
                value={formData.agent_name}
                onChange={(event) => setFormData((current) => ({ ...current, agent_name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--portal-accent)]"
                placeholder="My AI Shopping Assistant"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </span>
              <input
                type="email"
                required
                value={formData.agent_email}
                onChange={(event) => setFormData((current) => ({ ...current, agent_email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--portal-accent)]"
                placeholder="developer@company.com"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Key className="h-4 w-4" />
                  <span>Password</span>
                </span>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--portal-accent)]"
                  placeholder="••••••••"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--portal-accent)]"
                  placeholder="••••••••"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Building className="h-4 w-4" />
                <span>Company</span>
              </span>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(event) => setFormData((current) => ({ ...current, company: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--portal-accent)]"
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
              <span>{loading ? 'Creating account…' : 'Create developer account'}</span>
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>

            <p className="text-center text-xs leading-6 text-slate-500">
              By registering, you agree to Pivota&apos;s developer terms and production integration policies.
            </p>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/login" className="hover:text-slate-900">
              Already have an account? Sign in
            </Link>
            <a href="https://pivota.cc" className="hover:text-slate-900">
              Back to pivota.cc
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
