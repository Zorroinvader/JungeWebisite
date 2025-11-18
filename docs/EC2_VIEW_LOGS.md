# EC2 Service Logs Ansehen

## Service Logs auf EC2 ansehen

### Methode 1: systemd Journal (Empfohlen)

Der Service läuft als systemd Service (`fritz-service`), daher werden alle Logs im systemd Journal gespeichert.

#### Logs in Echtzeit ansehen (Live):

```bash
# Alle Logs des fritz-service
sudo journalctl -u fritz-service -f

# Mit Timestamps
sudo journalctl -u fritz-service -f --since "10 minutes ago"

# Farbige Ausgabe
sudo journalctl -u fritz-service -f --no-pager
```

#### Letzte Log-Einträge:

```bash
# Letzte 50 Zeilen
sudo journalctl -u fritz-service -n 50

# Letzte 100 Zeilen
sudo journalctl -u fritz-service -n 100

# Letzte 20 Zeilen, neueste zuerst
sudo journalctl -u fritz-service -n 20 --reverse
```

#### Logs nach Zeitraum:

```bash
# Logs der letzten Stunde
sudo journalctl -u fritz-service --since "1 hour ago"

# Logs seit heute
sudo journalctl -u fritz-service --since today

# Logs seit gestern
sudo journalctl -u fritz-service --since yesterday

# Logs zwischen zwei Zeitpunkten
sudo journalctl -u fritz-service --since "2024-01-01 10:00:00" --until "2024-01-01 11:00:00"
```

#### Logs nach Priorität filtern:

```bash
# Nur Fehler (ERROR level)
sudo journalctl -u fritz-service -p err

# Fehler und Warnungen (ERROR, WARNING)
sudo journalctl -u fritz-service -p warning

# Alle Logs (DEBUG, INFO, WARNING, ERROR)
sudo journalctl -u fritz-service -p debug
```

#### Logs nach Text durchsuchen:

```bash
# Suche nach "error" oder "Error"
sudo journalctl -u fritz-service | grep -i error

# Suche nach "WireGuard"
sudo journalctl -u fritz-service | grep -i wireguard

# Suche nach "VPN"
sudo journalctl -u fritz-service | grep -i vpn

# Suche nach "FritzBox"
sudo journalctl -u fritz-service | grep -i fritzbox

# Suche mit Kontext (vorherige/nachfolgende Zeilen)
sudo journalctl -u fritz-service | grep -i error -A 5 -B 5
```

#### Logs exportieren:

```bash
# Export in Datei
sudo journalctl -u fritz-service --since "1 day ago" > /tmp/fritz-service-logs.txt

# Export als JSON
sudo journalctl -u fritz-service --since "1 day ago" -o json > /tmp/fritz-service-logs.json

# Export als JSON, nur aktuelle Instanz
sudo journalctl -u fritz-service --since "1 day ago" -o json --no-pager | jq '.' > /tmp/fritz-service-logs.json
```

### Methode 2: Service-Datei Logs (Falls konfiguriert)

Falls der Service in die Datei `/var/log/fritz-service.log` schreibt:

```bash
# Letzte Zeilen ansehen
tail -f /var/log/fritz-service.log

# Letzte 50 Zeilen
tail -n 50 /var/log/fritz-service.log

# Mit Timestamps
tail -f /var/log/fritz-service.log | while read line; do echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line"; done

# Suche nach Fehlern
grep -i error /var/log/fritz-service.log

# Alle Logs seit heute
grep "$(date '+%Y-%m-%d')" /var/log/fritz-service.log
```

### Methode 3: Uvicorn/FastAPI Logs direkt

Falls du den Service manuell startest (ohne systemd):

```bash
# Service manuell starten mit Logs
cd /fritz-service
source venv/bin/activate
python src/services/fritzWorkerService.py

# Oder mit uvicorn direkt
uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000 --log-level info
```

### Methode 4: AWS Console System Logs

Für System-Boot-Logs und EC2-spezifische Logs:

1. **AWS Console** öffnen: https://console.aws.amazon.com/ec2/
2. **EC2** → **Instances** → Deine Instance wählen
3. **Actions** → **Monitor and troubleshoot** → **Get system log**
4. Prüfe auf:
   - Boot-Meldungen
   - Service-Start-Fehler
   - System-Fehler

### Methode 5: Docker Logs (Falls in Docker)

Falls der Service in einem Docker Container läuft:

```bash
# Container-ID finden
docker ps

# Logs ansehen
docker logs -f <container-id>

# Letzte 100 Zeilen
docker logs --tail 100 <container-id>

# Logs seit bestimmter Zeit
docker logs --since "1h" <container-id>

# Logs mit Timestamps
docker logs -f -t <container-id>
```

