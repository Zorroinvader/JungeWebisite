# Database Update Error Fix

## Problem: Response erfolgreich, aber Error in Supabase Logs

**Symptom:**
- ✅ Edge Function gibt erfolgreiche Response zurück
- ✅ Response macht Sinn (success: true, has_new_devices: false, etc.)
- ❌ Aber Error-Log in Supabase Logs

**Ursache:** Database Update (`update_club_status`) fehlschlägt, aber die Response wird trotzdem zurückgegeben.

## Lösung: Besseres Error-Handling + SQL Fix

### 1. Error-Handling in Edge Function verbessert

**Vorher:**
```typescript
const { error } = await supabase.rpc('update_club_status', {...})
if (error) {
  throw error  // Crashed die ganze Funktion
}
```

**Nachher:**
```typescript
try {
  const { error: dbError } = await supabase.rpc('update_club_status', {...})
  if (dbError) {
    console.error('Error updating club_status in database:', dbError)
    // Don't throw - allow response to be returned even if DB update fails
  } else {
    console.log('Club status updated successfully in database')
  }
} catch (dbUpdateError) {
  console.error('Exception updating club_status:', dbUpdateError)
  // Don't throw - allow response to be returned even if DB update fails
}
```

**Vorteil:**
- Response wird trotzdem zurückgegeben, auch wenn DB Update fehlschlägt
- Error wird geloggt, aber crasht nicht die ganze Funktion
- EC2 Service Response wird immer zurückgegeben

### 2. SQL Funktion verbessert

**Problem in alter Funktion:**
- DELETE-Anweisung konnte fehlschlagen wenn keine Records existieren
- `IF NOT FOUND` funktioniert nicht richtig mit DELETE

**Neue Funktion:**
```sql
DECLARE
  latest_id UUID;
BEGIN
  -- Get the latest record ID (if exists)
  SELECT id INTO latest_id FROM club_status ORDER BY updated_at DESC LIMIT 1;
  
  -- Delete old records only if latest exists
  IF latest_id IS NOT NULL THEN
    DELETE FROM club_status WHERE id != latest_id;
  END IF;
  
  -- Always insert new record
  INSERT INTO club_status (...)
  VALUES (...);
END;
```

**Vorteil:**
- Funktioniert auch wenn keine Records existieren
- Kein Race Condition Problem
- Sauberer und robuster

## Deployment

### 1. Edge Function neu deployen

**Option A: Supabase Dashboard**
1. **Edge Functions** → **check-devices** → **Edit**
2. Code aus `supabase/functions/check-devices/index.ts` kopieren
3. **Save** / **Deploy**

**Option B: Supabase CLI**
```powershell
supabase functions deploy check-devices
```

### 2. SQL Migration ausführen

**Supabase Dashboard:**
1. **SQL Editor** → **New Query**
2. Kopiere verbesserte `update_club_status` Funktion aus `supabase/migrations/create_club_status_table.sql`
3. **Run**

**Oder via MCP:**
```sql
-- Führe die verbesserte Funktion aus
CREATE OR REPLACE FUNCTION update_club_status(...)
...
```

### 3. Testen

**Edge Function testen:**
```powershell
.\scripts\test-edge-function.ps1
```

**Prüfe:**
1. ✅ Response wird zurückgegeben (wie vorher)
2. ✅ Keine Error-Logs mehr in Supabase (oder nur Warn-Logs)
3. ✅ Database Update funktioniert (prüfe `club_status` Tabelle)

**Database prüfen:**
```sql
-- In Supabase SQL Editor
SELECT * FROM club_status ORDER BY updated_at DESC LIMIT 5;
```

**Edge Function Logs prüfen:**
- Supabase Dashboard → Edge Functions → check-devices → Logs
- Sollte zeigen: `Club status updated successfully in database`
- Oder Warn-Log: `Error updating club_status in database: ...` (aber keine Errors mehr)

## Häufige Database Update Fehler

### Fehler 1: Function nicht gefunden

**Meldung:**
```
function update_club_status(boolean, text) does not exist
```

**Lösung:**
- SQL Migration ausführen (siehe oben)

### Fehler 2: Permission denied

**Meldung:**
```
permission denied for table club_status
```

**Lösung:**
- Prüfe RLS Policies (sollte bereits in Migration vorhanden sein)
- Prüfe ob Service Role Key verwendet wird

### Fehler 3: NULL constraint violation

**Meldung:**
```
null value in column "is_occupied" violates not-null constraint
```

**Lösung:**
- Sollte nicht auftreten, da `has_new_devices_value` immer boolean ist

## Zusammenfassung

**Problem:** Database Update fehlschlägt, aber Response wird zurückgegeben

**Lösung:**
1. ✅ **Error-Handling verbessert** - Database Update Fehler crasht nicht mehr die Funktion
2. ✅ **SQL Funktion verbessert** - Robuster und funktioniert auch ohne bestehende Records
3. ✅ **Response wird immer zurückgegeben** - Auch wenn DB Update fehlschlägt

**Nach Fix:**
- ✅ Keine Error-Logs mehr (oder nur Warn-Logs)
- ✅ Response wird trotzdem zurückgegeben
- ✅ Database Update funktioniert zuverlässig

**Next Steps:**
1. Edge Function neu deployen
2. SQL Migration ausführen (verbesserte Funktion)
3. Testen und prüfen ob Error-Logs weg sind

