-- Migration: Create temporarily_blocked_dates table for blocking time slots after initial acceptance
-- This table stores temporary blocks created when admin initially accepts an event request
-- The blocks are removed when the event is finally accepted and created in the events table
-- Created for: Event Email Workflow & Blocking Logic implementation
--
-- IMPORTANT: If you get an error "cannot create index on relation - This operation is not supported for views"
-- it means temporarily_blocked_dates exists as a VIEW. This migration will drop it and create a proper TABLE.
--
-- Run this migration in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Drop existing view if it exists (in case it was created as a view by mistake)
-- CASCADE will also drop any dependent objects
DROP VIEW IF EXISTS temporarily_blocked_dates CASCADE;

-- Drop existing table if it exists (to allow clean recreation)
-- This will also cascade drop any existing policies
DROP TABLE IF EXISTS temporarily_blocked_dates CASCADE;

-- Create the temporarily_blocked_dates table
CREATE TABLE temporarily_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES event_requests(id) ON DELETE CASCADE,
  event_name TEXT,
  requester_name TEXT,
  requester_email TEXT,
  start_date DATE,
  end_date DATE,
  exact_start_datetime TIMESTAMPTZ,
  exact_end_datetime TIMESTAMPTZ,
  request_stage TEXT DEFAULT 'initial_accepted',
  is_temporary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups (only after table is created)
-- Since we dropped the table above with CASCADE, indexes are also dropped, so we can create fresh
CREATE INDEX idx_temporarily_blocked_dates_request_id ON temporarily_blocked_dates(request_id);
CREATE INDEX idx_temporarily_blocked_dates_dates ON temporarily_blocked_dates(start_date, end_date);
CREATE INDEX idx_temporarily_blocked_dates_datetime ON temporarily_blocked_dates(exact_start_datetime, exact_end_datetime);

-- Enable RLS
ALTER TABLE temporarily_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read all temporarily blocked dates
CREATE POLICY "Admins can read all temporarily blocked dates"
ON temporarily_blocked_dates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Policy: Allow admins to insert temporarily blocked dates
CREATE POLICY "Admins can insert temporarily blocked dates"
ON temporarily_blocked_dates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Policy: Allow admins to delete temporarily blocked dates
CREATE POLICY "Admins can delete temporarily blocked dates"
ON temporarily_blocked_dates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Policy: Allow anonymous and authenticated users to read temporarily blocked dates (for calendar display)
-- This allows the calendar to show blocked time slots to all users
CREATE POLICY "Anyone can read temporarily blocked dates"
ON temporarily_blocked_dates
FOR SELECT
TO anon, authenticated
USING (true);

-- Add comment to table
COMMENT ON TABLE temporarily_blocked_dates IS 'Temporary blocks for event time slots created when admin initially accepts a request. Blocks are removed when event is finally accepted.';

