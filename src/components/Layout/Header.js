import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { ChevronDown, Moon, Sun, FileText, LogOut, AlertTriangle } from 'lucide-react'
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
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
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
                    Admin Panel
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
          {/* Mobile menu toggle */}
            <button
            className="md:hidden inline-flex items-center px-3 py-2 rounded hover:opacity-80 text-[#252422] dark:text-[#EBE9E9]"
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
        <div className="md:hidden px-6 pb-4 space-y-2 bg-[#F4F1E8] dark:bg-[#252422]">
          {/* Mobile Dark Mode Toggle */}
                    <button
                      onClick={() => {
              toggleDarkMode()
              setMobileOpen(false)
            }}
            className="block w-full text-left px-3 py-2 text-sm font-medium text-[#252422] dark:text-[#EBE9E9] hover:opacity-70 rounded-md transition-opacity"
                    >
                      <div className="flex items-center">
              {isDarkMode ? (
                <Sun className="h-5 w-5 mr-3" />
              ) : (
                <Moon className="h-5 w-5 mr-3" />
              )}
              {isDarkMode ? 'Hellmodus' : 'Dunkelmodus'}
                      </div>
          </button>
          
          <Link to="/about" className="block text-sm font-medium text-[#252422] dark:text-[#EBE9E9]" onClick={() => setMobileOpen(false)}>Über uns</Link>
          <Link to="/faq" className="block text-sm font-medium text-[#252422] dark:text-[#EBE9E9]" onClick={() => setMobileOpen(false)}>FAQ</Link>
          <Link to="/contact" className="block text-sm font-medium text-[#252422] dark:text-[#EBE9E9]" onClick={() => setMobileOpen(false)}>Kontakt</Link>
          {!user ? (
            <div className="pt-2 space-y-2">
              <Link to="/login" className="block text-sm font-medium text-[#252422] dark:text-[#EBE9E9]" onClick={() => setMobileOpen(false)}>Anmelden</Link>
              <Link to="/register" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] dark:bg-[#6054d9] dark:hover:bg-[#4f44c7] rounded-md" onClick={() => setMobileOpen(false)}>Registrieren</Link>
            </div>
          ) : (
            <div className="pt-2 space-y-2">
              <button
                onClick={() => { window.location.href = '/profile' }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white dark:text-[#252422] bg-[#252422] dark:bg-[#F4F1E8] rounded-md"
              >
                {user.email}
                    </button>
                    {isAdmin() && (
                <Link to="/admin" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white dark:text-red-400 bg-red-600 dark:bg-red-900/20 rounded-md" onClick={() => setMobileOpen(false)}>Admin Panel</Link>
                    )}
                    <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg shadow-md hover:shadow-lg border-2 border-red-500 dark:border-red-600 transition-all duration-200"
                    >
                <LogOut className="h-4 w-4 mr-2" />
                        Abmelden
                    </button>
            </div>
          )}
          </div>
        )}
    </nav>

    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-[#252422] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#EBE9E9]/20">
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
            
            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-[#F4F1E8] bg-gray-100 dark:bg-[#EBE9E9]/10 hover:bg-gray-200 dark:hover:bg-[#EBE9E9]/20 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('Logout confirmed')
                    await signOut()
                    setShowLogoutConfirm(false)
                    setMobileOpen(false)
                    // Don't force page reload - let auth state change handle UI update
                  } catch (error) {
                    console.error('Logout error:', error)
                    setShowLogoutConfirm(false)
                  }
                }}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors flex items-center justify-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Ja, abmelden
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