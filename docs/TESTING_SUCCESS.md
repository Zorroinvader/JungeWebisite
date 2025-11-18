# Testing: Edge Function erfolgreich verbunden

## Fortschritt: Edge Function kann EC2 Service erreichen

**Log-Nachricht in Edge Function:**
```
Calling Fritz service: http://34.204.153.169:8000/check-devices
```

**Bedeutung:** Die Edge Function kann jetzt den EC2 Service erreichen! ✅

## Nächste Schritte: Vollständigen Flow testen

### 1. Prüfe: Erfolgreiche Response?

**Supabase Dashboard:**
1. Gehe zu: **Edge Functions** → **check-devices** → **Logs**
2. Suche nach:
   - ✅ `Fritz service response received in Xms, status: 200` → **Erfolgreich!**
   - ❌ `Fritz service error: ...` → Fehler in EC2 Service
   - ❌ `Error calling Fritz service: ...` → Verbindungsfehler

**Erwartete Logs bei Erfolg:**
```
Calling Fritz service: http://34.204.153.169:8000/check-devices
Fritz service response received in Xms, status: 200
```

### 2. EC2 Service Logs prüfen

**SSH zu EC2:**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Live Logs ansehen
sudo journalctl -u fritz-service -f
```

**Was du sehen solltest:**
```
INFO: 127.0.0.1:xxxxx - "POST /check-devices HTTP/1.1" 200 OK
Connecting to FritzBox VPN via wireguard...
Using WireGuard config from WG_CONFIG environment variable
WireGuard VPN connection established...
Checking devices on FritzBox...
Found X devices
Disconnecting WireGuard VPN...
```

### 3. Edge Function Response prüfen

**Edge Function testen:**
```powershell
.\scripts\test-edge-function.ps1
```

**Erwartete Response:**
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

### 4. Vollständiger Test-Ablauf

**Terminal 1: EC2 Service Logs**
```bash
# SSH zu EC2
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Live Logs
sudo journalctl -u fritz-service -f
```

**Terminal 2: Edge Function testen**
```powershell
# Von Projekt-Root
.\scripts\test-edge-function.ps1
```

**Terminal 3: Supabase Dashboard**
- Edge Functions → check-devices → Logs
- Beobachte Logs während Test

### 5. Was du in allen Logs sehen solltest

#### Edge Function Logs (Supabase Dashboard):
```
Calling Fritz service: http://34.204.153.169:8000/check-devices
Fritz service response received in Xms, status: 200
```

#### EC2 Service Logs (Terminal 1):
```
INFO: 127.0.0.1:xxxxx - "POST /check-devices HTTP/1.1" 200 OK
Connecting to FritzBox VPN via wireguard...
WireGuard VPN connection established...
Checking devices on FritzBox...
Disconnecting WireGuard VPN...
```

#### Edge Function Response (Terminal 2):
```json
{
  "success": true,
  "has_new_devices": false,
  ...
}
```

## Troubleshooting

### Falls weiterhin Timeout

**Prüfe:**
1. **EC2 Service Response-Zeit:**
   ```powershell
   $ec2Ip = "34.204.153.169"
   Measure-Command { 
       Invoke-RestMethod -Uri "http://$ec2Ip:8000/check-devices" `
           -Method POST `
           -Headers @{"Content-Type"="application/json"} 
   }
   ```
   - Sollte < 58 Sekunden sein

2. **EC2 Logs:** Prüfe ob WireGuard Verbindung schnell genug aufbaut
3. **Edge Function Logs:** Prüfe Response-Zeit in Logs

### Falls EC2 Service Error

**EC2 Logs prüfen:**
```bash
# Letzte Fehler
sudo journalctl -u fritz-service -p err -n 50

# Alle Logs
sudo journalctl -u fritz-service -n 100
```

**Häufige Fehler:**
- WireGuard Verbindung fehlgeschlagen → VPN Config prüfen
- FritzBox nicht erreichbar → VPN Verbindung prüfen
- Permission denied → Service Permissions prüfen

### Falls Verbindung erfolgreich aber Timeout

**Möglichkeiten:**
1. **Service zu langsam:** > 58 Sekunden
   - Weitere Optimierungen nötig
   - Oder Supabase Pro Plan (300s Timeout)

2. **Netzwerk-Latenz:** Langsame Verbindung zwischen Supabase und EC2
   - Security Group prüfen
   - EC2 Region prüfen (sollte nahe bei Supabase sein)

## Erfolgs-Indikatoren

✅ **Edge Function Logs zeigen:** "Calling Fritz service"  
✅ **EC2 Logs zeigen:** HTTP Request empfangen  
✅ **Edge Function Response:** Erfolgreiche JSON Response  
✅ **Dauer:** < 58 Sekunden  
✅ **Kein Timeout-Fehler**

## Nächste Schritte nach erfolgreichem Test

1. **Cron Job prüfen:** Läuft alle 15 Minuten?
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-devices-every-15min';
   ```

2. **Database prüfen:** Status wird aktualisiert?
   ```sql
   SELECT * FROM club_status ORDER BY created_at DESC LIMIT 5;
   ```

3. **Website prüfen:** Zeigt `ClubStatusIndicator` korrekten Status?

## Zusammenfassung

**Aktueller Status:** ✅ Edge Function kann EC2 Service erreichen!

**Nächste Schritte:**
1. Prüfe ob vollständiger Request erfolgreich ist
2. Teste mit PowerShell Script
3. Beobachte EC2 Logs während Request
4. Prüfe Edge Function Response

**Wenn alles funktioniert:** System ist bereit für Produktion! 🎉

