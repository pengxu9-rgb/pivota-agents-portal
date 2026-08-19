# Vercel Environment Variables

## Required Environment Variables

Add these to your Vercel project settings:

### Production & Preview

```
NEXT_PUBLIC_API_URL=https://api.pivota.cc
```

**IMPORTANT**: 
- MUST use `https://` not `http://`
- NO trailing slash
- This is the canonical public API hostname

### How to Set

1. Go to https://vercel.com/pengxu9-rgb/pivota-agents-portal/settings/environment-variables
2. Add the variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://api.pivota.cc`
   - Environment: Production, Preview, Development
3. Save
4. Redeploy for changes to take effect

### Verify

After deployment, check in browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL);
// Should output: https://api.pivota.cc
```

## Note

The portal now expects a branded public API hostname rather than an infrastructure hostname. Set this before deploying the cutover.

## Hosted agent doors (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_COMMERCE_MCP_URL` | `https://commerce.mcp.pivota.cc` | Origin of the UCP (`/ucp/mcp`) and native (`/mcp`) commerce doors shown in Docs → Agent doors. |
| `NEXT_PUBLIC_PUBLIC_READ_MCP_URL` | `https://mcp.pivota.cc` | Origin of the anonymous public read door. |

Both fall back to their branded default when unset or when set to a `*.up.railway.app` host.
