-- ============================================
-- FIXED: Create Storage Bucket & Policies
-- ============================================

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-contracts',
  'signed-contracts', 
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow uploads to signed-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view signed-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view signed-contracts" ON storage.objects;

-- 3. Create policy: Allow anyone to upload
CREATE POLICY "Allow uploads to signed-contracts"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'signed-contracts');

-- 4. Create policy: Allow admins to download/view contracts
CREATE POLICY "Admins can view signed-contracts"
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

-- 5. Create policy: Allow anyone to download contracts (for users)
CREATE POLICY "Users can view signed-contracts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signed-contracts');

-- Verify bucket was created
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'signed-contracts';

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%signed-contracts%'
ORDER BY policyname;

-- Done! ✅
SELECT '✅ Storage bucket and policies created successfully!' as status;

