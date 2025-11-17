# Club Status Indicator Setup Guide

Automatische Überprüfung der Geräte im FritzBox WLAN mit WireGuard VPN - alles orchestriert von Supabase.

## Architektur

```
Supabase Backend (Orchestriert alles)
    ↓
pg_cron (alle 30 Sekunden)
    ↓
Supabase Edge Function (check-devices)
    ↓
Externer Service (fritzWorkerService.py) - Handhabt WireGuard VPN
    ↓
FritzBox (via VPN)
    ↓
Zurück zu Supabase → Datenbank Update → Website
```

## Setup Schritte

### 1. Datenbank Migrationen ausführen

Führe die Migrationen in der Supabase SQL-Konsole aus:

```sql
-- 1. Erstelle club_status Tabelle
-- Datei: supabase/migrations/create_club_status_table.sql

-- 2. Richte pg_cron ein
-- Datei: supabase/migrations/setup_pg_cron.sql
```

### 2. Externen Service deployen (Railway/Render/Heroku/VPS)

Der `fritzWorkerService.py` muss auf einem Server laufen, der:
- WireGuard installiert hat
- Python 3.x hat
- Internet-Zugriff hat

#### Option A: Railway (Empfohlen)

1. Erstelle `Procfile`:
```
web: uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT
```

2. Erstelle `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT"
  }
}
```

3. Deploy auf Railway:
   - Verbinde GitHub Repo
   - Setze Umgebungsvariablen:
     - `FRITZ_SERVICE_API_KEY` (optional, für Sicherheit)

#### Option B: Render

1. Erstelle `render.yaml`:
```yaml
services:
  - type: web
    name: fritz-worker-service
    env: python
    buildCommand: pip install -r src/services/requirements.txt
    startCommand: uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: FRITZ_SERVICE_API_KEY
        generateValue: true
```

#### Option C: Lokaler Server/VPS

```bash
# Installiere Dependencies
pip install fastapi uvicorn

# Starte Service
uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port 8000
```

**Wichtig**: Stelle sicher, dass WireGuard auf dem Server installiert ist!

### 3. Supabase Edge Function Secrets setzen

Setze die Umgebungsvariablen in Supabase Dashboard → Edge Functions → Secrets:

```bash
FRITZ_SERVICE_URL=https://your-service.railway.app  # URL zu deinem deployed Service
FRITZ_SERVICE_API_KEY=your-api-key  # Optional, aber empfohlen
```

### 4. Edge Function deployen

```bash
supabase functions deploy check-devices
```

Oder über Supabase Dashboard → Edge Functions → Deploy

### 5. pg_cron konfigurieren

1. Setze die Datenbank-Einstellungen in Supabase SQL Editor:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

2. Führe die pg_cron Migration aus (siehe `supabase/migrations/setup_pg_cron.sql`)

3. Prüfe ob der Cron-Job läuft:

```sql
SELECT * FROM cron.job;
```

### 6. WireGuard auf dem Service-Server einrichten

Der Service-Server muss WireGuard haben und die Config-Datei:

1. Installiere WireGuard:
```bash
# Ubuntu/Debian
sudo apt-get install wireguard

# Oder auf Windows Server
# Installiere WireGuard für Windows
```

2. Stelle sicher, dass `wg_config.conf` auf dem Server verfügbar ist:
   - Entweder als Datei im Projekt
   - Oder als Umgebungsvariable
   - Oder lade sie beim Start hoch

3. Teste manuell:
```bash
python src/services/fritzWorkerService.py
```

### 7. Testen

1. Teste den Service direkt:
```bash
curl -X POST https://your-service.railway.app/check-devices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

2. Teste die Edge Function:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-devices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Automatischer Ablauf

1. **pg_cron** löst alle 30 Sekunden aus
2. **Supabase Edge Function** wird aufgerufen
3. **Edge Function** ruft externen Service auf
4. **Externer Service**:
   - Stellt WireGuard VPN-Verbindung her
   - Prüft FritzBox Geräte
   - Trennt VPN-Verbindung
   - Gibt Ergebnisse zurück
5. **Edge Function** aktualisiert Datenbank
6. **Website** zeigt Status (via Realtime)

## Status Logik

- **Grün (Neue Geräte)**: `has_new_devices = True` → "Neue Geräte die nicht zum Baseline gehören"
- **Rot (Nur Baseline)**: `has_new_devices = False` → "Außer den Baseline Geräten ist niemand im Club"

## Troubleshooting

### Service nicht erreichbar
- Prüfe ob Service läuft: `curl https://your-service.railway.app/health`
- Prüfe Logs auf Railway/Render
- Prüfe Firewall-Einstellungen

### VPN-Verbindung schlägt fehl
- Prüfe ob WireGuard installiert ist
- Prüfe ob `wg_config.conf` vorhanden ist
- Prüfe ob Server Admin-Rechte hat (für WireGuard)

### Edge Function Fehler
- Prüfe Logs in Supabase Dashboard
- Prüfe ob `FRITZ_SERVICE_URL` korrekt gesetzt ist
- Prüfe Timeout (VPN-Verbindung kann 10-20 Sekunden dauern)

## Dateien

- `supabase/migrations/create_club_status_table.sql` - Datenbank Schema
- `supabase/migrations/setup_pg_cron.sql` - Cron Job Setup
- `supabase/functions/check-devices/index.ts` - Edge Function (orchestriert)
- `src/services/fritzWorkerService.py` - Externer Service (handhabt VPN)
- `src/components/UI/ClubStatusIndicator.js` - React Komponente

## Vorteile dieser Architektur

✅ **Alles orchestriert von Supabase** - pg_cron und Edge Function auf Supabase
✅ **Automatische VPN-Verbindung** - Service stellt WireGuard automatisch her
✅ **Keine manuelle Intervention** - Läuft vollautomatisch alle 30 Sekunden
✅ **Skalierbar** - Service kann auf mehreren Servern laufen
✅ **Sicher** - API Key Schutz möglich

