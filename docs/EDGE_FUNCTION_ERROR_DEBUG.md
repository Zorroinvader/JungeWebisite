# Edge Function Error Debugging

## Problem: Error Log in Edge Function

**Symptom:** Error-Level Log in Supabase Edge Function Logs

**Nächste Schritte:** Vollständige Fehlermeldung prüfen und debuggen

## 1. Vollständige Fehlermeldung anzeigen

### Supabase Dashboard

1. Gehe zu: https://supabase.com/dashboard
2. **Edge Functions** → **check-devices** → **Logs** Tab
3. Suche nach **"error"** Level Logs
4. Klicke auf den Log-Eintrag, um Details zu sehen
5. Prüfe das **"event_message"** Feld für die vollständige Fehlermeldung

### Wichtige Felder in Logs

- **event_message:** Die eigentliche Fehlermeldung
- **level:** "error", "warn", "info"
- **timestamp:** Wann der Fehler aufgetreten ist
- **execution_id:** Eindeutige ID für diesen Request

## 2. Häufige Fehler und Lösungen

### Fehler 1: TimeoutError

**Meldung:**
```
Error calling Fritz service: TimeoutError: Signal timed out.
```

**Ursache:** EC2 Service antwortet nicht innerhalb 58 Sekunden

**Lösung:**
1. Prüfe EC2 Service Status:
   ```bash
   ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
   sudo systemctl status fritz-service
   ```

2. Prüfe EC2 Service Logs:
   ```bash
   sudo journalctl -u fritz-service -n 100
   ```

3. Teste EC2 Service direkt:
   ```powershell
   $ec2Ip = "34.204.153.169"
   Invoke-RestMethod -Uri "http://$ec2Ip:8000/health"
   ```

4. Prüfe Response-Zeit:
   ```powershell
   Measure-Command { 
       Invoke-RestMethod -Uri "http://$ec2Ip:8000/check-devices" `
           -Method POST `
           -Headers @{"Content-Type"="application/json"} 
   }
   ```

### Fehler 2: Connection Refused / Connection Timeout

**Meldung:**
```
Error calling Fritz service: TypeError: Failed to fetch
```
oder
```
Error calling Fritz service: NetworkError
```

**Ursache:** EC2 Service ist nicht erreichbar

**Lösung:**
1. **EC2 Service läuft?**
   ```bash
   sudo systemctl status fritz-service
   sudo systemctl start fritz-service  # Falls gestoppt
   ```

2. **Security Group prüfen:**
   - AWS Console → EC2 → Instances → Security Group
   - Inbound Rules → Port 8000 muss offen sein (0.0.0.0/0)

3. **EC2 Service erreichbar?**
   ```powershell
   curl http://34.204.153.169:8000/health
   ```

4. **FRITZ_SERVICE_URL korrekt?**
   - Supabase Dashboard → Project Settings → Edge Functions
   - `FRITZ_SERVICE_URL` = `http://34.204.153.169:8000` (kein trailing slash!)

### Fehler 3: Invalid JSON Response

**Meldung:**
```
Error calling Fritz service: SyntaxError: Unexpected token in JSON
```
oder
```
Fritz service error: 500
```

**Ursache:** EC2 Service gibt ungültige Antwort zurück

**Lösung:**
1. **EC2 Service Logs prüfen:**
   ```bash
   sudo journalctl -u fritz-service -n 50
   ```

2. **EC2 Service direkt testen:**
   ```powershell
   Invoke-RestMethod -Uri "http://34.204.153.169:8000/check-devices" `
       -Method POST `
       -Headers @{"Content-Type"="application/json"}
   ```

3. **Prüfe ob Service Fehler wirft:**
   - FritzBox Verbindung Problem?
   - WireGuard VPN Problem?
   - Python Exception?

### Fehler 4: Unauthorized (401)

**Meldung:**
```
Fritz service error: 401 Unauthorized
```

**Ursache:** API Key falsch oder fehlt

**Lösung:**
1. **FRITZ_SERVICE_API_KEY prüfen:**
   - Supabase Dashboard → Project Settings → Edge Functions
   - `FRITZ_SERVICE_API_KEY` muss gesetzt sein (falls Service API Key benötigt)

2. **EC2 Service .env prüfen:**
   ```bash
   cat /fritz-service/.env
   # FRITZ_SERVICE_API_KEY muss mit Supabase übereinstimmen
   ```

