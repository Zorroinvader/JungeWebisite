# Deploy ICS Proxy Edge Function

## Problem
The calendar import fails due to CORS (Cross-Origin Resource Sharing) restrictions. The external calendar server (`kalender.digital`) doesn't allow direct browser requests from your domain.

## Solution
We've created a Supabase Edge Function that acts as a proxy server to fetch the ICS feed and return it with proper CORS headers.

## Deployment Steps

### Step 1: Deploy the Edge Function

Run this command in your terminal from the project root:

```bash
npx supabase functions deploy fetch-ics
```

This will deploy the function to your Supabase project.

### Step 2: Verify Deployment

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** section
3. You should see `fetch-ics` in the list
4. Click on it to view logs and status

### Step 3: Test the Function

You can test it directly in your browser:

```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-ics
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID (e.g., `wthsritnjosieqxpprsl`).

You should see the ICS calendar content returned.

### Step 4: Import Events

Now you can use the import function in your admin panel:

1. Go to **Admin Panel → Settings**
2. Click **"Aus altem Kalender importieren"**
3. Open Browser Console (F12) to see live logs
4. Wait for completion (1-3 minutes)

## How It Works

### Before (CORS Error):
```
Browser → kalender.digital ❌ CORS blocked
```

### After (With Proxy):
```
Browser → Supabase Edge Function → kalender.digital ✅ Success
```

The Edge Function:
1. Receives request from your browser
2. Fetches ICS feed from `kalender.digital`
3. Returns the content with proper CORS headers
4. Browser can now process the ICS data

## Configuration

### Edge Function Location
```
supabase/functions/fetch-ics/index.ts
```

### ICS Feed URL (hardcoded in function)
```
https://export.kalender.digital/ics/0/a6949578f7eb05dc5b2d/gesamterkalender.ics?past_months=3&future_months=36
```

### Authentication
The function is called with your Supabase anon key:
```javascript
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

## Troubleshooting

### Error: "Function not found"
**Solution:** Run deployment command again:
```bash
npx supabase functions deploy fetch-ics
```

### Error: "Not authenticated"
**Solution:** Check that your `.env` file has:
```
REACT_APP_SUPABASE_URL=https://wthsritnjosieqxpprsl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### Error: Still getting CORS
**Solution:** 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check that deployment succeeded

### Function Logs
View logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on `fetch-ics`
3. Click **"Logs"** tab
4. See real-time execution logs

## Alternative: Manual Deploy

If `npx supabase` doesn't work, you can deploy manually:

### Option 1: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref wthsritnjosieqxpprsl

# Deploy
supabase functions deploy fetch-ics
```

### Option 2: Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Click **"New Function"**
3. Name it `fetch-ics`
4. Copy/paste the code from `supabase/functions/fetch-ics/index.ts`
5. Click **"Deploy"**

## Caching

The Edge Function caches responses for 5 minutes to improve performance:
```typescript
'Cache-Control': 'public, max-age=300'
```

This means:
- First import: Fetches fresh data
- Subsequent imports (within 5 min): Uses cached data
- After 5 min: Fetches fresh data again

## Cost

Edge Functions are free for:
- First 500,000 requests/month
- First 400,000 GB-s compute/month

Your import will use approximately:
- 1 request per import run
- ~1 second of compute time

**Cost: Effectively free** for this use case.

## Security

The Edge Function:
- ✅ Uses HTTPS
- ✅ Requires authentication (Supabase anon key)
- ✅ Only fetches from specific URL (hardcoded)
- ✅ Doesn't expose sensitive data
- ✅ Has CORS headers for browser access

## Monitoring

Check Edge Function health:
```bash
# View recent logs
npx supabase functions logs fetch-ics

# Follow logs in real-time
npx supabase functions logs fetch-ics --follow
```

Or in Dashboard:
1. **Edge Functions** → `fetch-ics`
2. **Metrics** tab shows:
   - Invocation count
   - Error rate
   - Execution time

---

## Quick Deploy Command

```bash
npx supabase functions deploy fetch-ics
```

That's it! Your calendar import should now work without CORS errors. 🎉

