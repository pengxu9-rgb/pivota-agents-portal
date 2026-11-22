'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { agentApi } from '@/lib/api-client';
import { FIRST_CALL } from '@/lib/agent-doors';
import { Badge, CopyButton, EmptyState, PageHeader } from '../ui';
import { useSignedIn } from '../useSignedIn';

/**
 * Home (DevHome board) without invented numbers: there is no per-developer MCP call log
 * yet, so the activity card is an honest "not available yet", and only the checklist steps
 * the portal can actually see (a key exists, a webhook endpoint exists) are ticked.
 */

type Known = boolean | null; // null = couldn't tell

function Step({
  index,
  done,
  title,
  detail,
  aside,
}: {
  index: number;
  done?: Known;
  title: React.ReactNode;
  detail?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className={`pv2-step${done ? ' pv2-step-done' : ''}`}>
      <span className="pv2-step-mark" aria-hidden="true">{done ? <Check /> : index}</span>
      <div className="pv2-step-body">
        <div className="pv2-step-title">
          {title}
          {done ? <span className="pv2-sr"> (done)</span> : null}
        </div>
        {detail ? <div className="pv2-muted">{detail}</div> : null}
      </div>
      {aside ? <div className="pv2-step-aside">{aside}</div> : null}
    </div>
  );
}

export default function HomePage() {
  const ready = useSignedIn();
  const [hasKey, setHasKey] = React.useState<Known>(null);
  const [webhook, setWebhook] = React.useState<'enabled' | 'disabled' | 'none' | null>(null);

  React.useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void Promise.allSettled([agentApi.getApiKeys(), agentApi.getWebhookConfig()]).then(([keys, hook]) => {
      if (cancelled) return;
      if (keys.status === 'fulfilled') {
        const records: any[] = keys.value?.keys || [];
        setHasKey(records.some((record) => record?.status !== 'revoked'));
      }
      if (hook.status === 'fulfilled') {
        const config = hook.value?.config;
        setWebhook(!config?.destination_url ? 'none' : config.enabled ? 'enabled' : 'disabled');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const mono = (text: string) => <span className="pv2-mono pv2-muted" style={{ marginLeft: 6 }}>{text}</span>;

  return (
    <main className="pv2-main">
      <PageHeader title="Home" description="Connect your agent to Pivota: search products across merchants, get live offers, and check out." />

      <div className="pv2-grid-2">
        <section className="pv2-card pv2-card-clip">
          <div className="pv2-card-head"><h2 className="pv2-h2">Get to your first order</h2></div>
          <div className="pv2-steps">
            <Step index={1} done={hasKey} title="Create an API key" aside={hasKey ? null : <Link href="/api-keys">API keys</Link>} />
            <Step index={2} title={<>Search the catalog{mono('search_catalog')}</>} detail="Start with the first-call example. It needs only your key." />
            <Step
              index={3}
              title={<>Get live offers for a product{mono('get_offers')}</>}
              detail="Pass a product id from search. Offers carry the price and merchant you'll check out with."
              aside={<Link href="/docs">Read the guide</Link>}
            />
            <Step index={4} title="Create and complete a checkout session" detail={<span className="pv2-mono">create_checkout_session → complete_checkout_session</span>} />
            <Step
              index={5}
              done={webhook === 'enabled' || webhook === 'disabled'}
              title="Add a webhook endpoint"
              detail="Hear about order.payment_succeeded and order.refunded without polling."
              aside={webhook === 'none' ? <Link href="/webhooks">Webhooks</Link> : null}
            />
          </div>
          <div className="pv2-hint" style={{ padding: '12px 20px', borderTop: '1px solid var(--divider)' }}>
            Steps 2 to 4 aren't ticked automatically: Pivota doesn't keep a log of your agent's MCP calls yet.
          </div>
        </section>

        <div className="pv2-stack">
          <section className="pv2-card">
            <div className="pv2-card-head">
              <h2 className="pv2-h2">Your first call</h2>
              <CopyButton value={FIRST_CALL} />
            </div>
            <pre className="pv2-pre" aria-label="First call example">{FIRST_CALL}</pre>
          </section>

          <section className="pv2-card pv2-card-clip">
            <div className="pv2-card-head"><h2 className="pv2-h2">Status</h2></div>
            <table className="pv2-tbl">
              <tbody>
                <tr>
                  <td>API key</td>
                  <td className="pv2-r">
                    {hasKey === null ? <span className="pv2-muted">—</span> : hasKey ? <Badge tone="ok">Active</Badge> : <Link href="/api-keys">Create one</Link>}
                  </td>
                </tr>
                <tr>
                  <td>Webhook delivery</td>
                  <td className="pv2-r">
                    {webhook === null ? (
                      <span className="pv2-muted">—</span>
                    ) : webhook === 'enabled' ? (
                      <Badge tone="ok">Enabled</Badge>
                    ) : webhook === 'disabled' ? (
                      <Badge tone="neu">Disabled</Badge>
                    ) : (
                      <Badge tone="neu">Not set up</Badge>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Earnings</td>
                  <td className="pv2-r"><Link href="/earnings">Early access</Link></td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <section className="pv2-card">
        <div className="pv2-card-head"><h2 className="pv2-h2">API activity</h2></div>
        <EmptyState title="Not available yet" actions={<Link href="/orders" className="pv2-btn">Open orders</Link>}>
          Pivota doesn't keep a per-developer log of MCP calls yet, so there are no request counts, success rates or latencies to show
          here. Orders your agent places appear under Orders.
        </EmptyState>
      </section>
    </main>
  );
}
