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
    - `https://pivota-agents-portal-8i2n8dzde-peng-3139s-projects.vercel.app`
- Backend:
  - `https://web-production-fedb.up.railway.app`
  - active Railway deployment at final validation time:
    - `74d7e462-6d05-47c8-9d94-d1249acee773`

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

Validated live results:

- webhook config initially returned `enabled: false` and `destination_url: null`
- webhook config save succeeded with a temporary HTTPS destination
- webhook test returned a real delivery record:
  - `delivery_id: whd_c1acd911ed724aff951a5c29`
  - `event_type: webhook.test`
  - `status: delivered`
  - `http_status: 200`
  - `latency_ms: 112`
- webhook deliveries feed returned the persisted delivery and request headers:
  - `X-Pivota-Event`
  - `X-Pivota-Delivery`
  - `X-Pivota-Timestamp`
  - `X-Pivota-Signature`
- webhook config reflected:
  - `last_test_status: delivered`
  - `delivery_summary_24h.total: 1`
  - `delivery_summary_24h.success_rate: 100.0`

## Verified frontend behavior

The production portal UI reflected the live backend state after data refresh:

- `/webhooks`
  - state changed from `Missing` to `Healthy`
  - configured destination URL rendered
  - selected event subscriptions rendered
  - signing secret last4 rendered
  - delivery table showed the `webhook.test` record
- `/dashboard`
  - webhook summary changed from `Missing` to `Healthy`
  - hero state showed `All systems operational`
  - webhook summary showed `1 deliveries / 24h`
  - webhook summary showed `100% success rate`

## Temporary validation action and cleanup

To validate delivery in production, a temporary external HTTPS webhook endpoint was configured for the production test:

- temporary destination used:
  - `https://webhook.site/50a94564-9329-4134-8772-d38ecb24bcb5`

After validation completed, the production webhook configuration was restored to an unconfigured state:

- `enabled: false`
- `destination_url: null`

The successful test delivery record remains in history as validation evidence. No production webhook destination was left active after the test.

## Production issues found and resolved during validation

Resolved before final acceptance:

- backend production was initially still on an older deployment and did not expose the new webhook routes
- backend startup was blocked by missing optional modules during Railway rollout
- webhook config reads failed because async database records were being treated like plain dictionaries
- webhook delivery queries failed because UTC-aware timestamps were being passed into naive DB timestamp comparisons

## Residual follow-up

Not part of webhook acceptance itself, but still under investigation:

- developer login flow occasionally appeared to land on the merchant login page during browser automation runs; this requires separate browser-level reproduction and is not closed by this report
