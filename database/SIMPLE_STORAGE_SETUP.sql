-- ============================================
-- SIMPLE: Create Storage Bucket (No Policies)
-- Run this FIRST, then add policies manually
-- ============================================

-- Just create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-contracts',
  'signed-contracts', 
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT 
  '✅ Bucket created! Now add policies in Supabase Storage UI' as message,
  id, 
  name, 
  public as is_public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'signed-contracts';