3. **API Key entfernen** (falls Service ohne API Key läuft):
   - In Supabase: `FRITZ_SERVICE_API_KEY` löschen oder leer lassen
   - In EC2: `.env` Datei prüfen

### Fehler 5: FRITZ_SERVICE_URL not set

**Meldung:**
```
FRITZ_SERVICE_URL not set
```

**Ursache:** Environment Variable fehlt

**Lösung:**
1. **Supabase Dashboard:**
   - Project Settings → Edge Functions → Environment Variables
   - Add: `FRITZ_SERVICE_URL` = `http://34.204.153.169:8000`

2. **Edge Function neu deployen** (falls nötig)

## 3. Debugging-Workflow

### Schritt 1: Vollständige Fehlermeldung sammeln

**Supabase Dashboard:**
```
Edge Functions → check-devices → Logs
→ Suche nach "error" Level
→ Klicke auf Log-Eintrag
→ Kopiere vollständige "event_message"
```

### Schritt 2: EC2 Service Status prüfen

```bash
# SSH zu EC2
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Service Status
sudo systemctl status fritz-service

# Letzte Logs
sudo journalctl -u fritz-service -n 50

# Live Logs
sudo journalctl -u fritz-service -f
```

### Schritt 3: EC2 Service direkt testen

```powershell
# Health Check
Invoke-RestMethod -Uri "http://34.204.153.169:8000/health"

# Check Devices (wenn Health OK)
Invoke-RestMethod -Uri "http://34.204.153.169:8000/check-devices" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"}
```

### Schritt 4: Edge Function Logs mit EC2 Logs vergleichen

**Timeline erstellen:**
1. Edge Function sendet Request (Timestamp in Supabase Logs)
2. EC2 Service empfängt Request (Timestamp in EC2 Logs)
3. EC2 Service verarbeitet (Dauer in EC2 Logs)
4. EC2 Service sendet Response (Timestamp in EC2 Logs)
5. Edge Function empfängt Response (Timestamp in Supabase Logs)

**Prüfe:**
- Wird Request in EC2 empfangen?
- Wie lange braucht EC2 Service?
- Sendet EC2 Service Response?
- Empfängt Edge Function Response?

## 4. Häufige Timeout-Ursachen

### Ursache 1: WireGuard Verbindung zu langsam

**Prüfe:**
```bash
# Auf EC2, WireGuard Verbindungszeit messen
time wg-quick up /path/to/wg_config.conf
```

**Lösung:**
- Sleep-Zeiten bereits reduziert (3s → 1.5s, 5s → 2s)
- Falls weiterhin langsam: Netzwerk-Problem oder WireGuard Config Problem

### Ursache 2: FritzBox API langsam

**Prüfe:**
```bash
# EC2 Logs zeigen FritzBox API Aufrufe
sudo journalctl -u fritz-service | grep -i "fritzbox\|hosts"
```

**Lösung:**
- Timeout bereits reduziert (30s → 10s)
- Falls weiterhin langsam: FritzBox über VPN Problem

### Ursache 3: Netzwerk-Latenz

**Prüfe:**
```powershell
# Ping EC2 von deinem PC
ping 34.204.153.169

# HTTP Request Zeit
Measure-Command { 
    Invoke-RestMethod -Uri "http://34.204.153.169:8000/health"
}
```

**Lösung:**
- Security Group prüfen
- EC2 Region prüfen (sollte nahe bei Supabase sein)

## 5. Vollständige Fehlermeldung teilen

Für besseres Debugging, teile bitte:

1. **Vollständige "event_message"** aus Supabase Logs
2. **EC2 Service Logs** (letzte 50 Zeilen)
3. **EC2 Service Status:** `sudo systemctl status fritz-service`
4. **Direct Test Result:** EC2 Service direkt testen

## Zusammenfassung

**Wenn du einen Error siehst:**
1. ✅ Vollständige "event_message" aus Supabase Logs kopieren
2. ✅ EC2 Service Status prüfen (`systemctl status`)
3. ✅ EC2 Service Logs prüfen (`journalctl -n 50`)
4. ✅ EC2 Service direkt testen (von deinem PC)
5. ✅ Fehlertyp identifizieren (siehe oben)
6. ✅ Lösung anwenden (siehe oben)

**Am wichtigsten:** Teile die vollständige **"event_message"** aus den Supabase Logs! 🔍

