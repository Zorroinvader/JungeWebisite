# Fix RLS Policies for event_requests - URGENT

## Issue
- No RLS policies exist on `event_requests` table
- Event requests are not loading in admin panel
- Need to restore RLS policies

## Solution: Run SQL Migration

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run the Complete RLS Fix
Copy and paste the entire contents of:
**`supabase/migrations/fix_event_requests_rls_complete.sql`**

Then click **Run** or press `Ctrl+Enter`

### Step 3: Verify Policies Were Created
After running, you should see a result table showing 4 policies:
1. `Allow insert event requests` - Allows anyone to create requests
2. `Allow select event requests` - Allows everyone to read requests
3. `Allow update own event requests` - Allows users to update their own requests
4. `Admins full access event requests` - Allows admins full access

## What This Does

### Policy 1: INSERT (Create Requests)
- Allows anonymous and authenticated users to create event requests
- Required for the public event request form

### Policy 2: SELECT (Read Requests)
- Allows everyone to read event requests
- This is simplified to `USING (true)` to ensure admins can see all requests
- Users can also see their own requests via email lookup

### Policy 3: UPDATE (Modify Requests)
- Allows users to update their own requests (where `requested_by = auth.uid()`)
- Also allows admins to update any request

### Policy 4: Admins Full Access
- Allows authenticated users with `admin` or `superadmin` role to do everything
- Checks the `profiles` table for role verification

## Alternative: Quick Fix SQL

If you need a quick fix, run this minimal version:

```sql
-- Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'event_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON event_requests';
    END LOOP;
END $$;

-- Allow INSERT for everyone
CREATE POLICY "Allow insert event requests"
ON event_requests FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow SELECT for everyone (simplified)
CREATE POLICY "Allow select event requests"
ON event_requests FOR SELECT TO anon, authenticated
USING (true);

-- Allow UPDATE for admins and own requests
CREATE POLICY "Allow update event requests"
ON event_requests FOR UPDATE TO authenticated
USING (
  requested_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
)
WITH CHECK (
  requested_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);

-- Allow admins full access
CREATE POLICY "Admins full access"
ON event_requests FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
);
```

## After Running

1. **Refresh the admin panel** - Go to "3-Schritt Anfragen" tab
2. **Check browser console** - Look for any RLS errors
3. **Verify requests load** - You should see event requests in the admin panel
4. **Test event tracking** - Users should be able to see their requests by email

## Troubleshooting

If requests still don't load after running the migration:

1. **Check if policies exist**:
   ```sql
   SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'event_requests';
   ```

2. **Verify admin role**:
   ```sql
   SELECT id, email, role FROM profiles WHERE role IN ('admin', 'superadmin');
   ```

3. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'event_requests';
   ```

4. **Test direct query as admin**:
   ```sql
   SELECT id, title, requester_email, request_stage, created_at 
   FROM event_requests 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## Files
- `supabase/migrations/fix_event_requests_rls_complete.sql` - Complete migration with verification query
- `supabase/migrations/fix_event_requests_rls_simple.sql` - Original simple version

