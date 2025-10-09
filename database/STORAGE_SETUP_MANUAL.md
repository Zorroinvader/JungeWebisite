# Manual Supabase Storage Setup Guide

Since we can't modify storage policies via SQL due to permission limitations, follow these manual steps:

## Step 1: Create the Documents Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set the following:
   - **Name**: `documents`
   - **Public**: ❌ **UNCHECK** (keep it private)
5. Click **"Create bucket"**

## Step 2: Configure RLS Policies

1. In the **Storage** section, click on the **"documents"** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Create the following policies:

### Policy 1: Allow Upload
- **Policy Name**: `Allow authenticated users to upload`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 2: Allow View
- **Policy Name**: `Allow authenticated users to view`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 3: Allow Delete
- **Policy Name**: `Allow authenticated users to delete`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 4: Allow Update
- **Policy Name**: `Allow authenticated users to update`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

## Step 3: Test the Setup

1. Run the **"Storage Permission Test"** on the homepage
2. If successful, try the **"Storage Upload Test"**
3. Finally, test the **Event Request Form**

## Alternative: Use Database Storage

If Supabase Storage continues to have issues, we can use the database storage approach instead by running:

```sql
-- Add file storage columns to event_requests table
ALTER TABLE event_requests 
ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT,
ADD COLUMN IF NOT EXISTS uploaded_file_size INTEGER,
ADD COLUMN IF NOT EXISTS uploaded_file_type TEXT,
ADD COLUMN IF NOT EXISTS uploaded_file_data TEXT;
```

This stores files directly in the database as base64 data.
