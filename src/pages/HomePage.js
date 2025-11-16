// FILE OVERVIEW
// - Purpose: Main public landing page that shows hero, next event info, CTA buttons, and the small month calendar.
// - Used by: Route component for path '/', rendered from the main router (see App.js).
// - Notes: Core production page. Changes here affect the first impression for all visitors.

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDarkMode } from '../contexts/DarkModeContext'
import { Calendar, Users, FileText } from 'lucide-react'
import SimpleMonthCalendar from '../components/Calendar/SimpleMonthCalendar'
import TypewriterText from '../components/UI/TypewriterText'
import NextEventInfo from '../components/UI/NextEventInfo'
import { getActiveSpecialEvents } from '../services/specialEventsApi'
import PublicEventRequestForm from '../components/Calendar/PublicEventRequestForm'
import GuestOrRegisterModal from '../components/Calendar/GuestOrRegisterModal'

const HomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [showPublicRequestForm, setShowPublicRequestForm] = useState(false)
  const [showGuestOrRegister, setShowGuestOrRegister] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [specialEvents, setSpecialEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())

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

  // Load active special events (cached) for CTA target
  useEffect(() => {
    let mounted = true
    getActiveSpecialEvents({ useCache: true })
      .then(list => { if (mounted) setSpecialEvents(list || []) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen">

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

            {/* Mobile Special Events CTA: always visible on home */}
            <div className="mt-4 md:hidden">
              <Link
                to="/kostuemwettbewerb-ergebnisse"
                className="inline-flex items-center justify-center px-4 py-3 text-base font-semibold text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg shadow-md w-full"
              >
                Kostümwettbewerb Ergebnisse
              </Link>
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
              Event anfragen
            </button>
            <div className="mt-3 flex items-center justify-center gap-[1vw]">
              <span className={`text-[2.2vw] sm:text-[1.8vw] md:text-[1.4vw] lg:text-[1.1vw] xl:text-[0.9vw] text-[#252422] dark:text-[#F4F1E8]`}>
                oder
              </span>
              <Link 
                to="/event-tracking"
                className={`text-[2.5vw] sm:text-[2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1.1vw] font-medium text-[#252422] dark:text-[#F4F1E8] hover:text-[#A58C81] dark:hover:text-[#EBE9E9] transition-colors underline decoration-2 underline-offset-4 decoration-[#A58C81] dark:decoration-[#EBE9E9]`}
              >
                Status verfolgen
              </Link>
              <span className={`text-[2.2vw] sm:text-[1.8vw] md:text-[1.4vw] lg:text-[1.1vw] xl:text-[0.9vw] text-[#252422] dark:text-[#F4F1E8]`}>
                oder
              </span>
              <Link 
                to="/kostuemwettbewerb-ergebnisse"
                className={`text-[2.5vw] sm:text-[2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1.1vw] font-medium text-[#252422] dark:text-[#F4F1E8] hover:text-[#A58C81] dark:hover:text-[#EBE9E9] transition-colors underline decoration-2 underline-offset-4 decoration-[#A58C81] dark:decoration-[#EBE9E9]`}
              >
                Ergebnisse ansehen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Transition Section */}
      <div className="w-full h-[0.5vh] sm:h-[0.8vh] md:h-[1vh] lg:h-[1.2vh] xl:h-[1.5vh] 2xl:h-[1.8vh] bg-[#F4F1E8] dark:bg-[#252422]"></div>

      {/* Main Content */}
      <div className="w-full px-[2vw] sm:px-[3vw] md:px-[4vw] lg:px-[5vw] xl:px-[6vw] py-[1vh] sm:py-[1.5vh] md:py-[2vh] lg:py-[2.5vh] xl:py-[3vh] 2xl:py-[3.5vh] bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="mx-auto space-y-[0.5vh] sm:space-y-[0.8vh] md:space-y-[1vh] lg:space-y-[1.2vh] xl:space-y-[1.5vh] 2xl:space-y-[1.8vh] max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] 2xl:max-w-[75vw]">
          {/* Calendar Section */}
          <div className="bg-white dark:bg-[#252422] rounded-2xl shadow-xl p-[2vw] sm:p-[1.5vw] md:p-[1vw] lg:p-[0.8vw] xl:p-[0.6vw] 2xl:p-[0.5vw] relative border-2 border-[#A58C81] dark:border-[#EBE9E9]">
            {/* Make calendar header usable on small screens */}
            <div className="w-full touch-pan-x">
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
    </div>
  )
}

export default HomePage