# Row Level Security (RLS) Policies Documentation

## Overview

This document describes all Row Level Security (RLS) policies applied to database tables in the Jungengesellschaft application. RLS is critical for ensuring that users can only access data they are authorized to see.

## Security Model

The application uses a role-based access control (RBAC) system with the following roles:
- **superadmin**: Full access to all data and operations
- **admin**: Can manage events and requests, view all data
- **member**: Can view public events and manage their own requests
- **anon**: Anonymous users (guests) can create event requests

## Tables and RLS Policies

### 1. `event_requests` Table

**RLS Status:** ✅ Enabled

#### Policies:

1. **"Allow insert event requests"**
   - **Type:** INSERT
   - **Target:** `anon`, `authenticated`
   - **Condition:** `WITH CHECK (true)`
   - **Purpose:** Allows both anonymous and authenticated users to create event requests
   - **Security Note:** ⚠️ This allows anyone to insert. Consider adding validation in application code.

2. **"Allow select own event requests"**
   - **Type:** SELECT
   - **Target:** `anon`, `authenticated`
   - **Condition:** `USING (true)`
   - **Purpose:** Allows users to view event requests
   - **Security Note:** ⚠️ Currently allows all users to see all requests. Should be restricted to:
     - Users can see their own requests (by `requested_by` or `requester_email`)
     - Admins can see all requests
     - Anonymous users should only see their own requests (by email)

3. **"Allow update own event requests"**
   - **Type:** UPDATE
   - **Target:** `authenticated`
   - **Condition:** `USING (requested_by = auth.uid())` AND `WITH CHECK (requested_by = auth.uid())`
   - **Purpose:** Allows authenticated users to update only their own requests
   - **Security:** ✅ Good - properly restricts updates to own data

4. **"Admins full access"**
   - **Type:** ALL (SELECT, INSERT, UPDATE, DELETE)
   - **Target:** `authenticated`
   - **Condition:** User must have `admin` or `superadmin` role in `profiles` table
   - **Purpose:** Grants full access to admins
   - **Security:** ✅ Good - properly checks role in profiles table

#### Recommendations:

1. **Improve SELECT policy:**
   ```sql
   -- Recommended: Restrict SELECT to own requests
   CREATE POLICY "Allow select own event requests"
   ON event_requests
   FOR SELECT
   TO authenticated
   USING (
     requested_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'superadmin')
     )
   );
   
   -- For anonymous users, restrict by email (requires application-level tracking)
   -- Note: RLS cannot directly check email for anonymous users
   ```

2. **Add DELETE policy:**
   ```sql
   CREATE POLICY "Allow delete own event requests"
   ON event_requests
   FOR DELETE
   TO authenticated
   USING (
     requested_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'superadmin')
     )
   );
   ```

### 2. `profiles` Table

**RLS Status:** ⚠️ **NEEDS VERIFICATION**

#### Expected Policies:

1. **Users can view their own profile:**
   ```sql
   CREATE POLICY "Users can view own profile"
   ON profiles
   FOR SELECT
   TO authenticated
   USING (id = auth.uid());
   ```

2. **Users can update their own profile:**
   ```sql
   CREATE POLICY "Users can update own profile"
   ON profiles
   FOR UPDATE
   TO authenticated
   USING (id = auth.uid())
   WITH CHECK (id = auth.uid());
   ```

3. **Admins can view all profiles:**
   ```sql
   CREATE POLICY "Admins can view all profiles"
   ON profiles
   FOR SELECT
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'superadmin')
     )
   );
   ```

4. **Admins can update all profiles:**
   ```sql
   CREATE POLICY "Admins can update all profiles"
   ON profiles
   FOR UPDATE
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'superadmin')
     )
   );
   ```

5. **Allow profile creation on signup:**
   ```sql
   CREATE POLICY "Allow profile creation on signup"
   ON profiles
   FOR INSERT
   TO authenticated
   WITH CHECK (id = auth.uid());
   ```

**Action Required:** Verify these policies exist in your Supabase database.

### 3. `events` Table

**RLS Status:** ⚠️ **NEEDS VERIFICATION**

#### Expected Policies:

1. **Public events are visible to all:**
   ```sql
   CREATE POLICY "Public events visible to all"
   ON events
   FOR SELECT
   TO anon, authenticated
   USING (is_private = false AND status = 'approved');
   ```

2. **Users can view their own events (private or public):**
   ```sql
   CREATE POLICY "Users can view own events"
   ON events
   FOR SELECT
   TO authenticated
   USING (
     created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'superadmin')
     )
   );
   ```

3. **Admins can manage all events:**
   ```sql
   CREATE POLICY "Admins can manage all events"
   ON events
   FOR ALL
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.role IN ('admin', 'superadmin')
     )
   );
   ```

**Action Required:** Verify these policies exist in your Supabase database.

## Testing RLS Policies

### Test Checklist:

1. **Anonymous User Tests:**
   - [ ] Can create event requests (INSERT)
   - [ ] Cannot view other users' private data
   - [ ] Cannot update any data
   - [ ] Cannot delete any data

2. **Authenticated User Tests:**
   - [ ] Can view own profile
   - [ ] Can update own profile
   - [ ] Can view own event requests
   - [ ] Can update own event requests
   - [ ] Cannot view other users' private data
   - [ ] Cannot update other users' data

3. **Admin User Tests:**
   - [ ] Can view all profiles
   - [ ] Can update all profiles
   - [ ] Can view all event requests
   - [ ] Can update all event requests
   - [ ] Can manage all events

4. **Service Role Tests:**
   - [ ] Service role bypasses RLS (for backend operations)
   - [ ] Service role is never used in frontend code

## Security Recommendations

### High Priority:

1. **Restrict SELECT on `event_requests`:**
   - Currently allows all users to see all requests
   - Should restrict to own requests + admin access

2. **Verify RLS on all tables:**
   - Run `SELECT tablename FROM pg_tables WHERE schemaname = 'public';` in Supabase SQL Editor
   - For each table, verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`

3. **Test policies with different user roles:**
   - Create test users with different roles
   - Verify access restrictions work as expected

### Medium Priority:

1. **Add DELETE policies:**
   - Currently missing explicit DELETE policies
   - Should allow users to delete their own data (with restrictions)
   - Admins should be able to delete any data

2. **Add audit logging:**
   - Track who accessed what data
   - Monitor for suspicious access patterns

3. **Document policy changes:**
   - Keep this document updated when policies change
   - Version control SQL migration files

## SQL Commands to Check RLS Status

```sql
-- Check if RLS is enabled on a table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'event_requests';

-- List all RLS policies on a table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'event_requests';

-- Enable RLS on a table (if not already enabled)
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- List all tables with RLS status
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'Enabled'
    ELSE 'Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Migration Files

RLS policies are defined in:
- `supabase/migrations/fix_event_requests_rls_simple.sql` - Basic RLS setup for event_requests

**Note:** Additional migration files may be needed for `profiles` and `events` tables.

## Next Steps

1. ✅ Verify RLS is enabled on all tables
2. ⏳ Review and improve SELECT policies
3. ⏳ Add DELETE policies
4. ⏳ Test policies with different user roles
5. ⏳ Document any additional tables that need RLS

---

**Last Updated:** 2025-01-27  
**Status:** Partial - event_requests policies documented, other tables need verification

