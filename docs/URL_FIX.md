# URL Fix: Invalid URL Error

## Problem: Invalid URL Error

**Fehlermeldung:**
```
Error calling Fritz service: TypeError: Invalid URL: 'http://34.204.153.169:8000`/check-devices'
```

**Ursache:** Die `FRITZ_SERVICE_URL` Environment Variable enthält ungültige Zeichen (Backtick ` oder andere Zeichen).

**Problem:** URL enthält Backtick (`) statt normalem Zeichen.

## Lösung: URL säubern und validieren

### Code-Änderung

**Vorher:**
```typescript
const FRITZ_SERVICE_URL = Deno.env.get('FRITZ_SERVICE_URL') ?? ''
```

**Nachher:**
```typescript
const FRITZ_SERVICE_URL_RAW = Deno.env.get('FRITZ_SERVICE_URL') ?? ''
const FRITZ_SERVICE_URL = FRITZ_SERVICE_URL_RAW.trim().replace(/[`'"]/g, '').replace(/\/+$/, '')
```

**Was wird gemacht:**
1. `.trim()` - Entfernt führende/nachfolgende Whitespace
2. `.replace(/[`'"]/g, '')` - Entfernt Backticks (`), einfache Anführungszeichen (') und doppelte Anführungszeichen (")
3. `.replace(/\/+$/, '')` - Entfernt trailing slashes (/)

### Prüfe: FRITZ_SERVICE_URL in Supabase

**Supabase Dashboard:**
1. Gehe zu: https://supabase.com/dashboard
2. **Project Settings** → **Edge Functions**
3. Prüfe **Environment Variables:**
   - `FRITZ_SERVICE_URL` sollte sein: `http://34.204.153.169:8000`
   - **NICHT:** `http://34.204.153.169:8000`\`  (mit Backtick)
   - **NICHT:** `"http://34.204.153.169:8000"`  (mit Anführungszeichen)
   - **NICHT:** `http://34.204.153.169:8000/`  (mit trailing slash)

**Falls falsch:**
1. **Edit** die Variable
2. Setze Wert auf: `http://34.204.153.169:8000` (ohne Anführungszeichen, ohne Backtick, ohne trailing slash)
3. **Save**

### Edge Function neu deployen

**Option A: Supabase Dashboard**
1. **Edge Functions** → **check-devices** → **Edit**
2. Code aus `supabase/functions/check-devices/index.ts` kopieren
3. **Save** / **Deploy**

**Option B: Supabase CLI**
```powershell
supabase functions deploy check-devices
```

### Testen

**Edge Function testen:**
```powershell
.\scripts\test-edge-function.ps1
```

**Erwartetes Ergebnis:**
- ✅ Kein "Invalid URL" Fehler
- ✅ Edge Function kann EC2 Service erreichen
- ✅ Erfolgreiche Response

## Häufige URL-Fehler

### Fehler 1: Backtick in URL
**Falsch:** `http://34.204.153.169:8000\``  
**Richtig:** `http://34.204.153.169:8000`

### Fehler 2: Anführungszeichen in URL
**Falsch:** `"http://34.204.153.169:8000"`  
**Richtig:** `http://34.204.153.169:8000`

### Fehler 3: Trailing Slash
**Falsch:** `http://34.204.153.169:8000/`  
**Richtig:** `http://34.204.153.169:8000`

**Hinweis:** Der Code entfernt jetzt automatisch diese Fehler!

### Fehler 4: Falsche IP-Adresse
**Falsch:** `http://34.204.153.169:8000` (wenn IP sich geändert hat)  
**Richtig:** Aktuelle EC2 Public IP prüfen in AWS Console

## Prüfe: EC2 IP-Adresse

**AWS Console:**
1. **EC2** → **Instances** → Deine Instance
2. Prüfe **Public IPv4 address**
3. Falls anders als `34.204.153.169`, URL aktualisieren!

## Zusammenfassung

**Problem:** Invalid URL durch ungültige Zeichen in Environment Variable

**Lösung:**
1. ✅ **Code säubert URL automatisch** (entfernt Backticks, Anführungszeichen, trailing slashes)
2. ✅ **FRITZ_SERVICE_URL in Supabase prüfen** (sollte sein: `http://34.204.153.169:8000`)
3. ✅ **Edge Function neu deployen**

**Nach Fix:**
- ✅ Kein "Invalid URL" Fehler mehr
- ✅ Edge Function kann EC2 Service erreichen

