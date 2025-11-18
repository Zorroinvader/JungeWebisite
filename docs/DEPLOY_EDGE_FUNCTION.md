# Deploy Edge Function to Supabase

## Problem: Supabase CLI nicht installiert

```
supabase : The term 'supabase' is not recognized
```

**Lösung:** Supabase CLI installieren oder Edge Function über Dashboard deployen.

## Methode 1: Supabase CLI installieren (Empfohlen)

### Windows Installation

#### Option A: Mit Scoop (Empfohlen)

```powershell
# Scoop installieren (falls noch nicht vorhanden)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Supabase CLI installieren
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Option B: Mit npm (Falls Node.js installiert)

```powershell
npm install -g supabase
```

#### Option C: Manuell (Direct Download)

1. Gehe zu: https://github.com/supabase/cli/releases/latest
2. Download `supabase_windows_amd64.zip`
3. Entpacke in einen Ordner (z.B. `C:\tools\supabase`)
4. Füge Ordner zu PATH hinzu:
   ```powershell
   # PowerShell (als Administrator)
   [Environment]::SetEnvironmentVariable(
       "Path",
       $env:Path + ";C:\tools\supabase",
       [EnvironmentVariableTarget]::Machine
   )
   ```

### Nach Installation prüfen

```powershell
supabase --version
```

### Login zu Supabase

```powershell
# Login zu Supabase
supabase login

# Verbinde mit Projekt
supabase link --project-ref wthsritnjosieqxpprsl
```

### Edge Function deployen

```powershell
# Von Projekt-Root
cd C:\Users\Zorro\JC

# Edge Function deployen
supabase functions deploy check-devices
```

## Methode 2: Über Supabase Dashboard (Alternative)

Falls CLI Installation Probleme macht, kannst du die Edge Function direkt im Dashboard deployen:

### Schritt 1: Code vorbereiten

Die Datei `supabase/functions/check-devices/index.ts` ist bereits aktualisiert.

### Schritt 2: Supabase Dashboard öffnen

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt: `wthsritnjosieqxpprsl`
3. Navigiere zu: **Edge Functions** → **check-devices**

### Schritt 3: Code hochladen

**Option A: GitHub Integration (Empfohlen)**
- Wenn dein Code auf GitHub ist, kann Supabase automatisch deployen
- **Settings** → **Integrations** → **GitHub**
- Automatisches Deploy bei Push aktivieren

**Option B: Manuell Code kopieren**
1. Öffne `supabase/functions/check-devices/index.ts`
2. Kopiere den gesamten Code
3. In Supabase Dashboard → **Edge Functions** → **check-devices** → **Edit**
4. Code einfügen
5. **Save** / **Deploy**

### Schritt 4: Environment Variables prüfen

1. **Project Settings** → **Edge Functions**
2. Prüfe **Environment Variables:**
   - `FRITZ_SERVICE_URL` = `http://EC2_IP:8000`
   - `FRITZ_SERVICE_API_KEY` = (optional, falls gesetzt)

## Methode 3: Mit GitHub Actions (Für automatisches Deploy)

Erstelle `.github/workflows/deploy-edge-function.yml`:

```yaml
name: Deploy Edge Function

on:
  push:
    branches: [main, dev]
    paths:
      - 'supabase/functions/check-devices/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - run: supabase functions deploy check-devices
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: wthsritnjosieqxpprsl
```

## Nach Deploy: Testen

### 1. Edge Function testen

```powershell
# PowerShell Script
.\scripts\test-edge-function.ps1
```

**Oder Supabase Dashboard:**
- **Edge Functions** → **check-devices** → **Invoke**
- Method: `POST`
- Body: `{"name": "Functions"}`

### 2. Logs prüfen

**Supabase Dashboard:**
- **Edge Functions** → **check-devices** → **Logs**
- Prüfe auf neue Logs:
  - `Calling Fritz service: ...`
  - `Fritz service response received in Xms`

### 3. EC2 Logs prüfen

```bash
# SSH zu EC2
ssh -i "X:\Keys\JC_Devices.pem" ubuntu@ec2-34-204-153-169.compute-1.amazonaws.com

# Live Logs
sudo journalctl -u fritz-service -f
```

## Troubleshooting

### CLI Installation Probleme

**Problem: `supabase` nicht gefunden nach Installation**
```powershell
# Prüfe ob in PATH
Get-Command supabase

# Falls nicht, PATH manuell hinzufügen
$env:Path += ";C:\tools\supabase"
```

### Login Probleme

**Problem: `supabase login` funktioniert nicht**
```powershell
# Access Token manuell setzen
supabase login --token YOUR_ACCESS_TOKEN
```

**Access Token finden:**
1. Supabase Dashboard → **Account Settings** → **Access Tokens**
2. **Generate new token**
3. Token kopieren und verwenden

### Deploy Fehler

**Problem: `Error: project not linked`**
```powershell
# Projekt verbinden
supabase link --project-ref wthsritnjosieqxpprsl
```

**Problem: `Error: authentication failed`**
```powershell
# Neu einloggen
supabase login
```

### Edge Function funktioniert nach Deploy nicht

1. **Environment Variables prüfen** (siehe oben)
2. **Logs prüfen** (Edge Function Logs im Dashboard)
3. **Code Syntax prüfen** (TypeScript Fehler?)

## Schnellstart: Supabase CLI installieren

**Empfohlene Methode (Scoop):**

```powershell
# 1. Scoop installieren (falls nicht vorhanden)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. Supabase CLI installieren
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 3. Prüfen
supabase --version

# 4. Login
supabase login

# 5. Projekt verbinden
supabase link --project-ref wthsritnjosieqxpprsl

# 6. Edge Function deployen
supabase functions deploy check-devices
```

## Zusammenfassung

**Methode 1 (CLI):** 
- ✅ Supabase CLI installieren (Scoop/npm/manuell)
- ✅ Login: `supabase login`
- ✅ Deploy: `supabase functions deploy check-devices`

**Methode 2 (Dashboard):**
- ✅ Supabase Dashboard → Edge Functions → Code bearbeiten
- ✅ Oder GitHub Integration für automatisches Deploy

**Methode 3 (GitHub Actions):**
- ✅ Automatisches Deploy bei Code-Änderungen

**Empfohlen:** Methode 1 (CLI) für direkten Deploy, Methode 2 (Dashboard) als Alternative.

