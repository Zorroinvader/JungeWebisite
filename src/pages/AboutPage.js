import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, MapPin, Mail, Calendar, FileText, Heart } from 'lucide-react'

const AboutPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.avif" 
                alt="Junge Gesellschaft Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Junge Gesellschaft</h1>
                <p className="text-xs text-gray-500">Pferdestall Wedes-Wedel e.V.</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Start</Link>
              <Link to="/about" className="text-gray-900 text-sm font-medium">Über uns</Link>
              <Link to="/faq" className="text-gray-600 hover:text-gray-900 text-sm font-medium">FAQ</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Kontakt</Link>
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    Profil
                  </Link>
                  {user.email === 'admin@admin.com' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Anmelden
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Registrieren
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
              Über die Junge Gesellschaft
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Der Club der Jungen Gesellschaft in Wedelheine - Eine moderne Begegnungsstätte für junge Leute
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="space-y-16">
          
          {/* History Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-gray-600" />
              Unsere Geschichte
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Heart className="h-6 w-6 mr-3 text-gray-600" />
              Unser Ziel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Für Jugendliche ab 16</h3>
                <p className="text-gray-700 leading-relaxed">
                  Das neue Betreiberkonzept sieht vor, dass gemäß Vereinssatzung nur Jugendliche ab 16 und Erwachsene offizielle Mitglieder der "Jungen Gesellschaft Pferdestall Wedes-Wedel e.V." werden können. Ziel ist es, den Jugendclub vorrangig als Begegnungsstätte für junge Menschen ab 16 zu etablieren.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Altersgerechte Veranstaltungen</h3>
                <p className="text-gray-700 leading-relaxed">
                  In unserem Club finden altersgerechte Veranstaltungen wie Halloween- oder Silvesterpartys für Jugendliche ab 16 und Volljährige statt. Jugendliche unter 16 sind jedoch stets gern gesehene Gäste im Jugendclub.
                </p>
              </div>
            </div>
          </div>

          {/* Board Members Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
              <Users className="h-6 w-6 mr-3 text-gray-600" />
              Unser Vorstand
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Aktueller Vorstand</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      CR
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Charlotte Rode</p>
                      <p className="text-sm text-gray-600">Vorsitzende</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      MV
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Max Vogeley</p>
                      <p className="text-sm text-gray-600">Stellv. Vorsitzender</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      BS
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ben Strich</p>
                      <p className="text-sm text-gray-600">Kassenwart</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      RS
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Reinhard Strich</p>
                      <p className="text-sm text-gray-600">Stellv. Kassenwart</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      CR
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Christian Rode</p>
                      <p className="text-sm text-gray-600">Schriftwart</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Gründungsmitglieder</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      JR
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Joana Rode-Glag</p>
                      <p className="text-sm text-gray-600">Gründungsmitglied</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      YS
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Yvonne Strich</p>
                      <p className="text-sm text-gray-600">Gründungsmitglied</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-gray-600" />
              Unser Standort
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Junge Gesellschaft Pferdestall Wedes-Wedel e.V.</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Alte Dorfstrasse 46
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    38527 Meine
                  </p>
                  <p className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-600" />
                    <a href="mailto:jungegesellschaft@wedelheine.de" className="text-blue-600 hover:text-blue-800">
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-3 text-gray-600" />
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
                  <h3 className="font-medium text-gray-900">Mitgliedsantrag</h3>
                  <p className="text-sm text-gray-600">PDF herunterladen</p>
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
                  <h3 className="font-medium text-gray-900">Vereinssatzung</h3>
                  <p className="text-sm text-gray-600">PDF herunterladen</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.avif" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Junge Gesellschaft</h3>
                  <p className="text-xs text-gray-500">Pferdestall Wedes-Wedel e.V.</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Kontakt</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Alte Dorfstrasse 46</p>
                <p>38527 Meine</p>
                <p>jungegesellschaft@wedelheine.de</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Links</h4>
              <div className="space-y-1">
                <Link to="/" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Start</Link>
                <Link to="/about" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Über uns</Link>
                <Link to="/faq" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
                <Link to="/contact" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Kontakt</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 Junge Gesellschaft Pferdestall Wedes-Wedel e.V. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AboutPage