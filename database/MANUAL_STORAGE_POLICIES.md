# Manual Storage Policy Setup

Since the documents bucket exists but users can't access it, you need to set up RLS policies manually in Supabase Dashboard.

## Step 1: Go to Storage Policies

1. Open your **Supabase Dashboard**
2. Go to **Storage** in the left sidebar
3. Click on the **"documents"** bucket
4. Click on the **"Policies"** tab

## Step 2: Create the Required Policies

You need to create 4 policies. For each policy:

1. Click **"New Policy"**
2. Choose **"For full customization"**
3. Use the settings below:

### Policy 1: Allow Upload
- **Policy Name**: `Allow authenticated users to upload files`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 2: Allow View
- **Policy Name**: `Allow authenticated users to view files`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 3: Allow Delete
- **Policy Name**: `Allow authenticated users to delete files`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

### Policy 4: Allow Update
- **Policy Name**: `Allow authenticated users to update files`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

## Step 3: Test the Policies

After creating all 4 policies:

1. Go back to your application
2. Run the **"Storage Permission Test"**
3. It should now show ✅ for all operations

## Alternative: Use Database Storage

If you prefer not to deal with storage policies, you can use database storage instead:

1. Run `database/enable-database-storage.sql`
2. The application will automatically use database storage
3. Files will be stored as base64 in the `event_requests` table

This is actually more reliable for small files like PDFs!
