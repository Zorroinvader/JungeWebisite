// FILE OVERVIEW
// - Purpose: Main public landing page that shows hero, next event info, CTA buttons, and the small month calendar.
// - Used by: Route component for path '/', rendered from the main router (see App.js).
// - Notes: Core production page. Changes here affect the first impression for all visitors.

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDarkMode } from '../contexts/DarkModeContext'
import { Calendar, Users, FileText, X, Trophy, ArrowRight } from 'lucide-react'
import SimpleMonthCalendar from '../components/Calendar/SimpleMonthCalendar'
import TypewriterText from '../components/UI/TypewriterText'
import NextEventInfo from '../components/UI/NextEventInfo'
import ClubStatusIndicator from '../components/UI/ClubStatusIndicator'
import PublicEventRequestForm from '../components/Calendar/PublicEventRequestForm'
import GuestOrRegisterModal from '../components/Calendar/GuestOrRegisterModal'
import { getActiveSpecialEvents } from '../services/specialEventsApi'

const HomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showPublicRequestForm, setShowPublicRequestForm] = useState(false)
  const [showGuestOrRegister, setShowGuestOrRegister] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showBierWettbewerbPopup, setShowBierWettbewerbPopup] = useState(false)
  const [isNikolausfeierActive, setIsNikolausfeierActive] = useState(false)

  const handleFirstTextComplete = () => {
    setShowSubtitle(true)
  }

  const handlePublicRequestSuccess = () => {
    setShowPublicRequestForm(false)
    // Registered users go to profile, guests go to tracking
    if (user) {
      setTimeout(() => {
        navigate('/profile')
      }, 2000)
    } else {
      setTimeout(() => {
        navigate('/event-tracking')
      }, 2000)
    }
  }

  const handleEventRequest = (date = null) => {
    setSelectedDate(date)
    // If user is logged in, go straight to form with pre-filled data
    if (user) {
      setShowPublicRequestForm(true)
    } else {
      // Show guest or register choice
      setShowGuestOrRegister(true)
    }
  }

  const handleContinueAsGuest = () => {
    setShowGuestOrRegister(false)
    setShowPublicRequestForm(true)
  }

  // Check if returning from login/register with pending request
  useEffect(() => {
    const pendingRequest = sessionStorage.getItem('pendingEventRequest')
    const pendingDate = sessionStorage.getItem('pendingEventDate')
    
    if (pendingRequest === 'true' && user) {
      sessionStorage.removeItem('pendingEventRequest')
      const date = pendingDate ? pendingDate : null
      sessionStorage.removeItem('pendingEventDate')
      setSelectedDate(date)
      setShowPublicRequestForm(true)
    }
  }, [user])

  // Check if Nikolausfeier/Bier Wettbewerb is active and show popup
  useEffect(() => {
    const checkNikolausfeier = async () => {
      try {
        const events = await getActiveSpecialEvents()
        const nikolausfeierEvent = events.find(e => e.slug === 'nikolausfeier')
        if (nikolausfeierEvent) {
          setIsNikolausfeierActive(true)
          // Check if user has already dismissed the popup
          const dismissed = localStorage.getItem('bier-wettbewerb-popup-dismissed')
          if (!dismissed) {
            // Show popup after a short delay
            setTimeout(() => {
              setShowBierWettbewerbPopup(true)
            }, 1000)
          }
        }
      } catch (error) {
        console.error('Error checking Nikolausfeier event:', error)
      }
    }
    checkNikolausfeier()
  }, [])

  const handleBierWettbewerbRedirect = () => {
    setShowBierWettbewerbPopup(false)
    navigate('/nikolausfeier')
  }

  const handleDismissPopup = () => {
    setShowBierWettbewerbPopup(false)
    localStorage.setItem('bier-wettbewerb-popup-dismissed', 'true')
  }


  return (
    <div className="min-h-screen">
      {/* Banner at the top */}
      {isNikolausfeierActive && (
        <div className="w-full bg-[#F4F1E8] dark:bg-[#252422] border-b-2 border-[#A58C81] dark:border-[#EBE9E9] py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-[#A58C81] dark:text-[#EBE9E9]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-[#252422] dark:text-[#F4F1E8]">
                  Bier Wettbewerb - Jetzt teilnehmen!
                </p>
                <p className="text-xs sm:text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                  Zeige uns wie schnell du ein Bier trinken kannst!
                </p>
              </div>
            </div>
            <Link
              to="/nikolausfeier"
              className="flex items-center gap-2 bg-[#6054d9] hover:bg-[#4f44c7] dark:bg-[#6054d9] dark:hover:bg-[#4f44c7] text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors whitespace-nowrap flex-shrink-0 shadow-md"
            >
              Jetzt teilnehmen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section - Consistent Design */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            {/* Modern Hero Layout */}
            <div className="flex flex-col lg:flex-row items-start lg:items-start gap-[3vw] lg:gap-[4vw]">
              {/* Left: Logo + Title - Fixed width to prevent shifting */}
              <div className="flex items-center gap-[2vw] lg:gap-[1.5vw] flex-shrink-0 w-full lg:w-auto">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-[18vw] w-[18vw] sm:h-[16vw] sm:w-[16vw] md:h-[14vw] md:w-[14vw] lg:h-[12vw] lg:w-[12vw] xl:h-[10vw] xl:w-[10vw] 2xl:h-[8vw] 2xl:w-[8vw] object-contain flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-[7vw] sm:text-[6vw] md:text-[5vw] lg:text-[4vw] xl:text-[3.5vw] 2xl:text-[3vw] font-bold leading-tight text-[#252422] dark:text-[#F4F1E8] mb-[0.5vh] min-h-[8vw] sm:min-h-[7vw] md:min-h-[6vw] lg:min-h-[5vw] xl:min-h-[4vw] 2xl:min-h-[3.5vw]">
                    <TypewriterText 
                      text="Junge Gesellschaft" 
                      speed={75}
                      className="block"
                      onComplete={handleFirstTextComplete}
                    />
                  </h1>
                      <div className="min-h-[4vw] sm:min-h-[3.5vw] md:min-h-[3vw] lg:min-h-[2.5vw] xl:min-h-[2vw] 2xl:min-h-[1.5vw]">
                        {showSubtitle && (
                          <p className="text-[3.5vw] sm:text-[3vw] md:text-[2.5vw] lg:text-[2vw] xl:text-[1.8vw] 2xl:text-[1.5vw] text-[#A58C81] dark:text-[#EBE9E9] font-medium">
                        <TypewriterText 
                          text="Pferdestall Wedes-Wedel e.V." 
                          speed={20}
                          showCursor={false}
                        />
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Fixed Layout - Only NextEventInfo */}
              <div className="w-full lg:w-auto lg:flex-shrink-0 lg:ml-auto">
                {/* Fixed height container for NextEventInfo - Always visible */}
                <div className="min-h-[8vw] sm:min-h-[6vw] md:min-h-[5vw] lg:min-h-[4vw] xl:min-h-[3vw] 2xl:min-h-[2.5vw]">
                  <NextEventInfo />
                </div>
              </div>
            </div>

            {/* Club Status Indicator */}
            <div className="mt-4 flex justify-center lg:justify-start">
              <ClubStatusIndicator />
            </div>

          </div>
        </div>
      </div>

      {/* Action Section - Redesigned */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422] py-[2vh] sm:py-[3vh] md:py-[4vh]">
        <div className="max-w-6xl mx-auto px-[4vw] sm:px-[5vw] md:px-[6vw] lg:px-[8vw] xl:px-[10vw]">
          {/* Info/Navigation Links - Minimal Top */}
          <div className="flex flex-wrap justify-center gap-[4vw] sm:gap-[3vw] md:gap-[2.5vw] mb-[3vh] sm:mb-[4vh]">
            <Link
              to="/about"
              className={`inline-flex items-center text-[2.5vw] sm:text-[2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1.1vw] font-medium text-[#252422] dark:text-[#F4F1E8] hover:text-[#A58C81] dark:hover:text-[#EBE9E9] transition-colors underline decoration-2 underline-offset-4 decoration-[#A58C81] dark:decoration-[#EBE9E9]`}
            >
              <Users className="h-[2.5vw] sm:h-[2vw] md:h-[1.6vw] lg:h-[1.3vw] xl:h-[1.1vw] w-[2.5vw] sm:w-[2vw] md:w-[1.6vw] lg:w-[1.3vw] xl:w-[1.1vw] mr-[1vw] sm:mr-[0.8vw]" />
              Über uns
            </Link>
            <Link
              to="/faq"
              className={`inline-flex items-center text-[2.5vw] sm:text-[2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1.1vw] font-medium text-[#252422] dark:text-[#F4F1E8] hover:text-[#A58C81] dark:hover:text-[#EBE9E9] transition-colors underline decoration-2 underline-offset-4 decoration-[#A58C81] dark:decoration-[#EBE9E9]`}
            >
              <FileText className="h-[2.5vw] sm:h-[2vw] md:h-[1.6vw] lg:h-[1.3vw] xl:h-[1.1vw] w-[2.5vw] sm:w-[2vw] md:w-[1.6vw] lg:w-[1.3vw] xl:w-[1.1vw] mr-[1vw] sm:mr-[0.8vw]" />
              FAQ
            </Link>
          </div>

          {/* Main CTA - Event anfragen (Purple like Register button) */}
          <div className="text-center">
            <button
              onClick={() => handleEventRequest()}
              className="group inline-flex items-center justify-center px-[7vw] sm:px-[5.5vw] md:px-[4.5vw] lg:px-[3.5vw] py-[2.2vh] sm:py-[2vh] md:py-[1.8vh] text-[3.2vw] sm:text-[2.7vw] md:text-[2.2vw] lg:text-[1.8vw] xl:text-[1.5vw] font-semibold text-white bg-[#6054d9] hover:bg-[#4f44c7] dark:bg-[#6054d9] dark:hover:bg-[#4f44c7] rounded-lg transition-colors duration-200 shadow-xl"
            >
              <Calendar className="h-[4.5vw] sm:h-[4vw] md:h-[3.5vw] lg:h-[2.8vw] xl:h-[2.2vw] w-[4.5vw] sm:w-[4vw] md:w-[3.5vw] lg:w-[2.8vw] xl:w-[2.2vw] mr-[2vw] sm:mr-[1.8vw] md:mr-[1.5vw] lg:mr-[1.2vw]" />
              Veranstaltung anfragen
            </button>
            <div className="mt-3 flex items-baseline justify-center gap-[1vw] flex-wrap">
              <span className={`inline-block text-[2.2vw] sm:text-[1.8vw] md:text-[1.4vw] lg:text-[1.1vw] xl:text-[0.9vw] text-[#252422] dark:text-[#F4F1E8]`} style={{ lineHeight: '1' }}>
                oder
              </span>
              <Link 
                to="/event-tracking"
                className={`inline-block text-[2.2vw] sm:text-[1.8vw] md:text-[1.4vw] lg:text-[1.1vw] xl:text-[0.9vw] font-medium text-[#252422] dark:text-[#F4F1E8] hover:text-[#A58C81] dark:hover:text-[#EBE9E9] transition-colors underline decoration-2 underline-offset-2 decoration-[#A58C81] dark:decoration-[#EBE9E9]`}
                style={{ lineHeight: '1' }}
              >
                Status verfolgen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Transition Section */}
      <div className="w-full h-[0.5vh] sm:h-[0.8vh] md:h-[1vh] lg:h-[1.2vh] xl:h-[1.5vh] 2xl:h-[1.8vh] bg-[#F4F1E8] dark:bg-[#252422]"></div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-[3vw] md:px-[4vw] lg:px-[5vw] xl:px-[6vw] py-4 sm:py-[1.5vh] md:py-[2vh] lg:py-[2.5vh] xl:py-[3vh] 2xl:py-[3.5vh] bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="mx-auto space-y-3 sm:space-y-[0.8vh] md:space-y-[1vh] lg:space-y-[1.2vh] xl:space-y-[1.5vh] 2xl:space-y-[1.8vh] max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] 2xl:max-w-[75vw]">
          {/* Calendar Section */}
          <div className="bg-white dark:bg-[#252422] rounded-2xl sm:rounded-2xl shadow-xl p-4 sm:p-[1.5vw] md:p-[1vw] lg:p-[0.8vw] xl:p-[0.6vw] 2xl:p-[0.5vw] relative border-2 border-[#A58C81] dark:border-[#EBE9E9]">
            {/* Make calendar header usable on small screens */}
            <div className="w-full touch-pan-x" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y pinch-zoom' }}>
              <SimpleMonthCalendar 
                currentDate={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                onDateClick={handleEventRequest}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guest or Register Modal */}
      {showGuestOrRegister && (
        <GuestOrRegisterModal
          isOpen={showGuestOrRegister}
          onClose={() => {
            setShowGuestOrRegister(false)
            setSelectedDate(null)
          }}
          onContinueAsGuest={handleContinueAsGuest}
          selectedDate={selectedDate}
        />
      )}

      {/* Public Event Request Form Modal */}
      {showPublicRequestForm && (
        <PublicEventRequestForm
          isOpen={showPublicRequestForm}
          onClose={() => {
            setShowPublicRequestForm(false)
            setSelectedDate(null)
          }}
          onSuccess={handlePublicRequestSuccess}
          selectedDate={selectedDate}
          userData={user}
        />
      )}

      {/* Bier Wettbewerb Popup */}
      {showBierWettbewerbPopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4"
          style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
          onClick={handleDismissPopup}
        >
          <div 
            className="relative bg-white dark:bg-[#2a2a2a] rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full border-2 border-[#A58C81] dark:border-[#4a4a4a] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-[#A58C81] dark:border-[#EBE9E9]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-[#A58C81] dark:bg-[#6a6a6a] rounded-lg flex-shrink-0">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                      Bier Wettbewerb
                    </h3>
                    <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mt-1">
                      Nikolausfeier 2024
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissPopup}
                  className="min-w-[44px] min-h-[44px] p-2 hover:opacity-70 active:scale-95 transition-all rounded-lg text-[#A58C81] dark:text-[#EBE9E9] touch-manipulation flex items-center justify-center flex-shrink-0"
                  aria-label="Schließen"
                  style={{ touchAction: 'manipulation' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <p className="text-[#252422] dark:text-[#F4F1E8] mb-4 text-base sm:text-lg">
                Zeige uns wie schnell du ein Bier trinken kannst!
              </p>
              <ul className="text-sm text-[#A58C81] dark:text-[#EBE9E9] space-y-2 list-disc list-inside mb-6">
                <li>Lade ein Video hoch und zeige deine Zeit</li>
                <li>Teilnahme für alle möglich</li>
                <li>Preise zu gewinnen!</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 border-t border-[#A58C81] dark:border-[#EBE9E9]">
              <div className="flex gap-3">
                <button
                  onClick={handleDismissPopup}
                  className="flex-1 px-4 sm:px-6 py-3 min-h-[44px] text-base border-2 border-[#A58C81] dark:border-[#6a6a6a] text-[#252422] dark:text-[#e0e0e0] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:scale-95 transition-all font-semibold touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  Später
                </button>
                <button
                  onClick={handleBierWettbewerbRedirect}
                  className="flex-1 px-4 sm:px-6 py-3 min-h-[44px] text-base bg-[#6054d9] hover:bg-[#4f44c7] dark:bg-[#6054d9] dark:hover:bg-[#4f44c7] text-white rounded-lg active:scale-95 transition-all font-semibold touch-manipulation flex items-center justify-center gap-2 shadow-md"
                  style={{ touchAction: 'manipulation' }}
                >
                  Jetzt teilnehmen
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage