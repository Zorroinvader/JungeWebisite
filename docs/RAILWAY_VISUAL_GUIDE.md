# Railway Setup - Visuelle Schritt-für-Schritt Anleitung

## 🎯 Übersicht: Was wir machen

```
GitHub Repo → Railway → Service läuft → Supabase ruft auf
```

## 📍 Schritt 1: Railway öffnen

**WO**: https://railway.app

**WAS**: 
1. Klicke auf **"Start a New Project"** (großer Button)
2. Oder **"Login"** (oben rechts)

**WIE**:
- Wähle **"Login with GitHub"**
- Autorisiere Railway (klicke "Authorize")

## 📍 Schritt 2: Projekt erstellen

**WO**: Railway Dashboard (nach Login)

**WAS**: Neues Projekt erstellen

**WIE**:
1. Klicke auf **"+ New Project"** (oben links)
2. Wähle **"Deploy from GitHub repo"**
3. Falls gefragt: Autorisiere Railway für GitHub
4. Wähle dein Repository aus der Liste (z.B. `JC` oder dein Repo-Name)
5. Klicke auf dein Repo

**ERGEBNIS**: Railway erstellt automatisch ein Projekt und startet den Build

## 📍 Schritt 3: Service finden

**WO**: Railway Dashboard → Dein Projekt

**WAS**: Service sollte automatisch erstellt sein

**WIE**:
- Du siehst einen Service mit deinem Repo-Namen
- Falls nicht: Klicke **"+ New"** → **"GitHub Repo"** → Wähle Repo

## 📍 Schritt 4: Settings öffnen

**WO**: Klicke auf den Service (nicht auf das Projekt, sondern den Service!)

**WAS**: Service Settings konfigurieren

**WIE**:
1. Klicke auf den Service-Namen
2. Oben siehst du Tabs: **"Deployments"**, **"Metrics"**, **"Settings"**, **"Variables"**
3. Klicke auf **"Settings"** Tab

## 📍 Schritt 5: Build Settings prüfen

**WO**: Settings Tab → Scrolle nach unten

**WAS**: Build und Start Commands prüfen

**WIE**:
- Railway sollte automatisch `Procfile` erkannt haben
- Falls nicht, setze manuell:
  - **Build Command**: `pip install -r src/services/requirements.txt`
  - **Start Command**: `uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT`

**WICHTIG**: 
- **Root Directory** sollte leer sein (oder `.`)
- **Dockerfile Path**: `Dockerfile` (falls Dockerfile vorhanden)

## 📍 Schritt 6: Variables (Umgebungsvariablen)

**WO**: Service → **"Variables"** Tab (oben)

**WAS**: API Key setzen

**WIE**:
1. Klicke auf **"Variables"** Tab
2. Klicke auf **"+ New Variable"** Button
3. **Name**: `FRITZ_SERVICE_API_KEY`
4. **Value**: Erstelle ein sicheres Passwort (z.B. mit Passwort-Generator)
5. Klicke **"Add"**

**TIPP**: Kopiere das Passwort - du brauchst es später für Supabase!

## 📍 Schritt 7: Deploy starten

**WO**: Service → **"Deployments"** Tab

**WAS**: Build und Deploy

**WIE**:
- Railway deployt automatisch nach Git Push
- Oder klicke manuell auf **"Deploy"** Button (oben rechts)
- Warte auf Build (siehst Progress in "Deployments" Tab)

**WARTE**: Build kann 2-5 Minuten dauern

## 📍 Schritt 8: Domain generieren

**WO**: Service → **"Settings"** Tab → **"Networking"** Sektion

**WAS**: Öffentliche URL erstellen

**WIE**:
1. Scrolle zu **"Networking"** Sektion
2. Klicke auf **"Generate Domain"** Button
3. Railway erstellt eine URL (z.B. `https://fritz-worker-production.up.railway.app`)
4. **KOPIERE DIESE URL!** - Du brauchst sie für Supabase

## 📍 Schritt 9: Testen

**WO**: Deine Railway URL im Browser

**WAS**: Service testen

**WIE**:
1. Öffne die URL im Browser (z.B. `https://xxx.up.railway.app`)
2. Du solltest sehen:
   ```json
   {"status":"ok","service":"fritz-worker-service","vpn_support":true}
   ```
3. Teste Health: `https://xxx.up.railway.app/health`

**ERFOLG**: ✅ Service läuft!

## 📍 Schritt 10: Logs prüfen

**WO**: Service → **"Deployments"** Tab → Klicke auf den neuesten Deployment

**WAS**: Logs ansehen

**WIE**:
- Klicke auf den Deployment (neueste Zeile)
- Siehst Build-Logs und Runtime-Logs
- Prüfe auf Fehler (rot markiert)

## 📍 Schritt 11: Supabase konfigurieren

**WO**: Supabase Dashboard → **Edge Functions** → **Secrets**

**WAS**: Service URL und API Key hinzufügen

**WIE**:
1. Gehe zu https://app.supabase.com
2. Wähle dein Projekt
3. Links im Menü: **Edge Functions**
4. Klicke auf **"Secrets"** Tab
5. Klicke **"+ New Secret"**
6. **Name**: `FRITZ_SERVICE_URL`
7. **Value**: `https://xxx.up.railway.app` (deine Railway URL)
8. Klicke **"Save"**
9. Wiederhole für:
   - **Name**: `FRITZ_SERVICE_API_KEY`
   - **Value**: `[dein-passwort-von-schritt-6]`

## 📍 Schritt 12: Finaler Test

**WO**: Supabase Dashboard → Edge Functions → Logs

**WAS**: Edge Function testen

**WIE**:
1. Gehe zu **Edge Functions** → **check-devices**
2. Klicke **"Invoke"** oder teste mit curl:
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-devices \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
3. Prüfe Logs in Supabase
4. Prüfe Logs in Railway

## 🎉 Fertig!

Wenn alles funktioniert:
- ✅ Service läuft auf Railway
- ✅ URL in Supabase konfiguriert
- ✅ Edge Function kann Service aufrufen
- ✅ Automatische Checks alle 30 Sekunden

## 📸 Wo finde ich was?

### Railway Dashboard
- **Projekte**: Hauptseite nach Login
- **Services**: Klicke auf Projekt → Siehst Services
- **Settings**: Service → Settings Tab
- **Variables**: Service → Variables Tab
- **Logs**: Service → Deployments → Klicke auf Deployment
- **Domain**: Service → Settings → Networking

### Supabase Dashboard
- **Edge Functions**: Linkes Menü → Edge Functions
- **Secrets**: Edge Functions → Secrets Tab
- **Logs**: Edge Functions → Funktion → Logs Tab

## ⚠️ Häufige Fehler

### "Build failed"
- **WO**: Railway → Deployments → Logs
- **WAS**: Prüfe Fehlermeldung
- **LÖSUNG**: Meist fehlende Dependencies in requirements.txt

### "Service won't start"
- **WO**: Railway → Deployments → Runtime Logs
- **WAS**: Prüfe Start Command
- **LÖSUNG**: Stelle sicher, dass Port `$PORT` verwendet wird

### "WireGuard not found"
- **WO**: Railway → Deployments → Logs
- **WAS**: WireGuard nicht installiert
- **LÖSUNG**: Stelle sicher, dass Dockerfile vorhanden ist und WireGuard installiert

### "Connection timeout"
- **WO**: Supabase → Edge Functions → Logs
- **WAS**: Service nicht erreichbar
- **LÖSUNG**: Prüfe Railway URL, prüfe ob Service läuft

## 📞 Hilfe

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Supabase Docs: https://supabase.com/docs

