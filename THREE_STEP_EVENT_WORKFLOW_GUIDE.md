# 3-Schritt Event-Anfrage Workflow - Dokumentation

## Überblick

Das neue 3-Schritt Event-Anfrage System ermöglicht es jedem Besucher der Website, eine Event-Anfrage ohne Login zu stellen. Der Prozess durchläuft drei Hauptphasen mit zwei Administrator-Prüfpunkten, bevor das Event endgültig im Kalender erscheint.

## Workflow-Phasen

### Phase 1: Initiale Anfrage (Öffentlich zugänglich)
**Status: `initial`**

- **Wer:** Jeder Website-Besucher (kein Login erforderlich)
- **Was wird eingegeben:**
  - Event-Name
  - Name des Antragstellers
  - E-Mail-Adresse
  - Telefonnummer (optional)
  - Gewünschte Tage (Startdatum - Enddatum)
  - Event-Typ (Privat / Öffentlich)
  - Initiale Anmerkungen/Notizen

- **Zugriff:** Button "Event anfragen" auf der Homepage (grün)
- **Komponente:** `PublicEventRequestForm.js`

### Phase 2: Administrator prüft initiale Anfrage
**Status: `initial_accepted` oder `rejected`**

- **Wer:** Administrator
- **Was passiert:**
  - Admin sieht neue Anfragen im Admin-Panel unter "3-Schritt Anfragen"
  - Admin kann Anfrage akzeptieren oder ablehnen
  - Bei Akzeptanz: Nutzer erhält Benachrichtigung und kann Details ausfüllen
  - Bei Ablehnung: Nutzer erhält Ablehnungsgrund

- **Komponente:** `ThreeStepRequestManagement.js`
- **API:** `eventRequestsAPI.acceptInitialRequest()` oder `eventRequestsAPI.rejectRequest()`

### Phase 3: Nutzer füllt detaillierte Informationen aus
**Status: `details_submitted`**

- **Wer:** Der Antragsteller
- **Was wird eingegeben:**
  - Genaue Start- und Endzeit (mit Uhrzeit)
  - Schlüsselannahme-Zeit (Datum & Uhrzeit)
  - Schlüsselrückgabe-Zeit (Datum & Uhrzeit)
  - **Wichtig:** Schlüsselübergabe kann an einem anderen Tag sein!
  - Upload des signierten Mietvertrags (PDF, max 10MB)
  - Zusätzliche Anmerkungen

- **Zugriff:** 
  - Link in der E-Mail-Benachrichtigung
  - Über "Anfrage verfolgen" Button auf Homepage
  - Eingabe der E-Mail-Adresse zum Abrufen der Anfragen

- **Komponenten:** 
  - `EventRequestTrackingPage.js` (Tracking-Seite)
  - `DetailedEventForm.js` (Detailformular)
  - `RequestTimeline.js` (Status-Timeline)

- **API:** `eventRequestsAPI.submitDetailedRequest()`

### Phase 4: Administrator gibt endgültige Freigabe
**Status: `final_accepted`**

- **Wer:** Administrator
- **Was passiert:**
  - Admin überprüft die detaillierten Informationen
  - Admin kann den signierten Mietvertrag herunterladen und prüfen
  - Bei finaler Freigabe: Event wird im Kalender erstellt
  - Event ist nun für alle sichtbar
  - Temporäre Blockierung wird aufgehoben

- **Komponente:** `ThreeStepRequestManagement.js`
- **API:** `eventRequestsAPI.finalAcceptRequest()`

## Kalender-Integration

### Temporäre Blockierung
**Status: `initial_accepted` oder `details_submitted`**

Während der Phasen 2-3 werden die gewünschten Tage im Kalender als **"Vorübergehend blockiert"** markiert:

- **Für normale Nutzer:** Orange/gelb gestrichelte Markierung mit Text "Vorübergehend blockiert"
- **Für Administratoren:** Zeigt Event-Name mit "(Vorläufig)" und Antragsteller-Info
- **Styling:** Orange Hintergrund (`#f59e0b`), gestrichelte Linie, kursiv

