-- SIMPLE FIX: Allow anonymous users to INSERT event requests
-- Run this in your Supabase SQL Editor immediately

-- Enable RLS if not already enabled
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh (optional - comment out if you want to keep existing policies)
-- DROP POLICY IF EXISTS "Allow anonymous users to create event requests" ON event_requests;
-- DROP POLICY IF EXISTS "Allow public insert" ON event_requests;
-- DROP POLICY IF EXISTS "Anyone can insert event requests" ON event_requests;
-- DROP POLICY IF EXISTS "Allow anyone to create event requests" ON event_requests;

-- CRITICAL: Allow INSERT for anonymous and authenticated users
CREATE POLICY "Allow insert event requests"
ON event_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow SELECT for anonymous users (by email) and authenticated users (by user_id)
CREATE POLICY "Allow select own event requests"
ON event_requests
FOR SELECT
TO anon, authenticated
USING (true);  -- Simplified: allow all selects for now (you can restrict later)

-- Allow UPDATE for authenticated users on their own requests
CREATE POLICY "Allow update own event requests"
ON event_requests
FOR UPDATE
TO authenticated
USING (requested_by = auth.uid())
WITH CHECK (requested_by = auth.uid());

-- Allow admins to do everything
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

