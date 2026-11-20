'use client';

import Link from 'next/link';
import { Badge, PageHeader } from '../ui';
import { useSignedIn } from '../useSignedIn';

/**
 * Earnings, early-access state only (DevEarningsNow board, with the build decisions):
 * - no rate: the share is "set in your developer agreement" until the network terms
 *   are confirmed (no rate percentage anywhere);
 * - no live-merchants count (only the staff registry knows it);
 * - no numbers at all: there is no earnings read API yet.
 * Vocabulary shared with the employee portal: Pending → Confirmed → Settled → Paid out, plus Reversed.
 */
const TERMS = [
  { head: 'A share of net commission', body: 'For orders your agent sends, you earn a share of the net commission Pivota receives. The share is set in your developer agreement.' },
  { head: 'Quarterly', body: 'After each quarter closes, we pay out the commission that settled during it.' },
  { head: '$50 minimum', body: 'A smaller balance rolls over to the next quarter.' },
  { head: 'Settled only', body: "You're paid only from commission the network has already paid to Pivota. A return or cancellation reverses it." },
];

const STAGES: { label: string; tone: 'neu' | 'ok' | 'err'; body: string }[] = [
  { label: 'Pending', tone: 'neu', body: 'The network reported the commission.' },
  { label: 'Confirmed', tone: 'neu', body: 'The network locked it.' },
  { label: 'Settled', tone: 'ok', body: 'The network paid Pivota.' },
  { label: 'Paid out', tone: 'ok', body: 'We paid it to you.' },
];

export default function EarningsPage() {
  const ready = useSignedIn();
  if (!ready) return <main className="pv2-main" aria-busy="true" />;

  return (
    <main className="pv2-main">
      <PageHeader title="Earnings" badge={<Badge tone="neu">Early access</Badge>} />

      <section className="pv2-card pv2-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 className="pv2-h2">Commission isn't being tracked yet</h2>
        <p className="pv2-muted" style={{ maxWidth: 760 }}>
          We're joining merchants' affiliate programs now. Once a merchant's program is live with Pivota, orders your agent sends to that
          merchant start earning commission. Orders placed before then don't earn. This page will show your commission once the first one is
          tracked.
        </p>
      </section>

      <section className="pv2-card pv2-card-clip">
        <div className="pv2-card-head"><h2 className="pv2-h2">How you'll earn</h2></div>
        <div className="pv2-earn-terms">
          {TERMS.map((term) => (
            <div key={term.head} className="pv2-earn-term">
              <div className="pv2-strong">{term.head}</div>
              <div className="pv2-muted">{term.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pv2-card pv2-card-clip">
        <div className="pv2-card-head"><h2 className="pv2-h2">How commission moves</h2></div>
        <ol className="pv2-earn-stages">
          {STAGES.map((stage, index) => (
            <li key={stage.label} className="pv2-earn-stage">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="pv2-muted pv2-small" aria-hidden="true">{index + 1}</span>
                <Badge tone={stage.tone}>{stage.label}</Badge>
              </span>
              <span className="pv2-muted">{stage.body}</span>
            </li>
          ))}
        </ol>
        <div className="pv2-earn-reversed">
          <Badge tone="err">Reversed</Badge>
          <span className="pv2-muted">A return or cancellation cancelled the commission, at any stage before it's paid out.</span>
        </div>
      </section>

      <section className="pv2-card pv2-card-clip">
        <div className="pv2-card-head"><h2 className="pv2-h2">Get ready now</h2></div>
        <div className="pv2-steps">
          <div className="pv2-step">
            <span className="pv2-step-mark">1</span>
            <div className="pv2-step-body">
              <div className="pv2-step-title">Pass Pivota's links through unchanged</div>
              <div className="pv2-muted">
                Send shoppers to the checkout and product links our tools return, exactly as returned. If tracking parameters are stripped or
                links are rewritten, the order can't be credited to you.
              </div>
            </div>
          </div>
          <div className="pv2-step">
            <span className="pv2-step-mark">2</span>
            <div className="pv2-step-body">
              <div className="pv2-step-title">Use your own production key for real shoppers</div>
              <div className="pv2-muted">Orders are credited to the agent that owns the API key.</div>
            </div>
            <Link href="/api-keys" className="pv2-step-aside">API keys</Link>
          </div>
          <div className="pv2-step">
            <span className="pv2-step-mark">3</span>
            <div className="pv2-step-body">
              <div className="pv2-step-title">Add payout details</div>
              <div className="pv2-muted">This opens before your first payout. We'll ask for bank details and a tax form then.</div>
            </div>
            <button type="button" className="pv2-btn pv2-step-aside" disabled>Not yet available</button>
          </div>
        </div>
      </section>
    </main>
  );
}
