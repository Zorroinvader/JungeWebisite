# Database Setup Guide for New Event Request Fields

## Overview
This guide will help you add the new fields (`schluesselannahme_time`, `schluesselabgabe_time`, `additional_notes`) to your Supabase database so that the event request form works correctly and the admin panel can display all the data.

## Step 1: Run the Database Migration

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the migration script from `database/add-new-fields-migration.sql`:

```sql
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
```

## Step 2: Verify the Migration

Run the test script from `database/test-new-fields.sql` to verify the fields were added:

```sql
-- Check if the new columns exist in event_requests
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'event_requests' 
AND column_name IN ('schluesselannahme_time', 'schluesselabgabe_time', 'additional_notes')
ORDER BY column_name;

-- Check if the new columns exist in events
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('schluesselannahme_time', 'schluesselabgabe_time', 'additional_notes')
ORDER BY column_name;
```

## Step 3: Test the Complete Workflow

### 3.1 Test Event Request Submission
1. Go to your website
2. Click on a date in the calendar
3. Fill out the event request form with:
   - Event name
   - Start and end dates
   - Key pickup and return times
   - Additional notes
   - Upload a PDF file
4. Submit the form

### 3.2 Verify Data in Database
Check that the data was stored correctly:

```sql
SELECT 
  title,
  start_date,
  end_date,
  schluesselannahme_time,
  schluesselabgabe_time,
  additional_notes,
  event_type,
  status
FROM public.event_requests 
ORDER BY created_at DESC 
LIMIT 5;
```

### 3.3 Test Admin Panel
1. Log in as admin
2. Go to the admin panel
3. Check the "Requests" tab
4. Click on a request to see the details
5. Verify all new fields are displayed correctly

### 3.4 Test Event Approval
1. In the admin panel, approve an event request
2. Check that the event was created in the `events` table with all the new fields
3. Verify the event appears in the calendar

## Expected Database Schema After Migration

### event_requests table
- `schluesselannahme_time` (text) - Time for key pickup on start date
- `schluesselabgabe_time` (text) - Time for key return on end date  
- `additional_notes` (text) - Additional notes from requester
- `event_type` (text) - Default: 'Privates Event'

### events table
- `schluesselannahme_time` (text) - Time for key pickup on start date
- `schluesselabgabe_time` (text) - Time for key return on end date
- `additional_notes` (text) - Additional notes from requester
- `event_type` (text) - Default: 'Privates Event'

## Troubleshooting

### If you get permission errors:
Make sure your Supabase RLS (Row Level Security) policies allow:
- INSERT on event_requests for authenticated users
- SELECT on event_requests for authenticated users
- UPDATE on event_requests for admin users

### If the form submission fails:
1. Check the browser console for errors
2. Verify your Supabase URL and API key are correct
3. Check the Supabase logs for any database errors

### If the admin panel doesn't show new fields:
1. Make sure the migration was successful
2. Check that the API is returning the new fields
3. Verify the admin panel code is up to date

## Success Indicators

✅ **Form Submission**: Event request form submits without errors  
✅ **Database Storage**: New fields are stored in event_requests table  
✅ **Admin Display**: Admin panel shows all new fields in request details  
✅ **Event Creation**: Approved events include all new fields  
✅ **Calendar Display**: Events appear correctly in the calendar  

## Next Steps

After completing this setup:
1. Test the complete user workflow
2. Train your admin users on the new fields
3. Consider adding validation rules if needed
4. Monitor the system for any issues

The system should now fully support multi-day events with proper key management times and additional notes!
