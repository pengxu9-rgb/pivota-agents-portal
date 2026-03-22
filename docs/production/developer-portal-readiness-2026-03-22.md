# Pivota Developer Portal Production Readiness

Date: 2026-03-22

## Summary

The Developer Portal is now viable as an external developer console. The core developer workflow is present and backed by real production APIs:

- authentication
- signup
- overview
- API keys
- API usage
- webhooks
- logs
- orders
- docs
- endpoints
- settings
- onboarding

The remaining issue is not broad mock coverage. It is mixed maturity inside the core console:

- some pages are fully production-ready
- some are honest but degraded when backend feeds are incomplete
- some controls are still basic and need follow-up to feel complete

Legacy merchant/business/admin surfaces remain intentionally hidden from the external launch surface.

## Current launch decision

Recommended launch posture:

- launch the Developer Portal as the external developer-facing control surface
- keep hidden legacy pages redirected away from the public navigation
- treat degraded states as production debt, not as blockers, unless they mislead users

The previously suspected `developer -> merchant` redirect is currently **not reproducible** in a controlled browser session and is **not a launch blocker**.

## Page-by-page status

| Area | Status | Notes |
| --- | --- | --- |
| Login | Ready | Real login flow; no current redirect evidence to merchant domain. |
| Forgot password | Ready | Real backend flow is live. |
| Signup | Ready with follow-up | Uses real registration flow with supported fields only. |
| Overview | Ready | Real health, request, funnel, activity, and webhook status feeds. |
| API Keys | Ready with degraded fallback | Falls back to current authenticated session key when persisted key inventory is empty. |
| API Usage | Ready with partial-feed degradation | Uses real usage, analytics, funnel, and recent activity feeds; page is honest when some feeds fail. |
| Webhooks | Ready | Dedicated config, test, deliveries, retry, and signing-secret rotation are live. |
| Logs | Basic but usable | Requests, orders, and webhooks are visible; no advanced filtering or export. |
| Orders | Basic but usable | Real list, refund, cancel, tracking, and timeline; export button is not implemented. |
| Docs | Basic but usable | Curated docs are useful, but examples are code-managed and must stay in sync with backend contracts. |
| Endpoints | Basic but usable | Runtime-derived registry exists, but recent-call counts are summary-based rather than a dedicated endpoint telemetry feed. |
| Settings | Ready with partial-feed degradation | Profile, password, key preview, and webhook summary work; page is sensitive to multiple backend feeds. |
| Onboarding | Basic but useful | Real signal-based checklist, but no persisted onboarding program state. |

## Hidden and deferred surfaces

These are intentionally not part of the external developer launch:

- `/wallet`
- `/merchants`
- `/merchants/[id]`
- `/revenue`
- `/payouts`
- `/debug-orders`
- `/developers/docs`

These routes should remain redirected away from the external console until they have real role gating and a separate business or ops information architecture.

## Production gaps that still need follow-up

### P0: important follow-up for external trust

- API key inventory persistence
  - Current behavior in the portal is honest, but still degraded.
  - If the backend returns no persisted key records, the UI shows the current session key instead.
  - This is acceptable short term, but should not be the long-term API Keys experience.

- Order tracking failure semantics
  - `trackOrder()` currently synthesizes an `unknown` response when the backend call fails.
  - That keeps the UI alive, but it collapses transport failure into a fake business state.

- Docs contract drift prevention
  - Docs are curated in code, not backend-generated.
  - Every release that changes agent contracts can silently stale the quickstart or REST examples unless they are explicitly revalidated.

- Webhook regression coverage
  - Live webhook flow is now working, but retry, rotation overlap, and broader event coverage still need automated backend tests and repeatable smoke checks.

### P1: important product completeness work

- Orders export
  - The `Export` control exists in Orders but does not currently trigger a real export flow.

- Logs filtering and drill-down
  - Logs are useful today, but still basic:
  - no filter bar
  - no date range
  - no per-row detail panel
  - no export

- Onboarding depth
  - Onboarding is derived from real signals, which is correct.
  - It still does not persist onboarding progress, explain failures inline, or help users recover when a step cannot complete.

- Endpoints telemetry depth
  - Recent-call counts come from summary data.
  - Endpoint-specific telemetry will need a dedicated feed if this page is meant to support operational debugging at scale.

### P2: can wait after external launch

- richer docs navigation
- downloadable logs or CSV exports
- saved filters
- role-aware settings segmentation
- merchant/business/ops reintroduction behind explicit role gating

## Recommended near-term build plan

### Track A: remove misleading degraded states

- Replace synthetic `unknown` order tracking fallback with a visible unavailable state.
- Keep session-key fallback in API Keys, but make backend inventory persistence the next backend follow-up.
- Add one release-gate step to verify docs snippets against the live OpenAPI or route registry.

### Track B: finish the “basic but usable” pages

- Implement Orders export or remove the control until it is real.
- Add basic filters to Logs:
  - status
  - event type
  - last 24h / 7d
- Add empty-state guidance for Onboarding when real signals fail to load.

### Track C: harden release confidence

- Add a repeated smoke checklist for:
  - login
  - signup
  - forgot password
  - API key create
  - webhook config save
  - webhook test send
  - order creation visibility
  - logs visibility
- Add backend tests for webhook retry behavior and secret rotation overlap.

## Recommended release checklist

- `npm run lint`
- `npm run build`
- login succeeds on `developer.pivota.cc`
- signup succeeds and returns the expected registration result
- forgot password succeeds
- dashboard loads without hydration errors
- API Keys page loads and clearly indicates persisted keys vs session fallback
- webhook config save works
- webhook test send works
- webhook delivery appears in Webhooks and Logs
- docs snippets are spot-checked against the current backend contract
- orders list loads
- refund and cancel confirmations work
- hidden legacy routes redirect away from the external console

## Current recommendation

Treat the Developer Portal as production-capable for external developer use, with a short, explicit follow-up queue:

1. fix API key persistence visibility at the backend level
2. remove fake order-tracking fallback semantics
3. either implement Orders export or remove the button
4. add a lightweight docs contract validation step to release workflow
5. add repeatable webhook smoke and backend regression coverage
