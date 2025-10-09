# Jungengesellschaft Website

Eine moderne Webanwendung für Event-Management und Gemeinschaftsbildung, entwickelt mit React und Supabase.

## 🚀 Features

### Für alle Benutzer
- **Interaktiver Kalender**: Entdecken Sie kommende Events und Veranstaltungen
- **Event-Details**: Detaillierte Informationen zu jedem Event
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Accessibility**: Barrierefreie Benutzeroberfläche

### Für registrierte Mitglieder
- **Event-Anfragen**: Schlagen Sie eigene Events vor
- **Benutzerprofil**: Verwalten Sie Ihre persönlichen Informationen
- **Event-Tracking**: Verfolgen Sie Ihre Event-Anfragen

### Für Administratoren
- **Event-Management**: Erstellen, bearbeiten und löschen Sie Events
- **Anfrage-Verwaltung**: Genehmigen oder lehnen Sie Event-Anfragen ab
- **Benutzer-Verwaltung**: Verwalten Sie Benutzerrollen und Berechtigungen
- **Admin-Dashboard**: Übersichtliche Verwaltung aller Funktionen

## 🛠 Technologie-Stack

### Frontend
- **React 18**: Moderne UI-Bibliothek
- **React Router**: Client-side Routing
- **Tailwind CSS**: Utility-first CSS Framework
- **React Big Calendar**: Kalender-Komponente
- **Lucide React**: Icon-Bibliothek
- **Moment.js**: Datum/Zeit-Management

### Backend & Database
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Relationale Datenbank
- **Row Level Security (RLS)**: Sicherheitsrichtlinien
- **Supabase Auth**: Authentifizierungssystem

## 📁 Projektstruktur

```
src/
├── components/           # React-Komponenten
│   ├── Admin/           # Admin-spezifische Komponenten
│   ├── Auth/            # Authentifizierungs-Komponenten
│   ├── Calendar/        # Kalender-Komponenten
│   └── Layout/          # Layout-Komponenten
├── contexts/            # React Context (Auth)
├── pages/               # Seiten-Komponenten
├── services/            # API-Service-Schicht
├── lib/                 # Konfiguration und Utilities
└── index.css           # Globale Styles
```

## 🚀 Installation und Setup

### Voraussetzungen
- Node.js (Version 16 oder höher)
- npm oder yarn
- Supabase-Konto

### 1. Repository klonen
```bash
git clone <repository-url>
cd jungengesellschaft-website
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
Erstellen Sie eine `.env.local` Datei im Projektverzeichnis:

```env
REACT_APP_SUPABASE_URL=https://wthsritnjosieqxpprsl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aHNyaXRuam9zaWVxeHBwcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDEwNjAsImV4cCI6MjA3NTUxNzA2MH0.kIdmad-ohH_r2Ss6OsoqMbZw10cgNiF0FDj1zbgszlE
```

### 4. Datenbank-Schema einrichten
Führen Sie das SQL-Script in `database/schema.sql` in Ihrem Supabase-Dashboard aus:

1. Öffnen Sie Ihr Supabase-Projekt
2. Gehen Sie zu "SQL Editor"
3. Kopieren Sie den Inhalt von `database/schema.sql`
4. Führen Sie das Script aus

### 5. Anwendung starten
```bash
npm start
```

Die Anwendung ist nun unter `http://localhost:3000` verfügbar.

## 🗄 Datenbank-Schema

### Tabellen

#### `profiles`
- Benutzerprofile mit Rollen (admin, member, guest)
- Automatische Erstellung bei Registrierung

#### `events`
- Genehmigte Events
- Vollständige Event-Informationen

#### `event_requests`
- Event-Anfragen von Benutzern
- Status-Tracking (pending, approved, rejected)

### Row Level Security (RLS)
- Sichere Datenzugriffe basierend auf Benutzerrollen
- Administratoren haben Vollzugriff
- Benutzer können nur ihre eigenen Daten verwalten

## 🔐 Authentifizierung und Autorisierung

### Benutzerrollen
- **Guest**: Kann Events ansehen
- **Member**: Kann Events ansehen und anfragen
- **Admin**: Vollzugriff auf alle Funktionen

### Sicherheitsfeatures
- JWT-basierte Authentifizierung
- Row Level Security in der Datenbank
- Sichere API-Endpunkte
- Passwort-Validierung

## 📱 Responsive Design

Die Anwendung ist vollständig responsive und optimiert für:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## ♿ Accessibility

- ARIA-Labels für Screen Reader
- Keyboard-Navigation
- Hoher Kontrast
- Fokus-Indikatoren
- Semantische HTML-Struktur

## 🚀 Deployment

### Build für Produktion
```bash
npm run build
```

### Umgebungsvariablen für Produktion
Stellen Sie sicher, dass die Produktions-Umgebungsvariablen korrekt gesetzt sind:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

### Empfohlene Hosting-Plattformen
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🧪 Testing

```bash
# Tests ausführen
npm test

# Tests mit Coverage
npm run test -- --coverage
```

## 📝 API-Dokumentation

### Event API
- `getEvents(startDate, endDate)`: Events abrufen
- `createEvent(eventData)`: Event erstellen (Admin)
- `updateEvent(eventId, updates)`: Event aktualisieren (Admin)
- `deleteEvent(eventId)`: Event löschen (Admin)

### Event Request API
- `getEventRequests(status)`: Event-Anfragen abrufen
- `createEventRequest(requestData)`: Event-Anfrage erstellen
- `approveEventRequest(requestId, reviewedBy)`: Anfrage genehmigen (Admin)
- `rejectEventRequest(requestId, reviewNotes, reviewedBy)`: Anfrage ablehnen (Admin)

### Profile API
- `getProfiles()`: Alle Profile abrufen (Admin)
- `updateUserRole(userId, role)`: Benutzerrolle aktualisieren (Admin)

## 🔧 Konfiguration

### Supabase-Konfiguration
Die Supabase-Konfiguration befindet sich in `src/lib/supabase.js`:

```javascript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
```

### Tailwind CSS
Konfiguration in `tailwind.config.js` mit benutzerdefinierten Farben und Schriftarten.

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe `LICENSE` Datei für Details.

## 📞 Support

Bei Fragen oder Problemen:
- Erstellen Sie ein Issue im Repository
- Kontaktieren Sie das Entwicklungsteam

## 🔄 Changelog

### Version 1.0.0
- Initiale Version
- Event-Kalender
- Benutzer-Authentifizierung
- Admin-Panel
- Event-Anfrage-System
- Responsive Design
- Accessibility-Features

---

**Entwickelt mit ❤️ für die Jungengesellschaft**
