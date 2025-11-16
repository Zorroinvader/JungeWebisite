// FILE OVERVIEW
// - Purpose: Side navigation menu for mobile/tablet views with links to main pages and user account actions.
// - Used by: Header component on mobile devices; provides hamburger menu alternative to desktop navigation.
// - Notes: Production component. Responsive design; shows user-specific links when logged in; includes dark mode toggle.

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, MapPin, Mail, X, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import PDFLink from '../UI/PDFLink'

const SideMenu = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full shadow-2xl" style={{ backgroundColor: '#F4F1E8', borderLeft: '3px solid #A58C81' }}>
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: '#A58C81' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#A58C81' }}>
                  <User className="h-6 w-6" style={{ color: '#252422' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: '#252422' }}>Mein Bereich</h2>
                  <p className="text-sm" style={{ color: '#A58C81' }}>{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:opacity-80 rounded-lg transition-opacity"
                style={{ color: '#252422' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-6 space-y-4">
            {/* Profile Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#252422' }}>Profil</h3>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: '#252422' }}
              >
                <Users className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                Mein Profil
              </Link>
            </div>

            {/* Admin Section */}
            {user.email === 'admin@admin.com' && (
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#252422' }}>Administration</h3>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#252422' }}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Admin Panel
                </Link>
              </div>
            )}

            {/* Documents Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#252422' }}>Dokumente</h3>
              <div className="space-y-2">
                <PDFLink
                  href="/assets/Eintrits_Antrag.pdf"
                  className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
                  style={{ color: '#252422' }}
                >
                  <FileText className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                  Mitgliedsantrag (PDF)
                </PDFLink>
                <PDFLink
                  href="/assets/satzung.pdf"
                  className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
                  style={{ color: '#252422' }}
                >
                  <FileText className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                  Vereinssatzung (PDF)
                </PDFLink>
                <PDFLink
                  href="/assets/Junge_Geseltschaft_Hausordnung.pdf"
                  className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
                  style={{ color: '#252422' }}
                >
                  <FileText className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                  Hausordnung (PDF)
                </PDFLink>
                <PDFLink
                  href="/assets/Junge_Geseltschaft_Mietvertrag.pdf"
                  className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
                  style={{ color: '#252422' }}
                >
                  <FileText className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                  Mietvertrag (PDF)
                </PDFLink>
              </div>
            </div>

            {/* Contact Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#252422' }}>Kontakt</h3>
              <div className="space-y-2">
                <div className="flex items-center px-4 py-2 text-sm" style={{ color: '#252422' }}>
                  <MapPin className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                  <div>
                    <p className="font-medium">Alte Dorfstrasse 46</p>
                    <p>38527 Meine</p>
                  </div>
                </div>
                <div className="flex items-center px-4 py-2 text-sm" style={{ color: '#252422' }}>
                  <Mail className="h-4 w-4 mr-3" style={{ color: '#A58C81' }} />
                  <a 
                    href="mailto:jungegesellschaft@wedelheine.de" 
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: '#A58C81' }}
                  >
                    jungegesellschaft@wedelheine.de
                  </a>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t" style={{ borderColor: '#A58C81' }}>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#A58C81' }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SideMenu
