# EC2 Service Debugging: No Logs Appearing

## Problem: Edge Function responds but no EC2 logs

**Symptom:**
- Edge Function test returns success
- But no logs appear in EC2 (`sudo journalctl -u fritz-service -f`)

**Ursache:** Edge Function kann die EC2 Service nicht erreichen oder ruft sie nicht auf.

## Debugging Steps

### 1. Prüfe: Edge Function ruft EC2 Service auf?

**In Supabase Dashboard:**
1. **Edge Functions** → **check-devices** → **Logs**
2. Suche nach:
   - `FRITZ_SERVICE_URL not set` → Environment Variable fehlt
   - `Error calling Fritz service` → Verbindungsfehler
   - `Fritz service error` → EC2 Service Fehler

**Was du sehen solltest in Edge Function Logs:**
```
Calling Fritz service: http://EC2_IP:8000/check-devices
Fritz service response: {...}
```

**Falls du siehst:**
```
FRITZ_SERVICE_URL not set
```
→ **Problem:** Environment Variable fehlt in Supabase

### 2. Prüfe: FRITZ_SERVICE_URL in Supabase konfiguriert?

**Supabase Dashboard:**
1. Gehe zu: https://supabase.com/dashboard
2. **Project Settings** → **Edge Functions**
3. Suche nach **Environment Variables:**
   - `FRITZ_SERVICE_URL` → Muss gesetzt sein (z.B. `http://EC2_IP:8000`)
   - `FRITZ_SERVICE_API_KEY` → Optional (falls gesetzt, muss mit EC2 Service übereinstimmen)

**Falls nicht gesetzt:**
1. **Add new secret** oder **Environment Variable**
2. **Name:** `FRITZ_SERVICE_URL`
3. **Value:** `http://EC2_IP:8000` (ersetze EC2_IP mit deiner EC2 Public IP)
4. **Save**

**EC2 IP finden:**
```powershell
# AWS Console
EC2 -> Instances -> Deine Instance -> Public IPv4 address
# Oder Elastic IP, falls verwendet
```

### 3. Prüfe: EC2 Service läuft?

**SSH zu EC2:**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Service Status prüfen
sudo systemctl status fritz-service

# Falls nicht läuft:
sudo systemctl start fritz-service
sudo systemctl enable fritz-service
```

### 4. Prüfe: EC2 Service ist von außen erreichbar?

**Von deinem PC testen:**
```powershell
# Test Health Endpoint
curl http://EC2_IP:8000/health

# Test Check-Devices Endpoint
curl -X POST http://EC2_IP:8000/check-devices `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Falls Fehler:**
- `Connection timed out` → Security Group blockiert Port 8000
- `Connection refused` → Service läuft nicht oder falscher Port

### 5. Prüfe: Security Group erlaubt Port 8000?

**AWS Console:**
1. **EC2** → **Instances** → Deine Instance
2. **Security** Tab → **Security Group Name** klicken
3. **Inbound rules** → **Edit inbound rules**
4. Prüfe ob Port 8000 Regel existiert:
   - ✅ **Existiert:** OK
   - ❌ **Existiert nicht:** Hinzufügen (siehe unten)

**Port 8000 Rule hinzufügen:**
1. **Add rule**
2. **Type:** `Custom TCP`
3. **Port range:** `8000`
4. **Source:** 
   - `0.0.0.0/0` (für Tests, wenn Supabase darauf zugreifen soll)
   - Oder spezifische Supabase IPs (schwierig zu finden)
5. **Description:** `FritzBox Service API`
6. **Save rules**

**Hinweis:** Für Supabase Edge Functions musst du normalerweise `0.0.0.0/0` verwenden, da Supabase von verschiedenen IPs kommt.

### 6. Prüfe: FRITZ_SERVICE_URL Format korrekt?

**Falsch:**
```
FRITZ_SERVICE_URL = https://ec2-34-204-153-169.compute-1.amazonaws.com:8000
FRITZ_SERVICE_URL = http://ec2-34-204-153-169.compute-1.amazonaws.com:8000/check-devices
```

**Richtig:**
```
FRITZ_SERVICE_URL = http://34.204.153.169:8000
# Oder mit Elastic IP:
FRITZ_SERVICE_URL = http://YOUR_ELASTIC_IP:8000
```

**Wichtig:**
- Verwende **Public IP** (nicht Hostname, falls DNS nicht konfiguriert)
- Verwende `http://` (nicht `https://`, es sei denn SSL konfiguriert)
- **Kein** trailing slash oder Pfad (`/check-devices` wird automatisch angehängt)

### 7. Prüfe: API Key korrekt? (Falls gesetzt)

**In Supabase:**
- `FRITZ_SERVICE_API_KEY` → Wert prüfen

**In EC2 Service:**
```bash
# Auf EC2, .env Datei prüfen
cat /fritz-service/.env

# Prüfe FRITZ_SERVICE_API_KEY Wert
# Muss mit Supabase übereinstimmen
```

