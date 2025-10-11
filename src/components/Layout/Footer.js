import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-[#252422] text-[#F4F1E8] py-8 w-full">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Minimal Footer - Inspired by Bigface Brand */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          {/* Left Side - Brand and Description */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#F4F1E8] mb-2">
              Jungengesellschaft
            </h3>
            <p className="text-[#EBE9E9] text-sm mb-3 max-w-md">
              Die Begegnungsstätte für Junge (und jung gebliebene) Leute in unserer Gemeinde
            </p>
            <div className="text-[#EBE9E9] text-xs space-y-1">
              <p>E-Mail: jungegesellschaft@wedelheine.de</p>
              <p>Adresse: Pferdestall Wedes-Wedel, Wedel</p>
            </div>
          </div>

          {/* Right Side - Links */}
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Quick Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/about" className="text-[#EBE9E9] hover:text-[#F4F1E8] transition-colors">Über uns</Link>
              <Link to="/faq" className="text-[#EBE9E9] hover:text-[#F4F1E8] transition-colors">FAQ</Link>
              <Link to="/contact" className="text-[#EBE9E9] hover:text-[#F4F1E8] transition-colors">Kontakt</Link>
              <a href="/assets/satzung.pdf" className="text-[#EBE9E9] hover:text-[#F4F1E8] transition-colors">Satzung</a>
              <a href="/assets/Junge_Geseltschaft_Hausordnung.pdf" className="text-[#EBE9E9] hover:text-[#F4F1E8] transition-colors">Hausordnung</a>
              <Link to="/" className="text-[#EBE9E9] hover:text-[#F4F1E8] transition-colors">Event-Kalender</Link>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#EBE9E9]">
              <Link to="/contact" className="hover:text-[#F4F1E8] transition-colors">Impressum</Link>
              <Link to="/contact" className="hover:text-[#F4F1E8] transition-colors">Datenschutz</Link>
              <Link to="/contact" className="hover:text-[#F4F1E8] transition-colors">Nutzungsbedingungen</Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-6 pt-4 border-t border-[#EBE9E9]/20">
          <p className="text-xs text-[#EBE9E9]/70">
            © 2024 Junge Gesellschaft Pferdestall Wedes-Wedel e.V. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer