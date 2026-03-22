# Pivota SDK, REST API, and MCP Production Acceptance

Date: 2026-03-22  
Scope: Production validation of the public developer contract for REST API, SDK packages, MCP package naming, and live docs alignment

## Summary

The current public developer contract is now aligned and production-valid:

- REST API is live and callable on `https://api.pivota.cc`
- the published SDK package name is `pivota-agent`
- the published MCP package name is `pivota-mcp-server`
- Developer Portal docs and backend `agent/docs` no longer present the old SDK package names as the active install path

The only remaining appearance of the old SDK names in the portal is intentional: a deprecation note warning users that earlier references are outdated.

## Production Changes Included

### Frontend

Frontend production includes:

- `a81d9e0` `Clarify SDK and MCP package positioning`

Key file:

- [DocsPage.tsx](/Users/pengchydan/dev/pivota-agents-portal/components/pages/DocsPage.tsx)

Applied changes:

- added an explicit `Published package` panel in the SDK docs tab
- clarified that the SDK is a convenience wrapper over the same production REST API
- added an explicit `Published package` panel in the MCP tab
- clarified that MCP is a local client-side tool surface, not a hosted replacement for the REST API

### Backend

Backend production includes:

- `b09ced5` `Align agent docs with published SDK packages`
- `9ea0a71` `Use public API base in agent docs`

Key file:

- [/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/routes/agent_docs.py](/Users/pengchydan/dev/Pivota-cursor-create-project-directory-structure-8344/pivota-backend/routes/agent_docs.py)

Applied changes:

- changed `pip install pivota-agent-sdk` to `pip install pivota-agent`
- changed `npm install @pivota/agent-sdk` to `npm install pivota-agent`
- updated TypeScript import examples to `import { PivotaAgentClient } from 'pivota-agent'`
- changed `/agent/docs/endpoints` to return the branded public base `https://api.pivota.cc/agent/v1`
- changed `/agent/docs/openapi.json` from a broken 404 path to a live generated OpenAPI schema

## Live Verification

### REST API

Verified live:

- `GET https://api.pivota.cc/openapi.json` -> `200`
- `GET https://api.pivota.cc/docs` -> `200`
- `GET https://api.pivota.cc/agent/docs/endpoints` -> `200`
- `GET https://api.pivota.cc/agent/v1/orders?limit=1` -> `200`
- `GET https://api.pivota.cc/agent/metrics/summary` -> `200`
- `GET https://api.pivota.cc/agent/metrics/recent?limit=3` -> `200`

Decision:

- REST API is real, live, and remains the primary production integration contract.

### Backend Docs Routes

Verified live:

- `GET https://api.pivota.cc/agent/docs/sdks` -> `200`
- `GET https://api.pivota.cc/agent/docs/quickstart.md` -> `200`
- `GET https://api.pivota.cc/agent/docs/openapi.json` -> `200`
- `GET https://api.pivota.cc/agent/docs/endpoints` -> `200`

Observed live contract:

- SDK install names now use `pivota-agent`
- `agent/docs/endpoints` now reports `https://api.pivota.cc/agent/v1`
- `agent/docs/openapi.json` now resolves successfully instead of returning `404`

### Published Packages

Registry verification passed:

- PyPI package `pivota-agent` is published
- npm package `pivota-agent` is published
- npm package `pivota-mcp-server` is published

Observed missing legacy package names:

- `pivota-agent-sdk` is not the active published Python package
- `@pivota/agent-sdk` is not the active published npm package

### Executed Runtime Smoke

Beyond registry and docs validation, real runtime smoke checks were executed against production.

#### Python SDK

Execution path:

- created a temporary Python virtualenv
- installed the published PyPI package `pivota-agent`
- authenticated against `https://api.pivota.cc/agent/account/login`
- instantiated `PivotaAgentClient(api_key=..., base_url='https://api.pivota.cc/agent/v1')`
- executed:
  - `health_check()`
  - `list_merchants(limit=1)`

Observed result:

- `health.status = ok`
- merchant listing returned successfully

Decision:

- the published Python SDK is not just documented; it was successfully executed against the live production API.

#### TypeScript / npm SDK

Execution path:

- created a temporary Node project
- installed the published npm package `pivota-agent`
- authenticated against `https://api.pivota.cc/agent/account/login`
- instantiated `new PivotaAgentClient({ apiKey, baseUrl: 'https://api.pivota.cc/agent/v1' })`
- executed:
  - `healthCheck()`
  - `listMerchants({ limit: 1 })`

Observed result:

- `health.status = ok`
- merchant listing returned successfully

Decision:

- the published TypeScript / JavaScript SDK is also live and callable against production.

#### MCP Runtime

Execution path:

- authenticated against `https://api.pivota.cc/agent/account/login`
- started the MCP server implementation with:
  - `PIVOTA_API_KEY=<live key>`
  - `PIVOTA_BASE_URL=https://api.pivota.cc/agent/v1`
- connected using the official MCP client over stdio
- executed a real MCP session:
  - `initialize`
  - `tools/list`
  - `tools/call(name='list_merchants', arguments={ limit: 1, status: 'active' })`

Observed result:

- server started successfully on stdio
- `tools/list` returned `5` tools
- `list_merchants` was present
- `tools/call` returned a real merchant result:
  - `Chydan`
  - `merch_efbc46b4619cfbdf`
  - `active`

Decision:

- MCP is not just nominally packaged; the protocol server was started and a real tool call completed successfully against production data.

### Developer Portal Browser Validation

Live browser validation was run against `https://developer.pivota.cc/docs`.

#### SDK tab

Observed:

- page rendered successfully after authenticated load
- SDK tab showed `Published package`
- page displayed `pivota-agent`
- page displayed the new SDK scope explanation
- install block showed `pip install pivota-agent`

The old names `pivota-agent-sdk` and `@pivota/agent-sdk` still appeared only inside the explicit outdated-reference warning, which is expected.

#### MCP tab

Observed:

- page rendered successfully after authenticated load
- MCP tab showed `Published package`
- page displayed `pivota-mcp-server`
- page displayed the clarification that MCP is not a hosted replacement for the production REST API

## Final Contract Position

The production developer contract should now be communicated as:

- REST API: real, live, and the primary production path
- SDK: real, published as `pivota-agent`, and a wrapper around the same REST contract
- MCP: real, published as `pivota-mcp-server`, and intended for local orchestration and discovery workflows rather than primary control-plane operations

## Final Acceptance Decision

Accepted.

The public docs, live portal, and backend `agent/docs` routes are now aligned with the real package names and the real production integration model.