**Falls API Key gesetzt:**
- **Supabase:** `FRITZ_SERVICE_API_KEY = YOUR_KEY`
- **EC2 .env:** `FRITZ_SERVICE_API_KEY = YOUR_KEY` (gleicher Wert!)

### 8. Test: EC2 Service direkt aufrufen

**Von deinem PC:**
```powershell
# EC2 IP ersetzen
$ec2Ip = "34.204.153.169"
$apiKey = "YOUR_API_KEY"  # Falls gesetzt, sonst leer

# Test Health
Invoke-RestMethod -Uri "http://$ec2Ip:8000/health"

# Test Check-Devices
$headers = @{
    "Content-Type" = "application/json"
}
if ($apiKey) {
    $headers["Authorization"] = "Bearer $apiKey"
}

Invoke-RestMethod -Uri "http://$ec2Ip:8000/check-devices" `
    -Method POST `
    -Headers $headers
```

**Falls das funktioniert:**
- EC2 Service läuft und ist erreichbar
- Problem liegt bei Edge Function → FRITZ_SERVICE_URL prüfen

**Falls das nicht funktioniert:**
- EC2 Service Problem → Service Logs prüfen
- Security Group Problem → Port 8000 öffnen

### 9. Edge Function Logs detailliert prüfen

**Supabase Dashboard:**
1. **Edge Functions** → **check-devices** → **Logs**
2. Prüfe **letzte Logs** nach:
   - HTTP-Requests zu EC2
   - Fehlermeldungen
   - Timeout-Fehler

**Was du sehen solltest:**
```
Calling Fritz service: http://EC2_IP:8000/check-devices
Fritz service response: { success: true, ... }
```

**Falls du siehst:**
```
Error calling Fritz service: fetch failed
Timeout
Connection refused
```
→ **Problem:** EC2 Service nicht erreichbar

### 10. Test: Edge Function Code prüfen

**Edge Function sollte folgendes tun:**
1. `FRITZ_SERVICE_URL` aus Environment lesen
2. HTTP POST zu `${FRITZ_SERVICE_URL}/check-devices` senden
3. Response parsen und Datenbank updaten

**Prüfe in Supabase:**
- Edge Function Code sollte `FRITZ_SERVICE_URL` verwenden
- Falls leer, wird EC2 Service nicht aufgerufen

## Checklist: No Logs Appearing

- [ ] **EC2 Service läuft** (`sudo systemctl status fritz-service`)
- [ ] **EC2 Service erreichbar** (`curl http://EC2_IP:8000/health`)
- [ ] **Security Group:** Port 8000 offen (`0.0.0.0/0` für Tests)
- [ ] **FRITZ_SERVICE_URL gesetzt** in Supabase (Format: `http://EC2_IP:8000`)
- [ ] **FRITZ_SERVICE_URL korrekt** (Public IP, kein trailing slash)
- [ ] **API Key übereinstimmend** (falls gesetzt, in Supabase und EC2)
- [ ] **Edge Function Logs prüfen** (für Fehlermeldungen)
- [ ] **EC2 Logs prüfen** (`sudo journalctl -u fritz-service -f`)

## Quick Fix: Environment Variable setzen

**Supabase Dashboard:**
1. **Project Settings** → **Edge Functions**
2. **Environment Variables** oder **Secrets**
3. **Add new:**
   - **Name:** `FRITZ_SERVICE_URL`
   - **Value:** `http://YOUR_EC2_PUBLIC_IP:8000`
4. **Save**
5. **Edge Function neu deployen** (falls nötig)

**EC2 Public IP finden:**
```powershell
# AWS Console
EC2 -> Instances -> Deine Instance -> Public IPv4 address
# Kopiere die IP-Adresse
```

## Nach Fix testen

**Terminal 1: EC2 Logs**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
sudo journalctl -u fritz-service -f
```

**Terminal 2: Edge Function testen**
```powershell
.\scripts\test-edge-function.ps1
```

**Jetzt solltest du sehen:**
- ✅ Edge Function Response (Terminal 2)
- ✅ EC2 Service Logs (Terminal 1)

## Zusammenfassung

**Meistens liegt es an:**
1. ❌ **FRITZ_SERVICE_URL nicht gesetzt** in Supabase
2. ❌ **Security Group blockiert Port 8000**
3. ❌ **Falsche IP-Adresse** in FRITZ_SERVICE_URL
4. ❌ **EC2 Service läuft nicht**

**Schnellster Fix:**
1. ✅ EC2 Service Status prüfen (`sudo systemctl status fritz-service`)
2. ✅ FRITZ_SERVICE_URL in Supabase setzen (`http://EC2_IP:8000`)
3. ✅ Security Group Port 8000 öffnen (`0.0.0.0/0`)
4. ✅ Edge Function erneut testen

