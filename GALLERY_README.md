# Bildergalerie - Junge Gesellschaft Clubhaus

## 📸 Übersicht

Diese moderne Bildergalerie zeigt die Räumlichkeiten, Ausstattung und Atmosphäre des Junge Gesellschaft Clubhauses in Wedelheine.

## 🖼️ Bilderquelle

Die Bilder wurden automatisch von der offiziellen Wix-Website der Junge Gesellschaft heruntergeladen:
- **Quelle**: [https://jungegesellschaft.wixsite.com/junge-gesellschaft-p/blank-3](https://jungegesellschaft.wixsite.com/junge-gesellschaft-p/blank-3)
- **Anzahl**: 24 hochwertige Bilder
- **Formate**: JPG und PNG

## 🎨 Features der Galerie

### ✨ Moderne UI/UX
- **Responsive Design**: Optimiert für alle Geräte (Desktop, Tablet, Mobile)
- **Dark Mode Support**: Automatische Anpassung an das Design-System
- **Smooth Animations**: Hover-Effekte und Übergänge
- **Touch-Friendly**: Mobile-optimierte Bedienung

### 🔍 Interaktive Funktionen
- **Kategorien-Filter**: Bilder nach Bereichen filtern (Ausstattung, Impressionen, Events, etc.)
- **Lightbox-Modal**: Vollbildansicht mit Navigation
- **Tastatur-Navigation**: Pfeiltasten für Navigation, ESC zum Schließen
- **Download-Funktion**: Bilder direkt herunterladen
- **Bild-Informationen**: Titel und Kategorie anzeigen

### 📱 Responsive Layout
- **Desktop**: 5-spaltiges Grid
- **Tablet**: 3-4-spaltiges Grid  
- **Mobile**: 1-2-spaltiges Grid
- **Adaptive Bildgrößen**: Optimale Darstellung auf allen Geräten

## 🏗️ Technische Details

### Komponenten
- **ImageGallery.js**: Hauptkomponente mit allen Funktionen
- **AboutPage.js**: Integration in die Über-uns-Seite

### Kategorien
- **Gebäude**: Clubhaus Außenansichten
- **Ausstattung**: Möbel und Equipment
- **Impressionen**: Innenräume und Atmosphäre
- **Events**: Veranstaltungen und Aktivitäten
- **Details**: Architektur und Einzelheiten
- **Panorama**: Weitwinkelaufnahmen
- **Logo**: Vereinslogo und Branding

### Performance
- **Lazy Loading**: Bilder werden bei Bedarf geladen
- **Optimierte Größen**: Verschiedene Auflösungen für verschiedene Geräte
- **Effiziente Navigation**: Smooth Scrolling und Animationen

## 🚀 Verwendung

### In der Anwendung
Die Galerie ist automatisch in der "Über uns" Seite integriert und zeigt alle verfügbaren Bilder mit modernem Design.

### Für Entwickler
```jsx
import ImageGallery from '../components/UI/ImageGallery'

// Einfache Verwendung
<ImageGallery title="Meine Galerie" />

// Mit eigenen Bildern
const customImages = [
  { src: '/path/to/image.jpg', alt: 'Beschreibung', category: 'Kategorie' }
]
<ImageGallery images={customImages} title="Custom Gallery" />
```

## 📂 Dateistruktur

```
src/
├── components/UI/
│   └── ImageGallery.js          # Hauptkomponente
├── pages/
│   └── AboutPage.js             # Integration
public/assets/
├── 2e24d4_*.jpg                 # Clubhaus-Bilder
└── Wappen-Junge-Gesellschaft-*.png  # Vereinslogo
```

## 🎯 Design-Prinzipien

### Farben
- **Primär**: #A58C81 (Warmes Braun)
- **Sekundär**: #252422 (Dunkles Grau)
- **Hintergrund**: #F4F1E8 (Warmes Beige)
- **Akzente**: Gradienten und Schatten

### Typografie
- **Font**: Clash Grotesk (konsistent mit der Website)
- **Hierarchie**: Klare Größenunterschiede
- **Lesbarkeit**: Hoher Kontrast für Accessibility

### Interaktion
- **Hover-Effekte**: Subtile Animationen
- **Fokus-States**: Keyboard-Navigation
- **Feedback**: Loading-States und Übergänge

## 🔧 Anpassungen

### Neue Bilder hinzufügen
1. Bilder in `public/assets/` speichern
2. ImageGallery-Komponente mit neuen Bild-Objekten erweitern
3. Kategorien bei Bedarf anpassen

### Design-Anpassungen
- Farben in der Komponente anpassen
- Layout-Grid in CSS-Klassen ändern
- Animationen in Tailwind-Klassen modifizieren

## 📱 Mobile Optimierung

- **Touch-Gesten**: Swipe-Navigation im Modal
- **Responsive Grid**: Automatische Anpassung
- **Performance**: Optimierte Bildgrößen
- **Accessibility**: ARIA-Labels und Screen-Reader-Support

---

**Entwickelt mit ❤️ für die Junge Gesellschaft Pferdestall Wedes-Wedel e.V.**
