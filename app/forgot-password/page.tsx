'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, LifeBuoy, Mail, ShieldAlert } from 'lucide-react';

const SUPPORT_EMAIL = 'contact@pivota.cc';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent('Pivota Developer Portal password reset request');
    const body = encodeURIComponent(
      `Please help reset my Pivota Developer Portal password.\n\nAccount email: ${email || '[enter your account email]'}\n\nIssue: I can no longer access the developer portal.\n`,
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [email]);

  const handleRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequested(true);
    window.location.href = mailtoHref;
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
                Self-serve password reset is not live yet. Use this recovery flow to open a support request from your account email and get access restored.
              </p>
            </div>
          </div>

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
                <span>Support-managed recovery</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--portal-fg-muted)]">
                We will open your email client with a prefilled reset request addressed to{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-[var(--portal-accent)] hover:text-[var(--portal-accent-strong)]"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--portal-accent)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)]"
              >
                <Mail className="h-4 w-4" />
                <span>Request password reset</span>
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
              If your mail app did not open, send your request manually to {SUPPORT_EMAIL} from the email tied to your developer account.
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
