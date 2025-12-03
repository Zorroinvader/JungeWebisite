# Debug: Event Requests Not Loading

## Issue
Event requests are in the database but not showing in:
1. Admin panel (ThreeStepRequestManagement)
2. Event tracking page (EventRequestTrackingPage)

## Changes Made

### 1. Updated `getAdminPanelData()` in `src/services/databaseApi.js`
- Now uses `executeWithFallback` pattern
- **PRIMARY**: Supabase client (respects RLS properly)
- **FALLBACK**: HTTP REST API
- Added logging to track which method is used

### 2. Updated `getByEmail()` in `src/services/databaseApi.js`
- Now uses `executeWithFallback` pattern
- **PRIMARY**: Supabase client with `.ilike()` for case-insensitive email search
- **FALLBACK**: HTTP REST API with `ilike` operator
- Added logging to track which method is used

## How to Debug

### 1. Check Browser Console
Open browser DevTools (F12) and look for `secureLog` messages:
- `[ThreeStepRequestManagement]` - Admin panel loading
- `[EventRequestTrackingPage]` - Event tracking loading
- `Admin panel data loaded via Supabase client` or `via HTTP fallback`
- `Requests loaded by email via Supabase client` or `via HTTP fallback`

### 2. Check RLS Policies
Run this in Supabase SQL Editor to verify RLS policies:

```sql
-- Check current policies on event_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'event_requests';
```

### 3. Verify Admin Authentication
Check if admin is logged in:
- Admin should see their email in the top right
- Check browser console for session info
- Verify `getHeaders()` is returning a session token (not anon key)

### 4. Test Direct Query
Test if data is accessible:

**For Admin Panel:**
```sql
-- Run as admin user in Supabase SQL Editor
SELECT id, title, event_name, requester_email, request_stage, created_at
FROM event_requests
ORDER BY created_at DESC
LIMIT 50;
```

**For Event Tracking:**
```sql
-- Replace with actual email
SELECT id, title, event_name, requester_email, request_stage, created_at
FROM event_requests
WHERE requester_email ILIKE 'user@example.com'
ORDER BY created_at DESC;
```

## Common Issues

### Issue 1: RLS Policy Conflict
**Symptom**: Empty results even though data exists
**Solution**: Run `fix_event_requests_rls_simple.sql` migration which has `USING (true)` for SELECT

### Issue 2: Admin Not Authenticated
**Symptom**: Admin panel shows empty, console shows "Bearer [anon]"
**Solution**: 
1. Log out and log back in as admin
2. Verify admin profile has `role = 'admin'` or `'superadmin'` in `profiles` table

### Issue 3: Email Case Sensitivity
**Symptom**: Event tracking doesn't find requests by email
**Solution**: The `.ilike()` method should handle this, but verify email matches exactly

### Issue 4: Supabase Client vs REST API
**Symptom**: Inconsistent results
**Solution**: The code now tries Supabase client first (better RLS handling), then falls back to REST API

## Next Steps

1. **Check browser console** for secureLog messages
2. **Verify admin is logged in** and has proper role
3. **Run RLS policy check** SQL above
4. **Test direct queries** in Supabase SQL Editor
5. **Check network tab** in DevTools to see actual API responses

## Files Modified
- `src/services/databaseApi.js` - Updated `getAdminPanelData()` and `getByEmail()`
- Added logging to help debug the issue

