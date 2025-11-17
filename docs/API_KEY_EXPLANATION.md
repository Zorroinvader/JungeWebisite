# API Key Erklärung - FRITZ_SERVICE_API_KEY

## Was ist der API Key?

Der API Key ist ein **sicheres Passwort**, das verhindert, dass jeder deinen Service aufrufen kann. Er schützt den `/check-devices` Endpoint vor unautorisierten Zugriffen.

## Wo kommt der API Key her?

Der API Key wird von **dir selbst erstellt** und in **Railway Variables** gesetzt.

### Schritt 1: Erstelle einen sicheren API Key

Du kannst einen beliebigen sicheren String verwenden. Beispiele:

**Option A: Zufälliger String (Empfohlen)**
```
fritz-service-secret-key-2024-xyz123
```

**Option B: UUID**
```
550e8400-e29b-41d4-a716-446655440000
```

**Option C: Passwort-Generator**
- Verwende einen Passwort-Generator (z.B. https://passwordsgenerator.net/)
- Mindestens 32 Zeichen
- Mix aus Buchstaben, Zahlen, Sonderzeichen

### Schritt 2: Setze den API Key in Railway

1. Gehe zu **Railway Dashboard**
2. Wähle dein Projekt → Service
3. Klicke auf **"Variables"** Tab
4. Klicke **"+ New Variable"**
5. **Name**: `FRITZ_SERVICE_API_KEY`
6. **Value**: `[dein-sicheres-passwort]` (z.B. `fritz-service-secret-key-2024-xyz123`)
7. Klicke **"Add"** oder **"Save"**

### Schritt 3: Verwende den API Key

#### In Supabase Secrets

Gehe zu Supabase Dashboard → Edge Functions → Secrets:

1. **Name**: `FRITZ_SERVICE_API_KEY`
2. **Value**: `[derselbe-wert-wie-in-railway]` (muss identisch sein!)

#### In API Requests

```bash
# Beispiel mit curl
curl -X POST https://adequate-bravery-production-3a76.up.railway.app/check-devices \
  -H "Authorization: Bearer fritz-service-secret-key-2024-xyz123" \
  -H "Content-Type: application/json"
```

#### In Supabase Edge Function

Der Edge Function Code verwendet den API Key automatisch:

```typescript
// In supabase/functions/check-devices/index.ts
const apiKey = Deno.env.get('FRITZ_SERVICE_API_KEY');

const response = await fetch(`${serviceUrl}/check-devices`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

## Wichtig: API Key muss übereinstimmen

- **Railway Variable**: `FRITZ_SERVICE_API_KEY` = `dein-passwort`
- **Supabase Secret**: `FRITZ_SERVICE_API_KEY` = `dein-passwort` (muss identisch sein!)

## Sicherheit

### ✅ Best Practices

1. **Langer, zufälliger String** (mindestens 32 Zeichen)
2. **Nicht im Git-Repo committen**
3. **Nur in Railway Variables und Supabase Secrets**
4. **Regelmäßig rotieren** (alle paar Monate)

### ❌ Nicht tun

- Nicht im Code hardcoden
- Nicht in Git committen
- Nicht öffentlich teilen
- Nicht zu einfach (z.B. "password123")

## Falls kein API Key gesetzt ist

Wenn `FRITZ_SERVICE_API_KEY` in Railway **nicht gesetzt** ist:
- Der Service akzeptiert **alle Requests** (keine Authentifizierung)
- **Nur für Development/Testing!**
- **Für Produktion immer setzen!**

## Beispiel: Kompletter Setup

### 1. Erstelle API Key
```
MeinSicheresFritzServiceKey2024!XYZ123
```

### 2. Setze in Railway
```
Variable: FRITZ_SERVICE_API_KEY
Value: MeinSicheresFritzServiceKey2024!XYZ123
```

### 3. Setze in Supabase
```
Secret: FRITZ_SERVICE_API_KEY
Value: MeinSicheresFritzServiceKey2024!XYZ123
```

### 4. Teste
```bash
curl -X POST https://adequate-bravery-production-3a76.up.railway.app/check-devices \
  -H "Authorization: Bearer MeinSicheresFritzServiceKey2024!XYZ123"
```

## Troubleshooting

### "Invalid API key" Fehler
- Prüfe ob der API Key in Railway Variables gesetzt ist
- Prüfe ob der API Key in Supabase Secrets gesetzt ist
- Prüfe ob beide **identisch** sind (keine Leerzeichen, Groß-/Kleinschreibung)

### "Missing Authorization header" Fehler
- Stelle sicher, dass der Header `Authorization: Bearer [key]` gesetzt ist
- Prüfe ob der Header korrekt formatiert ist

### Service akzeptiert alle Requests
- Prüfe ob `FRITZ_SERVICE_API_KEY` in Railway Variables gesetzt ist
- Falls nicht gesetzt: Service ist im "Development Mode" (unsicher!)

## Zusammenfassung

1. ✅ **Erstelle** einen sicheren API Key (32+ Zeichen)
2. ✅ **Setze** ihn in Railway Variables als `FRITZ_SERVICE_API_KEY`
3. ✅ **Setze** ihn in Supabase Secrets als `FRITZ_SERVICE_API_KEY` (identisch!)
4. ✅ **Verwende** ihn in Requests: `Authorization: Bearer [dein-key]`

Der API Key ist dein **Passwort** für den Service - behandle ihn wie ein Passwort!

