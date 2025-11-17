# Railway Setup Guide - Schritt für Schritt

Diese Anleitung zeigt dir genau, wie du den FritzBox Worker Service auf Railway deployst.

## Voraussetzungen

- GitHub Account (kostenlos)
- Railway Account (kostenlos, mit GitHub verbinden)
- Dein Projekt bereits auf GitHub (oder bereit zum Pushen)

## Schritt 1: Railway Account erstellen

1. Gehe zu: https://railway.app
2. Klicke auf **"Start a New Project"** oder **"Login"**
3. Wähle **"Login with GitHub"**
4. Autorisiere Railway, auf dein GitHub zu zugreifen

## Schritt 2: Neues Projekt auf Railway erstellen

1. Im Railway Dashboard, klicke auf **"+ New Project"**
2. Wähle **"Deploy from GitHub repo"**
3. Wähle dein Repository aus (z.B. `JC` oder wie dein Repo heißt)
4. Railway erstellt automatisch ein neues Projekt

## Schritt 3: Service konfigurieren

### 3.1 Service Settings

1. Klicke auf dein neues Projekt
2. Railway sollte automatisch einen Service erkannt haben
3. Falls nicht, klicke auf **"+ New"** → **"GitHub Repo"** → Wähle dein Repo

### 3.2 Build Settings

1. Klicke auf den Service
2. Gehe zu **"Settings"** Tab
3. Unter **"Build Command"**:
   ```
   pip install -r src/services/requirements.txt
   ```
4. Unter **"Start Command"**:
   ```
   uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT
   ```

**ODER** Railway sollte automatisch die `Procfile` erkennen. Falls ja, kannst du diese Schritte überspringen.

### 3.3 Root Directory (wichtig!)

1. In den Settings, scrolle zu **"Root Directory"**
2. Setze es auf: `.` (Punkt = Root-Verzeichnis)
3. Oder lass es leer, wenn dein Projekt im Root ist

## Schritt 4: Umgebungsvariablen setzen

1. Im Service, klicke auf **"Variables"** Tab
2. Klicke auf **"+ New Variable"**
3. Füge diese Variablen hinzu:

### Erforderliche Variablen:

```
FRITZ_SERVICE_API_KEY=dein-sicheres-passwort-hier
```

**Wichtig**: Erstelle ein sicheres Passwort (z.B. mit einem Passwort-Generator)

### Optional (für Debugging):

```
PYTHONUNBUFFERED=1
```

## Schritt 5: WireGuard Setup auf Railway

**Problem**: Railway Container haben standardmäßig kein WireGuard installiert.

### Lösung A: Custom Dockerfile (Empfohlen)

1. Erstelle eine Datei `Dockerfile` im Root-Verzeichnis:

```dockerfile
FROM python:3.11-slim

# Install WireGuard
RUN apt-get update && apt-get install -y \
    wireguard \
    wireguard-tools \
    iptables \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY src/services/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE $PORT

# Start command
CMD ["uvicorn", "src.services.fritzWorkerService:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. In Railway Settings:
   - **"Dockerfile Path"**: `Dockerfile`
   - **"Docker Build Context"**: `.`

### Lösung B: Nixpacks mit Setup Script

1. Erstelle `nixpacks.toml` im Root:

```toml
[phases.setup]
nixPkgs = ["wireguard", "wireguard-tools"]

[phases.install]
cmds = ["pip install -r src/services/requirements.txt"]

