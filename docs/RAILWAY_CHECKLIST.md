# Railway Setup Checkliste ✅

## Vorbereitung

- [ ] GitHub Account vorhanden
- [ ] Code auf GitHub gepusht
- [ ] Railway Account erstellt (https://railway.app)

## Schritt 1: Railway Projekt erstellen

- [ ] Gehe zu https://railway.app
- [ ] Klicke **"Login with GitHub"**
- [ ] Autorisiere Railway
- [ ] Klicke **"+ New Project"**
- [ ] Wähle **"Deploy from GitHub repo"**
- [ ] Wähle dein Repository aus
- [ ] Projekt wurde erstellt ✅

## Schritt 2: Service konfigurieren

### Build Settings (automatisch erkannt)
- [ ] Railway erkennt `Procfile` ✅
- [ ] Oder manuell in Settings → Build Command:
  ```
  pip install -r src/services/requirements.txt
  ```
- [ ] Start Command:
  ```
  uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT
  ```

### Dockerfile (für WireGuard)
- [ ] `Dockerfile` existiert im Root ✅
- [ ] In Settings → **"Dockerfile Path"**: `Dockerfile`
- [ ] **"Docker Build Context"**: `.`

## Schritt 3: Umgebungsvariablen

In Railway → Service → **"Variables"** Tab:

- [ ] `FRITZ_SERVICE_API_KEY` = `[sicheres-passwort-generieren]`
- [ ] Optional: `PYTHONUNBUFFERED` = `1`

**Tipp**: Verwende einen Passwort-Generator für API_KEY!

## Schritt 4: WireGuard Config

### Option A: Config im Repo (einfach)
- [ ] `src/services/wg_config.conf` ist im Repo
- [ ] Private Keys sind NICHT committed (nur für Test)

### Option B: Als Umgebungsvariable (sicherer)
- [ ] Variable `WG_CONFIG` mit vollständiger Config
- [ ] Code anpassen um aus Variable zu lesen

## Schritt 5: Deploy

- [ ] Klicke **"Deploy"** Button
- [ ] Oder pushe zu GitHub (auto-deploy)
- [ ] Warte auf Build (siehe "Deployments" Tab)
- [ ] Build erfolgreich ✅

## Schritt 6: Domain/URL

- [ ] Gehe zu Settings → **"Networking"**
- [ ] Klicke **"Generate Domain"**
- [ ] URL kopiert (z.B. `https://xxx.up.railway.app`) ✅

## Schritt 7: Testen

### Health Check
- [ ] Öffne: `https://xxx.up.railway.app/`
- [ ] Siehst: `{"status":"ok","service":"fritz-worker-service"}` ✅

### API Test
- [ ] Teste mit curl oder Browser:
  ```
  https://xxx.up.railway.app/health
  ```
- [ ] Antwort: `{"status":"healthy",...}` ✅

## Schritt 8: Supabase konfigurieren

In Supabase Dashboard:

- [ ] Gehe zu **Edge Functions** → **Secrets**
- [ ] Füge hinzu: `FRITZ_SERVICE_URL` = `https://xxx.up.railway.app`
- [ ] Füge hinzu: `FRITZ_SERVICE_API_KEY` = `[dein-passwort]`

## Schritt 9: Finaler Test

- [ ] Supabase Edge Function deployen
- [ ] Manuell testen:
  ```bash
  curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-devices \
    -H "Authorization: Bearer YOUR_ANON_KEY"
  ```
- [ ] Prüfe Logs in Railway
- [ ] Prüfe Logs in Supabase

## Troubleshooting

### Build schlägt fehl?
- [ ] Prüfe Railway Logs (Deployments Tab)
- [ ] Prüfe ob `requirements.txt` korrekt ist
- [ ] Prüfe ob Python Version passt

### Service startet nicht?
- [ ] Prüfe Start Command
- [ ] Prüfe ob Port korrekt (`$PORT`)
- [ ] Prüfe Logs

### WireGuard Fehler?
- [ ] Prüfe ob Dockerfile korrekt ist
- [ ] Prüfe ob Config-Datei vorhanden ist
- [ ] **Hinweis**: Railway hat möglicherweise keine Admin-Rechte für WireGuard

### VPN-Verbindung schlägt fehl?
- [ ] **Lösung**: Verwende VPS statt Railway (siehe Guide)
- [ ] Oder: Prüfe WireGuard Installation in Logs

## ✅ Fertig!

Wenn alles funktioniert:
- [ ] Service läuft auf Railway
- [ ] URL in Supabase konfiguriert
- [ ] Edge Function ruft Service auf
- [ ] Status wird alle 30 Sekunden aktualisiert
- [ ] Website zeigt Status an

## Wichtige URLs

- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Deine Service URL**: `https://xxx.up.railway.app`

## Nächste Schritte

→ Siehe `CLUB_STATUS_SETUP.md` für Supabase Setup
→ Siehe `RAILWAY_SETUP_GUIDE.md` für detaillierte Anleitung

