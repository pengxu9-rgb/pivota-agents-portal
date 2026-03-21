'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, LifeBuoy, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

const SUPPORT_EMAIL = 'contact@pivota.cc';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent('Pivota Developer Portal password reset request');
    const body = encodeURIComponent(
      `Please help reset my Pivota Developer Portal password.\n\nAccount email: ${email || '[enter your account email]'}\n\nIssue: I can no longer access the developer portal.\n`,
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [email]);

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequesting(true);
    setError('');
    setMessage('');

    try {
      const response = await agentApi.forgotPassword(email);
      setRequested(true);
      setMessage(response?.message || 'If the email exists, a password reset link has been sent.');
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.detail ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to request password reset.',
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--portal-canvas)] text-[var(--portal-fg)]">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <div className="w-full rounded-[28px] border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] p-7 shadow-[var(--portal-shadow-overlay)] sm:p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--portal-fg-muted)] hover:text-[var(--portal-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to sign in</span>
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface-muted)] text-[var(--portal-accent)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-fg-subtle)]">Account recovery</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Recover developer portal access</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--portal-fg-muted)]">
                Request a password reset link for your developer account. If email delivery fails, support can still help you recover access.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleRequest} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Account email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                placeholder="developer@company.com"
              />
            </label>

            <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--portal-fg)]">
                <LifeBuoy className="h-4 w-4 text-[var(--portal-accent)]" />
                <span>Recovery fallback</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                If the reset email does not arrive, contact{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                >
                  {SUPPORT_EMAIL}
                </a>
                {' '}from the email tied to your developer account.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={requesting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--portal-accent)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
              >
                {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                <span>{requesting ? 'Requesting reset…' : 'Request password reset'}</span>
              </button>
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm font-medium text-[var(--portal-fg-muted)] hover:bg-[var(--portal-surface-muted)] hover:text-[var(--portal-fg)]"
              >
                <span>Email support directly</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </form>

          {requested ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--portal-fg)]">Already signed in elsewhere?</p>
              <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Change your password from Settings after you regain access to the portal.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-muted)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--portal-fg)]">New to Pivota?</p>
              <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                Create a new developer account if you have not completed onboarding yet.
              </p>
              <Link
                href="/onboarding"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
              >
                <span>Start onboarding</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
