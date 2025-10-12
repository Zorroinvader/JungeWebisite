-- Migration for 3-step event request workflow
-- Updated to work with existing schema
-- Run this in your Supabase SQL editor

-- ============================================================================
-- STEP 1: Create request_stage enum type
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE request_stage AS ENUM (
        'initial',              -- User submitted initial request
        'initial_accepted',     -- Admin accepted, waiting for user details
        'details_submitted',    -- User submitted final details
        'final_accepted',       -- Admin final approval, event created
        'rejected'              -- Admin rejected the request
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: Add new columns to event_requests table
-- ============================================================================

-- Workflow stage
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS request_stage request_stage DEFAULT 'initial';

-- Event name (separate from title for clarity)
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS event_name text;

-- Phone number for requester
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS requester_phone text;

-- Requested days as JSON array
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS requested_days text;

-- Initial notes from first request
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS initial_notes text;

-- Exact datetime fields (for step 3)
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS exact_start_datetime timestamp with time zone;

ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS exact_end_datetime timestamp with time zone;

-- Key handover times (can be different days than event)
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS key_handover_datetime timestamp with time zone;

ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS key_return_datetime timestamp with time zone;

-- Signed contract URL (from Supabase Storage)
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS signed_contract_url text;

-- Timestamps for each workflow stage
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS initial_accepted_at timestamp with time zone;

ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS details_submitted_at timestamp with time zone;

ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS final_accepted_at timestamp with time zone;

-- Admin notes and rejection reason
ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.event_requests 
ADD COLUMN IF NOT EXISTS admin_notes text;

-- ============================================================================
-- STEP 3: Update existing columns if needed
-- ============================================================================

-- Make requested_by nullable (for non-logged-in requests)
ALTER TABLE public.event_requests 
ALTER COLUMN requested_by DROP NOT NULL;

-- Update title to be nullable (we'll use event_name instead)
ALTER TABLE public.event_requests 
ALTER COLUMN title DROP NOT NULL;

-- ============================================================================
-- STEP 4: Add comments for documentation
-- ============================================================================
COMMENT ON COLUMN public.event_requests.request_stage IS '3-step workflow stage: initial → initial_accepted → details_submitted → final_accepted';
COMMENT ON COLUMN public.event_requests.event_name IS 'Name of the event (used for workflow tracking)';
COMMENT ON COLUMN public.event_requests.requester_email IS 'Email for non-logged-in requesters';
COMMENT ON COLUMN public.event_requests.requester_name IS 'Name for non-logged-in requesters';
COMMENT ON COLUMN public.event_requests.requester_phone IS 'Phone number for non-logged-in requesters';
COMMENT ON COLUMN public.event_requests.requested_days IS 'JSON array of requested date strings';
COMMENT ON COLUMN public.event_requests.is_private IS 'Whether this is a private or public event';
COMMENT ON COLUMN public.event_requests.initial_notes IS 'Initial notes submitted with the first request';
COMMENT ON COLUMN public.event_requests.exact_start_datetime IS 'Exact start date and time (step 2)';
COMMENT ON COLUMN public.event_requests.exact_end_datetime IS 'Exact end date and time (step 2)';
COMMENT ON COLUMN public.event_requests.key_handover_datetime IS 'When keys should be picked up (can be different day)';
COMMENT ON COLUMN public.event_requests.key_return_datetime IS 'When keys should be returned';
COMMENT ON COLUMN public.event_requests.signed_contract_url IS 'URL to uploaded signed Mietvertrag PDF';
COMMENT ON COLUMN public.event_requests.initial_accepted_at IS 'Timestamp when admin accepted initial request';
COMMENT ON COLUMN public.event_requests.details_submitted_at IS 'Timestamp when user submitted final details';
COMMENT ON COLUMN public.event_requests.final_accepted_at IS 'Timestamp when admin gave final approval';
COMMENT ON COLUMN public.event_requests.rejection_reason IS 'Reason for rejection if request was declined';
COMMENT ON COLUMN public.event_requests.admin_notes IS 'Notes from administrator during review process';

-- ============================================================================
-- STEP 5: Create indexes for faster queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_event_requests_stage ON public.event_requests(request_stage);
CREATE INDEX IF NOT EXISTS idx_event_requests_email ON public.event_requests(requester_email);
CREATE INDEX IF NOT EXISTS idx_event_requests_created_at ON public.event_requests(created_at);

-- ============================================================================
-- STEP 6: Enable RLS (Row Level Security) if not already enabled
-- ============================================================================
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Drop existing policies (to recreate them properly)
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can create initial event requests" ON public.event_requests;
DROP POLICY IF EXISTS "Users can view their own requests by email" ON public.event_requests;
DROP POLICY IF EXISTS "Users can update their pending requests" ON public.event_requests;
DROP POLICY IF EXISTS "Admins have full access to event_requests" ON public.event_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.event_requests;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.event_requests;

-- ============================================================================
-- STEP 8: Create new RLS policies
-- ============================================================================

-- Policy 1: Allow anyone to create initial requests (no login required)
CREATE POLICY "Anyone can create initial event requests" 
ON public.event_requests FOR INSERT 
TO public
WITH CHECK (
  request_stage = 'initial' OR request_stage IS NULL
);

-- Policy 2: Allow anyone to read their own requests by email (no login required)
CREATE POLICY "Users can view their own requests by email" 
ON public.event_requests FOR SELECT 
TO public
USING (
  requester_email = current_setting('request.headers', true)::json->>'x-user-email'
  OR requested_by = auth.uid()
);

-- Policy 3: Allow users to update their own requests (for step 2 details)
CREATE POLICY "Users can update their pending requests" 
ON public.event_requests FOR UPDATE 
TO public
USING (
  (requester_email = current_setting('request.headers', true)::json->>'x-user-email'
   OR requested_by = auth.uid())
  AND request_stage IN ('initial_accepted')
)
WITH CHECK (
  (requester_email = current_setting('request.headers', true)::json->>'x-user-email'
   OR requested_by = auth.uid())
  AND request_stage IN ('details_submitted')
);

-- Policy 4: Allow admins full access to all event requests
CREATE POLICY "Admins have full access to event_requests" 
ON public.event_requests FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- STEP 9: Create function to notify on stage changes
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_request_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the stage change
    RAISE NOTICE 'Request % stage changed from % to %', NEW.id, OLD.request_stage, NEW.request_stage;
    
    -- Here you can add:
    -- - Email notification logic (via Edge Function)
    -- - Database logging
    -- - External webhook calls
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Create trigger for stage changes
-- ============================================================================
DROP TRIGGER IF EXISTS event_request_stage_change_trigger ON public.event_requests;

CREATE TRIGGER event_request_stage_change_trigger
    AFTER UPDATE OF request_stage ON public.event_requests
    FOR EACH ROW
    WHEN (OLD.request_stage IS DISTINCT FROM NEW.request_stage)
    EXECUTE FUNCTION notify_request_stage_change();

-- ============================================================================
-- STEP 11: Create view for temporarily blocked dates
-- ============================================================================
DROP VIEW IF EXISTS public.temporarily_blocked_dates;

CREATE OR REPLACE VIEW public.temporarily_blocked_dates AS
SELECT 
    id,
    event_name,
    title,
    requested_days,
    exact_start_datetime,
    exact_end_datetime,
    start_date,
    end_date,
    is_private,
    request_stage,
    initial_accepted_at,
    requester_name,
    requester_email,
    created_at
FROM public.event_requests
WHERE request_stage IN ('initial_accepted', 'details_submitted')
  AND status NOT IN ('rejected')
ORDER BY initial_accepted_at ASC;

-- Grant access to the view
GRANT SELECT ON public.temporarily_blocked_dates TO anon, authenticated;

COMMENT ON VIEW public.temporarily_blocked_dates IS 'Shows dates that are temporarily blocked while awaiting final approval (stages 2-3)';

-- ============================================================================
-- STEP 12: Create helper function to get request by email
-- ============================================================================
CREATE OR REPLACE FUNCTION get_requests_by_email(user_email text)
RETURNS TABLE (
    id uuid,
    event_name text,
    title text,
    request_stage request_stage,
    status text,
    requester_name text,
    requester_email text,
    requester_phone text,
    requested_days text,
    is_private boolean,
    initial_notes text,
    exact_start_datetime timestamp with time zone,
    exact_end_datetime timestamp with time zone,
    key_handover_datetime timestamp with time zone,
    key_return_datetime timestamp with time zone,
    signed_contract_url text,
    admin_notes text,
    rejection_reason text,
    created_at timestamp with time zone,
    initial_accepted_at timestamp with time zone,
    details_submitted_at timestamp with time zone,
    final_accepted_at timestamp with time zone
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.id,
        er.event_name,
        er.title,
        er.request_stage,
        er.status,
        er.requester_name,
        er.requester_email,
        er.requester_phone,
        er.requested_days,
        er.is_private,
        er.initial_notes,
        er.exact_start_datetime,
        er.exact_end_datetime,
        er.key_handover_datetime,
        er.key_return_datetime,
        er.signed_contract_url,
        er.admin_notes,
        er.rejection_reason,
        er.created_at,
        er.initial_accepted_at,
        er.details_submitted_at,
        er.final_accepted_at
    FROM public.event_requests er
    WHERE er.requester_email = user_email
    ORDER BY er.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_requests_by_email(text) TO anon, authenticated;

-- ============================================================================
-- STEP 13: Update existing data (optional)
-- ============================================================================

-- Set event_name from title for existing records
UPDATE public.event_requests 
SET event_name = title 
WHERE event_name IS NULL AND title IS NOT NULL;

-- Set default request_stage for existing records
UPDATE public.event_requests 
SET request_stage = 
  CASE 
    WHEN status = 'approved' THEN 'final_accepted'::request_stage
    WHEN status = 'rejected' THEN 'rejected'::request_stage
    ELSE 'initial'::request_stage
  END
WHERE request_stage IS NULL;

-- ============================================================================
-- STEP 14: Create storage bucket policies reminder
-- ============================================================================

-- NOTE: You need to create the storage bucket manually in Supabase Dashboard:
-- 
-- Bucket Configuration:
-- - Name: signed-contracts
-- - Public: false
-- - File size limit: 10MB
-- - Allowed MIME types: application/pdf
--
-- Then create these policies in the Storage section:

/*
-- Policy: Allow authenticated uploads
CREATE POLICY "Authenticated users can upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signed-contracts'
);

-- Policy: Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed-contracts' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Allow anonymous uploads (for non-logged-in users)
CREATE POLICY "Anonymous users can upload contracts"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'signed-contracts'
);

-- Policy: Users can view their own contracts by email reference
-- (You may need to implement this via Edge Function for security)
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if all columns were added successfully
DO $$ 
DECLARE 
    missing_columns text[];
BEGIN
    SELECT array_agg(column_name) INTO missing_columns
    FROM (
        VALUES 
            ('request_stage'),
            ('event_name'),
            ('requester_phone'),
            ('requested_days'),
            ('initial_notes'),
            ('exact_start_datetime'),
            ('exact_end_datetime'),
            ('key_handover_datetime'),
            ('key_return_datetime'),
            ('signed_contract_url'),
            ('initial_accepted_at'),
            ('details_submitted_at'),
            ('final_accepted_at'),
            ('rejection_reason'),
            ('admin_notes')
    ) AS required_columns(column_name)
    WHERE NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_requests' 
        AND column_name = required_columns.column_name
    );
    
    IF missing_columns IS NOT NULL THEN
        RAISE WARNING 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✓ All required columns have been added successfully!';
    END IF;
END $$;

-- List all policies on event_requests
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'event_requests'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║  ✓ 3-STEP EVENT WORKFLOW MIGRATION COMPLETED SUCCESSFULLY             ║
║                                                                        ║
║  Next Steps:                                                           ║
║  1. Create Storage Bucket "signed-contracts" in Supabase Dashboard    ║
║  2. Configure Storage Policies (see comments above)                   ║
║  3. Test the workflow:                                                 ║
║     - Create initial request (no login)                                ║
║     - Admin accepts request                                            ║
║     - User fills details + uploads PDF                                 ║
║     - Admin gives final approval                                       ║
║  4. Check temporarily_blocked_dates view                               ║
║                                                                        ║
║  Documentation: THREE_STEP_EVENT_WORKFLOW_GUIDE.md                    ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    ';
END $$;
