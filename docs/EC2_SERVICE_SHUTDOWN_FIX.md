# EC2 Service Shutdown Problem Fix

## Problem: Service fährt nach Request herunter

**Symptom:**
- Service verarbeitet Request erfolgreich (200 OK)
- Aber dann stoppt er nach ~1 Minute
- Logs zeigen: "Stopping fritz-service.service"

**Ursache:** Service läuft nicht als permanenter systemd Service oder crasht nach Request.

## Analyse der Logs

```
23:26:02: WireGuard VPN connection established
23:26:02: POST /check-devices HTTP/1.1 200 OK  ← Request erfolgreich!
23:27:12: Stopping fritz-service.service       ← Nach ~1 Minute stoppt Service!
```

**Problem:** Service sollte **permanent laufen**, nicht nach jedem Request stoppen.

## Lösung: Service als systemd Service richtig einrichten

### 1. Prüfe: Service läuft als systemd Service?

```bash
# SSH zu EC2
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Service Status prüfen
sudo systemctl status fritz-service

# Prüfe ob service enabled ist (startet beim Boot)
sudo systemctl is-enabled fritz-service

# Prüfe ob service aktiv ist
sudo systemctl is-active fritz-service
```

### 2. Service-Datei prüfen/erstellen

**Service-Datei sollte existieren:**
```bash
cat /etc/systemd/system/fritz-service.service
```

**Sollte so aussehen:**
```ini
[Unit]
Description=FritzBox Device Checker Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/fritz-service
Environment="PATH=/fritz-service/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=/fritz-service"
EnvironmentFile=/fritz-service/.env
ExecStart=/fritz-service/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Wichtig:**
- `Type=simple` (nicht `oneshot` oder `notify`)
- `Restart=always` (startet automatisch neu wenn crasht)
- `RestartSec=10` (wartet 10 Sekunden vor Neustart)

### 3. Service-Datei erstellen (falls nicht existiert)

```bash
# Service-Datei erstellen
sudo nano /etc/systemd/system/fritz-service.service
```

**Kopiere den Inhalt von oben hinein.**

**Oder mit Script:**
```bash
sudo tee /etc/systemd/system/fritz-service.service > /dev/null <<'EOF'
[Unit]
Description=FritzBox Device Checker Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/fritz-service
Environment="PATH=/fritz-service/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="PYTHONPATH=/fritz-service"
EnvironmentFile=/fritz-service/.env
ExecStart=/fritz-service/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### 4. Service aktivieren und starten

```bash
# systemd neu laden
sudo systemctl daemon-reload

# Service aktivieren (startet beim Boot)
sudo systemctl enable fritz-service

# Service jetzt starten
sudo systemctl start fritz-service

# Status prüfen
sudo systemctl status fritz-service
```

### 5. Service sollte jetzt permanent laufen

**Prüfe:**
```bash
# Service Status
sudo systemctl status fritz-service

# Process prüfen
ps aux | grep fritzWorkerService

# Port prüfen
netstat -tlnp | grep 8000

# Health Check
curl http://localhost:8000/health
```

**Erwartetes Ergebnis:**
- ✅ Service Status: `active (running)`
- ✅ Process läuft: `uvicorn ... fritzWorkerService`
- ✅ Port 8000: `LISTEN`
- ✅ Health Check: `{"status":"healthy",...}`

### 6. Test: Request senden und Service prüfen

**Terminal 1: EC2 Logs**
```bash
sudo journalctl -u fritz-service -f
```

**Terminal 2: Edge Function testen**
```powershell
.\scripts\test-edge-function.ps1
```

**Nach Request:**
- ✅ Service sollte **weiterlaufen** (nicht stoppen!)
- ✅ Logs zeigen Request-Verarbeitung
- ✅ Keine "Stopping" oder "Shutting down" Meldungen (außer bei manuellem Stop)

## Problem: Warum stoppt der Service?

### Mögliche Ursachen

**1. Service Type falsch**
- `Type=oneshot` → Service stoppt nach Ausführung
- **Lösung:** `Type=simple` verwenden

**2. Service crasht**
- Python Exception nach Request
- **Lösung:** Logs prüfen (`journalctl -u fritz-service -n 100`)

**3. Service wird manuell gestoppt**
- Jemand stoppt den Service
- **Lösung:** Prüfe wer/was den Service stoppt

**4. start.sh Script beendet sich**
- Script hat `exit` statt Service laufen zu lassen
- **Lösung:** Prüfe `start.sh` - sollte `exec uvicorn` verwenden

### Prüfe: start.sh Script

```bash
cat /fritz-service/start.sh
```

**Sollte sein:**
```bash
#!/bin/bash
PORT=${PORT:-8000}
exec uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port "$PORT"
```

**Wichtig:** `exec` (ersetzt Shell-Prozess) oder Script läuft weiter ohne Service zu starten.

## Automatischer Check-Script

**Script hochladen und ausführen:**
```bash
# Von deinem PC
scp -i "X:\Keys\JC_Devices.pem" scripts/ec2-check-service.sh ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com:/tmp/

# Auf EC2
chmod +x /tmp/ec2-check-service.sh
/tmp/ec2-check-service.sh
```

Das Script prüft alles und gibt Anweisungen zum Fix.

## Zusätzlich: Alte Message Problem

**Problem:** Response zeigt noch alte Message: "AuÃer den Baseline GerÃ¤ten ist niemand im Club"

**Ursachen:**
1. Edge Function nicht neu deployed (zeigt noch alte Message)
2. EC2 Service nicht neu deployed (sendet noch alte Message)
3. Database hat noch alte Message (Fallback verwendet alte Message)

**Lösung:**
1. Edge Function neu deployen (neue Version hat neue Messages)
2. EC2 Service neu deployen (neue Version hat neue Messages)
3. SQL Migration ausführen (Database Funktion hat neue Messages)

**Nach allen Updates:**
- ✅ Response sollte zeigen: "Niemand ist gerade im Club" oder "Jemand ist im Club"
- ✅ Keine Encoding-Probleme mehr (AuÃer → Außer)

## Zusammenfassung

**Problem:** Service stoppt nach Request

**Lösung:**
1. ✅ Service-Datei prüfen/erstellen (`/etc/systemd/system/fritz-service.service`)
2. ✅ `Type=simple` und `Restart=always` sicherstellen
3. ✅ Service aktivieren (`systemctl enable`)
4. ✅ Service starten (`systemctl start`)
5. ✅ Prüfe `start.sh` verwendet `exec uvicorn`
6. ✅ Testen: Service sollte permanent laufen

**Nach Fix:**
- ✅ Service läuft permanent (nicht nur bei Requests)
- ✅ Service verarbeitet Requests und läuft weiter
- ✅ Service startet automatisch beim Boot
- ✅ Service startet automatisch neu bei Crash

**Kosten:** Du zahlst nur für die EC2 Instance-Laufzeit, nicht pro Request! Die Instance läuft 24/7 (kostet ~$5-10/Monat für t3.micro).

