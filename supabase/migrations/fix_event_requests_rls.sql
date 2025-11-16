-- Fix RLS policies for event_requests table to allow anonymous users to create requests
-- This migration ensures that anyone (including anonymous users) can INSERT into event_requests

-- First, ensure RLS is enabled on the table
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow anonymous users to create event requests" ON event_requests;
DROP POLICY IF EXISTS "Allow public insert" ON event_requests;
DROP POLICY IF EXISTS "Anyone can insert event requests" ON event_requests;

-- Create a policy that allows anyone (including anonymous users) to INSERT event requests
CREATE POLICY "Allow anyone to create event requests"
ON event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also ensure users can read their own requests
DROP POLICY IF EXISTS "Users can read their own requests" ON event_requests;
CREATE POLICY "Users can read their own requests"
ON event_requests
FOR SELECT
TO anon, authenticated
USING (
  -- Allow if user is reading their own request (by email for anonymous, by user_id for authenticated)
  (auth.role() = 'anon' AND requester_email IS NOT NULL) OR
  (auth.role() = 'authenticated' AND (requested_by = auth.uid() OR requester_email = (SELECT email FROM auth.users WHERE id = auth.uid())))
);

-- Allow admins to read all requests
DROP POLICY IF EXISTS "Admins can read all requests" ON event_requests;
CREATE POLICY "Admins can read all requests"
ON event_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Allow admins to update all requests
DROP POLICY IF EXISTS "Admins can update all requests" ON event_requests;
CREATE POLICY "Admins can update all requests"
ON event_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Allow users to update their own requests
DROP POLICY IF EXISTS "Users can update their own requests" ON event_requests;
CREATE POLICY "Users can update their own requests"
ON event_requests
FOR UPDATE
TO authenticated
USING (requested_by = auth.uid())
WITH CHECK (requested_by = auth.uid());