[start]
cmd = "uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT"
```

## Schritt 6: WireGuard Config hochladen

1. Im Railway Service, gehe zu **"Settings"** → **"Files"**
2. Oder füge die Config als Umgebungsvariable hinzu:

### Option A: Als Umgebungsvariable

1. Gehe zu **"Variables"**
2. Füge hinzu:
   ```
   WG_CONFIG=[Interface]
   PrivateKey = gMZanpT8ocSoMdEdjmu8BV63ZdfwKEhAuLWf4IOF9VA=
   Address = 192.168.178.202/24
   DNS = 192.168.178.1
   DNS = fritz.box
   
   [Peer]
   PublicKey = ZPNPsuxAXAWDNZyOqZhXrRmFgU7d6vxRSyFuPPAt8As=
   PresharedKey = V8Wu2/mtcAODOjU3MGYBLO3ajB7n/0S2/xUJosRkMLU=
   AllowedIPs = 192.168.178.0/24,0.0.0.0/0
   Endpoint = llezz3op4nv9opzb.myfritz.net:58294
   PersistentKeepalive = 25
   ```

3. ✅ **FERTIG**: `fritzWorker.py` wurde bereits modifiziert und liest die Config aus der Umgebungsvariable `WG_CONFIG`

### Option B: Config im Code (weniger sicher)

1. Stelle sicher, dass `src/services/wg_config.conf` im Repo ist
2. Pushe es zu GitHub (aber **NICHT** die Private Keys!)

## Schritt 7: Deploy

1. Railway deployt automatisch bei jedem Git Push
2. Oder klicke manuell auf **"Deploy"** Button
3. Warte bis der Build fertig ist (siehe **"Deployments"** Tab)

## Schritt 8: Service URL finden

1. Nach erfolgreichem Deploy, gehe zu **"Settings"** → **"Networking"**
2. Klicke auf **"Generate Domain"** (falls noch nicht vorhanden)
3. Kopiere die URL (z.B. `https://your-service.up.railway.app`)

**WICHTIG**: Diese URL brauchst du für Supabase!

## Schritt 9: Testen

1. Öffne die Railway URL in deinem Browser
2. Du solltest sehen: `{"status":"ok","service":"fritz-worker-service","vpn_support":true}`

2. Teste den Health Endpoint:
   ```
   https://your-service.up.railway.app/health
   ```

3. Teste den Check-Devices Endpoint (mit API Key):
   ```bash
   curl -X POST https://your-service.up.railway.app/check-devices \
     -H "Authorization: Bearer dein-api-key" \
     -H "Content-Type: application/json"
   ```

## Schritt 10: Supabase konfigurieren

1. Gehe zu Supabase Dashboard → **Edge Functions** → **Secrets**
2. Füge hinzu:
   ```
   FRITZ_SERVICE_URL=https://your-service.up.railway.app
   FRITZ_SERVICE_API_KEY=dein-api-key
   ```

## Troubleshooting

### Build schlägt fehl
- Prüfe Logs in Railway → **"Deployments"** → Klicke auf den Deployment
- Prüfe ob alle Dependencies in `requirements.txt` sind
- Prüfe ob Python Version korrekt ist

### WireGuard nicht verfügbar
- Prüfe ob Dockerfile oder nixpacks.toml korrekt ist
- Prüfe Logs: `wg --version` sollte funktionieren
- Möglicherweise brauchst du einen VPS statt Railway (Railway hat eingeschränkte System-Zugriffe)

### Service startet nicht
- Prüfe Logs in Railway
- Prüfe ob Port korrekt ist (`$PORT` wird von Railway gesetzt)
- Prüfe ob Start Command korrekt ist

### VPN-Verbindung schlägt fehl
- Railway Container haben möglicherweise keine Admin-Rechte für WireGuard
- **Alternative**: Verwende einen VPS (z.B. DigitalOcean, Hetzner) statt Railway
- Oder verwende einen Service der WireGuard nativ unterstützt

## Alternative: VPS statt Railway

Falls Railway Probleme mit WireGuard hat, verwende einen VPS:

1. **DigitalOcean Droplet** (ab $4/Monat)
2. **Hetzner Cloud** (ab €4/Monat)
3. **AWS EC2** (Free Tier verfügbar)

Auf einem VPS kannst du:
- WireGuard direkt installieren
- Python Service laufen lassen
- Volle System-Kontrolle haben

## Nächste Schritte

Nach erfolgreichem Railway Setup:
1. ✅ Service läuft auf Railway
2. ✅ URL kopiert
3. → Weiter zu Supabase Setup (siehe `CLUB_STATUS_SETUP.md`)

