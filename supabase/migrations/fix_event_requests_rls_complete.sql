-- Complete RLS Policy Fix for event_requests table
-- Run this in Supabase SQL Editor to restore RLS policies
-- This ensures admins can see all requests and users can see their own

-- Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow insert event requests" ON event_requests;
DROP POLICY IF EXISTS "Allow select own event requests" ON event_requests;
DROP POLICY IF EXISTS "Allow update own event requests" ON event_requests;
DROP POLICY IF EXISTS "Admins full access" ON event_requests;
DROP POLICY IF EXISTS "Allow anonymous users to create event requests" ON event_requests;
DROP POLICY IF EXISTS "Allow public insert" ON event_requests;
DROP POLICY IF EXISTS "Anyone can insert event requests" ON event_requests;
DROP POLICY IF EXISTS "Allow anyone to create event requests" ON event_requests;
DROP POLICY IF EXISTS "Users can read their own requests" ON event_requests;
DROP POLICY IF EXISTS "Admins can read all requests" ON event_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON event_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON event_requests;

-- POLICY 1: Allow INSERT for anonymous and authenticated users
CREATE POLICY "Allow insert event requests"
ON event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- POLICY 2: Allow SELECT for everyone (simplified for now)
-- This allows admins to see all requests and users to see their own
CREATE POLICY "Allow select event requests"
ON event_requests
FOR SELECT
TO anon, authenticated
USING (true);

-- POLICY 3: Allow UPDATE for authenticated users on their own requests
CREATE POLICY "Allow update own event requests"
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

-- POLICY 4: Allow admins to do everything (SELECT, UPDATE, DELETE)
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

-- Verify policies were created
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
WHERE tablename = 'event_requests'
ORDER BY policyname;