### Finale Event-Darstellung
**Status: `final_accepted`**

Nach finaler Freigabe:
- Event erscheint normal im Kalender
- Alle Event-Details sind sichtbar
- Schlüsselübergabe-Informationen sind für Admin sichtbar

## Datenbank-Schema

### Neue Felder in `event_requests` Tabelle:

```sql
-- Workflow-Status
request_stage: ENUM('initial', 'initial_accepted', 'details_submitted', 'final_accepted', 'rejected')

-- Antragsteller-Info (für nicht-eingeloggte Nutzer)
requester_email: TEXT
requester_name: TEXT
requester_phone: TEXT

-- Initiale Anfrage-Daten
requested_days: TEXT (JSON-Array von Datumsstrings)
is_private: BOOLEAN
initial_notes: TEXT

-- Detaillierte Event-Informationen
exact_start_datetime: TIMESTAMP
exact_end_datetime: TIMESTAMP
key_handover_datetime: TIMESTAMP
key_return_datetime: TIMESTAMP
signed_contract_url: TEXT
schluesselannahme_time: TEXT (optional zusätzlich)
schluesselabgabe_time: TEXT (optional zusätzlich)
additional_notes: TEXT

-- Timestamps für jede Phase
initial_accepted_at: TIMESTAMP
details_submitted_at: TIMESTAMP
final_accepted_at: TIMESTAMP

-- Admin-Notizen & Ablehnungsgründe
admin_notes: TEXT
rejection_reason: TEXT
```

### Database View für temporär blockierte Daten:

```sql
CREATE VIEW temporarily_blocked_dates AS
SELECT id, event_name, requested_days, exact_start_datetime, exact_end_datetime, 
       is_private, request_stage, initial_accepted_at
FROM event_requests
WHERE request_stage IN ('initial_accepted', 'details_submitted')
ORDER BY initial_accepted_at ASC;
```

## API-Endpunkte

### Event Request API (`httpApi.js`)

```javascript
// Schritt 1: Initiale Anfrage erstellen
eventRequestsAPI.createInitialRequest(data)

// Schritt 2: Admin akzeptiert initiale Anfrage
eventRequestsAPI.acceptInitialRequest(id, adminNotes)

// Schritt 2b: Admin lehnt Anfrage ab
eventRequestsAPI.rejectRequest(id, rejectionReason)

// Schritt 3: Nutzer sendet Details
eventRequestsAPI.submitDetailedRequest(id, data)

// Schritt 4: Admin gibt finale Freigabe
eventRequestsAPI.finalAcceptRequest(id)

// Hilfs-Methoden
eventRequestsAPI.getByStage(stage)
eventRequestsAPI.getByEmail(email)
```

### Storage API für Datei-Uploads

```javascript
// Vertrag hochladen
storageAPI.uploadSignedContract(file, requestId)
// Returns: { success: true, url: string, fileName: string }

// Datei löschen
storageAPI.deleteFile(fileName)
```

### Temporär blockierte Daten API

```javascript
// Alle temporär blockierten Zeiträume abrufen
blockedDatesAPI.getTemporarilyBlocked()
```

## Komponenten-Übersicht

### Neu erstellte Komponenten:

1. **`PublicEventRequestForm.js`**
   - Initiales Anfrageformular (kein Login nötig)
   - Validierung von Daten
   - Success-Animation

2. **`DetailedEventForm.js`**
   - Detailliertes Formular für Phase 3
   - PDF-Upload mit Drag & Drop
   - Validierung von Zeitangaben
   - Progress-Bar für Upload

3. **`RequestTimeline.js`**
   - Visuelle Timeline des Anfrage-Status
   - Zeigt alle 4 Phasen
   - Farbcodierung nach Status
   - Admin-Notizen-Anzeige

4. **`ThreeStepRequestManagement.js`**
   - Admin-Panel für 3-Schritt-Workflow
   - Filter nach Status/Phase
   - Aktions-Buttons je nach Phase
   - Modal für Akzeptieren/Ablehnen

