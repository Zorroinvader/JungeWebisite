# 🚨 QUICK FIX: Event Request Form Hanging

## The Problem
The form is timing out because RLS (Row Level Security) policies are blocking anonymous users from inserting event requests.

## Immediate Solution

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run This SQL

Copy and paste this SQL into the SQL Editor and click **Run**:

```sql
-- Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Allow INSERT for anonymous and authenticated users
DROP POLICY IF EXISTS "Allow insert event requests" ON event_requests;
CREATE POLICY "Allow insert event requests"
ON event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow SELECT (simplified for now)
DROP POLICY IF EXISTS "Allow select own event requests" ON event_requests;
CREATE POLICY "Allow select own event requests"
ON event_requests
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow UPDATE for authenticated users
DROP POLICY IF EXISTS "Allow update own event requests" ON event_requests;
CREATE POLICY "Allow update own event requests"
ON event_requests
FOR UPDATE
TO authenticated
USING (requested_by = auth.uid())
WITH CHECK (requested_by = auth.uid());

-- Allow admins full access
DROP POLICY IF EXISTS "Admins full access" ON event_requests;
CREATE POLICY "Admins full access"
ON event_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);
```

### Step 3: Test
After running the SQL, try submitting the event request form again. It should work immediately!

## What This Does
- ✅ Allows anonymous users to INSERT event requests
- ✅ Allows everyone to SELECT (you can restrict later)
- ✅ Allows authenticated users to UPDATE their own requests
- ✅ Allows admins to do everything

## Files Created
- `supabase/migrations/fix_event_requests_rls.sql` - Full migration
- `supabase/migrations/fix_event_requests_rls_simple.sql` - Simpler version
- This file - Quick reference

