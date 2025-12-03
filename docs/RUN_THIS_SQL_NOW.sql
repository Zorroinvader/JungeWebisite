-- ============================================================================
-- URGENT: Restore RLS Policies for event_requests
-- ============================================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- This will fix the issue where event requests don't load in admin panel
-- ============================================================================

-- Step 1: Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'event_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON event_requests CASCADE';
    END LOOP;
END $$;

-- Step 3: Create essential policies

-- POLICY 1: Allow INSERT for anonymous and authenticated users
CREATE POLICY "Allow insert event requests"
ON event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- POLICY 2: Allow SELECT for everyone (simplified - allows admins to see all)
CREATE POLICY "Allow select event requests"
ON event_requests
FOR SELECT
TO anon, authenticated
USING (true);

-- POLICY 3: Allow UPDATE for own requests or admins
CREATE POLICY "Allow update event requests"
ON event_requests
FOR UPDATE
TO authenticated
USING (
  requested_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  requested_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- POLICY 4: Allow admins full access (SELECT, UPDATE, DELETE)
CREATE POLICY "Admins full access event requests"
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

-- Step 4: Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'event_requests'
ORDER BY policyname;

-- Expected result: 4 policies should be listed
-- 1. Allow insert event requests (INSERT)
-- 2. Allow select event requests (SELECT)
-- 3. Allow update event requests (UPDATE)
-- 4. Admins full access event requests (ALL)

