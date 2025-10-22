-- ============================================
-- RUN THIS NOW TO FIX STORAGE BUCKET ISSUE
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-contracts',
  'signed-contracts', 
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow uploads to signed-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Allow downloads from signed-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view signed-contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view signed-contracts" ON storage.objects;

-- Create policy: Allow anyone to upload
CREATE POLICY "Allow uploads to signed-contracts"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'signed-contracts');

-- Create policy: Allow admins to download
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

-- Create policy: Allow anyone to download (for users checking their own contracts)
CREATE POLICY "Allow downloads from signed-contracts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signed-contracts');

-- ============================================
-- VERIFICATION
-- ============================================

-- Check bucket was created
SELECT 
  '✅ Bucket created!' as status,
  id, 
  name, 
  public as is_public,
  file_size_limit as size_limit
FROM storage.buckets 
WHERE id = 'signed-contracts';

-- Check policies were created
SELECT 
  '✅ Policies created!' as status,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%signed-contracts%'
ORDER BY policyname;

-- ============================================
-- SUCCESS! ✅
-- ============================================
SELECT '
╔════════════════════════════════════════════╗
║  ✅ STORAGE BUCKET SETUP COMPLETE!        ║
║                                            ║
║  You can now:                              ║
║  - Upload PDFs (users)                     ║
║  - Download PDFs (admins)                  ║
║                                            ║
║  Refresh your app and try again!           ║
╚════════════════════════════════════════════╝
' as message;

