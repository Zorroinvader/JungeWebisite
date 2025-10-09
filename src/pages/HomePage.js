import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, FileText, ChevronDown } from 'lucide-react'
import NewEventCalendar from '../components/Calendar/NewEventCalendar'
import SideMenu from '../components/Layout/SideMenu'
import TypewriterText from '../components/UI/TypewriterText'
import PDFLink from '../components/UI/PDFLink'

const HomePage = () => {
  const { user, isAdmin, signOut } = useAuth()
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleFirstTextComplete = () => {
    setShowSubtitle(true)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
      {/* Navigation Header - Anthropic Style with Dropdowns */}
      <nav className="w-full border-b sticky top-0 z-40" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo on the left */}
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                alt="Junge Gesellschaft Logo" 
                className="h-8 w-8 object-contain"
              />
              <Link to="/" className="text-lg font-semibold hover:opacity-80" style={{ color: '#252422' }}>Junge Gesellschaft</Link>
            </div>
            
            {/* Navigation on the right */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Start</Link>
              
              {/* Über uns Dropdown */}
              <div className="relative group">
                <Link to="/about" className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center" style={{ color: '#252422' }}>
                  Über uns
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Link>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link to="/about" className="block px-4 py-2 text-sm hover:bg-gray-50" style={{ color: '#252422' }}>
                      Vorstand & Geschichte
                    </Link>
                    <Link to="/contact" className="block px-4 py-2 text-sm hover:bg-gray-50" style={{ color: '#252422' }}>
                      Kontakt & Standort
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* FAQ Dropdown */}
              <div className="relative group">
                <Link to="/faq" className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center" style={{ color: '#252422' }}>
                  FAQ
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Link>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link to="/faq" className="block px-4 py-2 text-sm hover:bg-gray-50" style={{ color: '#252422' }}>
                      Häufige Fragen
                    </Link>
                    <Link to="/contact" className="block px-4 py-2 text-sm hover:bg-gray-50" style={{ color: '#252422' }}>
                      Kontakt aufnehmen
                    </Link>
                  </div>
                </div>
              </div>
              
              
              {/* Downloads Dropdown */}
              <div className="relative group">
                <span className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center cursor-pointer" style={{ color: '#252422' }}>
                  Downloads
                  <ChevronDown className="h-4 w-4 ml-1" />
                </span>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <PDFLink
                      href="/assets/Eintrits_Antrag.pdf"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                      style={{ color: '#252422' }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Mitgliedsantrag
                    </PDFLink>
                    <PDFLink
                      href="/assets/satzung.pdf"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                      style={{ color: '#252422' }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Vereinssatzung
                    </PDFLink>
                    <PDFLink
                      href="/assets/Junge_Geseltschaft_Hausordnung.pdf"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                      style={{ color: '#252422' }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Hausordnung
                    </PDFLink>
                    <PDFLink
                      href="/assets/Junge_Geseltschaft_Mietvertrag.pdf"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                      style={{ color: '#252422' }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Mietvertrag
                    </PDFLink>
                  </div>
                </div>
              </div>
              
              {!user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ color: '#252422' }}
                  >
                    Anmelden
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#252422' }}
                  >
                    Registrieren
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      console.log('Email clicked - navigating to profile')
                      try {
                        window.location.href = '/profile'
                      } catch (error) {
                        console.error('Navigation error:', error)
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#252422' }}
                  >
                    {user.email}
                  </button>
                  {isAdmin() && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        console.log('Logout clicked')
                        await signOut()
                        window.location.href = '/login'
                      } catch (error) {
                        console.error('Logout error:', error)
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#A58C81' }}
                  >
                    Abmelden
                  </button>
                </div>
              )}
            </div>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden inline-flex items-center px-3 py-2 rounded hover:opacity-80"
              style={{ color: '#252422' }}
              aria-label="Menü öffnen"
              onClick={() => setMobileOpen(o => !o)}
            >
              <span className="sr-only">Menü</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden px-6 pb-4 space-y-2" style={{ backgroundColor: '#F4F1E8' }}>
            <Link to="/" className="block text-sm font-medium" style={{ color: '#252422' }} onClick={() => setMobileOpen(false)}>Start</Link>
            <Link to="/about" className="block text-sm font-medium" style={{ color: '#252422' }} onClick={() => setMobileOpen(false)}>Über uns</Link>
            <Link to="/faq" className="block text-sm font-medium" style={{ color: '#252422' }} onClick={() => setMobileOpen(false)}>FAQ</Link>
            <Link to="/contact" className="block text-sm font-medium" style={{ color: '#252422' }} onClick={() => setMobileOpen(false)}>Kontakt</Link>
            {!user ? (
              <div className="pt-2 space-y-2">
                <Link to="/login" className="block text-sm font-medium" style={{ color: '#252422' }} onClick={() => setMobileOpen(false)}>Anmelden</Link>
                <Link to="/register" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md" style={{ backgroundColor: '#252422' }} onClick={() => setMobileOpen(false)}>Registrieren</Link>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => { window.location.href = '/profile' }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundColor: '#252422' }}
                >
                  {user.email}
                </button>
                {isAdmin() && (
                  <Link to="/admin" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md" style={{ backgroundColor: '#dc2626' }} onClick={() => setMobileOpen(false)}>Admin Panel</Link>
                )}
                <button
                  onClick={async () => { await signOut(); window.location.href = '/login' }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundColor: '#A58C81' }}
                >
                  Abmelden
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section - Smaller 30% */}
      <div className="w-full" style={{ backgroundColor: '#F4F1E8' }}>
        <div className="w-full px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left side - Main content (on mobile above, logo moves below/right) */}
              <div className="order-1 lg:order-1">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#252422' }}>
                  <TypewriterText 
                    text="Junge Gesellschaft" 
                    speed={150}
                    className="block"
                    onComplete={handleFirstTextComplete}
                  />
                  {showSubtitle && (
                    <TypewriterText 
                      text="Pferdestall Wedes-Wedel e.V." 
                      speed={100}
                      className="block text-lg md:text-xl mt-3 font-medium"
                      style={{ color: '#A58C81' }}
                      showCursor={false}
                    />
                  )}
                </h1>
                <p className="text-xl md:text-2xl mb-8 leading-relaxed font-normal" style={{ color: '#252422' }}>
                  Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/about"
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#252422' }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Über uns
                  </Link>
                  <Link
                    to="/faq"
                    className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2"
                    style={{ color: '#252422', borderColor: '#252422', backgroundColor: 'transparent' }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    FAQ
                  </Link>
                  <button
                    onClick={() => {
                      const calendar = document.querySelector('.rbc-calendar')
                      if (calendar) {
                        const event = new CustomEvent('openEventRequestModal', {
                          detail: { selectedDate: new Date() }
                        })
                        window.dispatchEvent(event)
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2"
                    style={{ color: '#252422', borderColor: '#A58C81', backgroundColor: 'transparent' }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Event anfragen
                  </button>
                </div>
              </div>
              
              {/* Right side - Logo/Visual (mobile right alignment) */}
              <div className="order-2 lg:order-2 flex justify-end">
                <div className="relative mb-4 md:mb-0">
                  <img 
                    src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                    alt="Junge Gesellschaft Logo" 
                    className="h-24 w-24 md:h-32 md:w-32 object-contain drop-shadow-xl"
                  />
                  <div className="absolute -inset-2 bg-white rounded-full opacity-20 blur-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Transition Section */}
      <div className="w-full h-16" style={{ 
        backgroundColor: '#F4F1E8'
      }}></div>

      {/* Main Content */}
      <div className="w-full px-6 lg:px-8 py-12" style={{ backgroundColor: '#F4F1E8' }}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Calendar Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 relative" style={{ border: '2px solid #A58C81' }}>
            {/* If user not logged in, show quick hint and mobile tap overlay */}
            {!user && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: '#666' }}>
                  Bitte anmelden, um eine Event‑Anfrage zu stellen.
                </p>
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-white rounded-md" style={{ backgroundColor: '#252422' }}>Anmelden</Link>
                  <Link to="/register" className="px-3 py-1.5 text-sm font-medium text-white rounded-md" style={{ backgroundColor: '#A58C81' }}>Registrieren</Link>
                </div>
              </div>
            )}
            {/* Make calendar header usable on small screens */}
            <div className="w-full touch-pan-x">
              {/* Mobile overlay to redirect directly on tap */}
              {!user && (
                <button
                  type="button"
                  className="absolute inset-0 z-10 md:hidden"
                  aria-label="Zum Anmelden tippen"
                  onClick={() => { window.location.href = '/login' }}
                  style={{ background: 'transparent' }}
                />
              )}
              <div className="w-full">
                <NewEventCalendar />
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8" style={{ border: '2px solid #A58C81' }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#252422' }}>Häufig gestellte Fragen</h2>
              <p className="text-lg" style={{ color: '#A58C81' }}>Antworten auf die wichtigsten Fragen rund um die Junge Gesellschaft</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-l-4 pl-4" style={{ borderColor: '#A58C81' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Wer darf Mitglied werden?</h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Der Jugendclub steht insbesondere für Junge Leute ab 16 zur Verfügung. Offizielles Mitglied kann man erst mit 16 Jahren werden.
                  </p>
                </div>
                
                <div className="border-l-4 pl-4" style={{ borderColor: '#A58C81' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Wie hoch ist der Mitgliedsbeitrag?</h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Der standardmäßige Monatsbeitrag beträgt lediglich 5 €. Höhere Beiträge sind auf freiwilliger Basis möglich.
                  </p>
                </div>
                
                <div className="border-l-4 pl-4" style={{ borderColor: '#A58C81' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Gibt es feste Öffnungszeiten?</h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Der Jugend Club steht allen Mitgliedern rund um die Uhr zur Verfügung. Schlüssel können bei Vorstandsmitgliedern abgeholt werden.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 pl-4" style={{ borderColor: '#A58C81' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Wie kann ich den Club mieten?</h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Über den Menüpunkt "Vermietung" können Sie den Jugendclub für eigene Veranstaltungen buchen. Details und Preise finden Sie dort.
                  </p>
                </div>
                
                <div className="border-l-4 pl-4" style={{ borderColor: '#A58C81' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Was ist für die Zukunft geplant?</h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Wir möchten die Junge Gesellschaft breiter aufstellen und möglichst viele Mitglieder für das Projekt gewinnen.
                  </p>
                </div>
                
                <div className="border-l-4 pl-4" style={{ borderColor: '#A58C81' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Wie kann ich Kontakt aufnehmen?</h3>
                  <p className="text-sm" style={{ color: '#666' }}>
                    Schreiben Sie uns eine E-Mail an jungegesellschaft@wedelheine.de oder besuchen Sie uns in der Alten Dorfstrasse 46.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link
                to="/faq"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#A58C81' }}
              >
                <FileText className="h-5 w-5 mr-2" />
                Alle Fragen anzeigen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#252422' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">Junge Gesellschaft</h3>
                  <p className="text-sm" style={{ color: '#CCB7AE' }}>Pferdestall Wedes-Wedel e.V.</p>
                </div>
              </div>
              <p className="text-white text-sm opacity-80">
                Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Kontakt</h4>
              <div className="space-y-1 text-sm text-white opacity-80">
                <p>Alte Dorfstrasse 46</p>
                <p>38527 Meine</p>
                <p>jungegesellschaft@wedelheine.de</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Links</h4>
              <div className="space-y-1">
                <Link to="/" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Start</Link>
                <Link to="/about" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Über uns</Link>
                <Link to="/faq" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">FAQ</Link>
                <Link to="/contact" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Kontakt</Link>
                <a href="/assets/satzung.pdf" target="_blank" rel="noopener noreferrer" className="block text-sm text-white opacity-80 hover:opacity-100 transition-opacity">Satzung</a>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-white opacity-60" style={{ borderColor: '#CCB7AE' }}>
            <p>&copy; 2024 Junge Gesellschaft Pferdestall Wedes-Wedel e.V. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>

      {/* Side Menu for logged-in users */}
      <SideMenu />
    </div>
  )
}

export default HomePage