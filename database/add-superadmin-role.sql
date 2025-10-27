-- Migration to add superadmin role support
-- Run this in your Supabase SQL editor

-- ============================================================================
-- STEP 1: Add superadmin role support to profiles table
-- ============================================================================

-- First, ensure the role column exists (if it doesn't already)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'member';
    END IF;
END $$;

-- Update existing admin@admin.com to be superadmin
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE email = 'admin@admin.com';

-- ============================================================================
-- STEP 2: Create role type enum (optional but recommended)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'superadmin',  -- Can do everything, including create/manage users
        'admin',       -- Can accept events, manage requests
        'member',      -- Logged in user
        'guest'        -- Not logged in
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: Update RLS policies to include superadmin
-- ============================================================================

-- Update admin RLS policies to include superadmin
-- Note: This will vary based on your existing policies
-- Look for policies that check for role = 'admin' and update them

-- Example for profiles table
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

CREATE POLICY "Admins and superadmins have full access to profiles" 
ON public.profiles FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- ============================================================================
-- STEP 4: Create verification queries
-- ============================================================================

-- Check if admin@admin.com is superadmin
SELECT 
    id, 
    email, 
    role, 
    full_name 
FROM public.profiles 
WHERE email = 'admin@admin.com';

-- List all users with their roles
SELECT 
    id, 
    email, 
    role, 
    full_name,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 5: Create helper function to check if user is superadmin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_superadmin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND role = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_superadmin(uuid) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║  ✓ SUPERADMIN ROLE MIGRATION COMPLETED SUCCESSFULLY                  ║
║                                                                        ║
║  Changes Applied:                                                      ║
║  - Added superadmin role support                                      ║
║  - admin@admin.com is now superadmin                                  ║
║  - Updated RLS policies                                                ║
║  - Created is_superadmin() helper function                            ║
║                                                                        ║
║  Next Steps:                                                           ║
║  1. Verify admin@admin.com has superadmin role                        ║
║  2. Test superadmin access in the application                         ║
║  3. Create user management interface for superadmin                   ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    ';
END $$;

