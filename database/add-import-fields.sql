-- Add fields to support imported events from old calendar
-- Run this migration to add import tracking fields to the events table

-- Add imported_from field to track source of import
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS imported_from TEXT;

-- Add imported_at timestamp
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Add imported_uid to track original event UID and prevent duplicates
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS imported_uid TEXT;

-- Add category field to preserve original categorization
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add attendee_info field to store attendee information
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS attendee_info TEXT;

-- Create index on imported_uid for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_events_imported_uid ON events(imported_uid);

-- Add comment
COMMENT ON COLUMN events.imported_from IS 'Source of import (e.g., old_calendar)';
COMMENT ON COLUMN events.imported_at IS 'Timestamp when event was imported';
COMMENT ON COLUMN events.imported_uid IS 'Original UID from imported calendar';
COMMENT ON COLUMN events.category IS 'Original category from imported calendar';
COMMENT ON COLUMN events.attendee_info IS 'Attendee information from imported calendar';

