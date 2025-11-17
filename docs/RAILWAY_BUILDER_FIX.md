# Railway Builder Fix - Dockerfile verwenden

## Problem

Railway sucht immer noch nach `src/services/requirements.tx` - das bedeutet, Railway verwendet **NIXPACKS** statt **Dockerfile**.

## Lösung: Builder in Railway Dashboard ändern

### Schritt-für-Schritt:

1. **Öffne Railway Dashboard**
   - Gehe zu: https://railway.app/dashboard
   - Wähle dein Projekt → Service

2. **Gehe zu Settings**
   - Klicke auf **"Settings"** Tab (oben)

3. **Builder ändern**
   - Scrolle zu **"Build Settings"** oder **"Build & Deploy"**
   - Finde **"Builder"** oder **"Build Method"**
   - Ändere von **"NIXPACKS"** zu **"Dockerfile"**

4. **Dockerfile Path setzen**
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Build Context**: `.` (Punkt) oder leer lassen

5. **Build Command entfernen**
   - Falls ein **"Build Command"** gesetzt ist, lösche ihn
   - Das Dockerfile macht alles automatisch

6. **Root Directory prüfen**
   - **Root Directory**: Sollte leer sein (`.`) oder nicht gesetzt

7. **Speichern**
   - Klicke **"Save"** oder die Änderungen werden automatisch gespeichert

8. **Neu deployen**
   - Klicke auf **"Deploy"** Button (oben rechts)
   - Oder warte auf Auto-Deploy nach Git Push

## Alternative: Falls Dockerfile nicht verfügbar ist

Falls Railway das Dockerfile nicht findet:

1. **Prüfe ob Dockerfile im Root ist**
   - Sollte `Dockerfile` (ohne Endung) heißen
   - Sollte im Root-Verzeichnis sein (gleiche Ebene wie `package.json`)

2. **Commit und Push**
   ```bash
   git add Dockerfile requirements.txt railway.json
   git commit -m "Add Dockerfile and requirements.txt for Railway"
   git push
   ```

3. **In Railway**: Builder sollte jetzt Dockerfile erkennen

## Verifizierung

Nach dem Wechsel zu Dockerfile:

1. **Prüfe Build Logs**:
   - Gehe zu Deployments → Neuester Deployment
   - Sollte zeigen:
     ```
     Step 1/10 : FROM python:3.11-slim
     Step 2/10 : RUN apt-get update...
     Step 3/10 : COPY requirements.txt...
     Step 4/10 : RUN pip install...
     ```

2. **Erfolgreicher Build**:
   - Keine Fehler mehr
   - `Successfully installed fritzconnection fastapi uvicorn`
   - Container startet

## Falls es immer noch nicht funktioniert

### Option 1: NIXPACKS mit Build Command

Falls Dockerfile Probleme macht, verwende NIXPACKS mit Build Command:

1. **Builder**: `NIXPACKS`
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT`

### Option 2: Prüfe railway.json

Stelle sicher, dass `railway.json` im Repo ist und committed wurde:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

## Wichtigste Punkte

✅ **requirements.txt** ist im Root-Verzeichnis
✅ **Dockerfile** ist im Root-Verzeichnis  
⚠️ **In Railway Dashboard**: Builder auf **Dockerfile** setzen
⚠️ **Commit und Push** alle Änderungen
⚠️ **Neu deployen** nach Änderungen

## Screenshot-Beschreibung

**Wo finde ich den Builder?**
- Railway Dashboard → Projekt → Service
- Oben: Tabs (Deployments, Metrics, **Settings**, Variables, ...)
- Settings Tab → Scrolle nach unten zu **"Build Settings"**
- Dort: **"Builder"** Dropdown → Wähle **"Dockerfile"**

