# VPS Setup - Komplette Anleitung

## Übersicht

Der Service wurde für VPS (Virtual Private Server) optimiert. Alle Railway-spezifischen Konfigurationen wurden entfernt.

## Was wurde entfernt

- ✅ `railway.json` - Railway Konfiguration
- ✅ `nixpacks.toml` - Railway Build Config
- ✅ Railway-spezifische Code-Checks
- ✅ Railway-spezifische Kommentare

## Was bleibt (funktioniert auf VPS)

- ✅ `Dockerfile` - Kann für Docker-Deployment verwendet werden
- ✅ `start.sh` - Start-Script für VPS
- ✅ `Procfile` - Für Process Manager (systemd, supervisor, etc.)
- ✅ `requirements.txt` - Python Dependencies
- ✅ Alle Service-Dateien

## Quick Start auf VPS

### 1. VPS Setup

Siehe: `docs/QUICK_VPS_SETUP.md`

### 2. Code deployen

```bash
# Auf VPS
git clone [dein-repo] /app
cd /app
pip3 install -r requirements.txt
```

### 3. Umgebungsvariablen setzen

```bash
export FRITZ_SERVICE_API_KEY="JC!Pferdestall"
export WG_CONFIG="[deine-wg-config]"
export PORT=8000  # Optional, default ist 8000
```

### 4. Service starten

**Option A: Mit start.sh**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Direkt mit uvicorn**
```bash
uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
```

**Option C: Als systemd Service** (siehe `docs/QUICK_VPS_SETUP.md`)

### 5. Testen

```bash
curl http://localhost:8000/health
curl http://localhost:8000/
```

## Supabase Konfiguration

In Supabase → Edge Functions → Secrets:

1. `FRITZ_SERVICE_URL` = `http://[deine-vps-ip]:8000`
   - Oder mit Domain: `http://fritz.yourdomain.com:8000`

2. `FRITZ_SERVICE_API_KEY` = `JC!Pferdestall`
   - Muss identisch sein mit dem auf dem VPS

## Firewall

```bash
# Öffne Port 8000
ufw allow 8000/tcp
ufw enable
```

## Service Management

### Als systemd Service

Siehe: `docs/QUICK_VPS_SETUP.md` für vollständige Anleitung

### Mit screen (für Testing)

```bash
screen -S fritz
./start.sh
# Ctrl+A, dann D zum Detachen
```

### Mit tmux

```bash
tmux new -s fritz
./start.sh
# Ctrl+B, dann D zum Detachen
```

## Troubleshooting

### Service startet nicht
```bash
# Prüfe Logs
journalctl -u fritz-service -f  # Falls systemd Service
# Oder
python3 -m uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
```

### WireGuard funktioniert nicht
```bash
# Prüfe ob WireGuard installiert ist
wg --version

# Prüfe ob Config vorhanden ist
cat $WG_CONFIG  # Falls als Variable
# Oder
cat src/services/wg_config.conf  # Falls als Datei
```

### Port nicht erreichbar
```bash
# Prüfe Firewall
ufw status

# Prüfe ob Service läuft
netstat -tlnp | grep 8000
# Oder
ss -tlnp | grep 8000
```

## Nächste Schritte

1. ✅ VPS erstellen (DigitalOcean, Hetzner, etc.)
2. ✅ Code deployen
3. ✅ Umgebungsvariablen setzen
4. ✅ Service starten
5. ✅ Supabase URL aktualisieren
6. ✅ Testen

## Dokumentation

- **Quick Setup**: `docs/QUICK_VPS_SETUP.md`
- **Warum VPS**: `docs/RAILWAY_WIREGUARD_LIMITATION.md`
- **API Key**: `docs/API_KEY_EXPLANATION.md`

## Fertig! 🎉

Der Code ist jetzt vollständig für VPS optimiert und bereit für Deployment!

