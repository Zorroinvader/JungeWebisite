# EC2 Service Auto-Start Guide

## Service automatisch starten (systemd)

Der Service sollte bereits als systemd Service eingerichtet sein. Hier ist die komplette Anleitung:

### 1. Prüfe ob Service bereits existiert

```bash
# Auf EC2
sudo systemctl status fritz-service
```

### 2. Service-Datei erstellen/überprüfen

```bash
# Service-Datei bearbeiten
sudo nano /etc/systemd/system/fritz-service.service
```

**Inhalt der Service-Datei:**

```ini
[Unit]
Description=FritzBox Device Checker Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/fritz-service
Environment="PATH=/fritz-service/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
EnvironmentFile=/fritz-service/.env
ExecStart=/fritz-service/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Service aktivieren und starten

```bash
# systemd neu laden
sudo systemctl daemon-reload

# Service aktivieren (startet automatisch beim Boot)
sudo systemctl enable fritz-service

# Service jetzt starten
sudo systemctl start fritz-service

# Status prüfen
sudo systemctl status fritz-service
```

### 4. Verifizierung

```bash
# Prüfe ob Service läuft
sudo systemctl is-active fritz-service
# Sollte "active" ausgeben

# Prüfe ob Service enabled ist (startet beim Boot)
sudo systemctl is-enabled fritz-service
# Sollte "enabled" ausgeben

# Test: Service neu starten
sudo systemctl restart fritz-service

# Prüfe Logs
sudo journalctl -u fritz-service -f
```

### 5. Service-Management Befehle

```bash
# Service starten
sudo systemctl start fritz-service

# Service stoppen
sudo systemctl stop fritz-service

# Service neu starten
sudo systemctl restart fritz-service

# Service Status
sudo systemctl status fritz-service

# Service aktivieren (Auto-Start beim Boot)
sudo systemctl enable fritz-service

# Service deaktivieren (kein Auto-Start)
sudo systemctl disable fritz-service

# Logs ansehen
sudo journalctl -u fritz-service -f
sudo journalctl -u fritz-service -n 50  # Letzte 50 Zeilen
```

### 6. Test: EC2 Neustart

```bash
# EC2 Instance neu starten
sudo reboot

# Nach Neustart: Prüfe ob Service automatisch gestartet ist
sudo systemctl status fritz-service
```

## Service startet nicht automatisch?

### Problem 1: Service nicht enabled

```bash
sudo systemctl enable fritz-service
sudo systemctl daemon-reload
```

### Problem 2: start.sh nicht ausführbar

```bash
chmod +x /fritz-service/start.sh
ls -la /fritz-service/start.sh
# Sollte -rwxr-xr-x zeigen
```

### Problem 3: .env Datei fehlt

```bash
# Prüfe ob .env existiert
ls -la /fritz-service/.env

# Falls nicht, erstellen:
cat > /fritz-service/.env << 'EOF'
FRITZ_SERVICE_API_KEY=JC!Pferdestall
PORT=8000
EOF

sudo chown ubuntu:ubuntu /fritz-service/.env
```

### Problem 4: Permissions falsch

```bash
# Setze korrekte Permissions
sudo chown -R ubuntu:ubuntu /fritz-service
sudo chmod +x /fritz-service/start.sh
```

## Cron Job auf 15 Minuten geändert

Der Cron Job wurde bereits auf 15 Minuten geändert:

- **Alter Job**: `check-devices-every-30s` (alle 30 Sekunden) - **ENTFERNT**
- **Neuer Job**: `check-devices-every-15min` (alle 15 Minuten) - **AKTIV**

### Prüfen:

```sql
-- In Supabase SQL Editor
SELECT jobid, jobname, schedule, active, command 
FROM cron.job 
WHERE jobname LIKE 'check-devices%';
```

Sollte zeigen:
- `check-devices-every-15min` mit Schedule `*/15 * * * *`

## Kosten-Optimierung

### Vorher:
- Checks alle 30 Sekunden = **120 Checks/Stunde** = **2,880 Checks/Tag**

### Nachher:
- Checks alle 15 Minuten = **4 Checks/Stunde** = **96 Checks/Tag**

**Reduktion: 97% weniger Requests!**

### Weitere Kosten-Optimierungen:

1. **EC2 Instance Type**: 
   - t3.micro (Free Tier) oder t3.small
   - Stoppe Instance wenn nicht benötigt

2. **Elastic IP**: 
   - Kostenlos wenn mit laufender Instance verbunden
   - Kosten entstehen nur wenn Instance gestoppt ist

3. **Storage**: 
   - Minimale EBS Volume Größe (8 GB)

## Monitoring

### Service Status prüfen (von außen):

```bash
# Von deinem PC
curl http://EC2_IP:8000/health
```

### Logs prüfen:

```bash
# Auf EC2
sudo journalctl -u fritz-service --since "1 hour ago"
```

### Cron Job History prüfen:

```sql
-- In Supabase SQL Editor
SELECT runid, status, start_time, end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-devices-every-15min')
ORDER BY start_time DESC 
LIMIT 10;
```

## Zusammenfassung

✅ **Service läuft automatisch** (systemd)
✅ **Startet beim Boot** (systemctl enable)
✅ **Cron Job auf 15 Minuten** geändert
✅ **97% weniger Requests** = deutlich weniger Kosten

Der Service läuft jetzt vollständig automatisch und kosteneffizient!

