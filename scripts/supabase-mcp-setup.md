# Supabase MCP Setup - Schritt für Schritt

## Schritt 1: Projekt-ID finden

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Gehe zu: Project Settings → General
4. Kopiere die **Reference ID** (z.B. `abcdefghijklmnop`)

## Schritt 2: Migrationen anwenden

### Migration 1: Club Status Table

Führe diese Migration im **Supabase SQL Editor** aus:

```sql
-- Create table to store club status
CREATE TABLE IF NOT EXISTS club_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  has_new_devices BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to update the status
CREATE OR REPLACE FUNCTION update_club_status(
  has_new_devices_value BOOLEAN,
  message_value TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Delete old records (keep only the latest)
  DELETE FROM club_status WHERE id != (
    SELECT id FROM club_status ORDER BY updated_at DESC LIMIT 1
  );
  
  -- Determine if occupied: if has_new_devices is true, someone new is there
  INSERT INTO club_status (is_occupied, has_new_devices, message, last_checked, updated_at)
  VALUES (
    has_new_devices_value, -- is_occupied = true when new devices found
    has_new_devices_value,
    COALESCE(message_value, 
      CASE 
        WHEN has_new_devices_value THEN 'Neue Geräte die nicht zum Baseline gehören'
        ELSE 'Außer den Baseline Geräten ist niemand im Club'
      END
    ),
    NOW(),
    NOW()
  );
  
  -- If no records exist, create one
  IF NOT FOUND THEN
    INSERT INTO club_status (is_occupied, has_new_devices, message, last_checked, updated_at)
    VALUES (
      has_new_devices_value,
      has_new_devices_value,
      COALESCE(message_value, 
        CASE 
          WHEN has_new_devices_value THEN 'Neue Geräte die nicht zum Baseline gehören'
          ELSE 'Außer den Baseline Geräten ist niemand im Club'
        END
      ),
      NOW(),
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the latest status
CREATE OR REPLACE FUNCTION get_latest_club_status()
RETURNS TABLE (
  is_occupied BOOLEAN,
  has_new_devices BOOLEAN,
  message TEXT,
  last_checked TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT cs.is_occupied, cs.has_new_devices, cs.message, cs.last_checked
  FROM club_status cs
  ORDER BY cs.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE club_status ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to club_status"
  ON club_status FOR SELECT
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to update club_status"
  ON club_status FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial status
INSERT INTO club_status (is_occupied, has_new_devices, message, last_checked) 
VALUES (false, false, 'Außer den Baseline Geräten ist niemand im Club', NOW())
ON CONFLICT DO NOTHING;
```

### Migration 2: pg_cron Setup

**Zuerst: Database Settings setzen**

Ersetze `YOUR_PROJECT_REF` und `YOUR_SERVICE_ROLE_KEY`:

```sql
-- Set Supabase URL (findest du in Project Settings → API → URL)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';

-- Set Service Role Key (findest du in Project Settings → API → service_role key)
ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

**Dann: pg_cron Migration**

```sql
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

-- Schedule cron job (runs every 30 seconds)
-- Note: Some pg_cron versions only support minute-level granularity
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
```

## Schritt 3: Edge Function Secrets setzen

1. Gehe zu: Supabase Dashboard → Edge Functions → Secrets
2. Füge hinzu:

**Secret 1:**
- Name: `FRITZ_SERVICE_URL`
- Value: `http://YOUR_EC2_IP:8000` (deine EC2 Elastic IP oder Public IP)

**Secret 2:**
- Name: `FRITZ_SERVICE_API_KEY`
- Value: `JC!Pferdestall` (muss identisch mit EC2 .env sein)

## Schritt 4: Edge Function deployen

**Mit Supabase CLI:**

```bash
# Install Supabase CLI (falls nicht installiert)
npm install -g supabase

# Login
supabase login

# Link zu deinem Projekt
supabase link --project-ref YOUR_PROJECT_REF

# Deploy
supabase functions deploy check-devices
```

**Oder manuell:**
1. Gehe zu: Edge Functions → Create new function
2. Name: `check-devices`
3. Kopiere Inhalt von `supabase/functions/check-devices/index.ts`
4. Deploy

## Schritt 5: Testen

**1. Prüfe pg_cron Job:**
```sql
SELECT * FROM cron.job WHERE jobname = 'check-devices-every-30s';
```

**2. Prüfe Job History:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-devices-every-30s')
ORDER BY start_time DESC 
LIMIT 10;
```

**3. Prüfe club_status:**
```sql
SELECT * FROM club_status ORDER BY updated_at DESC LIMIT 1;
```

**4. Test Edge Function manuell:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-devices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Fertig! 🎉

Der Service sollte jetzt alle 30 Sekunden automatisch laufen und den Club-Status aktualisieren.

