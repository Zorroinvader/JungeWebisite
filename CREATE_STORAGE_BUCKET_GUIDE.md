# Create Storage Bucket for Signed Contracts

## Error: "Bucket not found"

This happens because the Supabase Storage bucket for signed contracts hasn't been created yet.

## Solution 1: Create Bucket Manually (Recommended - 2 minutes)

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - Open https://supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click the "New bucket" button

3. **Configure the Bucket**
   ```
   Bucket name:    signed-contracts
   Public bucket:  ❌ OFF (Keep it private!)
   File size limit: 10485760 (10MB)
   Allowed MIME types: application/pdf
   ```

4. **Create Policies**

   After creating the bucket, click on it, then go to "Policies" tab:

   **Policy 1: Allow Uploads**
   - Click "New Policy"
   - Choose "Custom"
   - Name: `Allow authenticated uploads`
   - Policy definition:
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated, anon
   WITH CHECK (
     bucket_id = 'signed-contracts'
   );
   ```

   **Policy 2: Allow Admins to View**
   - Click "New Policy"  
   - Choose "Custom"
   - Name: `Admins can view contracts`
   - Policy definition:
   ```sql
   CREATE POLICY "Admins can view contracts"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'signed-contracts' AND
     EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE profiles.id = auth.uid() 
       AND profiles.role = 'admin'
     )
   );
   ```

5. **Test Upload**
   - Try uploading the contract again
   - Should work now! ✅

## Solution 2: Create via SQL (Alternative)

If you prefer SQL, run this in Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-contracts',
  'signed-contracts',
  false,
  10485760,
  ARRAY['application/pdf']
);

-- Create upload policy
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (
  bucket_id = 'signed-contracts'
);

-- Create admin view policy
CREATE POLICY "Admins can view contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed-contracts' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

## Solution 3: Temporary Workaround (If you can't create bucket now)

If you need to test the workflow immediately without the bucket, we can temporarily store the contract data in the database instead of storage.

The system will store the PDF as base64 in the `uploaded_file_data` column (like your old workflow).

This is already implemented as a fallback, but let me improve the error message.

## Verification

After creating the bucket, verify it works:

1. Go to Storage → signed-contracts
2. You should see the empty bucket
3. Check the Policies tab - should see 2 policies
4. Try uploading a contract again - should work! ✅

## Common Issues

### "Policy not working"
- Make sure you're logged in
- Check the `profiles` table has your user with proper role
- Refresh the page

### "Still getting 404"
- Wait 30 seconds after creating bucket
- Refresh your application
- Check bucket name is exactly `signed-contracts` (no spaces!)

### "Upload works but can't download"
- Check the admin policy exists
- Verify your user has `role = 'admin'` in profiles table
- Check bucket is set to private (public = false)

