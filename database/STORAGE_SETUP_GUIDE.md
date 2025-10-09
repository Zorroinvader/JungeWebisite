# Supabase Storage Setup Guide

## Step 1: Create the Storage Bucket

1. **Go to Supabase Dashboard**
   - Open your project in the Supabase Dashboard
   - Navigate to **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"**
   - **Bucket name**: `documents`
   - **Public bucket**: ❌ **UNCHECK** (keep it private for security)
   - Click **"Create bucket"**

## Step 2: Apply RLS Policies

1. **Go to SQL Editor**
   - In Supabase Dashboard, go to **SQL Editor**
   - Click **"New query"**

2. **Run the RLS Policy Script**
   - Copy the contents of `database/apply-storage-rls-policies.sql`
   - Paste it into the SQL Editor
   - Click **"Run"**

## Step 3: Verify the Setup

1. **Check Bucket Creation**
   - Go back to **Storage** → **Buckets**
   - Verify `documents` bucket exists and is private

2. **Check RLS Policies**
   - Go to **Storage** → **Policies**
   - Verify the following policies exist:
     - "Users can upload their own files"
     - "Users can view their own files"
     - "Admins can view all files"
     - "Users can delete their own files"
     - "Admins can delete any file"

## Step 4: Test File Upload

1. **Run Database Script**
   - First run `database/add-file-upload-column.sql` to add the database column

2. **Test in Application**
   - Go to your application
   - Try creating an event request
   - Upload a PDF file
   - Check if it appears in the admin panel

## File Structure

The uploaded files will be stored with this structure:
```
documents/
└── mietvertraege/
    ├── {user_id}_1234567890_filename.pdf
    ├── {user_id}_1234567891_filename.pdf
    └── ...
```

## Security Features

- ✅ **Private Bucket**: Files are not publicly accessible
- ✅ **User Isolation**: Users can only access their own files
- ✅ **Admin Access**: Admins can view all files
- ✅ **Organized Structure**: Files are stored in user-specific folders
- ✅ **Unique Naming**: Prevents filename conflicts

## Troubleshooting

### If file upload fails:
1. Check that the `documents` bucket exists
2. Verify RLS policies are applied
3. Check browser console for errors
4. Ensure user is authenticated

### If admin can't see files:
1. Verify admin role in profiles table
2. Check RLS policies are applied correctly
3. Refresh the admin panel

### If users can't upload:
1. Check authentication status
2. Verify file size (max 10MB)
3. Check file type (PDF only)
4. Verify RLS policies allow uploads
