# Pivota Developer Portal Webhook Production Acceptance

Date: 2026-03-22

## Scope

Validate the production developer webhook control surface and backend contract end to end:

- webhook config read/write
- webhook event catalog
- webhook test delivery
- webhook delivery history
- dashboard and webhooks page state updates

## Production deployments used

- Developer Portal frontend:
  - `https://developer.pivota.cc`
  - active Vercel deployment at validation time:
    - initial webhook validation:
      - `https://pivota-agents-portal-8i2n8dzde-peng-3139s-projects.vercel.app`
    - final UX validation:
      - `https://pivota-agents-portal-gwqw54s92-peng-3139s-projects.vercel.app`
- Backend:
  - `https://web-production-fedb.up.railway.app`
  - active Railway deployment at final validation time:
    - initial webhook route rollout:
      - `74d7e462-6d05-47c8-9d94-d1249acee773`
    - final managed receiver rollout:
      - `a1d50a76-e44b-4b61-b1f1-98d018381eda`

## Production account used

- email: `contact@pivota.cc`
- agent id: `agent_982b1ea2df866206`

## Verified backend behavior

The following production endpoints returned successful responses during validation:

- `GET /agents/{agent_id}/webhooks/config`
- `PUT /agents/{agent_id}/webhooks/config`
- `GET /agents/{agent_id}/webhooks/events/catalog`
- `POST /agents/{agent_id}/webhooks/test`
- `GET /agents/{agent_id}/webhooks/deliveries`
- `POST /agents/{agent_id}/webhooks/managed-inbox`

Validated live results:

- webhook config initially returned `enabled: false` and `destination_url: null`
- webhook config save succeeded with a temporary HTTPS destination during the first validation pass
- webhook test returned a real delivery record during the first validation pass:
  - `delivery_id: whd_c1acd911ed724aff951a5c29`
  - `event_type: webhook.test`
  - `status: delivered`
  - `http_status: 200`
  - `latency_ms: 112`
- a first-party managed receiver was then added to production and exposed through `managed_receiver_url`
- the managed receiver URL returned from production config was:
  - `https://web-production-fedb.up.railway.app/agents/agent_982b1ea2df866206/webhooks/managed-inbox`
- webhook config save succeeded again with the managed receiver as the destination
- webhook test returned a second real delivery record against the managed receiver:
  - `delivery_id: whd_e83d8caf8bed47a5aaa14ec3`
  - `event_type: webhook.test`
  - `status: delivered`
  - `http_status: 200`
  - `latency_ms: 85`
- webhook deliveries feed returned both persisted deliveries and request headers:
  - `X-Pivota-Event`
  - `X-Pivota-Delivery`
  - `X-Pivota-Timestamp`
  - `X-Pivota-Signature`
- final webhook config reflected:
  - `enabled: true`
  - `destination_url: https://web-production-fedb.up.railway.app/agents/agent_982b1ea2df866206/webhooks/managed-inbox`
  - `last_test_status: delivered`
  - `delivery_summary_24h.total: 2`
  - `delivery_summary_24h.success_rate: 100.0`

## Verified frontend behavior

The production portal UI reflected the live backend state after data refresh:

- `/webhooks`
  - final state is `Healthy`
  - configured destination URL rendered
  - first-party managed receiver card rendered
  - selected event subscriptions rendered
  - signing secret last4 rendered
  - delivery table showed both `webhook.test` records
- `/dashboard`
  - final webhook summary is `Healthy`
  - hero state showed `All systems operational`
  - webhook summary showed `2 deliveries / 24h`
  - webhook summary showed `100% success rate`

Additional UX validation on the final frontend deployment:

- `/webhooks`
  - first frame on hard refresh now shows `Checking`, not `Missing`
  - settled state shows `Configuration: Healthy`
- `/dashboard`
  - first frame on hard refresh now shows `Webhook: Checking`
  - settled state shows `Webhook: Healthy`

This resolved the earlier misleading frontend behavior where `config === null` during initial client load was rendered as `Missing` before the webhook feed returned.

## Temporary validation action and final production state

To validate delivery in production, a temporary external HTTPS webhook endpoint was configured for the production test:

- temporary destination used:
  - `https://webhook.site/50a94564-9329-4134-8772-d38ecb24bcb5`

After the first validation completed, that temporary external destination was removed.

Final production state is no longer unconfigured. The production agent is now intentionally configured to the Pivota-managed receiver:

- `enabled: true`
- `destination_url: https://web-production-fedb.up.railway.app/agents/agent_982b1ea2df866206/webhooks/managed-inbox`

The successful test delivery records remain in history as validation evidence. A first-party production webhook destination is now left active by design.

## Production issues found and resolved during validation

Resolved before final acceptance:

- backend production was initially still on an older deployment and did not expose the new webhook routes
- backend startup was blocked by missing optional modules during Railway rollout
- webhook config reads failed because async database records were being treated like plain dictionaries
- webhook delivery queries failed because UTC-aware timestamps were being passed into naive DB timestamp comparisons
- there was no first-party production receiver initially, so webhook health depended on temporary external endpoints
- frontend webhook pages initially rendered `Missing` while config data was still loading

## Residual follow-up

Not blocking webhook acceptance:

- a prior browser-automation-only report of developer login landing on the merchant login page could not be reproduced in controlled reruns and is currently tracked as unconfirmed
