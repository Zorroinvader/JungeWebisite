# Railway Quick Start - Schnellübersicht

## Was du brauchst:
1. ✅ GitHub Account
2. ✅ Railway Account (kostenlos)
3. ✅ Dein Code auf GitHub

## 5-Minuten Setup:

### 1. Railway Login
- Gehe zu https://railway.app
- Login mit GitHub

### 2. Neues Projekt
- Klicke **"+ New Project"**
- Wähle **"Deploy from GitHub repo"**
- Wähle dein Repository

### 3. Service konfigurieren
Railway erkennt automatisch:
- ✅ `Procfile` → Start Command
- ✅ `requirements.txt` → Dependencies
- ✅ `Dockerfile` → Build (falls vorhanden)

### 4. Umgebungsvariablen
In Railway → Service → **"Variables"**:
```
FRITZ_SERVICE_API_KEY=dein-sicheres-passwort
```

### 5. Deploy
- Railway deployt automatisch
- Oder klicke **"Deploy"** Button

### 6. URL kopieren
- Settings → Networking → **"Generate Domain"**
- Kopiere URL (z.B. `https://xxx.up.railway.app`)

### 7. Supabase konfigurieren
In Supabase → Edge Functions → Secrets:
```
FRITZ_SERVICE_URL=https://xxx.up.railway.app
FRITZ_SERVICE_API_KEY=dein-passwort
```

## Fertig! 🎉

Für detaillierte Anleitung siehe: `RAILWAY_SETUP_GUIDE.md`

