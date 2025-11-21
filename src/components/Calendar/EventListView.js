// FILE OVERVIEW
// - Purpose: Mobile-friendly list view of upcoming events; shows instead of calendar on mobile devices.
// - Used by: SimpleMonthCalendar on mobile devices (screen width < 768px).
// - Notes: Production component. Displays events in a scrollable list with easy finger navigation.

import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Clock, MapPin, Users, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import httpAPI from '../../services/databaseApi'
import EventDetailsModal from './EventDetailsModal'
import { secureLog, sanitizeError } from '../../utils/secureConfig'

const EventListView = ({ 
  onEventClick,
  onDateClick 
}) => {
  const { user, isAdmin } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [allEvents, setAllEvents] = useState([]) // Store all events
  const [loading, setLoading] = useState(true)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [temporarilyBlocked, setTemporarilyBlocked] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const eventsPerPage = 5

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true)
      
      // Load events
      let allEvents = []
      try {
        const apiEventsResult = await httpAPI.events.getAll()
        
        // Handle both { data, error } format and direct array
        let apiEvents = apiEventsResult
        if (apiEventsResult && typeof apiEventsResult === 'object') {
          if (apiEventsResult.data !== undefined) {
            apiEvents = apiEventsResult.data
          } else if (Array.isArray(apiEventsResult)) {
            apiEvents = apiEventsResult
          }
        }
        
        if (Array.isArray(apiEvents)) {
          allEvents = apiEvents
        }
      } catch (error) {
        secureLog('error', 'Failed to load events', sanitizeError(error))
        allEvents = []
      }
      
      // Load temporarily blocked dates
      let blocked = []
      try {
        blocked = await httpAPI.blockedDates.getTemporarilyBlocked() || []
      } catch (blockError) {
        secureLog('warn', 'Failed to load temporarily blocked dates', sanitizeError(blockError))
        blocked = []
      }
      setTemporarilyBlocked(blocked)
      
      // Filter and process events
      const now = new Date()
      const upcomingEvents = []
      
      // Process approved events
      if (allEvents && Array.isArray(allEvents)) {
        allEvents.forEach(event => {
          const isPrivate = event.is_private || false
          const isOwnEvent = user && (
            event.requested_by === user.id || 
            event.created_by === user.id
          )
          
          // Skip private events unless user is admin or owner
          if (isPrivate && !isAdmin() && !isOwnEvent) {
            return
          }
          
          // Parse dates
          let startDate = null
          let endDate = null
          
          try {
            if (event.start_date) {
              startDate = new Date(event.start_date)
              if (isNaN(startDate.getTime())) {
                startDate = new Date(event.start_date + (event.start_date.includes('T') ? '' : 'T00:00:00'))
              }
            }
            
            if (event.end_date) {
              endDate = new Date(event.end_date)
              if (isNaN(endDate.getTime())) {
                endDate = new Date(event.end_date + (event.end_date.includes('T') ? '' : 'T23:59:59'))
              }
            } else if (startDate) {
              endDate = new Date(startDate)
            }
          } catch (dateError) {
            return // Skip events with invalid dates
          }
          
          // Only show upcoming events
          if (startDate && !isNaN(startDate.getTime()) && startDate >= now) {
            upcomingEvents.push({
              ...event,
              startDate,
              endDate,
              isPrivate,
              isOwnEvent
            })
          }
        })
      }
      
      // Add temporarily blocked dates as events
      if (blocked && Array.isArray(blocked)) {
        blocked.forEach(block => {
          let blockedStartDate = null
          let blockedEndDate = null
          
          try {
            if (block.exact_start_datetime) {
              blockedStartDate = new Date(block.exact_start_datetime)
              blockedEndDate = new Date(block.exact_end_datetime || block.exact_start_datetime)
            } else if (block.start_date) {
              blockedStartDate = new Date(block.start_date)
              blockedEndDate = new Date(block.end_date || block.start_date)
            }
          } catch (e) {
            return
          }
          
          if (blockedStartDate && !isNaN(blockedStartDate.getTime()) && blockedStartDate >= now) {
            upcomingEvents.push({
              id: `temp-blocked-${block.id}`,
              title: 'Vorläufig blockiert',
              description: isAdmin() 
                ? `Anfrage von ${block.requester_name} - Status: ${block.request_stage}` 
                : 'Dieser Zeitraum ist vorübergehend blockiert',
              startDate: blockedStartDate,
              endDate: blockedEndDate,
              isTemporaryBlock: true,
              isPrivate: false,
              isOwnEvent: false
            })
          }
        })
      }
      
      // Sort by start date
      upcomingEvents.sort((a, b) => a.startDate - b.startDate)
      
      // Store all events (no limit)
      setAllEvents(upcomingEvents)
      
    } catch (error) {
      secureLog('error', 'Failed to load events for list view', sanitizeError(error))
      setAllEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Load events only once on mount - no auto-refresh
  useEffect(() => {
    loadEvents()
    
    // Listen for refresh event from admin panel (only manual refresh)
    const handleRefresh = () => {
      loadEvents()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('refreshCalendar', handleRefresh)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('refreshCalendar', handleRefresh)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount, not on user/admin changes

  // Track touch to detect scroll vs tap - use refs to avoid re-renders
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const isScrollingRef = useRef(false)
  const touchTimerRef = useRef(null)

  const handleEventClick = (event) => {
    if (event.isTemporaryBlock) {
      return // Don't show details for temporary blocks
    }
    
    // Don't trigger click if user was scrolling
    if (isScrollingRef.current) {
      return
    }
    
    setSelectedEvent(event)
    setShowEventDetails(true)
    
    if (onEventClick) {
      onEventClick(event)
    }
  }

  // MOBILE SCROLL FIX: Handle touch start to detect scroll vs tap
  // This handler is passive-compatible and never calls preventDefault()
  // It only tracks touch position to distinguish scrolling from tapping
  const handleTouchStart = (e) => {
    if (!e.touches || !e.touches[0]) return
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    isScrollingRef.current = false
    
    // Clear any existing timer
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
    }
    // MOBILE SCROLL FIX: Never preventDefault() - allow native scroll to work
  }

  // MOBILE SCROLL FIX: Handle touch move to detect scroll intent
  // Never calls preventDefault() - allows native scroll to work smoothly
  // Only tracks movement to distinguish scroll from tap
  const handleTouchMove = (e) => {
    if (!touchStartRef.current.x && !touchStartRef.current.y) return
    if (!e.touches || !e.touches[0]) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
    
    // If movement is more vertical than horizontal and significant, it's a scroll
    // Very low threshold (2px) to detect scroll intent immediately
    if (deltaY > 2 && deltaY > deltaX) {
      isScrollingRef.current = true
    }
    // MOBILE SCROLL FIX: Never preventDefault() - always allow native scroll
  }

  // Handle touch end - reset after a delay
  const handleTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) {
      // Reset after delay
      touchTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false
        touchStartRef.current = { x: 0, y: 0, time: 0 }
      }, 150)
      return
    }
    
    // Check if it was a quick tap (less than 200ms and minimal movement)
    const timeDiff = Date.now() - touchStartRef.current.time
    const deltaX = touchStartRef.current.x ? Math.abs((e.changedTouches[0].clientX || 0) - touchStartRef.current.x) : 0
    const deltaY = touchStartRef.current.y ? Math.abs((e.changedTouches[0].clientY || 0) - touchStartRef.current.y) : 0
    
    // If it was a quick tap with minimal movement, it's not a scroll
    if (timeDiff < 200 && deltaX < 10 && deltaY < 10) {
      isScrollingRef.current = false
    }
    
    // Reset after delay
    touchTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false
      touchStartRef.current = { x: 0, y: 0, time: 0 }
    }, 150)
  }

  // MOBILE SCROLL FIX: Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current)
      }
    }
  }, [])
  
  // MOBILE SCROLL FIX: Ensure touch handlers never block native scroll
  // React's synthetic events are not passive by default, but we ensure they
  // never call preventDefault() to allow native scrolling to work smoothly

  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return ''
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    if (!date || isNaN(date.getTime())) return ''
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (startDate, endDate) => {
    const startStr = formatDate(startDate)
    const startTime = formatTime(startDate)
    const endTime = formatTime(endDate)
    
    // Check if same day
    const isSameDay = startDate.toDateString() === endDate.toDateString()
    
    if (isSameDay) {
      if (startTime && endTime) {
        return `${startStr}, ${startTime} - ${endTime} Uhr`
      } else if (startTime) {
        return `${startStr}, ${startTime} Uhr`
      }
      return startStr
    } else {
      const endStr = formatDate(endDate)
      if (startTime && endTime) {
        return `${startStr}, ${startTime} - ${endStr}, ${endTime} Uhr`
      }
      return `${startStr} - ${endStr}`
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(allEvents.length / eventsPerPage)
  const startIndex = currentPage * eventsPerPage
  const endIndex = startIndex + eventsPerPage
  const currentEvents = allEvents.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 sm:py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-8 sm:w-8 border-b-2 border-[#A58C81]"></div>
      </div>
    )
  }

  if (allEvents.length === 0 && !loading) {
    return (
      <div className="text-center py-16 sm:py-12 px-6 sm:px-4">
        <Calendar className="h-16 w-16 sm:h-12 sm:w-12 mx-auto mb-5 sm:mb-4 text-gray-400" />
        <p className={`text-xl sm:text-lg font-medium text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''} mb-2`}>
          Keine bevorstehenden Veranstaltungen
        </p>
        <p className={`text-base sm:text-sm text-gray-600 ${isDarkMode ? 'dark:text-gray-400' : ''} leading-relaxed`}>
          Es sind derzeit keine Veranstaltungen geplant.
        </p>
      </div>
    )
  }

  return (
    <div 
      className="w-full"
      // MOBILE SCROLL FIX: Touch handlers only on outer container to detect scroll vs tap
      // Removed from inner div to prevent event conflicts and allow native scroll
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        // MOBILE SCROLL FIX: Changed from 'contain' to 'auto' to allow scroll chaining
        // 'contain' was preventing page scroll when reaching end of event list
        touchAction: 'pan-y',
        overscrollBehavior: 'auto' // Changed from 'contain' - allows scroll to continue to page
      }}
    >
      {/* Pagination Controls - Mobile-friendly with larger touch targets */}
      {allEvents.length > eventsPerPage && (
        <div 
          className="flex items-center justify-between px-4 sm:px-2 mb-5 sm:mb-3 pb-4 sm:pb-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm"
          style={{
            backgroundColor: isDarkMode ? 'rgba(37, 36, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            paddingTop: '16px',
            paddingBottom: '16px',
            minHeight: '64px', // Ensure minimum touch target height for mobile
            // MOBILE SCROLL FIX: Sticky pagination doesn't interfere with page scroll
            // touch-action on buttons allows scrolling through pagination area
          }}
        >
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`flex items-center justify-center gap-2.5 sm:gap-2 px-6 sm:px-4 py-3.5 sm:py-2 rounded-xl sm:rounded-lg font-semibold transition-all min-h-[48px] sm:min-h-[44px] ${
              currentPage === 0
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-[#A58C81] dark:bg-[#6a6a6a] text-white hover:bg-[#8a6a5a] dark:hover:bg-[#8a8a8a] active:scale-95 active:bg-[#7a5a4a] dark:active:bg-[#7a7a7a]'
            }`}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '110px', // Ensure minimum touch target width for mobile
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            <ChevronLeft className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="text-base sm:text-sm font-semibold whitespace-nowrap">Zurück</span>
          </button>
          
          <span className={`text-sm sm:text-sm font-medium px-3 sm:px-2 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {startIndex + 1}-{Math.min(endIndex, allEvents.length)} von {allEvents.length}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className={`flex items-center justify-center gap-2.5 sm:gap-2 px-6 sm:px-4 py-3.5 sm:py-2 rounded-xl sm:rounded-lg font-semibold transition-all min-h-[48px] sm:min-h-[44px] ${
              currentPage >= totalPages - 1
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-[#A58C81] dark:bg-[#6a6a6a] text-white hover:bg-[#8a6a5a] dark:hover:bg-[#8a8a8a] active:scale-95 active:bg-[#7a5a4a] dark:active:bg-[#7a7a7a]'
            }`}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '110px', // Ensure minimum touch target width for mobile
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            <span className="text-base sm:text-sm font-semibold whitespace-nowrap">Weiter</span>
            <ChevronRight className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Scrollable event list with improved mobile spacing and touch targets */}
      <div 
        className="space-y-4 sm:space-y-4 px-2 sm:px-2 pb-10 sm:pb-6"
        // MOBILE SCROLL FIX: Removed touch handlers from inner div to prevent event conflicts
        // Touch events are handled only on outer container to allow native scroll propagation
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          // MOBILE SCROLL FIX: 'pan-y' allows vertical scrolling, 'auto' allows scroll chaining to page
          touchAction: 'pan-y',
          overscrollBehavior: 'auto', // Changed from 'contain' - allows page scroll when list ends
          scrollSnapType: 'y proximity',
          msTouchAction: 'pan-y'
        }}
      >
        {currentEvents.map((event, index) => (
          <button
            key={event.id}
            onClick={() => {
              // Only handle click if not scrolling
              if (!isScrollingRef.current) {
                handleEventClick(event)
              }
            }}
            disabled={event.isTemporaryBlock}
            type="button"
            className={`w-full text-left p-5 sm:p-4 rounded-xl sm:rounded-lg border-2 transition-all ${
              event.isTemporaryBlock
                ? `bg-orange-50 ${isDarkMode ? 'dark:bg-orange-900/20' : ''} border-orange-200 ${isDarkMode ? 'dark:border-orange-800' : ''}`
                : event.isPrivate
                ? `bg-gray-50 ${isDarkMode ? 'dark:bg-gray-800/50' : ''} border-gray-200 ${isDarkMode ? 'dark:border-gray-700' : ''} hover:bg-gray-100 ${isDarkMode ? 'dark:hover:bg-gray-800' : ''} active:scale-[0.98] active:shadow-inner`
                : `bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''} hover:bg-gray-50 ${isDarkMode ? 'dark:hover:bg-[#333]' : ''} active:scale-[0.98] active:shadow-inner`
            } ${event.isTemporaryBlock ? 'cursor-default' : 'cursor-pointer'}`}
            style={{
              // MOBILE SCROLL FIX: 'pan-y' allows vertical scrolling from anywhere on button
              // This ensures users can scroll the page even when starting touch on event button
              touchAction: 'pan-y',
              WebkitTapHighlightColor: 'transparent',
              scrollSnapAlign: 'start',
              scrollMarginTop: '20px',
              scrollMarginBottom: '20px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              msTouchAction: 'pan-y',
              minHeight: '100px', // Ensure minimum touch target height for mobile (increased for better finger scrolling)
              boxShadow: event.isTemporaryBlock 
                ? 'none' 
                : '0 2px 4px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="flex items-start justify-between gap-4 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-xl sm:text-base mb-2.5 sm:mb-1 leading-tight ${
                  event.isTemporaryBlock
                    ? `text-orange-800 ${isDarkMode ? 'dark:text-orange-300' : ''}`
                    : `text-[#252422] ${isDarkMode ? 'dark:text-[#F4F1E8]' : ''}`
                }`}>
                  {event.title || 'Veranstaltung'}
                </h3>
                
                <div className="space-y-2.5 sm:space-y-1.5">
                  <div className="flex items-center gap-3 sm:gap-2 text-base sm:text-sm">
                    <Calendar className={`h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0 ${
                      event.isTemporaryBlock
                        ? 'text-orange-600'
                        : 'text-[#A58C81]'
                    }`} />
                    <span className={`leading-relaxed break-words ${
                      event.isTemporaryBlock
                        ? `text-orange-700 ${isDarkMode ? 'dark:text-orange-300' : ''}`
                        : `text-gray-700 ${isDarkMode ? 'dark:text-gray-300' : ''}`
                    }`}>
                      {formatDateTime(event.startDate, event.endDate)}
                    </span>
                  </div>
                  
                  {event.description && !event.isTemporaryBlock && (
                    <p className={`text-sm sm:text-sm line-clamp-2 leading-relaxed ${
                      `text-gray-600 ${isDarkMode ? 'dark:text-gray-400' : ''}`
                    }`}>
                      {event.description}
                    </p>
                  )}
                  
                  {event.isTemporaryBlock && event.description && (
                    <p className={`text-sm sm:text-sm leading-relaxed ${
                      `text-orange-700 ${isDarkMode ? 'dark:text-orange-300' : ''}`
                    }`}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
              
              {!event.isTemporaryBlock && (
                <ChevronRight className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400 mt-1.5" />
              )}
            </div>
            
            {event.isPrivate && !event.isTemporaryBlock && (
              <div className="mt-3 sm:mt-2 inline-flex items-center gap-2 sm:gap-1 px-3 sm:px-2 py-2 sm:py-1 bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded text-sm sm:text-xs text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4 sm:h-3 sm:w-3" />
                <span className="font-medium">Privat</span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={showEventDetails}
          onClose={() => {
            setShowEventDetails(false)
            setSelectedEvent(null)
          }}
          onEventUpdated={() => {
            loadEvents()
          }}
        />
      )}
    </div>
  )
}

export default EventListView

