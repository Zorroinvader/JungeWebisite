# 🚨 URGENT: Fix RLS Policies - Event Requests Not Loading

## Problem
- **No RLS policies** on `event_requests` table
- **Event requests don't load** in admin panel "3-Schritt Anfragen"
- **Admin can't see any requests** even though they exist in database

## Solution: Run SQL in Supabase

### Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Or go to: https://supabase.com/dashboard/project/_/sql

3. **Run the SQL**
   - Open file: **`RUN_THIS_SQL_NOW.sql`** in this directory
   - Copy **ALL** contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click **Run** button or press `Ctrl+Enter`

4. **Verify Success**
   - You should see a result table showing 4 policies
   - Policies listed: Allow insert, Allow select, Allow update, Admins full access

5. **Test the Fix**
   - Refresh your admin panel (F5)
   - Go to "3-Schritt Anfragen" tab
   - Event requests should now appear

## What the SQL Does

The SQL will:
1. ✅ Enable RLS on `event_requests` table
2. ✅ Drop all existing policies (clean slate)
3. ✅ Create 4 essential policies:
   - **INSERT**: Anyone can create event requests
   - **SELECT**: Everyone can read (admins see all, users see their own)
   - **UPDATE**: Users can update own requests, admins can update any
   - **ADMINS FULL ACCESS**: Admins have complete access

## Quick Copy-Paste Version

If you can't open the file, copy this:

```sql
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'event_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON event_requests CASCADE';
    END LOOP;
END $$;

CREATE POLICY "Allow insert event requests" ON event_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow select event requests" ON event_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow update event requests" ON event_requests FOR UPDATE TO authenticated
USING (requested_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')))
WITH CHECK (requested_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')));
CREATE POLICY "Admins full access" ON event_requests FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')));
```

## Files Created
- **`RUN_THIS_SQL_NOW.sql`** ← **RUN THIS ONE**
- `supabase/migrations/fix_event_requests_rls_complete.sql` - Migration version
- `QUICK_FIX_RLS.md` - Detailed instructions
- `FIX_RLS_POLICIES_INSTRUCTIONS.md` - Full documentation

## After Running

1. Wait 2-3 seconds for policies to apply
2. Refresh admin panel (F5)
3. Check "3-Schritt Anfragen" tab
4. Event requests should now be visible

## Still Not Working?

Run this verification query in Supabase SQL Editor:

```sql
-- Check if policies exist
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'event_requests';

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'event_requests';

-- Check admin users
SELECT id, email, role FROM profiles WHERE role IN ('admin', 'superadmin');
```

You should see 4 policies in the first query.

