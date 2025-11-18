# Testing check-devices Edge Function with Live EC2 Logs

## Overview

This guide shows how to test the `check-devices` Edge Function while monitoring the EC2 service logs in real-time.

## Prerequisites

1. **Supabase URL and Anon Key** (from `.env` or environment)
2. **SSH access to EC2** (for live logs)
3. **Edge Function deployed** in Supabase

## Method 1: Test via Supabase Dashboard (Visual)

### Step 1: Open Edge Functions in Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** → **check-devices**

### Step 2: Open EC2 Live Logs (In Separate Terminal)

```bash
# SSH to EC2 and start live logs
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# On EC2, start live logs
sudo journalctl -u fritz-service -f
```

### Step 3: Test Edge Function in Dashboard

1. In **Supabase Dashboard** → **Edge Functions** → **check-devices**
2. Click **"Invoke"** or **"Test"**
3. Use these settings:
   - **Method:** `POST`
   - **Headers:**
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_ANON_KEY"
     }
     ```
   - **Body:**
     ```json
     {
       "name": "Functions"
     }
     ```
4. Click **"Send request"**

### Step 4: Watch EC2 Logs

While the Edge Function executes, watch the EC2 logs:
- You'll see the HTTP request arrive
- WireGuard VPN connection
- FritzBox device check
- Response sent back

## Method 2: Test via PowerShell Script

### Step 1: Start EC2 Live Logs (Terminal 1)

```bash
# SSH to EC2
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Start live logs
sudo journalctl -u fritz-service -f
```

### Step 2: Run Test Script (Terminal 2 - PowerShell)

```powershell
# From project root
.\scripts\test-edge-function.ps1
```

**Or manually:**

```powershell
# Set your Supabase credentials
$supabaseUrl = "https://your-project.supabase.co"
$supabaseAnonKey = "your-anon-key"

# Edge Function endpoint
$edgeFunctionUrl = "$supabaseUrl/functions/v1/check-devices"

# Send request
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $supabaseAnonKey"
}

$body = @{
    name = "Functions"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $edgeFunctionUrl -Method POST -Headers $headers -Body $body

# Display response
$response | ConvertTo-Json -Depth 10
```

## Method 3: Test via cURL (From Terminal)

### Step 1: Start EC2 Live Logs (Terminal 1)

```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
sudo journalctl -u fritz-service -f
```

### Step 2: Test Edge Function (Terminal 2)

```bash
# Replace with your Supabase URL and Anon Key
curl -X POST \
  "https://your-project.supabase.co/functions/v1/check-devices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"name": "Functions"}'
```

## Method 4: Test via Browser Console

### Step 1: Start EC2 Live Logs

```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
sudo journalctl -u fritz-service -f
```

### Step 2: Test in Browser Console

Open browser console (F12) and run:

```javascript
// Replace with your Supabase URL and Anon Key
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

fetch(`${supabaseUrl}/functions/v1/check-devices`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({ name: 'Functions' })
})
  .then(res => res.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err))
```

## Expected Flow

When you test the Edge Function, you should see:

### 1. In Supabase Dashboard/Response:

```json
{
  "success": true,
  "has_new_devices": false,
  "is_occupied": false,
  "message": "Außer den Baseline Geräten ist niemand im Club",
  "device_count": 0,
  "devices": [],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. In EC2 Logs (Live):

```
INFO: 127.0.0.1:xxxxx - "POST /check-devices HTTP/1.1" 200 OK
Connecting to FritzBox VPN via wireguard...
Using WireGuard config from WG_CONFIG environment variable
WireGuard VPN connection established to xxx.xxx.xxx.xxx:xxxx
Checking devices on FritzBox...
Found X devices
Disconnecting WireGuard VPN...
WireGuard VPN disconnected
```

## Troubleshooting

### Edge Function Returns Error

**Check:**
1. **Environment Variables in Supabase:**
   - `FRITZ_SERVICE_URL` (should be `http://EC2_IP:8000`)
   - `FRITZ_SERVICE_API_KEY` (optional, if set in service)

2. **EC2 Service Status:**
   ```bash
   ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
   sudo systemctl status fritz-service
   ```

3. **EC2 Service Reachable:**
   ```bash
   # From your PC
   curl http://EC2_IP:8000/health
   ```

### No Logs in EC2

**Check:**
1. Service is running:
   ```bash
   sudo systemctl status fritz-service
   ```

2. Logs are available:
   ```bash
   sudo journalctl -u fritz-service -n 50
   ```

3. Service is receiving requests:
   ```bash
   # Check if port 8000 is listening
   sudo netstat -tlnp | grep 8000
   ```

### Connection Timeout

**Check:**
1. **EC2 Security Group** allows inbound on port 8000 from Supabase IPs
2. **EC2 Service** is running and healthy
3. **FRITZ_SERVICE_URL** in Supabase is correct (include `http://`)

### Edge Function Logs

To see Edge Function logs:

1. **Supabase Dashboard** → **Edge Functions** → **check-devices**
2. Click **"Logs"** tab
3. You'll see console.log output from the function

## Monitoring Both Sides

### Terminal Setup:

**Terminal 1: EC2 Service Logs**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
sudo journalctl -u fritz-service -f
```

**Terminal 2: Test Edge Function**
```powershell
.\scripts\test-edge-function.ps1
```

**Terminal 3: Supabase Logs (Optional)**
- Open Supabase Dashboard → Edge Functions → Logs

## Quick Test Commands

### Test EC2 Service Directly

```bash
# Test EC2 service (bypasses Edge Function)
curl -X POST http://EC2_IP:8000/check-devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Test Edge Function

```bash
curl -X POST \
  "https://your-project.supabase.co/functions/v1/check-devices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"name": "Functions"}'
```

## Success Indicators

✅ **Edge Function responds** with JSON  
✅ **EC2 logs show** incoming request  
✅ **WireGuard connects** (visible in logs)  
✅ **FritzBox check** completes (visible in logs)  
✅ **Database updated** (check `club_status` table)  
✅ **Response sent** back to Edge Function  

## Next Steps

After successful test:
1. **Verify database** update:
   ```sql
   SELECT * FROM club_status ORDER BY created_at DESC LIMIT 1;
   ```

2. **Check website** shows updated status (if using `ClubStatusIndicator`)

3. **Verify cron job** is scheduled (every 15 minutes):
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-devices-every-15min';
   ```

## Summary

1. ✅ **Start EC2 logs**: `sudo journalctl -u fritz-service -f`
2. ✅ **Test Edge Function**: Use PowerShell script or Supabase Dashboard
3. ✅ **Watch EC2 logs**: See VPN connection and device check
4. ✅ **Verify response**: Check Edge Function response
5. ✅ **Check database**: Verify status was updated

**Perfect for debugging and monitoring the entire flow!** 🔍