5. **`EventRequestTrackingPage.js`**
   - Öffentliche Tracking-Seite
   - E-Mail-basierte Suche
   - Zeigt alle Anfragen eines Nutzers
   - Integration mit DetailedEventForm

### Aktualisierte Komponenten:

1. **`HomePage.js`**
   - Neuer Button "Event anfragen" (grün)
   - Neuer Button "Anfrage verfolgen" (blau)
   - Integration von PublicEventRequestForm

2. **`EventCalendar.js`**
   - Lädt temporär blockierte Daten
   - Spezielle Styling für temporary_block
   - Unterschiedliche Ansicht für Admin/User

3. **`AdminPanelClean.js`**
   - Neuer Tab "3-Schritt Anfragen"
   - Integration von ThreeStepRequestManagement

4. **`App.js`**
   - Neue Route: `/event-tracking`

## Routing

```javascript
// Öffentliche Routen
/ - HomePage (mit Event-Anfrage-Button)
/event-tracking - EventRequestTrackingPage (öffentlich)

// Admin-Routen
/admin - AdminPanelClean (mit 3-Schritt-Anfragen Tab)
```

## Storage-Setup (Supabase)

### Bucket-Konfiguration

1. Erstellen Sie einen neuen Storage Bucket in Supabase:
   - **Name:** `signed-contracts`
   - **Public:** false
   - **File size limit:** 10MB
   - **Allowed MIME types:** `application/pdf`

2. Storage Policies:

```sql
-- Policy: Allow authenticated uploads
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'signed-contracts' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow public access for admins
CREATE POLICY "Admin can view contracts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'signed-contracts' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Users can view their own contracts
CREATE POLICY "Users can view own contracts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'signed-contracts' AND
  storage.foldername(name)[1] = auth.uid()::text
);
```

## Benachrichtigungen

### Trigger für Status-Änderungen

```sql
-- Trigger-Funktion für Benachrichtigungen
CREATE OR REPLACE FUNCTION notify_request_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Hier können Sie E-Mail-Benachrichtigungen implementieren
    -- z.B. über Supabase Edge Functions
    RAISE NOTICE 'Request % stage changed to %', NEW.id, NEW.request_stage;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER event_request_stage_change_trigger
    AFTER UPDATE OF request_stage ON public.event_requests
    FOR EACH ROW
    WHEN (OLD.request_stage IS DISTINCT FROM NEW.request_stage)
    EXECUTE FUNCTION notify_request_stage_change();
```

## Sicherheit & Permissions

### Row Level Security (RLS) Policies

```sql
-- Jeder kann initiale Anfragen erstellen
CREATE POLICY "Anyone can create initial event requests" 
ON event_requests FOR INSERT 
WITH CHECK (request_stage = 'initial');

-- Nutzer können eigene Anfragen per E-Mail abrufen
CREATE POLICY "Users can view their own requests by email" 
ON event_requests FOR SELECT 
USING (requester_email = current_setting('request.jwt.claims', true)::json->>'email' 
       OR requested_by = auth.uid());

-- Nutzer können ihre akzeptierten Anfragen aktualisieren
CREATE POLICY "Users can update their pending requests" 
ON event_requests FOR UPDATE 
USING (
    (requester_email = current_setting('request.jwt.claims', true)::json->>'email' 
     OR requested_by = auth.uid())
    AND request_stage IN ('initial_accepted')
);

-- Admins haben vollen Zugriff
CREATE POLICY "Admins have full access to event_requests" 
ON event_requests FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);
```

## Migration durchführen

1. **Führen Sie die SQL-Migration aus:**
   ```bash
   # In Supabase SQL Editor
   # Datei: database/three-step-workflow-migration.sql
   ```

2. **Erstellen Sie den Storage Bucket:**
   - Gehen Sie zu Storage in Supabase Dashboard
   - Erstellen Sie Bucket "signed-contracts"
   - Konfigurieren Sie die Policies

