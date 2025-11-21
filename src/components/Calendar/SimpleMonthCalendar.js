// FILE OVERVIEW
// - Purpose: Small month calendar component showing events and blocked dates; allows clicking dates to request events.
// - Used by: HomePage as the main calendar display; shows events from eventsAPI and temporarily blocked dates.
// - Notes: Production component. Uses react-big-calendar with moment; handles date clicks to trigger event request flow.

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import httpAPI from '../../services/databaseApi'
import EventDetailsModal from './EventDetailsModal'
import PublicEventRequestForm from './PublicEventRequestForm'
import EventListView from './EventListView'
import { secureLog, sanitizeError } from '../../utils/secureConfig'

// Set up moment.js for react-big-calendar
moment.locale('de')
const localizer = momentLocalizer(moment)

const SimpleMonthCalendar = ({ 
  currentDate, 
  onNavigate, 
  onDateClick,
  onEventUpdated 
}) => {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventRequestForm, setShowEventRequestForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [calendarDate, setCalendarDate] = useState(currentDate || new Date())
  const [isMobile, setIsMobile] = useState(false)


  // Load all events and requests - Optimized for calendar view
  const loadAllEvents = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      return
    }
    
    setIsRefreshing(true)
    setLoading(true)
    
    try {
      
      // Load all events (not just current month) to show all available events
      let allEvents = []
      
      try {
        // getAll() now uses Supabase client as primary with HTTP fallback built-in
        // executeWithFallback already has a 5s timeout, so just call it directly
        const apiEventsResult = await httpAPI.events.getAll()
        
        // Handle both { data, error } format and direct array
        let apiEvents = apiEventsResult
        if (apiEventsResult && typeof apiEventsResult === 'object') {
          // If it's { data, error } format, extract data
          if (apiEventsResult.data !== undefined) {
            apiEvents = apiEventsResult.data
          }
          // If it's already an array, use it
          else if (Array.isArray(apiEventsResult)) {
            apiEvents = apiEventsResult
          }
        }
        
        // Ensure apiEvents is an array and add to allEvents
        if (Array.isArray(apiEvents)) {
          allEvents = apiEvents // Use the events from API
        } else if (apiEvents) {
          // If it's not an array but has data, try to convert
          allEvents = Array.isArray(apiEvents) ? apiEvents : []
        }
      } catch (error) {
        secureLog('error', 'Failed to load events', sanitizeError(error))
        // Set empty array on error to prevent stale data
        allEvents = []
        // Don't throw - continue with empty events
      }
      
      // Load pending requests (admin only) - DISABLED to remove requests from calendar
      let pendingRequests = []
      // if (isAdmin()) {
      //   try {
      //     pendingRequests = await httpAPI.eventRequests.getCalendarRequests(startOfMonth, endOfMonth)
      //   } catch (dateError) {
      //     pendingRequests = await httpAPI.eventRequests.getAll()
      //   }
      // }
      
      // Load temporarily blocked dates (these show as orange blockers in calendar)
      // These are created when admin initially accepts a request to block the time slot
      let temporarilyBlocked = []
      try {
        temporarilyBlocked = await httpAPI.blockedDates.getTemporarilyBlocked() || []
      } catch (blockError) {
        secureLog('warn', 'Failed to load temporarily blocked dates', sanitizeError(blockError))
        temporarilyBlocked = []
      }
      
      const calendarEvents = []
      
      // Process approved events
      try {
        if (allEvents && allEvents.length > 0) {
        allEvents.forEach((event, index) => {
          const isPrivate = event.is_private || false
          // Check if user owns this event (check multiple possible ID fields)
          const isOwnEvent = user && (
            event.requested_by === user.id || 
            event.created_by === user.id
          )
          
          let eventTitle = event.title
          let eventDescription = event.description
          let isBlocked = false

          // Handle privacy based on user role
          if (isPrivate) {
            
            if (isAdmin()) {
              // Admin sees everything with full details
              eventTitle = event.title
              eventDescription = event.description
              isBlocked = false
            } else if (isOwnEvent) {
              // User sees their own private events with full details
              eventTitle = event.title
              eventDescription = event.description
              isBlocked = false
            } else {
              // Others (including all non-logged-in users) see as blocked (grey)
              eventTitle = 'Blockiert'
              eventDescription = 'Dieses Event ist privat.'
              isBlocked = true
            }
          } else {
            // Public event - everyone can see
            eventTitle = event.title
            eventDescription = event.description
            isBlocked = false
          }

          // Parse dates - handle different formats
          let startDate = null
          let endDate = null
          
          try {
            // Handle different date formats
            if (event.start_date) {
              startDate = new Date(event.start_date)
              // If date is invalid, try parsing as ISO string
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
            secureLog('warn', 'Failed to parse event dates', { 
              eventId: event.id, 
              start_date: event.start_date, 
              end_date: event.end_date,
              error: sanitizeError(dateError)
            })
            return // Skip this event if dates can't be parsed (return from forEach callback)
          }

          // Check if event has time information
          const hasTimeInfo = event.start_date && event.start_date.includes('T')
          
          // Time is NOT shown in calendar title - only in event details modal
          // Keep event title clean without time display

          if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
            const calendarEvent = {
              id: event.id,
              title: eventTitle,
              start: startDate,
              end: endDate,
              allDay: !hasTimeInfo,
              resource: {
                ...event,
                description: eventDescription,
                status: 'approved',
                isRequest: false,
                isPrivate: isPrivate,
                isBlocked: isBlocked,
                isOwnEvent: isOwnEvent
              }
            }
            calendarEvents.push(calendarEvent)
          } else {
            // Skip events with invalid dates
            secureLog('warn', 'Skipping event with invalid dates', { 
              eventId: event.id, 
              title: event.title,
              start_date: event.start_date,
              end_date: event.end_date,
              startDateValid: startDate && !isNaN(startDate.getTime()),
              endDateValid: endDate && !isNaN(endDate.getTime())
            })
          }
        })
        }
      } catch (processingError) {
        secureLog('error', 'Error processing events for calendar', sanitizeError(processingError))
      }

      // Process pending requests (admin only) - DISABLED
      if (false && isAdmin() && pendingRequests && pendingRequests.length > 0) {
        pendingRequests.forEach(request => {
          const startDate = new Date(request.start_date)
          const endDate = request.end_date ? new Date(request.end_date) : new Date(request.start_date)
          const hasTimeInfo = request.start_date && request.start_date.includes('T')

          if (!isNaN(startDate.getTime())) {
            calendarEvents.push({
              id: `request-${request.id}`,
              title: `${request.title} (Anfrage)`,
              start: startDate,
              end: endDate,
              allDay: !hasTimeInfo,
              resource: {
                ...request,
                status: 'pending',
                isRequest: true,
                isPrivate: request.is_private || false,
                isBlocked: false
              }
            })
          }
        })
      }

      // Process temporarily blocked dates
      if (temporarilyBlocked && temporarilyBlocked.length > 0) {
        temporarilyBlocked.forEach(blocked => {
          let blockedStartDate = null
          let blockedEndDate = null

          try {
            // Try to get exact times first
            if (blocked.exact_start_datetime) {
              blockedStartDate = new Date(blocked.exact_start_datetime)
              blockedEndDate = new Date(blocked.exact_end_datetime || blocked.exact_start_datetime)
            }
            // Fallback to exact times if available
            else if (!blockedStartDate && blocked.exact_start_datetime) {
              blockedStartDate = new Date(blocked.exact_start_datetime)
              blockedEndDate = new Date(blocked.exact_end_datetime || blocked.exact_start_datetime)
            }
            // Fallback to start_date/end_date
            else if (!blockedStartDate && blocked.start_date) {
              blockedStartDate = new Date(blocked.start_date)
              blockedEndDate = new Date(blocked.end_date || blocked.start_date)
            }
          } catch (e) {
          }
          
          if (blockedStartDate && !isNaN(blockedStartDate.getTime())) {
            // Show as "Vorläufig blockiert" for everyone (admin and non-admin)
            const title = 'Vorläufig blockiert'
            const description = isAdmin() 
              ? `Anfrage von ${blocked.requester_name} - Status: ${blocked.request_stage}` 
              : 'Dieser Zeitraum ist vorübergehend blockiert'
            
            // Check if this blocked event has time information
            const hasTimeInfo = blocked.exact_start_datetime || 
                               (blocked.start_date && blocked.start_date.includes('T'))
            
            calendarEvents.push({
              id: `temp-blocked-${blocked.id}`,
              title: title,
              start: blockedStartDate,
              end: blockedEndDate || blockedStartDate,
              allDay: !hasTimeInfo,
              resource: {
                ...blocked,
                description: description,
                status: 'temporary_block',
                isRequest: true,
                isPrivate: false,
                isBlocked: true,
                isTemporaryBlock: true,
                request_stage: blocked.request_stage
              }
            })
          }
        })
      }

      setEvents(calendarEvents)
      
    } catch (error) {
      secureLog('error', 'Failed to load calendar events', sanitizeError(error))
      setEvents([]) // Set empty array on error to prevent stale data
    } finally {
      // Always clear loading state, even on error
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [isAdmin, calendarDate, user, isRefreshing])

  // Detect mobile viewport - run FIRST to avoid loading calendar on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        const mobile = window.innerWidth < 768 // md breakpoint
        setIsMobile(mobile)
        // If mobile, set loading to false immediately
        if (mobile) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    }
    
    // Check immediately on mount
    checkMobile()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobile)
      }
    }
  }, []) // Run only once on mount

  // Load events on component mount - only for desktop (mobile uses EventListView)
  useEffect(() => {
    // Skip if mobile - EventListView handles its own loading
    if (isMobile) {
      return
    }
    
    let mounted = true
    
    const loadEventsSafely = async () => {
      // Load events regardless of authentication status
      // Events should be visible to all users (logged in or not)
      if (mounted && !isMobile) {
        try {
          await loadAllEvents()
        } catch (error) {
          secureLog('error', 'loadEventsSafely error', sanitizeError(error))
          if (mounted) {
            setLoading(false)
            setIsRefreshing(false)
          }
        }
      }
    }

    // Load events immediately for desktop
    loadEventsSafely()
    
    // Listen for custom refresh event (triggered by admin panel after final acceptance)
    const handleRefreshCalendar = () => {
      if (mounted && !isMobile) {
        loadEventsSafely()
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('refreshCalendar', handleRefreshCalendar)
    }
    
    // No auto-refresh - events only load on mount and manual refresh
    // User requested: events should only load when site is called, not while site is open
    
    // Safety timeout to prevent infinite loading
    // This is a backup in case both Supabase client (5s) and HTTP fallback (5s) both fail
    const timeout = setTimeout(() => {
      if (mounted && !isMobile) {
        secureLog('warn', 'Calendar loading timeout - forcing loading state to false')
        setLoading(false)
        setIsRefreshing(false)
      }
    }, 10000) // 10 second timeout (5s primary + 5s fallback + buffer)
    
    return () => {
      mounted = false
      clearTimeout(timeout)
      if (typeof window !== 'undefined') {
        window.removeEventListener('refreshCalendar', handleRefreshCalendar)
      }
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]) // Only depend on isMobile, loadAllEvents is stable

  // Update calendar date when currentDate prop changes
  useEffect(() => {
    if (currentDate) {
      setCalendarDate(new Date(currentDate))
    }
  }, [currentDate])

  // Handle date selection
  const handleSelectSlot = useCallback((slotInfo) => {
    if (onDateClick) {
      setSelectedDate(slotInfo.start)
      onDateClick(slotInfo.start)
    }
  }, [onDateClick])

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    const isBlocked = event.resource?.isBlocked
    const isOwnEvent = event.resource?.isOwnEvent
    
    // Only allow clicks on:
    // - Admin can click everything
    // - Users can click their own events
    // - Users can click public events
    // - Blocked events cannot be clicked unless admin or own event
    if (isBlocked && !isAdmin() && !isOwnEvent) {
      return // Don't show details for blocked events
    }
    
    setSelectedEvent(event)
    setShowEventDetails(true)
  }, [isAdmin])

  // Handle event update from details modal
  const handleEventUpdate = useCallback(async () => {
    await loadAllEvents()
    if (onEventUpdated) {
      onEventUpdated()
    }
  }, [loadAllEvents, onEventUpdated])

  // Custom event component
  const EventComponent = ({ event }) => {
    const isBlocked = event.resource?.isBlocked
    const isTemporaryBlock = event.resource?.isTemporaryBlock
    const isPrivate = event.resource?.isPrivate
    const isRequest = event.resource?.isRequest
    
    let backgroundColor = '#3b82f6' // Default: Public events - blue
    let borderColor = '#2563eb'
    let borderStyle = 'solid'
    let opacity = 1
    
    if (isTemporaryBlock) {
      backgroundColor = '#f59e0b' // Orange for temporarily blocked
      borderColor = '#d97706'
      borderStyle = 'dashed'
      opacity = 0.7
    } else if (isBlocked) {
      backgroundColor = '#6b7280' // Gray for blocked
      borderColor = '#4b5563'
      opacity = 0.6
    } else if (isRequest) {
      backgroundColor = '#fbbf24' // Yellow for requests
      borderColor = '#f59e0b'
      borderStyle = 'dashed'
      opacity = 0.8
    } else if (isPrivate) {
      backgroundColor = '#6054d9' // Purple for private events
      borderColor = '#4A3BB5'
    }

    return (
      <div 
        style={{
          backgroundColor,
          color: 'white',
          padding: '2px 4px',
          margin: '1px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          lineHeight: '1.3',
          border: `2px ${borderStyle} ${borderColor}`,
          opacity,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {event.title}
      </div>
    )
  }



  // Show list view on mobile, calendar on desktop
  // Don't wait for loading on mobile - show list immediately
  if (isMobile) {
    return (
      <div className="w-full">
        <div className="mb-5 sm:mb-4 px-1">
          <h2 className={`text-2xl sm:text-xl font-bold mb-2.5 sm:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Bevorstehende Events
          </h2>
          <p className={`text-base sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
            Tippen Sie auf eine Veranstaltung für Details
          </p>
        </div>
        <EventListView 
          onEventClick={(event) => {
            setSelectedEvent(event)
            setShowEventDetails(true)
          }}
          onDateClick={onDateClick}
        />
        {showEventDetails && selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            isOpen={showEventDetails}
            onClose={() => {
              setShowEventDetails(false)
              setSelectedEvent(null)
            }}
            onEventUpdated={() => {
              loadAllEvents()
              if (onEventUpdated) {
                onEventUpdated()
              }
            }}
          />
        )}
        {showEventRequestForm && (
          <PublicEventRequestForm
            isOpen={showEventRequestForm}
            onClose={() => {
              setShowEventRequestForm(false)
              setSelectedDate(null)
            }}
            selectedDate={selectedDate}
          />
        )}
      </div>
    )
  }

  // Only show loading for desktop calendar view
  if (loading && !isMobile) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: isDarkMode ? '#ffffff' : '#252422'
      }}>
        Lade Kalender...
      </div>
    )
  }

  return (
    <>
      {/* Legend */}
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Veranstaltungs-Kalender
        </h2>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Klicken Sie auf einen Tag, um eine Veranstaltung anzufragen (keine Anmeldung erforderlich!)
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1E40AF' }}></div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Öffentliche Veranstaltung</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9CA3AF', opacity: 0.8 }}></div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Blockiert</span>
          </div>
        </div>
      </div>

      <style>{`
        /* Increase day cell height for better event visibility */
        .rbc-month-row {
          min-height: 100px !important;
        }
        
        .rbc-day-bg {
          min-height: 100px !important;
          cursor: pointer !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        .rbc-day-bg:not(.rbc-off-range-bg):hover {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'} !important;
        }
        
        /* Make date cells clickable */
        .rbc-date-cell {
          font-size: 16px !important;
          font-weight: 700 !important;
          padding: 6px 10px !important;
          color: #252422 !important;
          cursor: pointer !important;
          position: relative !important;
          z-index: 2 !important;
        }
        
        .rbc-off-range .rbc-date-cell {
          color: #999999 !important;
          cursor: default !important;
        }
        
        /* Make sure event segments don't block clicks on empty dates */
        .rbc-row-segment {
          pointer-events: none !important;
        }
        
        /* Ensure day cells are above row segments and clickable */
        .rbc-day-bg:not(.rbc-off-range-bg) {
          pointer-events: auto !important;
        }
        
        /* Make sure events don't block date clicks - only allow clicks on events themselves */
        .rbc-event {
          pointer-events: auto !important;
        }
      `}</style>

      <div className={isDarkMode ? 'dark' : ''}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '750px' }}
          defaultView="month"
          views={['month']}
          date={calendarDate}
          onNavigate={(action) => {
            if (onNavigate) {
              // Calculate new date based on action
              const newDate = new Date(calendarDate)
              if (action === 'PREV') {
                newDate.setMonth(newDate.getMonth() - 1)
              } else if (action === 'NEXT') {
                newDate.setMonth(newDate.getMonth() + 1)
              } else if (action instanceof Date) {
                setCalendarDate(action)
                if (onNavigate) onNavigate(action)
                return
              }
              setCalendarDate(newDate)
              onNavigate(newDate)
            } else {
              // Default navigation if no callback provided
              const newDate = new Date(calendarDate)
              if (action === 'PREV') {
                newDate.setMonth(newDate.getMonth() - 1)
              } else if (action === 'NEXT') {
                newDate.setMonth(newDate.getMonth() + 1)
              } else if (action instanceof Date) {
                setCalendarDate(action)
                return
              }
              setCalendarDate(newDate)
            }
          }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          components={{
            event: EventComponent,
            toolbar: (props) => (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '0',
                width: '100%'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      const newDate = new Date(calendarDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setCalendarDate(newDate)
                      if (onNavigate) onNavigate(newDate)
                      props.onNavigate('PREV')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '28px',
                      cursor: 'pointer',
                      color: isDarkMode ? '#000000' : '#252422',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = isDarkMode ? '#333333' : '#f0f0f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ‹
                  </button>
                  
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    color: isDarkMode ? '#000000' : '#252422',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {props.label}
                  </h2>
                  
                  <button
                    onClick={() => {
                      const newDate = new Date(calendarDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setCalendarDate(newDate)
                      if (onNavigate) onNavigate(newDate)
                      props.onNavigate('NEXT')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '28px',
                      cursor: 'pointer',
                      color: isDarkMode ? '#000000' : '#252422',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = isDarkMode ? '#333333' : '#f0f0f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ›
                  </button>
                </div>
              </div>
            )
          }}
          eventPropGetter={(event) => {
            const isBlocked = event.resource?.isBlocked
            const isTemporaryBlock = event.resource?.isTemporaryBlock
            const isPrivate = event.resource?.isPrivate
            const isRequest = event.resource?.isRequest
            const isOwnEvent = event.resource?.isOwnEvent
            
            let backgroundColor = '#1E40AF' // Dark blue for public events (Vermietet - Öffentliche Veranstaltung)
            let borderColor = '#1E3A8A'
            let borderStyle = 'solid'
            let opacity = 1
            let textColor = 'white'
            
            if (isTemporaryBlock) {
              backgroundColor = '#F97316' // Orange for temporarily blocked (Vormerkung)
              borderColor = '#EA580C'
              borderStyle = 'dashed'
              opacity = 0.9
              textColor = 'white'
            } else if (isBlocked) {
              // Grey for blocked events (Geblockt)
              backgroundColor = '#9CA3AF'
              borderColor = '#6B7280'
              opacity = 0.8
              textColor = 'white'
            } else if (isRequest) {
              backgroundColor = '#F97316' // Orange for requests (admin only)
              borderColor = '#EA580C'
              borderStyle = 'dashed'
              opacity = 0.8
              textColor = 'white'
            } else if (isPrivate && (isAdmin() || isOwnEvent)) {
              // Green for private events that user can see (Vermietet - Privatveranstaltung)
              backgroundColor = '#16A34A'
              borderColor = '#15803D'
              textColor = 'white'
            }

            return {
              style: {
                backgroundColor,
                borderColor,
                color: textColor,
                border: `2px ${borderStyle} ${borderColor}`,
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                opacity,
                padding: '2px 4px'
              }
            }
          }}
        />
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
          onEventUpdated={handleEventUpdate}
        />
      )}

      {/* Event Request Form Modal */}
      {showEventRequestForm && (
        <PublicEventRequestForm
          isOpen={showEventRequestForm}
          onClose={() => {
            setShowEventRequestForm(false)
            setSelectedDate(null)
          }}
          selectedDate={selectedDate}
          onSuccess={() => {
            setShowEventRequestForm(false)
            setSelectedDate(null)
            // Auto-refresh will handle updating the calendar
          }}
        />
      )}
    </>
  )
}

export default SimpleMonthCalendar
