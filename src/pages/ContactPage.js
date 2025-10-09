import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, MapPin, Mail, Phone, Clock, FileText } from 'lucide-react'

const ContactPage = () => {
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
              <Link to="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Über uns</Link>
              <Link to="/faq" className="text-gray-600 hover:text-gray-900 text-sm font-medium">FAQ</Link>
              <Link to="/contact" className="text-gray-900 text-sm font-medium">Kontakt</Link>
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
              Kontakt
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Erreiche uns und werde Teil der Jungen Gesellschaft
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Kontaktinformationen</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Adresse</h3>
                    <p className="text-gray-700 text-sm">
                      Junge Gesellschaft Pferdestall Wedes-Wedel e.V.<br />
                      Alte Dorfstrasse 46<br />
                      38527 Meine
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">E-Mail</h3>
                    <a 
                      href="mailto:jungegesellschaft@wedelheine.de" 
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      jungegesellschaft@wedelheine.de
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Öffnungszeiten</h3>
                    <p className="text-gray-700 text-sm">
                      Der Jugendclub steht Mitgliedern rund um die Uhr zur Verfügung.<br />
                      Schlüssel können bei Vorstandsmitgliedern abgeholt werden.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Board Contact */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ansprechpartner</h2>
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900">Charlotte Rode</h3>
                  <p className="text-sm text-gray-600">Vorsitzende</p>
                  <p className="text-xs text-gray-500">Schlüsselausgabe</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900">Max Vogeley</h3>
                  <p className="text-sm text-gray-600">Stellv. Vorsitzender</p>
                  <p className="text-xs text-gray-500">Schlüsselausgabe</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900">Ben Strich</h3>
                  <p className="text-sm text-gray-600">Kassenwart</p>
                  <p className="text-xs text-gray-500">Schlüsselausgabe</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map and Additional Info */}
          <div className="space-y-8">
            {/* Map Placeholder */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Standort</h2>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Karte wird hier angezeigt</p>
                  <p className="text-xs text-gray-500">Google Maps Integration</p>
                </div>
              </div>
            </div>

            {/* Membership Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Mitglied werden</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">1</span>
                  </div>
                  <p className="text-gray-700 text-sm">Mindestalter: 16 Jahre</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">2</span>
                  </div>
                  <p className="text-gray-700 text-sm">Monatsbeitrag: 5€</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">3</span>
                  </div>
                  <p className="text-gray-700 text-sm">Mitgliedsantrag ausfüllen</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">4</span>
                  </div>
                  <p className="text-gray-700 text-sm">An Vorstand senden</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <a
                  href="/assets/Eintrits_Antrag.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Mitgliedsantrag herunterladen (PDF)
                </a>
                <a
                  href="/assets/satzung.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Vereinssatzung ansehen (PDF)
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h2>
              <div className="space-y-2">
                <Link
                  to="/"
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Zur Startseite
                </Link>
                <Link
                  to="/about"
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Über uns & Vorstand
                </Link>
                <Link
                  to="/faq"
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Häufige Fragen
                </Link>
              </div>
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

export default ContactPage