3. **Testen Sie die Integration:**
   - Öffentliche Anfrage erstellen
   - Admin-Akzeptanz testen
   - Details-Formular ausfüllen
   - Finale Freigabe testen

## Testing-Checkliste

### Nutzer-Flow:
- [ ] Öffentliche Anfrage kann ohne Login erstellt werden
- [ ] E-Mail wird korrekt gespeichert
- [ ] Anfrage erscheint in Tracking-Seite
- [ ] Nach Admin-Akzeptanz kann Details-Formular ausgefüllt werden
- [ ] PDF-Upload funktioniert (max 10MB)
- [ ] Zeitvalidierung funktioniert korrekt
- [ ] Success-Nachrichten werden angezeigt

### Admin-Flow:
- [ ] Neue Anfragen erscheinen in "3-Schritt Anfragen"
- [ ] Filter nach Status funktioniert
- [ ] Anfrage kann akzeptiert werden mit Notizen
- [ ] Anfrage kann abgelehnt werden mit Grund
- [ ] Details-Phase zeigt hochgeladenen Vertrag
- [ ] Vertrag kann heruntergeladen werden
- [ ] Finale Freigabe erstellt Event im Kalender

### Kalender-Integration:
- [ ] Temporäre Blockierung wird angezeigt (Phase 2-3)
- [ ] Admin sieht Event-Name bei temp. Blockierung
- [ ] Normale Nutzer sehen "Vorübergehend blockiert"
- [ ] Nach finaler Freigabe: Event wird normal angezeigt
- [ ] Temporäre Blockierung verschwindet nach Freigabe

## Troubleshooting

### Problem: Anfrage wird nicht in Tracking-Seite angezeigt
**Lösung:** 
- Prüfen Sie, ob die E-Mail-Adresse korrekt eingegeben wurde
- Prüfen Sie RLS-Policies in Supabase
- Prüfen Sie Browser-Console auf Fehler

### Problem: PDF-Upload schlägt fehl
**Lösung:**
- Prüfen Sie Storage Bucket Permissions
- Stellen Sie sicher, dass Datei < 10MB
- Prüfen Sie, dass Datei-Typ PDF ist
- Prüfen Sie Storage Policies

### Problem: Kalender zeigt keine temporären Blockierungen
**Lösung:**
- Prüfen Sie, ob View `temporarily_blocked_dates` existiert
- Prüfen Sie `blockedDatesAPI.getTemporarilyBlocked()` Aufruf
- Prüfen Sie Browser-Console für Fehler
- Prüfen Sie EventCalendar.js event styling

### Problem: Admin sieht keine neuen Anfragen
**Lösung:**
- Prüfen Sie Admin-Rolle in Profiles-Tabelle
- Prüfen Sie RLS-Policy für Admins
- Aktualisieren Sie die Seite
- Prüfen Sie request_stage Filter

## Zukünftige Erweiterungen

1. **E-Mail-Benachrichtigungen:**
   - Implementierung über Supabase Edge Functions
   - Automatische Benachrichtigungen bei Status-Änderungen

2. **SMS-Benachrichtigungen:**
   - Optional über Twilio oder ähnliche Services
   - Bei kritischen Status-Änderungen

3. **Kalendar-Integration:**
   - .ics Export für genehmigte Events
   - Google Calendar Integration

4. **Erweiterte Admin-Features:**
   - Bulk-Actions für mehrere Anfragen
   - Statistiken & Reports
   - Export-Funktion für Anfragen

5. **Nutzer-Dashboard:**
   - Eigenes Dashboard für häufige Antragsteller
   - Historie aller Anfragen
   - Schnelle Wiederholung früherer Events

## Support & Wartung

Bei Fragen oder Problemen:
1. Prüfen Sie diese Dokumentation
2. Prüfen Sie Browser Console auf Fehler
3. Prüfen Sie Supabase Logs
4. Kontaktieren Sie den Entwickler

---

**Version:** 1.0  
**Letzte Aktualisierung:** 2025-10-11  
**Autor:** AI Assistant

