-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enable pg_net extension for HTTP requests (if available)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that calls the Supabase Edge Function
CREATE OR REPLACE FUNCTION trigger_check_devices()
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
  response_status INT;
  response_body TEXT;
BEGIN
  -- Get settings
  BEGIN
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_key := current_setting('app.settings.supabase_service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Settings not configured. Please set app.settings.supabase_url and app.settings.supabase_service_role_key';
    RETURN;
  END;
  
  -- Call the Supabase Edge Function via HTTP using pg_net
  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := supabase_url || '/functions/v1/check-devices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
  
  -- Log the result (optional)
  RAISE NOTICE 'Device check triggered. Status: %, Response: %', response_status, LEFT(response_body, 200);
END;
$$ LANGUAGE plpgsql;

-- Schedule the job to run every 30 seconds
-- Note: You need to set these settings first:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- Schedule cron job (runs every 30 seconds)
-- Note: Some pg_cron versions only support minute-level granularity
-- If seconds don't work, use: '*/1 * * * *' for every minute
SELECT cron.schedule(
  'check-devices-every-30s',
  '*/30 * * * * *', -- Every 30 seconds (requires pg_cron 1.5+)
  $$SELECT trigger_check_devices();$$
);

-- Alternative: If your pg_cron doesn't support seconds, use this (runs every minute):
-- SELECT cron.schedule(
--   'check-devices-every-minute',
--   '* * * * *', -- Every minute
--   $$SELECT trigger_check_devices();$$
-- );

-- To remove the job later:
-- SELECT cron.unschedule('check-devices-every-30s');

