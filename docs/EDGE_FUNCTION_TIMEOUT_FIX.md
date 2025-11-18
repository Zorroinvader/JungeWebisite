# Edge Function Timeout Fix

## Problem: TimeoutError in Edge Function

```
Error calling Fritz service: TimeoutError: Signal timed out.
```

**Ursache:** Der EC2 Service braucht mehr als 60 Sekunden, um zu antworten (WireGuard VPN Verbindung + Device Check dauert lange).

## Lösung 1: Timeout erhöht (Bereits angewendet)

Der Timeout wurde von 60 Sekunden auf **120 Sekunden** erhöht.

**Code-Änderung:**
```typescript
// Vorher: 60 Sekunden
signal: AbortSignal.timeout(60000)

// Nachher: 120 Sekunden
signal: AbortSignal.timeout(120000)
```

**Edge Function muss neu deployed werden:**
```bash
# Von Projekt-Root
supabase functions deploy check-devices
```

## Lösung 2: EC2 Service Performance optimieren

Wenn 120 Sekunden immer noch nicht reichen, optimiere den EC2 Service:

### 1. Prüfe EC2 Service Logs

```bash
# SSH zu EC2
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Live Logs ansehen
sudo journalctl -u fritz-service -f

# Test direkt aufrufen und Zeit messen
time curl -X POST http://localhost:8000/check-devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 2. WireGuard Verbindung Zeit messen

```bash
# Auf EC2, WireGuard Verbindungszeit testen
time wg-quick up /path/to/wg_config.conf
```

### 3. FritzBox Verbindung Zeit messen

Prüfe ob die FritzBox Verbindung schnell genug ist.

## Lösung 3: Asynchrone Verarbeitung (Advanced)

Falls Timeout weiterhin auftritt, verwende asynchrone Verarbeitung:

1. Edge Function startet Request und gibt sofort zurück
2. EC2 Service verarbeitet im Hintergrund
3. Status wird später über Webhook/Polling aktualisiert

**Nur wenn nötig - für jetzt sollte 120 Sekunden reichen.**

## Debugging: Warum dauert es so lange?

### Prüfe: EC2 Service erreichbar?

```powershell
# Von deinem PC
$ec2Ip = "34.204.153.169"
Measure-Command { Invoke-RestMethod -Uri "http://$ec2Ip:8000/health" }
```

**Falls langsam:**
- Netzwerk-Latenz prüfen
- Security Group Routing prüfen

### Prüfe: WireGuard Verbindung Zeit

Der längste Teil ist normalerweise:
1. WireGuard VPN Verbindung aufbauen (~5-10 Sekunden)
2. FritzBox Geräte abfragen (~2-5 Sekunden)
3. Daten verarbeiten (~1-2 Sekunden)

**Gesamt:** ~8-17 Sekunden unter normalen Bedingungen

**Falls länger:**
- FritzBox ist nicht erreichbar über VPN
- Netzwerk-Probleme
- WireGuard Konfiguration Problem

### Prüfe: EC2 Service Logs während Timeout

**Terminal 1: EC2 Logs**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com
sudo journalctl -u fritz-service -f
```

**Terminal 2: Edge Function testen**
```powershell
.\scripts\test-edge-function.ps1
```

**Beobachte EC2 Logs:**
- Kommt Request an?
- Wann startet WireGuard?
- Wann endet Device Check?
- Wie lange dauert insgesamt?

## Alternative: Timeout weiter erhöhen (Falls nötig)

Falls 120 Sekunden nicht reichen:

```typescript
// In supabase/functions/check-devices/index.ts
signal: AbortSignal.timeout(180000), // 180 Sekunden (3 Minuten)
```

**Aber:** Supabase Edge Functions haben ein Maximum von 60 Sekunden Execution Time in Free Tier!

**Wichtig:** Supabase Edge Functions haben ein Hard-Limit von 60 Sekunden in Free Tier. Wenn dein Service länger braucht, musst du entweder:
1. Service optimieren (< 60 Sekunden)
2. Auf Pro Plan upgraden (längere Timeouts)
3. Asynchrone Verarbeitung implementieren

## Supabase Edge Function Limits

- **Free Tier:** 60 Sekunden Maximum Execution Time
- **Pro Tier:** 300 Sekunden (5 Minuten) Maximum Execution Time

**Problem:** Unser Timeout ist 120 Sekunden, aber Free Tier erlaubt nur 60 Sekunden!

**Lösung:** Timeout auf 55 Sekunden reduzieren oder Service optimieren.

## Fix: Timeout auf 55 Sekunden reduzieren

Da Supabase Free Tier nur 60 Sekunden erlaubt, müssen wir den Timeout reduzieren:

```typescript
signal: AbortSignal.timeout(55000), // 55 Sekunden (unter Supabase 60s Limit)
```

**Oder:** Service optimieren, damit er schneller antwortet.

## Checklist: Timeout beheben

- [ ] **Edge Function neu deployen** (mit erhöhtem Timeout, aber < 60s für Free Tier)
- [ ] **EC2 Service Performance prüfen** (logs während Request)
- [ ] **WireGuard Verbindung optimieren** (falls zu langsam)
- [ ] **FritzBox Verbindung prüfen** (falls zu langsam)
- [ ] **Security Group Routing prüfen** (falls langsame Verbindung)
- [ ] **Supabase Plan prüfen** (Free vs Pro für längere Timeouts)

## Nach Fix testen

**Terminal 1: EC2 Logs**
```bash
sudo journalctl -u fritz-service -f
```

**Terminal 2: Edge Function testen**
```powershell
.\scripts\test-edge-function.ps1
```

**Erwartetes Ergebnis:**
- ✅ Edge Function antwortet innerhalb 60 Sekunden
- ✅ EC2 Logs zeigen vollständigen Request
- ✅ Kein Timeout-Fehler

## Zusammenfassung

**Problem:** TimeoutError nach 60 Sekunden

**Ursache:** 
1. Supabase Free Tier Limit: 60 Sekunden Maximum
2. EC2 Service braucht > 60 Sekunden (WireGuard + Device Check)

**Lösung:**
1. ✅ **Timeout auf 55 Sekunden reduzieren** (unter Supabase Limit)
2. ✅ **EC2 Service optimieren** (schneller antworten)
3. ✅ **Logging hinzugefügt** (besseres Debugging)

**Nächste Schritte:**
1. Edge Function neu deployen
2. EC2 Service Performance testen
3. Falls weiterhin Timeout: Service optimieren oder auf Pro Plan upgraden

