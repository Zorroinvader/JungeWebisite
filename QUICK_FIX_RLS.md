# QUICK FIX: Restore RLS Policies for event_requests

## The Problem
- No RLS policies on `event_requests` table
- Event requests don't load in admin panel "3-Schritt Anfragen"
- Admin can't see any requests

## The Solution - Run This SQL NOW

### Option 1: Use the Complete SQL File
1. Open **`RUN_THIS_SQL_NOW.sql`** in this directory
2. Copy ALL contents
3. Go to https://supabase.com/dashboard
4. Select your project
5. Click **SQL Editor** (left sidebar)
6. Paste the SQL
7. Click **Run** (or press Ctrl+Enter)

### Option 2: Quick Copy-Paste (Minimal Version)
Copy and paste this into Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'event_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON event_requests CASCADE';
    END LOOP;
END $$;

-- Allow INSERT
CREATE POLICY "Allow insert event requests" ON event_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow SELECT (everyone can read)
CREATE POLICY "Allow select event requests" ON event_requests FOR SELECT TO anon, authenticated USING (true);

-- Allow UPDATE (own requests or admins)
CREATE POLICY "Allow update event requests" ON event_requests FOR UPDATE TO authenticated
USING (requested_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')))
WITH CHECK (requested_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')));

-- Allow admins full access
CREATE POLICY "Admins full access" ON event_requests FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')));
```

## After Running

1. **Wait 2-3 seconds** for policies to be applied
2. **Refresh your admin panel** (F5)
3. **Go to "3-Schritt Anfragen" tab**
4. **Event requests should now appear**

## Verify It Worked

Run this in Supabase SQL Editor to check:

```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'event_requests';
```

You should see 4 policies listed.

## If Still Not Working

1. **Check admin is logged in** - Make sure you're logged in as admin
2. **Verify admin role** - Run: `SELECT id, email, role FROM profiles WHERE role IN ('admin', 'superadmin');`
3. **Check browser console** - Look for RLS errors
4. **Try logging out and back in** - Refresh session

## Files Created
- `RUN_THIS_SQL_NOW.sql` - Complete SQL with verification
- `supabase/migrations/fix_event_requests_rls_complete.sql` - Migration version
- `QUICK_FIX_RLS.md` - This file

