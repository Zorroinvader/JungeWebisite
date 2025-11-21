// FILE OVERVIEW
// - Purpose: Main site header with navigation links, logo, user menu, dark mode toggle, and admin access.
// - Used by: Layout component on all public pages; provides navigation to About, FAQ, Contact, Profile, Admin.
// - Notes: Production component. Shows user menu when logged in; admin link visible only to admins; includes dark mode toggle.

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { ChevronDown, Moon, Sun, FileText, LogOut, AlertTriangle, Sparkles } from 'lucide-react'
import PDFLink from '../UI/PDFLink'

const Header = () => {
  const { user, isAdmin, signOut } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <>
    <nav className="w-full border-b sticky top-0 z-40 bg-[#F4F1E8] dark:bg-[#252422] border-[#A58C81] dark:border-[#EBE9E9]">
      <div className="w-full px-[1vw] sm:px-[1.5vw] md:px-[2vw] lg:px-[2.5vw] xl:px-[3vw] 2xl:px-[3.5vw]">
        <div className="flex justify-between items-center h-[10vh] sm:h-[9vh] md:h-[8vh] lg:h-[7vh] xl:h-[6vh] 2xl:h-[5vh] w-full">
          {/* Logo on the left - Clickable to homepage */}
          <Link to="/" className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw] flex-shrink-0 hover:opacity-80 transition-opacity">
            <img 
              src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
              alt="Junge Gesellschaft Logo" 
              className="h-[6vh] w-[6vh] sm:h-[5.5vh] sm:w-[5.5vh] md:h-[5vh] md:w-[5vh] lg:h-[4.5vh] lg:w-[4.5vh] xl:h-[4vh] xl:w-[4vh] 2xl:h-[3.5vh] 2xl:w-[3.5vh] object-contain flex-shrink-0"
            />
          </Link>
          
          {/* Navigation on the right - full width with justify-end */}
          <div className="hidden md:flex items-center justify-end w-full space-x-[2vw] sm:space-x-[1.8vw] md:space-x-[1.5vw] lg:space-x-[1.2vw] xl:space-x-[1vw] 2xl:space-x-[0.8vw]">
            
            {/* Über uns Dropdown */}
            <div className="relative group">
              <Link to="/about" className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal hover:opacity-70 transition-opacity flex items-center text-[#252422] dark:text-[#EBE9E9]">
                Über uns
                <ChevronDown className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] ml-[0.5vw] sm:ml-[0.4vw] md:ml-[0.3vw] lg:ml-[0.2vw] xl:ml-[0.15vw] 2xl:ml-[0.1vw]" />
              </Link>
              <div className="absolute top-full left-0 mt-[1vh] sm:mt-[1.5vh] md:mt-[2vh] w-[30vw] sm:w-[25vw] md:w-[20vw] lg:w-[15vw] xl:w-[12vw] 2xl:w-[10vw] bg-white dark:bg-[#252422] rounded-lg shadow-lg border border-gray-200 dark:border-[#EBE9E9] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-[1vh] sm:py-[1.5vh] md:py-[2vh]">
                  <Link to="/about" className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] text-[#252422] dark:text-[#F4F1E8]">
                    Vorstand & Geschichte
                  </Link>
                  <Link to="/contact" className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] text-[#252422] dark:text-[#F4F1E8]">
                    Kontakt & Standort
                  </Link>
                </div>
              </div>
            </div>
            
            {/* FAQ Dropdown */}
            <div className="relative group">
              <Link to="/faq" className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal hover:opacity-70 transition-opacity flex items-center text-[#252422] dark:text-[#EBE9E9]">
                FAQ
                <ChevronDown className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] ml-[0.5vw] sm:ml-[0.4vw] md:ml-[0.3vw] lg:ml-[0.2vw] xl:ml-[0.15vw] 2xl:ml-[0.1vw]" />
              </Link>
              <div className="absolute top-full left-0 mt-[1vh] sm:mt-[1.5vh] md:mt-[2vh] w-[30vw] sm:w-[25vw] md:w-[20vw] lg:w-[15vw] xl:w-[12vw] 2xl:w-[10vw] bg-white dark:bg-[#252422] rounded-lg shadow-lg border border-gray-200 dark:border-[#EBE9E9] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-[1vh] sm:py-[1.5vh] md:py-[2vh]">
                  <Link to="/faq" className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] text-[#252422] dark:text-[#F4F1E8]">
                    Häufige Fragen
                  </Link>
                  <Link to="/contact" className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] text-[#252422] dark:text-[#F4F1E8]">
                    Kontakt aufnehmen
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Special Events Link */}
            <Link to="/special-events" className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal hover:opacity-70 transition-opacity flex items-center text-[#252422] dark:text-[#EBE9E9]">
              <Sparkles className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] mr-[0.5vw] sm:mr-[0.4vw] md:mr-[0.3vw] lg:mr-[0.2vw] xl:mr-[0.15vw] 2xl:mr-[0.1vw]" />
              Besondere Veranstaltungen
            </Link>

            {/* Downloads Dropdown */}
            <div className="relative group">
              <span className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal hover:opacity-70 transition-opacity flex items-center cursor-pointer text-[#252422] dark:text-[#EBE9E9]">
                Downloads
                <ChevronDown className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] ml-[0.5vw] sm:ml-[0.4vw] md:ml-[0.3vw] lg:ml-[0.2vw] xl:ml-[0.15vw] 2xl:ml-[0.1vw]" />
              </span>
              <div className="absolute top-full left-0 mt-[1vh] sm:mt-[1.5vh] md:mt-[2vh] w-[35vw] sm:w-[30vw] md:w-[25vw] lg:w-[20vw] xl:w-[15vw] 2xl:w-[12vw] bg-white dark:bg-[#252422] rounded-lg shadow-lg border border-gray-200 dark:border-[#EBE9E9] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-[1vh] sm:py-[1.5vh] md:py-[2vh]">
                  <PDFLink
                    href="/assets/Eintrits_Antrag.pdf"
                    className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] flex items-center text-[#252422] dark:text-[#F4F1E8]"
                  >
                    <FileText className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] mr-[1vw] sm:mr-[0.8vw] md:mr-[0.6vw] lg:mr-[0.4vw] xl:mr-[0.3vw] 2xl:mr-[0.2vw]" />
                    Mitgliedsantrag
                  </PDFLink>
                  <PDFLink
                    href="/assets/satzung.pdf"
                    className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] flex items-center text-[#252422] dark:text-[#F4F1E8]"
                  >
                    <FileText className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] mr-[1vw] sm:mr-[0.8vw] md:mr-[0.6vw] lg:mr-[0.4vw] xl:mr-[0.3vw] 2xl:mr-[0.2vw]" />
                    Vereinssatzung
                  </PDFLink>
                  <PDFLink
                    href="/assets/Junge_Geseltschaft_Hausordnung.pdf"
                    className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] flex items-center text-[#252422] dark:text-[#F4F1E8]"
                  >
                    <FileText className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] mr-[1vw] sm:mr-[0.8vw] md:mr-[0.6vw] lg:mr-[0.4vw] xl:mr-[0.3vw] 2xl:mr-[0.2vw]" />
                    Hausordnung
                  </PDFLink>
                  <PDFLink
                    href="/assets/Junge_Geseltschaft_Mietvertrag.pdf"
                    className="block px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[0.8vh] sm:py-[0.6vh] md:py-[0.5vh] lg:py-[0.4vh] xl:py-[0.3vh] 2xl:py-[0.25vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] hover:bg-gray-50 dark:hover:bg-[#EBE9E9] flex items-center text-[#252422] dark:text-[#F4F1E8]"
                  >
                    <FileText className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] mr-[1vw] sm:mr-[0.8vw] md:mr-[0.6vw] lg:mr-[0.4vw] xl:mr-[0.3vw] 2xl:mr-[0.2vw]" />
                    Mietvertrag
                  </PDFLink>
                </div>
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-[1vw] sm:p-[0.8vw] md:p-[0.6vw] lg:p-[0.4vw] xl:p-[0.3vw] 2xl:p-[0.2vw] rounded-md text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 transition-opacity"
              aria-label={isDarkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
            >
              {isDarkMode ? (
                <Sun className="h-[4vw] sm:h-[3vw] md:h-[2.5vw] lg:h-[2vw] xl:h-[1.5vw] 2xl:h-[1.2vw] w-[4vw] sm:w-[3vw] md:w-[2.5vw] lg:w-[2vw] xl:w-[1.5vw] 2xl:w-[1.2vw]" />
              ) : (
                <Moon className="h-[4vw] sm:h-[3vw] md:h-[2.5vw] lg:h-[2vw] xl:h-[1.5vw] 2xl:h-[1.2vw] w-[4vw] sm:w-[3vw] md:w-[2.5vw] lg:w-[2vw] xl:w-[1.5vw] 2xl:w-[1.2vw]" />
              )}
            </button>

            {!user ? (
              <div className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw]">
              <Link
                to="/login"
                className="px-[2.5vw] sm:px-[2vw] md:px-[1.5vw] lg:px-[1.2vw] xl:px-[1vw] 2xl:px-[0.8vw] py-[2vh] sm:py-[1.8vh] md:py-[1.5vh] lg:py-[1.2vh] xl:py-[1vh] 2xl:py-[0.8vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal hover:opacity-70 transition-opacity text-[#252422] dark:text-[#EBE9E9] rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              >
                Anmelden
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-[3.5vw] sm:px-[3vw] md:px-[2.5vw] lg:px-[2vw] xl:px-[1.5vw] 2xl:px-[1.2vw] py-[2vh] sm:py-[1.8vh] md:py-[1.5vh] lg:py-[1.2vh] xl:py-[1vh] 2xl:py-[0.8vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal text-white bg-[#6054d9] hover:bg-[#4f44c7] dark:bg-[#6054d9] dark:hover:bg-[#4f44c7] rounded-md hover:opacity-90 transition-opacity"
              >
                Registrieren
            </Link>
          </div>
            ) : (
              <div className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw]">
                <Link
                  to="/profile"
                  className="inline-flex items-center px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[1vh] sm:py-[0.8vh] md:py-[0.6vh] lg:py-[0.5vh] xl:py-[0.4vh] 2xl:py-[0.3vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal text-white dark:text-[#252422] bg-[#252422] dark:bg-[#F4F1E8] rounded-md hover:opacity-90 transition-opacity"
                >
                  {user.email}
                </Link>
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[1vh] sm:py-[0.8vh] md:py-[0.6vh] lg:py-[0.5vh] xl:py-[0.4vh] 2xl:py-[0.3vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-normal text-white dark:text-red-400 bg-red-600 dark:bg-red-900/20 rounded-md hover:opacity-90 transition-opacity"
                  >
                    Verwaltung
                  </Link>
                )}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex items-center px-[2.5vw] sm:px-[2vw] md:px-[1.5vw] lg:px-[1.2vw] xl:px-[1vw] 2xl:px-[0.8vw] py-[1.2vh] sm:py-[1vh] md:py-[0.8vh] lg:py-[0.6vh] xl:py-[0.5vh] 2xl:py-[0.4vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-500 dark:border-red-600"
                >
                  <LogOut className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] mr-[0.5vw] sm:mr-[0.4vw] md:mr-[0.3vw] lg:mr-[0.2vw] xl:mr-[0.15vw] 2xl:mr-[0.1vw]" />
                  Abmelden
                </button>
              </div>
            )}
          </div>
          {/* MOBILE RESPONSIVE: Hamburger menu with proper tap target (min 44x44px) */}
          <button
            className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg hover:opacity-80 active:scale-95 transition-all text-[#252422] dark:text-[#EBE9E9] touch-manipulation"
            aria-label="Menü öffnen"
            onClick={() => setMobileOpen(o => !o)}
            style={{ touchAction: 'manipulation' }}
          >
            <span className="sr-only">Menü</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          </div>
        </div>
      {/* MOBILE RESPONSIVE: Mobile dropdown menu with proper tap targets and spacing */}
      {mobileOpen && (
        <div className="md:hidden px-4 sm:px-6 pb-4 space-y-1 bg-[#F4F1E8] dark:bg-[#252422] border-t border-[#A58C81] dark:border-[#EBE9E9]">
          {/* MOBILE RESPONSIVE: Dark Mode Toggle - min 44px height for touch */}
          <button
            onClick={() => {
              toggleDarkMode()
              setMobileOpen(false)
            }}
            className="block w-full text-left px-4 py-3 min-h-[44px] text-base font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-all touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="flex items-center">
              {isDarkMode ? (
                <Sun className="h-5 w-5 mr-3 flex-shrink-0" />
              ) : (
                <Moon className="h-5 w-5 mr-3 flex-shrink-0" />
              )}
              <span className="text-base">{isDarkMode ? 'Heller Modus' : 'Dunkler Modus'}</span>
            </div>
          </button>
          
          {/* MOBILE RESPONSIVE: Navigation links with proper tap targets */}
          <Link 
            to="/about" 
            className="block px-4 py-3 min-h-[44px] text-base font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-all touch-manipulation" 
            onClick={() => setMobileOpen(false)}
            style={{ touchAction: 'manipulation' }}
          >
            Über uns
          </Link>
          <Link 
            to="/faq" 
            className="block px-4 py-3 min-h-[44px] text-base font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-all touch-manipulation" 
            onClick={() => setMobileOpen(false)}
            style={{ touchAction: 'manipulation' }}
          >
            FAQ
          </Link>
          <Link 
            to="/special-events" 
            className="block px-4 py-3 min-h-[44px] text-base font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-all touch-manipulation" 
            onClick={() => setMobileOpen(false)}
            style={{ touchAction: 'manipulation' }}
          >
            Besondere Veranstaltungen
          </Link>
          <Link 
            to="/contact" 
            className="block px-4 py-3 min-h-[44px] text-base font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-all touch-manipulation" 
            onClick={() => setMobileOpen(false)}
            style={{ touchAction: 'manipulation' }}
          >
            Kontakt
          </Link>
          
          {!user ? (
            <div className="pt-2 space-y-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <Link 
                to="/login" 
                className="block px-4 py-3 min-h-[44px] text-base font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg transition-all touch-manipulation" 
                onClick={() => setMobileOpen(false)}
                style={{ touchAction: 'manipulation' }}
              >
                Anmelden
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center w-full px-4 py-3 min-h-[44px] text-base font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] dark:bg-[#6054d9] dark:hover:bg-[#4f44c7] rounded-lg active:scale-95 transition-all touch-manipulation" 
                onClick={() => setMobileOpen(false)}
                style={{ touchAction: 'manipulation' }}
              >
                Registrieren
              </Link>
            </div>
          ) : (
            <div className="pt-2 space-y-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <button
                onClick={() => { 
                  setMobileOpen(false)
                  window.location.href = '/profile' 
                }}
                className="inline-flex items-center justify-center w-full px-4 py-3 min-h-[44px] text-sm sm:text-base font-medium text-white dark:text-[#252422] bg-[#252422] dark:bg-[#F4F1E8] rounded-lg active:scale-95 transition-all touch-manipulation break-all"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="truncate">{user.email}</span>
              </button>
              {isAdmin() && (
                <Link 
                  to="/admin" 
                  className="inline-flex items-center justify-center w-full px-4 py-3 min-h-[44px] text-base font-medium text-white dark:text-red-400 bg-red-600 dark:bg-red-900/20 rounded-lg active:scale-95 transition-all touch-manipulation" 
                  onClick={() => setMobileOpen(false)}
                  style={{ touchAction: 'manipulation' }}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  setShowLogoutConfirm(true)
                  setMobileOpen(false)
                }}
                className="inline-flex items-center justify-center w-full px-4 py-3 min-h-[44px] text-base font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg shadow-md border-2 border-red-500 dark:border-red-600 active:scale-95 transition-all touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut className="h-5 w-5 mr-2 flex-shrink-0" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      )}
    </nav>

    {/* MOBILE RESPONSIVE: Logout Confirmation Modal - responsive sizing and proper mobile padding */}
    {showLogoutConfirm && (
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3 sm:p-4"
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      >
        <div className="relative w-full max-w-md mx-auto bg-white dark:bg-[#252422] rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-[#EBE9E9]/20">
          {/* Header */}
          <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-[#EBE9E9]/20">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                Abmelden bestätigen
              </h3>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 text-center">
            <p className="text-lg text-[#252422] dark:text-[#F4F1E8] mb-6">
              Möchten Sie sich wirklich abmelden?
            </p>
            <p className="text-sm text-gray-600 dark:text-[#EBE9E9] mb-8">
              Sie werden aus Ihrem Konto abgemeldet und müssen sich erneut anmelden, um auf geschützte Bereiche zuzugreifen.
            </p>
            
            {/* MOBILE RESPONSIVE: Buttons with proper tap targets (min 44px height) */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 min-h-[44px] text-base font-medium text-gray-700 dark:text-[#F4F1E8] bg-gray-100 dark:bg-[#EBE9E9]/10 hover:bg-gray-200 dark:hover:bg-[#EBE9E9]/20 active:scale-95 rounded-lg transition-all touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                Abbrechen
              </button>
              <button
                onClick={async () => {
                  try {
                    await signOut()
                    setShowLogoutConfirm(false)
                    setMobileOpen(false)
                    // Don't force page reload - let auth state change handle UI update
                  } catch (error) {
                    setShowLogoutConfirm(false)
                  }
                }}
                className="flex-1 px-4 py-3 min-h-[44px] text-base font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 active:scale-95 rounded-lg transition-all flex items-center justify-center touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Ja, abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Header