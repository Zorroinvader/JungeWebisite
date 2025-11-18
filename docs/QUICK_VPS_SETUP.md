# Quick VPS Setup Guide - DigitalOcean

## Warum VPS statt Railway?

Railway Container können keine WireGuard-Verbindungen herstellen (keine CAP_NET_ADMIN). Ein VPS gibt dir volle Kontrolle.

## 5-Minuten Setup

### 1. DigitalOcean Droplet erstellen

1. Gehe zu: https://www.digitalocean.com/products/droplets
2. Klicke **"Create Droplet"**
3. **Image**: Ubuntu 22.04 LTS
4. **Plan**: Basic ($4/Monat)
5. **Region**: Frankfurt (näher zu Deutschland)
6. **Authentication**: SSH Key (empfohlen) oder Password
7. Klicke **"Create Droplet"**

### 2. SSH zum Droplet

```bash
ssh root@[deine-droplet-ip]
```

### 3. Quick Setup Script

Führe diese Befehle auf dem Droplet aus:

```bash
# Update System
apt update && apt upgrade -y

# Install WireGuard & Tools
apt install -y wireguard wireguard-tools iptables

# Install Python & Dependencies
apt install -y python3 python3-pip git

# Clone dein Repo (oder kopiere Code)
git clone [dein-git-repo-url] /app
cd /app

# Install Python Dependencies
pip3 install -r requirements.txt

# Setze Umgebungsvariablen
export FRITZ_SERVICE_API_KEY="JC!Pferdestall"
export WG_CONFIG="[deine-wg-config-aus-railway]"

# Teste Service
python3 -m uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
```

### 4. Als Service laufen lassen

Erstelle `/etc/systemd/system/fritz-service.service`:

```bash
nano /etc/systemd/system/fritz-service.service
```

Füge ein:

```ini
[Unit]
Description=FritzBox Worker Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/app
Environment="FRITZ_SERVICE_API_KEY=JC!Pferdestall"
Environment="WG_CONFIG=[deine-wg-config]"
ExecStart=/usr/bin/python3 -m uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Aktiviere Service:

```bash
systemctl daemon-reload
systemctl enable fritz-service
systemctl start fritz-service
systemctl status fritz-service
```

### 5. Firewall öffnen

```bash
ufw allow 8000/tcp
ufw enable
```

### 6. Teste Service

```bash
curl http://localhost:8000/health
curl http://localhost:8000/
```

### 7. Supabase URL aktualisieren

In Supabase → Edge Functions → Secrets:
- `FRITZ_SERVICE_URL` = `http://[deine-droplet-ip]:8000`

Oder mit Domain (falls du eine hast):
- `FRITZ_SERVICE_URL` = `http://fritz.yourdomain.com:8000`

## Kosten

- **DigitalOcean**: $4/Monat (Basic Droplet)
- **Hetzner**: €4/Monat (CX11)
- **AWS EC2**: Free Tier (12 Monate), dann ~$3.50/Monat

## Vorteile VPS

- ✅ Volle WireGuard-Unterstützung
- ✅ Root-Zugriff
- ✅ Bessere Performance
- ✅ Mehr Kontrolle
- ✅ Günstiger als viele denken

## Troubleshooting

### Service startet nicht
```bash
# Prüfe Logs
journalctl -u fritz-service -f

# Prüfe Status
systemctl status fritz-service
```

### WireGuard funktioniert nicht
```bash
# Prüfe ob WireGuard installiert ist
wg --version

# Teste manuell
wg-quick up /path/to/config.conf
```

### Port nicht erreichbar
```bash
# Prüfe Firewall
ufw status

# Prüfe ob Service läuft
netstat -tlnp | grep 8000
```

## Fertig! 🎉

Dein Service läuft jetzt auf einem VPS mit voller WireGuard-Unterstützung!

