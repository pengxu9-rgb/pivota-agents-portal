'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { agentApi } from '@/lib/api-client';

// Mirrors the backend's _validate_password_strength so the user sees the rule
// before the round trip; the backend still enforces it. The classes follow Python's
// isupper/islower (the Uppercase/Lowercase properties) and are a superset of
// isdigit, so a password the backend accepts, e.g. one with an accented capital,
// is never blocked here; anything looser is still rejected server-side.
function validatePassword(password: string): string | null {
  if (Array.from(password).length < 8) return 'Password must be at least 8 characters long';
  if (!/\p{Uppercase}/u.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/\p{Lowercase}/u.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[\p{Nd}\p{No}]/u.test(password)) return 'Password must contain at least one digit';
  return null;
}

function describeError(requestError: any): string {
  const detail = requestError?.response?.data?.detail;
  // Pydantic validation failures come back as a list of {msg} objects.
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean);
    if (messages.length) return messages.join('; ');
  }
  if (typeof detail === 'string') return detail;
  return (
    requestError?.response?.data?.message ||
    requestError?.message ||
    'Failed to reset password. Please try again.'
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--portal-canvas)] text-[var(--portal-fg-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  // Only a backend rejection (bad, expired or used token) is fixed by a new link;
  // a mismatch or weak password is fixed by retyping.
  const [tokenRejected, setTokenRejected] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setTokenRejected(false);

    if (!token) {
      setError('This reset link is missing its token. Request a new reset link.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setSubmitting(true);
    try {
      await agentApi.resetPassword(token, newPassword);
      // Drop any session still cached in this browser, possibly another account's,
      // so the next sign-in starts clean.
      agentApi.logout();
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (requestError: any) {
      setError(describeError(requestError));
      setTokenRejected(true);
    } finally {
      setSubmitting(false);
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
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-fg-subtle)]">Account recovery</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--portal-fg)]">Choose a new password</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--portal-fg-muted)]">
                Set a new password for your developer account. Reset links expire after one hour and work once.
              </p>
            </div>
          </div>

          {!token ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              This reset link is missing its token.{' '}
              <Link href="/forgot-password" className="font-medium underline">
                Request a new reset link
              </Link>
              .
            </div>
          ) : null}

          {error && token ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
              {tokenRejected ? (
                <>
                  {' '}
                  <Link href="/forgot-password" className="font-medium underline">
                    Request a new link
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}

          {done ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Password reset. Redirecting you to sign in…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">New password</span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={!token}
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                />
                <span className="mt-2 block text-xs text-[var(--portal-fg-subtle)]">
                  At least 8 characters, with an uppercase letter, a lowercase letter and a number.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--portal-fg)]">Confirm new password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={!token}
                  className="w-full rounded-2xl border border-[var(--portal-border-strong)] bg-[var(--portal-surface)] px-4 py-3 text-sm text-[var(--portal-fg)] outline-none focus:border-[var(--portal-accent)]"
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !token}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--portal-accent)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--portal-accent-strong)] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                <span>{submitting ? 'Resetting…' : 'Reset password'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