## Nützliche Log-Befehle Kombinationen

### Service Status + Logs:

```bash
# Service Status + letzte 20 Log-Zeilen
sudo systemctl status fritz-service && echo "--- Recent Logs ---" && sudo journalctl -u fritz-service -n 20
```

### Fehler-Logs der letzten Stunde:

```bash
sudo journalctl -u fritz-service --since "1 hour ago" -p err --no-pager
```

### Alle Logs mit Timestamps seit Service-Start:

```bash
sudo journalctl -u fritz-service --since "boot" --no-pager
```

### WireGuard VPN Verbindungs-Logs:

```bash
sudo journalctl -u fritz-service | grep -i "wireguard\|vpn" -A 3 -B 3
```

### API Request Logs:

```bash
sudo journalctl -u fritz-service | grep -i "POST\|GET\|/check-devices" -A 5
```

## Log-Rotation und Speicher

### Journal-Speicher prüfen:

```bash
# Speicher-Verbrauch des Journals
sudo journalctl --disk-usage

# Journal-Speicher begrenzen (auf 100MB)
sudo journalctl --vacuum-size=100M

# Journal nur letzten 7 Tage behalten
sudo journalctl --vacuum-time=7d
```

### Journal konfigurieren:

```bash
# Journal-Konfiguration bearbeiten
sudo nano /etc/systemd/journald.conf

# Wichtige Einstellungen:
# SystemMaxUse=100M        # Max Speicher für Journal
# SystemKeepFree=500M      # Freier Speicher behalten
# MaxRetentionSec=7day     # Logs nur 7 Tage behalten
```

## Häufige Fehler in Logs

### Fehler 1: "ModuleNotFoundError"

```bash
# Suche nach diesem Fehler
sudo journalctl -u fritz-service | grep -i "ModuleNotFoundError"
```

**Lösung:** `PYTHONPATH` in Service-Datei prüfen

### Fehler 2: "Permission denied"

```bash
sudo journalctl -u fritz-service | grep -i "permission denied"
```

**Lösung:** Permissions prüfen, Service als richtiger User ausführen

### Fehler 3: "Port already in use"

```bash
sudo journalctl -u fritz-service | grep -i "port.*use\|address.*use"
```

**Lösung:** Port prüfen, anderen Service beenden

### Fehler 4: "WireGuard connection failed"

```bash
sudo journalctl -u fritz-service | grep -i "wireguard.*fail\|operation not permitted"
```

**Lösung:** WireGuard Installation prüfen, CAP_NET_ADMIN prüfen

### Fehler 5: "FritzBox connection timeout"

```bash
sudo journalctl -u fritz-service | grep -i "fritzbox.*timeout\|connection.*timeout"
```

**Lösung:** VPN-Verbindung prüfen, FritzBox erreichbar?

## Service-Logs Remote ansehen (Von deinem PC)

### Methode 1: SSH + Journalctl

```bash
# SSH-Verbindung + Logs ansehen
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com "sudo journalctl -u fritz-service -n 50"

# Live-Logs über SSH
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com "sudo journalctl -u fritz-service -f"
```

### Methode 2: Logs herunterladen

```bash
# Logs exportieren und herunterladen
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com "sudo journalctl -u fritz-service --since '1 day ago' > /tmp/service-logs.txt"
scp -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com:/tmp/service-logs.txt ./
```

## Quick Reference: Wichtigste Befehle

```bash
# Live-Logs (am häufigsten verwendet)
sudo journalctl -u fritz-service -f

# Letzte 50 Zeilen
sudo journalctl -u fritz-service -n 50

# Logs der letzten Stunde
sudo journalctl -u fritz-service --since "1 hour ago"

# Nur Fehler
sudo journalctl -u fritz-service -p err

# Fehler suchen
sudo journalctl -u fritz-service | grep -i error

# Service Status + Logs
sudo systemctl status fritz-service && sudo journalctl -u fritz-service -n 20
```

## Zusammenfassung

✅ **Live-Logs:** `sudo journalctl -u fritz-service -f`  
✅ **Letzte Zeilen:** `sudo journalctl -u fritz-service -n 50`  
✅ **Fehler:** `sudo journalctl -u fritz-service -p err`  
✅ **Suche:** `sudo journalctl -u fritz-service | grep -i error`  
✅ **Seit Stunde:** `sudo journalctl -u fritz-service --since "1 hour ago"`

**Empfohlener Start:** `sudo journalctl -u fritz-service -f` für Live-Monitoring! 📊

