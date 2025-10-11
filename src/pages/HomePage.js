import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, FileText } from 'lucide-react'
import NewEventCalendar from '../components/Calendar/NewEventCalendar'
import TypewriterText from '../components/UI/TypewriterText'
import NextEventInfo from '../components/UI/NextEventInfo'

const HomePage = () => {
  const { user } = useAuth()
  const [showSubtitle, setShowSubtitle] = useState(false)

  const handleFirstTextComplete = () => {
    setShowSubtitle(true)
  }

  return (
    <div className="min-h-screen">

      {/* Hero Section - Modern & Compact */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-[4vw] sm:px-[5vw] md:px-[6vw] lg:px-[8vw] xl:px-[10vw] py-[4vh] sm:py-[5vh] md:py-[6vh]">
          <div className="max-w-6xl mx-auto">
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
          </div>
        </div>
      </div>

      {/* Button Section - Middle between hero and calendar */}
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422] py-[1vh] sm:py-[1.2vh] md:py-[1.4vh] lg:py-[1.6vh] xl:py-[1.8vh] 2xl:py-[2vh]">
        <div className="max-w-6xl mx-auto px-[4vw] sm:px-[5vw] md:px-[6vw] lg:px-[8vw] xl:px-[10vw]">
          <div className="flex flex-wrap justify-center gap-[3vw] sm:gap-[2.5vw] md:gap-[2vw] lg:gap-[1.8vw] xl:gap-[1.5vw]">
            <Link
              to="/about"
              className="group inline-flex items-center px-[3.5vw] sm:px-[3vw] md:px-[2.5vw] lg:px-[2vw] xl:px-[1.8vw] py-[1.8vh] sm:py-[1.5vh] md:py-[1.2vh] lg:py-[1vh] xl:py-[0.8vh] text-[2.8vw] sm:text-[2.4vw] md:text-[2vw] lg:text-[1.6vw] xl:text-[1.3vw] font-semibold text-white dark:text-[#252422] bg-[#A58C81] dark:bg-[#F4F1E8] rounded-full border-2 border-[#A58C81] dark:border-[#F4F1E8] hover:bg-[#8B6F5F] dark:hover:bg-[#EBE9E9] hover:text-white dark:hover:text-[#252422] transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl"
            >
              <Users className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.6vw] xl:h-[1.3vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.6vw] xl:w-[1.3vw] mr-[1.2vw] sm:mr-[1vw] md:mr-[0.8vw] lg:mr-[0.6vw] xl:mr-[0.5vw]" />
              Über uns
            </Link>
            <Link
              to="/faq"
              className="group inline-flex items-center px-[3.5vw] sm:px-[3vw] md:px-[2.5vw] lg:px-[2vw] xl:px-[1.8vw] py-[1.8vh] sm:py-[1.5vh] md:py-[1.2vh] lg:py-[1vh] xl:py-[0.8vh] text-[2.8vw] sm:text-[2.4vw] md:text-[2vw] lg:text-[1.6vw] xl:text-[1.3vw] font-semibold text-white dark:text-[#252422] bg-[#A58C81] dark:bg-[#F4F1E8] rounded-full border-2 border-[#A58C81] dark:border-[#F4F1E8] hover:bg-[#8B6F5F] dark:hover:bg-[#EBE9E9] hover:text-white dark:hover:text-[#252422] transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl"
            >
              <FileText className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.6vw] xl:h-[1.3vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.6vw] xl:w-[1.3vw] mr-[1.2vw] sm:mr-[1vw] md:mr-[0.8vw] lg:mr-[0.6vw] xl:mr-[0.5vw]" />
              FAQ
            </Link>
            <button
              onClick={() => {
                const calendar = document.querySelector('.rbc-calendar')
                if (calendar) {
                  const event = new CustomEvent('openEventRequestModal', {
                    detail: { selectedDate: new Date() }
                  })
                  window.dispatchEvent(event)
                }
              }}
              className="group inline-flex items-center px-[3.5vw] sm:px-[3vw] md:px-[2.5vw] lg:px-[2vw] xl:px-[1.8vw] py-[1.8vh] sm:py-[1.5vh] md:py-[1.2vh] lg:py-[1vh] xl:py-[0.8vh] text-[2.8vw] sm:text-[2.4vw] md:text-[2vw] lg:text-[1.6vw] xl:text-[1.3vw] font-semibold text-white dark:text-[#252422] bg-[#A58C81] dark:bg-[#F4F1E8] rounded-full border-2 border-[#A58C81] dark:border-[#F4F1E8] hover:bg-[#8B6F5F] dark:hover:bg-[#EBE9E9] hover:text-white dark:hover:text-[#252422] transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl"
            >
              <Calendar className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.6vw] xl:h-[1.3vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.6vw] xl:w-[1.3vw] mr-[1.2vw] sm:mr-[1vw] md:mr-[0.8vw] lg:mr-[0.6vw] xl:mr-[0.5vw]" />
              Event anfragen
            </button>
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
            {/* If user not logged in, show quick hint and mobile tap overlay */}
            {!user && (
              <div className="mb-[0.5vh] sm:mb-[0.8vh] md:mb-[1vh]">
                <p className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] text-gray-600 dark:text-[#EBE9E9]">
                  Bitte anmelden, um eine Event‑Anfrage zu stellen.
                </p>
              </div>
            )}
            {/* Make calendar header usable on small screens */}
            <div className="w-full touch-pan-x">
              {/* Mobile overlay to redirect directly on tap */}
              {!user && (
                <button
                  type="button"
                  className="absolute inset-0 z-10 md:hidden"
                  onClick={() => {
                    window.location.href = '/login'
                  }}
                  aria-label="Zum Anmelden weiterleiten"
                >
                  <span className="sr-only">Tippen Sie hier, um sich anzumelden</span>
                </button>
              )}
              <NewEventCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage