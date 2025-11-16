# Vercel Environment Variables Setup Guide

## Critical: After Removing Credentials from vercel.json

The Supabase credentials have been removed from `vercel.json` for security. You must configure them in the Vercel Dashboard.

## Steps to Configure Environment Variables in Vercel

### 1. Access Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### 2. Add Required Environment Variables

Add the following environment variables for **all environments** (Production, Preview, Development):

#### Required Variables:

```
REACT_APP_SUPABASE_URL=https://wthsritnjosieqxpprsl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Optional Build Variables (if needed):

```
CI=false
DISABLE_ESLINT_PLUGIN=true
```

### 3. Environment-Specific Configuration

**For Production:**
- Use production Supabase project credentials
- Set `CI=false` if you want non-CI builds

**For Preview:**
- Can use same as production or separate staging project
- Useful for testing before production deployment

**For Development:**
- Use development/staging Supabase project credentials
- Allows safe testing without affecting production data

### 4. After Adding Variables

1. **Redeploy your application** for changes to take effect
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or push a new commit to trigger automatic deployment

## Security Best Practices

1. ✅ **Never commit secrets to version control**
   - Keep `vercel.json` free of credentials
   - Use Vercel Dashboard for all secrets

2. ✅ **Use different keys for different environments**
   - Production: Production Supabase project
   - Preview/Development: Staging Supabase project

3. ✅ **Rotate keys regularly**
   - Generate new keys in Supabase Dashboard
   - Update Vercel environment variables
   - Revoke old keys

4. ✅ **Limit access to Vercel project**
   - Only grant access to trusted team members
   - Use Vercel Teams for proper access control

## Verifying Configuration

After setting environment variables:

1. Deploy a new version
2. Check build logs to ensure variables are available
3. Test the application to verify Supabase connection works
4. Check browser console (in production, console logs are removed)

## Troubleshooting

### Build fails with "Supabase URL is not configured"
- Verify environment variables are set in Vercel Dashboard
- Check that variable names match exactly (case-sensitive)
- Ensure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### Application works locally but not on Vercel
- Verify environment variables are set in Vercel (not just locally)
- Check Vercel build logs for errors
- Ensure you're using the correct environment (Production vs Preview)

## Next Steps

1. ✅ Credentials removed from `vercel.json` (DONE)
2. ⏳ Add environment variables in Vercel Dashboard
3. ⏳ Rotate the exposed Supabase anon key (if repository was public)
4. ⏳ Redeploy application
5. ⏳ Verify application works correctly

---

**Important:** If your repository is public or was shared, you should rotate the Supabase anon key immediately, as it was exposed in Git history.

