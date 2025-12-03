# Fix: Event Requests Not Showing in "3-Schritt Anfragen" Admin Panel

## Issue
Event requests exist in the database but are not displaying in the "3-Schritt Anfragen" tab of the admin panel.

## Changes Made

### 1. Updated `getAdminPanelData()` in `src/services/databaseApi.js`
- Now uses `executeWithFallback` pattern
- **PRIMARY**: Supabase client (respects RLS properly, uses authenticated session)
- **FALLBACK**: HTTP REST API
- Added logging to track which method is used

### 2. Updated `getByEmail()` in `src/services/databaseApi.js`
- Now uses `executeWithFallback` pattern
- **PRIMARY**: Supabase client with `.ilike()` for case-insensitive email search
- **FALLBACK**: HTTP REST API

### 3. Enhanced `executeWithFallback()` in `src/services/databaseApi.js`
- Added debug logging for `getAdminPanelData` operations
- Better handling of `{ data, error }` response format from Supabase client
- Logs data type and length to help debug

### 4. Updated `ThreeStepRequestManagement.js`
- Added debug logging to see what data is received
- Improved data handling for different response formats
- Increased safety timeout from 3 to 10 seconds
- Better error handling and logging

## How to Debug

### 1. Open Browser Console
Press F12 and go to the Console tab. Look for:
- `[ThreeStepRequestManagement] Received data:` - Shows what data was received
- `[eventRequests.getAdminPanelData]` - Shows if Supabase client or HTTP fallback was used
- `[FALLBACK]` messages - Indicates if Supabase client failed and HTTP was used

### 2. Check What You See
The console should show:
```javascript
[ThreeStepRequestManagement] Received data: {
  isArray: true/false,
  dataType: "object" or "array",
  dataLength: number,
  sample: first request object or "no data"
}
```

### 3. Verify Admin Authentication
- Make sure you're logged in as admin
- Check that your profile has `role = 'admin'` or `'superadmin'` in the `profiles` table
- The Supabase client needs an authenticated session to respect RLS policies

### 4. Check RLS Policies
Run this in Supabase SQL Editor:
```sql
-- Check current policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'event_requests';

-- Verify admin can read all requests
-- Should see policy like "Admins full access" or "Admins can read all requests"
```

### 5. Test Direct Query
Run this as admin in Supabase SQL Editor:
```sql
SELECT id, title, event_name, requester_email, request_stage, created_at
FROM event_requests
ORDER BY created_at DESC
LIMIT 50;
```

## Expected Behavior

1. **On page load**: Component calls `eventRequestsAPI.getAdminPanelData(50, 0)`
2. **Supabase client tries first**: Uses authenticated session, respects RLS
3. **If client fails**: Falls back to HTTP REST API
4. **Data is displayed**: Requests appear in the grid
5. **Auto-refresh**: Every 60 seconds

## Common Issues

### Issue 1: Empty Array Returned
**Symptom**: Console shows `dataLength: 0` or `isArray: false`
**Possible causes**:
- RLS policy blocking admin access
- Admin not authenticated properly
- No requests in database with matching criteria

**Solution**: 
1. Verify admin is logged in
2. Check RLS policies allow admin SELECT
3. Run direct SQL query to verify data exists

### Issue 2: Supabase Client Fails, HTTP Fallback Works
**Symptom**: Console shows `[FALLBACK] Supabase client failed`
**Possible causes**:
- Session expired
- RLS policy issue with Supabase client
- Network issue

**Solution**: 
1. Log out and log back in
2. Check browser console for specific error
3. Verify Supabase URL and keys are correct

### Issue 3: Data Received But Not Displayed
**Symptom**: Console shows data but UI shows "Keine Anfragen vorhanden"
**Possible causes**:
- Data format issue
- Component state not updating
- Filtering issue

**Solution**: 
1. Check console for the actual data structure
2. Verify `requests.length` in component state
3. Check if there are any filters applied

## Files Modified
- `src/services/databaseApi.js` - Updated `getAdminPanelData()`, `getByEmail()`, `executeWithFallback()`
- `src/components/Admin/ThreeStepRequestManagement.js` - Added debugging and improved data handling

## Next Steps
1. **Refresh the admin panel** and check browser console
2. **Look for the debug messages** to see what's happening
3. **Share the console output** if requests still don't show
4. **Remove debug logging** once issue is resolved (optional)

