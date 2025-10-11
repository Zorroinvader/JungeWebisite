-- Test script to verify new fields are working
-- Run this in your Supabase SQL editor after running the migration

-- Check if the new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'event_requests' 
AND column_name IN ('schluesselannahme_time', 'schluesselabgabe_time', 'additional_notes')
ORDER BY column_name;

-- Check if the new columns exist in events table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('schluesselannahme_time', 'schluesselabgabe_time', 'additional_notes')
ORDER BY column_name;

-- Test insert with new fields (optional - only run if you want to test)
-- INSERT INTO public.event_requests (
--   title, 
--   start_date, 
--   end_date, 
--   schluesselannahme_time, 
--   schluesselabgabe_time, 
--   additional_notes,
--   requester_name,
--   requester_email,
--   event_type,
--   is_private,
--   hausordnung_accepted,
--   mietvertrag_accepted,
--   requested_by,
--   created_by
-- ) VALUES (
--   'Test Event',
--   '2025-01-15 10:00:00+00',
--   '2025-01-15 18:00:00+00',
--   '09:00',
--   '19:00',
--   'Test additional notes',
--   'Test User',
--   'test@example.com',
--   'Privates Event',
--   true,
--   true,
--   true,
--   '00000000-0000-0000-0000-000000000000',
--   '00000000-0000-0000-0000-000000000000'
-- );
