# Railway Build Error Fix - requirements.txt nicht gefunden

## Problem

Railway findet die `requirements.txt` nicht:
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'src/services/requirements.tx'
```

**Beachte**: Railway sucht nach `requirements.tx` (Tippfehler) - das deutet darauf hin, dass Railway noch NIXPACKS verwendet oder die Konfiguration nicht aktualisiert wurde.

## Lösung

### ✅ Lösung 1: Railway Settings manuell anpassen (Schnellste)

1. **Gehe zu Railway Dashboard**:
   - Öffne dein Projekt → Service → **Settings** Tab

2. **Builder ändern**:
   - Scrolle zu **"Build Settings"**
   - **Builder**: Wähle **"Dockerfile"** (nicht NIXPACKS)
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Build Context**: `.` (Punkt)

3. **Build Command entfernen** (wenn vorhanden):
   - Falls ein Build Command gesetzt ist, lösche ihn
   - Das Dockerfile macht alles automatisch

4. **Root Directory prüfen**:
   - Sollte leer sein (`.`) oder nicht gesetzt

5. **Speichern und neu deployen**:
   - Klicke **"Deploy"** Button

### ✅ Lösung 2: Code wurde bereits gefixt

Ich habe bereits:
- ✅ `requirements.txt` im Root erstellt
- ✅ `Dockerfile` angepasst
- ✅ `railway.json` konfiguriert

**Du musst nur**:
1. Commit und Push:
   ```bash
   git add requirements.txt railway.json Dockerfile
   git commit -m "Fix Railway requirements.txt"
   git push
   ```

2. **In Railway Dashboard**:
   - Gehe zu Settings
   - Stelle sicher, dass **Builder = Dockerfile** ist
   - Klicke **"Deploy"**

### Lösung 3: Falls Dockerfile nicht funktioniert

Falls Railway das Dockerfile ignoriert:

1. **In Railway Settings**:
   - **Builder**: `NIXPACKS`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.services.fritzWorkerService:app --host 0.0.0.0 --port $PORT`

2. **Root Directory**: `.` (leer lassen)

## Verifizierung

Nach dem Fix:

1. **Prüfe Railway Logs**:
   - Gehe zu Deployments → Neuester Deployment → Logs
   - Sollte zeigen:
     ```
     Collecting fritzconnection...
     Collecting fastapi...
     Collecting uvicorn...
     Successfully installed...
     ```

2. **Erfolgreicher Build**:
   - Keine Fehler mehr
   - Container startet
   - Service läuft

## Wichtigste Schritte

1. ✅ `requirements.txt` ist jetzt im Root
2. ⚠️ **In Railway Dashboard**: Builder auf **Dockerfile** setzen
3. ⚠️ **Commit und Push** die Änderungen
4. ⚠️ **Neu deployen** in Railway

## Troubleshooting

### Railway verwendet immer noch NIXPACKS
- Gehe zu Settings → Builder
- Wähle explizit **"Dockerfile"**
- Speichern

### Build Command wird ignoriert
- Lösche den Build Command
- Dockerfile macht alles

### requirements.txt wird immer noch nicht gefunden
- Prüfe ob `requirements.txt` wirklich im Root ist
- Prüfe ob sie committed und gepusht wurde
- Prüfe Railway Logs für genauen Pfad
