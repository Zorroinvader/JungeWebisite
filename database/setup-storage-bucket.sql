-- Setup Supabase Storage bucket for document uploads
-- This creates a bucket for storing uploaded Mietvertrag PDFs

-- Create the documents bucket (this needs to be done in Supabase Dashboard or via API)
-- For now, we'll just document the required bucket configuration

-- Bucket name: documents
-- Public: false (private bucket for security)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf

-- RLS policies for the documents bucket:
-- 1. Users can upload files to their own folder
-- 2. Admins can view all files
-- 3. Users can view their own uploaded files

-- Example RLS policies (to be applied in Supabase Dashboard):
/*
-- Policy for uploading files
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'mietvertraege' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy for viewing files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[2] OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy for admins to view all files
CREATE POLICY "Admins can view all files" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
*/

SELECT 'Storage bucket setup instructions documented!' as status;
