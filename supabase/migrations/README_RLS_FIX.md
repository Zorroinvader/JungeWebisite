# Fix Event Requests RLS Policies

This migration fixes the Row Level Security (RLS) policies for the `event_requests` table to allow anonymous users to create event requests.

## Problem
The form is hanging when trying to insert event requests because RLS policies are blocking anonymous users from inserting data.

## Solution
Run the migration `fix_event_requests_rls.sql` to:
1. Allow anyone (including anonymous users) to INSERT event requests
2. Allow users to read their own requests
3. Allow admins to read and update all requests
4. Allow users to update their own requests

## How to Apply

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `fix_event_requests_rls.sql`
4. Paste and run it

### Option 2: Via Supabase CLI
```bash
supabase db push
```

### Option 3: Via Migration
If you're using migrations, the file is already in the migrations folder and should be applied automatically.

## What the Migration Does

- **Enables RLS** on the `event_requests` table
- **Creates INSERT policy** that allows `anon` and `authenticated` roles to insert
- **Creates SELECT policies** for users to read their own requests and admins to read all
- **Creates UPDATE policies** for users to update their own requests and admins to update all

## Testing

After applying the migration, try submitting the event request form again. It should work for both:
- Anonymous users (not logged in)
- Authenticated users (logged in)

