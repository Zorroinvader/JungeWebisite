-- Migration to add new fields to event_requests and events tables
-- Run this in your Supabase SQL editor

-- Add new fields to event_requests table
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS schluesselannahme_time text,
ADD COLUMN IF NOT EXISTS schluesselabgabe_time text,
ADD COLUMN IF NOT EXISTS additional_notes text;

-- Add new fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS schluesselannahme_time text,
ADD COLUMN IF NOT EXISTS schluesselabgabe_time text,
ADD COLUMN IF NOT EXISTS additional_notes text;

-- Update the event_type default value to match the form
ALTER TABLE public.event_requests 
ALTER COLUMN event_type SET DEFAULT 'Privates Event';

ALTER TABLE public.events 
ALTER COLUMN event_type SET DEFAULT 'Privates Event';

-- Add comments for clarity
COMMENT ON COLUMN public.event_requests.schluesselannahme_time IS 'Time for key pickup on start date';
COMMENT ON COLUMN public.event_requests.schluesselabgabe_time IS 'Time for key return on end date';
COMMENT ON COLUMN public.event_requests.additional_notes IS 'Additional notes and requirements from the requester';

COMMENT ON COLUMN public.events.schluesselannahme_time IS 'Time for key pickup on start date';
COMMENT ON COLUMN public.events.schluesselabgabe_time IS 'Time for key return on end date';
COMMENT ON COLUMN public.events.additional_notes IS 'Additional notes and requirements from the requester';
