'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Command, KeyRound, Loader2, ScrollText, Webhook } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

const consoleHighlights = [
  {
    title: 'Production overview',
    description: 'Check API activity, recent events, latency, and attention items from one place.',
    icon: Command,
  },
  {
    title: 'Key and webhook access',
    description: 'Manage API keys, review webhook setup, and keep integration controls close to the surface.',
    icon: KeyRound,
  },
  {
    title: 'Operational entry points',
    description: 'Jump directly into docs, logs, endpoint usage, and order flow monitoring after sign-in.',
    icon: ScrollText,
  },
];

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await agentApi.login(email, password);

      if (response.success && response.agent) {
        router.push('/dashboard');
        return;
      }

      setError(response.detail || response.message || 'Invalid credentials.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--portal-canvas)] text-[var(--portal-fg)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:px-10">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--portal-border-strong)] bg-white/72 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)] shadow-[var(--portal-shadow-card)]">
              <Webhook className="h-3.5 w-3.5 text-[var(--portal-accent)]" />
              Developer Console
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-[var(--portal-fg)]">
              Sign in to the Pivota Developer Portal
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--portal-fg-muted)]">
              Production-ready access to API keys, usage, webhooks, orders, docs, and operational visibility for external integrations.
            </p>

            <div className="mt-10 grid gap-4">
              {consoleHighlights.map((item) => {
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

        <section className="mx-auto flex w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] p-7 shadow-[var(--portal-shadow-overlay)] sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] text-[var(--portal-accent)]">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.01em] text-[var(--portal-fg)]">Pivota</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--portal-fg-subtle)]">Developer Portal</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Use your developer account to manage keys, review usage, and monitor production integrations.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Email</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  placeholder="developer@company.com"
                />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--portal-fg)]">Password</span>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                  placeholder="Enter your password"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--portal-accent)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--portal-fg)]">Need access?</p>
              <p className="mt-1 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Create a developer account to get your API key and complete onboarding for your production integration.
              </p>
              <Link
                href="/onboarding"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>Start onboarding</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
