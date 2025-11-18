# Persistent Timeout Fix

## Problem: Immer noch TimeoutError nach 58 Sekunden

**Fehlermeldung:**
```
Error calling Fritz service: TimeoutError: Signal timed out.
```

**Ursache:** EC2 Service braucht immer noch > 58 Sekunden, auch nach Optimierungen.

## Analyse

Der Timeout tritt auf, weil:
1. WireGuard Optimierung möglicherweise noch nicht auf EC2 deployed wurde
2. Erster Request baut immer noch neue Verbindung auf (~15-20 Sekunden)
3. Gesamt-Dauer: WireGuard + FritzBox Check + Netzwerk = > 58 Sekunden

## Lösung 1: Edge Function verbessert (Bereits implementiert)

**Änderungen:**
1. ✅ **Response Source Tracking:** Zeigt ob Response von EC2 kommt oder Fallback
2. ✅ **Bessere Logging:** Unterscheidet zwischen Timeout und anderen Fehlern
3. ✅ **Fallback nur wenn nötig:** Verwendet Database Status nur bei Fehler

**Response Format:**
```json
{
  "success": true,
  "has_new_devices": false,
  "is_occupied": false,
  "message": "Niemand ist gerade im Club",
  "device_count": 0,
  "devices": [],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "response_source": "ec2_service",  // oder "fallback"
  "is_fallback": false  // oder true
}
```

## Lösung 2: EC2 Service WireGuard Optimierung deployen (KRITISCH)

**Das Hauptproblem:** WireGuard Optimierung wurde im Code implementiert, aber noch nicht auf EC2 deployed!

**SSH zu EC2 und deployen:**
```bash
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Zum Projekt-Verzeichnis
cd /fritz-service

# Git pull (falls Code auf GitHub)
git pull origin dev

# Oder manuell: Datei aktualisieren
# Kopiere aktualisierten Code nach src/services/fritzWorker.py
# Die Datei sollte _is_wireguard_connected() Funktion haben

# Service neu starten
sudo systemctl restart fritz-service

# Status prüfen
sudo systemctl status fritz-service

# Logs prüfen
sudo journalctl -u fritz-service -f
```

**Erwartete Logs beim zweiten Request:**
```
WireGuard VPN already connected, reusing existing connection.
Using existing VPN connection, minimal wait...
Keeping existing VPN connection active (reused connection).
```

## Lösung 3: Timeout erhöhen (Wenn möglich)

**Option A: Supabase Pro Plan**
- Pro Plan erlaubt **300 Sekunden** (5 Minuten) Timeout
- Upgrade: https://supabase.com/pricing
- Dann Timeout auf 290 Sekunden erhöhen

**Option B: EC2 Service Performance weiter optimieren**
- WireGuard permanent verbunden lassen (beim Service-Start)
- FritzBox API Aufrufe parallelisieren
- Caching implementieren

## Lösung 4: EC2 Service direkt testen (Performance prüfen)

**Von deinem PC:**
```powershell
$ec2Ip = "34.204.153.169"

# Zeit messen
Measure-Command { 
    Invoke-RestMethod -Uri "http://$ec2Ip:8000/check-devices" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} 
}
```

**SSH zu EC2 und direkt testen:**
```bash
# Service direkt testen
time curl -X POST http://localhost:8000/check-devices \
  -H "Content-Type: application/json"

# Zweites Mal (sollte schneller sein mit WireGuard Wiederverwendung)
time curl -X POST http://localhost:8000/check-devices \
  -H "Content-Type: application/json"
```

**Erwartete Dauer:**
- **Erster Request:** ~15-25 Sekunden (WireGuard Aufbau)
- **Zweiter Request:** ~5-10 Sekunden (WireGuard wiederverwendet)

## Lösung 5: WireGuard permanent verbunden lassen

Falls Wiederverwendung nicht ausreicht, WireGuard beim Service-Start verbinden:

**Service Start Script ändern (`/fritz-service/start.sh`):**
```bash
#!/bin/bash
# Start script for VPS - WireGuard persistent connection

# Connect WireGuard once at startup (if not already connected)
if ! ping -c 1 -W 2 192.168.178.1 > /dev/null 2>&1; then
    echo "WireGuard not connected, connecting..."
    wg-quick up /path/to/wg_config.conf || true
    sleep 2
fi

# Get PORT from environment or use default 8000
PORT=${PORT:-8000}

# Start uvicorn with the port
exec uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port "$PORT"
```

**Vorteil:**
- WireGuard ist immer verbunden
- Keine Verbindungszeit mehr nötig (~15 Sekunden Ersparnis)
- Jeder Check ist sofort (~5-10 Sekunden)

## Prüfen: Welche Response wird zurückgegeben?

**Nach Edge Function Test:**
```powershell
.\scripts\test-edge-function.ps1
```

**Prüfe Response:**
- `response_source: "ec2_service"` → ✅ Echte Response von EC2
- `response_source: "fallback"` → ⚠️ Fallback verwendet (EC2 nicht erreichbar oder Timeout)

**Wenn `is_fallback: true`:**
- EC2 Service antwortet nicht innerhalb 58 Sekunden
- Oder EC2 Service ist nicht erreichbar
- Lösung: EC2 Service optimieren oder Timeout erhöhen

## Checklist

- [ ] **EC2 Service WireGuard Optimierung deployed?**
  ```bash
  # Prüfe ob _is_wireguard_connected() Funktion existiert
  grep -n "_is_wireguard_connected" /fritz-service/src/services/fritzWorker.py
  ```

- [ ] **EC2 Service Performance getestet?**
  ```bash
  time curl -X POST http://localhost:8000/check-devices -H "Content-Type: application/json"
  ```

- [ ] **Edge Function Response Source prüfen?**
  ```powershell
  .\scripts\test-edge-function.ps1
  # Prüfe response_source und is_fallback Felder
  ```

- [ ] **Supabase Logs zeigen Timeout?**
  - Falls ja: EC2 Service zu langsam
  - Lösung: WireGuard Optimierung deployen oder permanent verbinden

## Zusammenfassung

**Problem:** TimeoutError nach 58 Sekunden

**Lösungen (Priorität):**
1. ✅ **Edge Function verbessert** - Zeigt Response Source und besseres Logging
2. 🔴 **EC2 Service WireGuard Optimierung deployen** (KRITISCH!)
3. 🔴 **EC2 Service Performance testen** (sollte < 58 Sekunden sein)
4. ⚠️ **Supabase Pro Plan** (falls weiterhin Timeout)
5. ⚠️ **WireGuard permanent verbinden** (falls nötig)

**Next Steps:**
1. SSH zu EC2 und WireGuard Optimierung deployen
2. Service neu starten
3. Performance testen (zweimal nacheinander)
4. Edge Function testen und `response_source` prüfen

**Wenn `response_source: "ec2_service"`:** ✅ System funktioniert korrekt!  
**Wenn `response_source: "fallback"`:** ⚠️ Timeout Problem - weiter optimieren

