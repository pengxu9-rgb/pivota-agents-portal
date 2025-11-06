# Vercel Environment Variables

## Required Environment Variables

Add these to your Vercel project settings:

### Production & Preview

```
NEXT_PUBLIC_API_URL=https://web-production-fedb.up.railway.app
```

**IMPORTANT**: 
- MUST use `https://` not `http://`
- NO trailing slash
- This is the Railway backend URL

### How to Set

1. Go to https://vercel.com/pengxu9-rgb/pivota-agents-portal/settings/environment-variables
2. Add the variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://web-production-fedb.up.railway.app`
   - Environment: Production, Preview, Development
3. Save
4. Redeploy for changes to take effect

### Verify

After deployment, check in browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL);
// Should output: https://web-production-fedb.up.railway.app
```

## Note

The code has been hardcoded to use HTTPS to prevent Mixed Content errors. But setting this environment variable properly ensures consistency.
