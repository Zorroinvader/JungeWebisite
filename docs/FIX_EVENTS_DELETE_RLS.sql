-- ============================================================================
-- FIX: Ensure Admins and Superadmins can DELETE events
-- ============================================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- This will ensure that admins and superadmins can delete events from the database
-- ============================================================================

-- Step 1: Check current RLS status
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'events';

-- Step 2: Enable RLS if not already enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing DELETE policies to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events' AND cmd = 'DELETE') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON events CASCADE';
    END LOOP;
END $$;

-- Step 4: Create DELETE policy for admins and superadmins
CREATE POLICY "Admins and superadmins can delete events"
ON events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Step 5: Verify the policy was created
SELECT
  policyname,
  cmd as operation,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause
FROM pg_policies
WHERE tablename = 'events' AND cmd = 'DELETE'
ORDER BY policyname;

-- Step 6: Also ensure SELECT and UPDATE policies allow admins full access
-- Check current policies
SELECT
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'events' 
AND cmd IN ('SELECT', 'UPDATE', 'DELETE')
ORDER BY cmd, policyname;

-- Step 7: Create comprehensive admin policies for SELECT and UPDATE
-- These ensure admins have full access to events

-- Allow admins to SELECT all events
DROP POLICY IF EXISTS "Admins can select all events" ON events CASCADE;
CREATE POLICY "Admins can select all events"
ON events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
  OR
  -- Allow public read for non-private events
  (is_private = false OR is_private IS NULL)
  OR
  -- Allow users to see their own events
  (requested_by = auth.uid() OR created_by = auth.uid())
);

-- Allow public/anonymous users to SELECT non-private events
DROP POLICY IF EXISTS "Public can select non-private events" ON events CASCADE;
CREATE POLICY "Public can select non-private events"
ON events
FOR SELECT
TO anon, authenticated
USING (
  is_private = false OR is_private IS NULL
);

-- Allow admins to UPDATE all events
DROP POLICY IF EXISTS "Admins can update all events" ON events CASCADE;
CREATE POLICY "Admins can update all events"
ON events
FOR UPDATE
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

-- Step 8: Final verification - show all policies for events table
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
WHERE tablename = 'events'
ORDER BY cmd, policyname;
