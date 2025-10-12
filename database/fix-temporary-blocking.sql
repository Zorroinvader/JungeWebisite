-- Update the temporarily_blocked_dates view to include ALL pending requests
-- This ensures dates are blocked immediately when users submit initial requests

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
WHERE request_stage IN ('initial', 'initial_accepted', 'details_submitted')
  AND status NOT IN ('rejected', 'cancelled')
ORDER BY created_at ASC;

COMMENT ON VIEW public.temporarily_blocked_dates IS 'Shows dates that are temporarily blocked for all pending requests (stages 1-3, until final approval or rejection)';

-- This ensures:
-- 1. Initial requests ('initial') block dates immediately
-- 2. Accepted requests ('initial_accepted') keep dates blocked
-- 3. Detailed submissions ('details_submitted') keep dates blocked
-- 4. Rejected and cancelled requests do NOT block dates

