# Pivota Developer API Public Domain Cutover Acceptance

Date: 2026-03-22  
Scope: Production cutover of the external developer-facing API contract from Railway infrastructure hostname to `https://api.pivota.cc`

## Summary

The developer-facing API hostname cutover is complete and live in production.

The canonical public backend contract is now:

- API base: `https://api.pivota.cc`
- OpenAPI: `https://api.pivota.cc/openapi.json`
- Backend docs: `https://api.pivota.cc/docs`
- Managed webhook receiver pattern: `https://api.pivota.cc/agents/{agent_id}/webhooks/managed-inbox`

`web-production-fedb.up.railway.app` remains an infrastructure host only and is no longer exposed through the main Developer Portal experience.

## Production Changes Included

### Frontend

Frontend production is on commit:

- `89952ed` `Normalize stale API host env to public domain`

This follows the earlier cutover commit:

- `bc10f4b` `Cut over developer portal to public API domain`

Key files:

- [config.ts](/Users/pengchydan/dev/pivota-agents-portal/lib/config.ts)
- [api-client.ts](/Users/pengchydan/dev/pivota-agents-portal/lib/api-client.ts)
- [next.config.ts](/Users/pengchydan/dev/pivota-agents-portal/next.config.ts)
- [DocsPage.tsx](/Users/pengchydan/dev/pivota-agents-portal/components/pages/DocsPage.tsx)

### Backend

Backend production includes:

- `2bf2d7a` `Adopt public API domain for developer contracts`
- `34697da` `Exclude loopback hosts from public API resolution`
- `a014e74` `Normalize managed webhook receiver URLs`

Key files:

- [/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/config/settings.py](/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/config/settings.py)
- [/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/openapi_config.py](/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/openapi_config.py)
- [/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/services/agent_webhook_service.py](/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/services/agent_webhook_service.py)

## Infrastructure Verification

Verified live:

- `api.pivota.cc` resolves and serves the backend
- `api.pivota.cc` is not attached to the frontend Vercel project
- the public backend host responds successfully on:
  - `/health`
  - `/openapi.json`
  - `/docs`

HTTP checks passed:

- `GET https://api.pivota.cc/health` -> `200`
- `GET https://api.pivota.cc/openapi.json` -> `200`
- `GET https://api.pivota.cc/docs` -> `200`
- `GET https://developer.pivota.cc/developers/openapi.json` -> `200`
- `GET https://developer.pivota.cc/developers/docs` -> `200`

OpenAPI server metadata verification passed:

- `servers[0].url = https://api.pivota.cc`

## Live Browser Acceptance

Production browser validation was run against `https://developer.pivota.cc` using a real production login.

### Orders

Result:

- login succeeded
- `Orders` loaded successfully
- live page showed `100 matching orders`
- browser console reported `0` errors

Observed network requests:

- `GET https://api.pivota.cc/agents/{agent_id}/api-keys` -> `200`
- `GET https://api.pivota.cc/agent/v1/orders?limit=100` -> `200`

No `web-production-fedb.up.railway.app` requests were observed.

### Webhooks

Result:

- `Webhooks` loaded successfully
- page status showed `Healthy`
- managed receiver displayed a branded endpoint on `api.pivota.cc`
- browser console reported `0` errors

Observed network requests:

- `GET https://api.pivota.cc/agents/{agent_id}/webhooks/config` -> `200`
- `GET https://api.pivota.cc/agents/{agent_id}/webhooks/events/catalog` -> `200`
- `GET https://api.pivota.cc/agents/{agent_id}/webhooks/deliveries?limit=25` -> `200`

Displayed managed receiver:

- `https://api.pivota.cc/agents/agent_982b1ea2df866206/webhooks/managed-inbox`

No `web-production-fedb.up.railway.app` requests were observed.

## Fixes Applied During Cutover

Two production-facing issues were found and corrected during validation:

1. OpenAPI initially exposed an internal loopback server URL.
   - Cause: public URL resolution incorrectly considered an internal loopback host.
   - Fix: exclude loopback hosts from public API base resolution.

2. Existing managed webhook configs could still surface the old Railway hostname.
   - Cause: persisted managed receiver destination URLs were not normalized after hostname cutover.
   - Fix: normalize managed receiver destination URLs to the branded `api.pivota.cc` host on read and update.

## Final Acceptance Decision

Accepted.

The production Developer Portal now uses `https://api.pivota.cc` as the canonical public API domain, and the main verified developer workflows no longer expose the raw Railway hostname.

## Remaining Non-Blocking Follow-Up

- Continue treating Railway as internal infrastructure only
- Keep sweeping non-user-facing historical references where useful
- Do not commit local browser artifacts from `.playwright-cli/` or `output/`
