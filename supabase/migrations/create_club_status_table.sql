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
DECLARE
  latest_id UUID;
BEGIN
  -- Get the latest record ID (if exists)
  SELECT id INTO latest_id 
  FROM club_status 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  -- Delete old records (keep only the latest one)
  IF latest_id IS NOT NULL THEN
    DELETE FROM club_status WHERE id != latest_id;
  END IF;
  
  -- Insert new status record
  INSERT INTO club_status (is_occupied, has_new_devices, message, last_checked, updated_at)
  VALUES (
    has_new_devices_value, -- is_occupied = true when new devices found
    has_new_devices_value,
    COALESCE(message_value, 
      CASE 
        WHEN has_new_devices_value THEN 'Jemand ist im Club'
        ELSE 'Niemand ist gerade im Club'
      END
    ),
    NOW(),
    NOW()
  );
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
VALUES (false, false, 'Niemand ist gerade im Club', NOW())
ON CONFLICT DO NOTHING;

