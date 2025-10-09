# Setup-Anleitung für Jungengesellschaft Website

## 🚀 Schnellstart

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen einrichten
Die Supabase-Credentials sind bereits in der Anwendung konfiguriert:
- URL: `https://wthsritnjosieqxpprsl.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHNyaXRuam9zaWVxeHBwcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDEwNjAsImV4cCI6MjA3NTUxNzA2MH0.kIdmad-ohH_r2Ss6OsoqMbZw10cgNiF0FDj1zbgszlE`

### 3. Datenbank-Schema einrichten
1. Öffnen Sie Ihr Supabase-Dashboard
2. Gehen Sie zu "SQL Editor"
3. Kopieren Sie den Inhalt aus `database/schema.sql`
4. Führen Sie das Script aus

### 4. Anwendung starten
```bash
npm start
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 🔧 Erste Schritte

### Admin-Benutzer erstellen
1. Registrieren Sie sich über die Anwendung
2. In der Supabase-Datenbank die Rolle auf 'admin' setzen:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'ihre@email.de';
   ```

### Test-Events erstellen
Über das Admin-Panel können Sie Test-Events erstellen.

## 📱 Features testen

### Als Gast:
- Events im Kalender ansehen
- Event-Details öffnen

### Als Mitglied:
- Event-Anfragen stellen
- Eigene Anfragen verfolgen

### Als Admin:
- Events verwalten
- Event-Anfragen genehmigen/ablehnen
- Benutzer verwalten
- Einstellungen anpassen

## 🐛 Häufige Probleme

### Supabase-Verbindung
- Überprüfen Sie die URL und den Anon Key
- Stellen Sie sicher, dass RLS-Policies korrekt eingerichtet sind

### Authentifizierung
- Überprüfen Sie die E-Mail-Konfiguration in Supabase
- Testen Sie die Registrierung mit einer echten E-Mail-Adresse

### Kalender
- Überprüfen Sie, ob Events korrekt in der Datenbank gespeichert werden
- Testen Sie verschiedene Datumsbereiche

## 📞 Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehler
2. Schauen Sie in die Supabase-Logs
3. Erstellen Sie ein Issue mit detaillierter Fehlerbeschreibung
