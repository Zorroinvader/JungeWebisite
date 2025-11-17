# Railway Service - Bereit! ✅

## Service Status

**Service URL**: `https://adequate-bravery-production-3a76.up.railway.app/`

**Status**: ✅ Läuft erfolgreich

**Response**:
```json
{"status":"ok","service":"fritz-worker-service","vpn_support":true}
```

## Verfügbare Endpoints

### 1. Root Endpoint (Health Check)
```
GET https://adequate-bravery-production-3a76.up.railway.app/
```
**Response**: `{"status":"ok","service":"fritz-worker-service","vpn_support":true}`

### 2. Health Endpoint (Detailed)
```
GET https://adequate-bravery-production-3a76.up.railway.app/health
```
**Response**: `{"status":"healthy","service":"fritz-worker-service","vpn_support":true,"wireguard_available":true}`

### 3. Check Devices Endpoint
```
POST https://adequate-bravery-production-3a76.up.railway.app/check-devices
Headers:
  Authorization: Bearer YOUR_API_KEY
```
**Response**: 
```json
{
  "success": true,
  "has_new": false,
  "new_devices": [],
  "message": "Außer den Baseline Geräten ist niemand im Club",
  "device_count": 0,
  "is_occupied": false
}
```

## Nächste Schritte

### 1. Supabase Secrets konfigurieren

Gehe zu Supabase Dashboard → Edge Functions → Secrets:

1. **FRITZ_SERVICE_URL**:
   ```
   https://adequate-bravery-production-3a76.up.railway.app
   ```

2. **FRITZ_SERVICE_API_KEY**:
   ```
   [dein-api-key-von-railway-variables]
   ```
   (Falls du `FRITZ_SERVICE_API_KEY` in Railway Variables gesetzt hast)

### 2. WG_CONFIG Variable setzen (falls noch nicht gesetzt)

In Railway → Variables:

1. **Name**: `WG_CONFIG`
2. **Value**: Die formatierte Config (siehe `docs/RAILWAY_WG_CONFIG_SETUP.md`)

Oder verwende das Helper-Script:
```powershell
.\scripts\format-wg-config-for-railway.ps1
```

### 3. Teste den Service

```bash
# Health Check
curl https://adequate-bravery-production-3a76.up.railway.app/health

# Check Devices (mit API Key)
curl -X POST https://adequate-bravery-production-3a76.up.railway.app/check-devices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### 4. Supabase Edge Function deployen

```bash
# Falls noch nicht deployed
supabase functions deploy check-devices
```

### 5. Teste Supabase Edge Function

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-devices \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Wichtige URLs

- **Railway Service**: `https://adequate-bravery-production-3a76.up.railway.app`
- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://app.supabase.com

## Troubleshooting

### Service antwortet nicht
- Prüfe Railway Logs: Deployments → Neuester Deployment → Logs
- Prüfe ob Service läuft: Railway → Service → Metrics

### Check Devices schlägt fehl
- Prüfe ob `WG_CONFIG` Variable gesetzt ist
- Prüfe Railway Logs für WireGuard Fehler
- Prüfe ob API Key korrekt ist

### Supabase kann Service nicht erreichen
- Prüfe `FRITZ_SERVICE_URL` in Supabase Secrets
- Prüfe ob URL korrekt ist (ohne trailing slash)
- Prüfe Supabase Edge Function Logs

## ✅ Checkliste

- [x] Railway Service läuft
- [x] Service URL gefunden: `https://adequate-bravery-production-3a76.up.railway.app`
- [ ] `FRITZ_SERVICE_URL` in Supabase Secrets gesetzt
- [ ] `FRITZ_SERVICE_API_KEY` in Supabase Secrets gesetzt
- [ ] `WG_CONFIG` in Railway Variables gesetzt
- [ ] Supabase Edge Function deployed
- [ ] Kompletter Flow getestet

## Fertig! 🎉

Der Railway Service ist bereit und läuft. Als Nächstes: Supabase konfigurieren!

