import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, MapPin, Mail, Calendar, FileText, Heart } from 'lucide-react'

const AboutPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
      {/* Navigation Header - match HomePage */}
      <nav className="w-full border-b" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                alt="Junge Gesellschaft Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold" style={{ color: '#252422' }}>Junge Gesellschaft</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Start</Link>
              <Link to="/about" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Über uns</Link>
              <Link to="/faq" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>FAQ</Link>
              <Link to="/contact" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#252422' }}>Kontakt</Link>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#252422' }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Profil
                  </Link>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - left aligned like HomePage */}
      <div className="w-full" style={{ backgroundColor: '#F4F1E8' }}>
        <div className="w-full px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="lg:pr-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: '#252422' }}>
                  Über die Junge Gesellschaft
                </h1>
                <p className="text-lg md:text-xl mb-2 leading-relaxed" style={{ color: '#A58C81' }}>
                  Der Club der Jungen Gesellschaft in Wedelheine - Eine moderne Begegnungsstätte für junge Leute
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - match card styles */}
      <div className="w-full px-6 lg:px-8 py-12" style={{ backgroundColor: '#F4F1E8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="space-y-16">
          
          {/* History Section */}
          <div className="bg-white rounded-2xl p-8" style={{ border: '2px solid #A58C81' }}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center" style={{ color: '#252422' }}>
              <Calendar className="h-6 w-6 mr-3" />
              Unsere Geschichte
            </h2>
            <div className="prose prose-lg max-w-none" style={{ color: '#252422' }}>
              <p className="text-lg leading-relaxed mb-6">
                Aufgrund einiger Vorfälle, bei denen vereinzelt Jugendliche das Eigentum der Gemeinde Meine nicht pfleglich behandelten und teilweise zweckentfremdeten, sah sich die Gemeinde Meine während der schwierigen Corona-Zeit mehrfach gezwungen, den Jugendclub in Wedelheine über längere Zeiträume zu schließen.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                Als Ende 2021 eine dauerhafte Schließung im Raum stand, setzten sich einige Jugendliche gemeinsam mit ihren Eltern vor Ort dafür ein, dass der Jugendclub erhalten bleibt. Nach dem mehrheitlichen Willen der Bürger und Bürgerinnen sollte der Jugendclub weiterhin vorwiegend für Jugendliche ab 16 und junge Erwachsene zur Verfügung stehen, da ein vergleichbares Angebot für Junge Leute in der Gemeinde ansonsten fehlt.
              </p>
              <p className="text-lg leading-relaxed">
                Das Ergebnis ist aus Sicht der Jugendlichen und deren Eltern sogar noch besser, als sie es sich erhofft hatten: Nach ausführlichen Verhandlungen mit der Gemeinde über die Ausrichtung des Jugendclubs wurde ein neues Betreiberkonzept entwickelt, für das eigens der Verein "Junge Gesellschaft Pferdestall Wedes-Wedel e.V." gegründet wurde.
              </p>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-2xl p-8" style={{ border: '2px solid #A58C81' }}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center" style={{ color: '#252422' }}>
              <Heart className="h-6 w-6 mr-3" />
              Unser Ziel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#252422' }}>Für Jugendliche ab 16</h3>
                <p className="leading-relaxed" style={{ color: '#666' }}>
                  Das neue Betreiberkonzept sieht vor, dass gemäß Vereinssatzung nur Jugendliche ab 16 und Erwachsene offizielle Mitglieder der "Jungen Gesellschaft Pferdestall Wedes-Wedel e.V." werden können. Ziel ist es, den Jugendclub vorrangig als Begegnungsstätte für junge Menschen ab 16 zu etablieren.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#252422' }}>Altersgerechte Veranstaltungen</h3>
                <p className="leading-relaxed" style={{ color: '#666' }}>
                  In unserem Club finden altersgerechte Veranstaltungen wie Halloween- oder Silvesterpartys für Jugendliche ab 16 und Volljährige statt. Jugendliche unter 16 sind jedoch stets gern gesehene Gäste im Jugendclub.
                </p>
              </div>
            </div>
          </div>

          {/* Board Members Section */}
          <div className="bg-white rounded-2xl p-8" style={{ border: '2px solid #A58C81' }}>
            <h2 className="text-2xl font-semibold mb-8 flex items-center" style={{ color: '#252422' }}>
              <Users className="h-6 w-6 mr-3" />
              Unser Vorstand
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6" style={{ color: '#252422' }}>Aktueller Vorstand</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      CR
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Charlotte Rode</p>
                      <p className="text-sm" style={{ color: '#666' }}>Vorsitzende</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      MV
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Max Vogeley</p>
                      <p className="text-sm" style={{ color: '#666' }}>Stellv. Vorsitzender</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      BS
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Ben Strich</p>
                      <p className="text-sm" style={{ color: '#666' }}>Kassenwart</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      RS
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Reinhard Strich</p>
                      <p className="text-sm" style={{ color: '#666' }}>Stellv. Kassenwart</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      CR
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Christian Rode</p>
                      <p className="text-sm" style={{ color: '#666' }}>Schriftwart</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-6" style={{ color: '#252422' }}>Gründungsmitglieder</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      JR
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Joana Rode-Glag</p>
                      <p className="text-sm" style={{ color: '#666' }}>Gründungsmitglied</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      YS
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#252422' }}>Yvonne Strich</p>
                      <p className="text-sm" style={{ color: '#666' }}>Gründungsmitglied</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-2xl p-8" style={{ border: '2px solid #A58C81' }}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center" style={{ color: '#252422' }}>
              <MapPin className="h-6 w-6 mr-3" />
              Unser Standort
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#252422' }}>Junge Gesellschaft Pferdestall Wedes-Wedel e.V.</h3>
                <div className="space-y-2" style={{ color: '#252422' }}>
                  <p className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Alte Dorfstrasse 46
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    38527 Meine
                  </p>
                  <p className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    <a href="mailto:jungegesellschaft@wedelheine.de" className="hover:opacity-80" style={{ color: '#A58C81' }}>
                      jungegesellschaft@wedelheine.de
                    </a>
                  </p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center">
                <p className="text-gray-600 text-center">
                  Karte wird hier angezeigt<br />
                  <span className="text-sm">(Google Maps Integration)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-2xl p-8" style={{ border: '2px solid #A58C81' }}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center" style={{ color: '#252422' }}>
              <FileText className="h-6 w-6 mr-3" />
              Wichtige Dokumente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href="/assets/Eintrits_Antrag.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: '#252422' }}>Mitgliedsantrag</h3>
                  <p className="text-sm" style={{ color: '#666' }}>PDF herunterladen</p>
                </div>
              </a>
              <a
                href="/assets/satzung.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: '#252422' }}>Vereinssatzung</h3>
                  <p className="text-sm" style={{ color: '#666' }}>PDF herunterladen</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Footer - match HomePage */}
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
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-white opacity-60" style={{ borderColor: '#CCB7AE' }}>
            <p>&copy; 2024 Junge Gesellschaft Pferdestall Wedes-Wedel e.V. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AboutPage