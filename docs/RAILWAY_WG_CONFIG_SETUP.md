# WireGuard Config in Railway hinzufügen - Detaillierte Anleitung

## Problem
Railway's Variables-Interface unterstützt mehrzeilige Werte nicht direkt. Die WireGuard Config ist aber mehrzeilig.

## Lösung: Mehrzeilige Config als eine Zeile mit \n

### Methode 1: Manuell in Railway Dashboard (Einfachste)

1. **Öffne Railway Dashboard**
   - Gehe zu: https://railway.app
   - Wähle dein Projekt → Service

2. **Gehe zu Variables**
   - Klicke auf **"Variables"** Tab (oben)

3. **Neue Variable hinzufügen**
   - Klicke **"+ New Variable"**
   - **Name**: `WG_CONFIG`

4. **Value eingeben** (alles in EINE Zeile):
   ```
   [Interface]\nPrivateKey = gMZanpT8ocSoMdEdjmu8BV63ZdfwKEhAuLWf4IOF9VA=\nAddress = 192.168.178.202/24\nDNS = 192.168.178.1\nDNS = fritz.box\n\n[Peer]\nPublicKey = ZPNPsuxAXAWDNZyOqZhXrRmFgU7d6vxRSyFuPPAt8As=\nPresharedKey = V8Wu2/mtcAODOjU3MGYBLO3ajB7n/0S2/xUJosRkMLU=\nAllowedIPs = 192.168.178.0/24,0.0.0.0/0\nEndpoint = llezz3op4nv9opzb.myfritz.net:58294\nPersistentKeepalive = 25
   ```

5. **Speichern**
   - Klicke **"Add"** oder **"Save"**

### Methode 2: Mit Railway CLI (Empfohlen für mehrzeilige Werte)

#### Schritt 1: Railway CLI installieren

```bash
npm i -g @railway/cli
```

#### Schritt 2: Login und Projekt verlinken

```bash
# Login
railway login

# Navigiere zu deinem Projekt-Verzeichnis
cd C:\Users\Zorro\JC

# Link zu deinem Railway Projekt
railway link
```

#### Schritt 3: Variable setzen

**Windows PowerShell:**
```powershell
# Lese die Config-Datei und setze als Variable
$config = Get-Content src/services/wg_config.conf -Raw
railway variables set WG_CONFIG="$config"
```

**Windows CMD:**
```cmd
# Lese die Config-Datei
set /p config=<src/services/wg_config.conf
railway variables set WG_CONFIG="%config%"
```

**Git Bash / Linux / Mac:**
```bash
railway variables set WG_CONFIG="$(cat src/services/wg_config.conf)"
```

### Methode 3: Via Railway API (Für Automatisierung)

1. Hole dein Railway API Token:
   - Railway Dashboard → Settings → Tokens → Create Token

2. Setze Variable via API:
   ```bash
   curl -X POST https://api.railway.app/v1/variables \
     -H "Authorization: Bearer YOUR_RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "projectId": "YOUR_PROJECT_ID",
       "serviceId": "YOUR_SERVICE_ID",
       "name": "WG_CONFIG",
       "value": "[Interface]\\nPrivateKey = ..."
     }'
   ```

### Methode 4: Config-Datei im Repo (Weniger sicher, aber einfach)

1. Stelle sicher, dass `src/services/wg_config.conf` im Repo ist
2. Pushe zu GitHub
3. Railway lädt die Datei automatisch beim Deploy
4. Der Code verwendet die Datei automatisch (falls `WG_CONFIG` nicht gesetzt ist)

**⚠️ WARNUNG**: Private Keys sollten NICHT im Git-Repo sein! Verwende `.gitignore`:

```gitignore
# In .gitignore hinzufügen:
src/services/wg_config.conf
```

## Verifizierung

Nach dem Setzen der Variable:

1. **Prüfe in Railway**:
   - Variables Tab → `WG_CONFIG` sollte vorhanden sein
   - Klicke darauf um den Wert zu sehen

2. **Teste den Service**:
   - Deploy neu starten (oder warte auf Auto-Deploy)
   - Prüfe Logs: Du solltest sehen:
     ```
     Using WireGuard config from WG_CONFIG environment variable
     ```

3. **Teste Endpoint**:
   ```bash
   curl https://your-service.up.railway.app/check-devices \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## Troubleshooting

### Variable wird nicht erkannt
- Prüfe ob Variable korrekt geschrieben ist: `WG_CONFIG` (groß geschrieben)
- Prüfe ob `\n` korrekt eingegeben wurde (nicht als Text, sondern als Zeilenumbruch)
- Starte Deploy neu

### Config wird nicht gelesen
- Prüfe Logs in Railway → Deployments → Runtime Logs
- Suche nach: "Using WireGuard config from WG_CONFIG"
- Falls nicht vorhanden, wird lokale Datei verwendet

### Zeilenumbrüche funktionieren nicht
- Stelle sicher, dass `\n` als Escape-Sequenz eingegeben wurde
- Oder verwende Railway CLI (Methode 2) - das funktioniert am besten

## Empfehlung

**Für Produktion**: Verwende **Methode 2 (Railway CLI)** - am zuverlässigsten für mehrzeilige Werte.

**Für schnellen Test**: Verwende **Methode 1 (Dashboard)** - aber achte auf korrekte `\n` Eingabe.

