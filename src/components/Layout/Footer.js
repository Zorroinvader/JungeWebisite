import React from 'react'
import { Calendar, Mail, MapPin, Phone } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Organization Info */}
          <div>
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-primary-400 mr-3" />
              <h3 className="text-xl font-bold">Jungengesellschaft</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Ihre Plattform für Events, Veranstaltungen und Gemeinschaft. 
              Entdecken Sie kommende Events und werden Sie Teil unserer Gemeinschaft.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Musterstraße 123, 12345 Musterstadt</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="h-4 w-4 mr-2" />
                <span>+49 123 456 789</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span>info@jungengesellschaft.de</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Schnellzugriff</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/calendar" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Event-Kalender
                </a>
              </li>
              <li>
                <a 
                  href="/about" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Über uns
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Kontakt
                </a>
              </li>
              <li>
                <a 
                  href="/privacy" 
                  className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Datenschutz
                </a>
              </li>
            </ul>
          </div>

          {/* Event Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Event-Informationen</h4>
            <div className="space-y-3">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="font-medium text-primary-400 mb-2">Nächster Event</h5>
                <p className="text-sm text-gray-300">
                  Schauen Sie in unseren Kalender für die neuesten Veranstaltungen und Events.
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="font-medium text-primary-400 mb-2">Event anfragen</h5>
                <p className="text-sm text-gray-300">
                  Haben Sie eine Idee für ein Event? Melden Sie sich an und schlagen Sie es vor!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Jungengesellschaft. Alle Rechte vorbehalten.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a 
                href="/terms" 
                className="text-gray-400 hover:text-primary-400 text-sm transition-colors duration-200"
              >
                Nutzungsbedingungen
              </a>
              <a 
                href="/privacy" 
                className="text-gray-400 hover:text-primary-400 text-sm transition-colors duration-200"
              >
                Datenschutz
              </a>
              <a 
                href="/imprint" 
                className="text-gray-400 hover:text-primary-400 text-sm transition-colors duration-200"
              >
                Impressum
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
