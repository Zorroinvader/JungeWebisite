import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import httpAPI from '../../services/httpApi'
import EventDetailsModal from './EventDetailsModal'
import PublicEventRequestForm from './PublicEventRequestForm'

// Set up moment.js for react-big-calendar
moment.locale('de')
const localizer = momentLocalizer(moment)

const NewEventCalendar = ({ 
  currentDate, 
  onNavigate, 
  onDateClick,
  onEventUpdated 
}) => {
  const { user, isAdmin } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventRequestForm, setShowEventRequestForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  // Load all events and requests
  const loadAllEvents = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load approved events
      const allEvents = await httpAPI.events.getAll()
      
      // Load pending requests (admin only)
      let pendingRequests = []
      if (isAdmin()) {
        pendingRequests = await httpAPI.eventRequests.getAll()
      }
      
      // Load temporarily blocked dates
      const temporarilyBlocked = await httpAPI.blockedDates.getTemporarilyBlocked()
      
      const calendarEvents = []
      
      // Process approved events
      if (allEvents && allEvents.length > 0) {
        allEvents.forEach(event => {
          const isPrivate = event.is_private || false
          
          let eventTitle = event.title
          let eventDescription = event.description
          let isBlocked = false

          // Handle privacy for non-admin users
          if (isPrivate && !isAdmin()) {
            eventTitle = 'Blockiert'
            eventDescription = 'Dieses Event ist privat und nur für Administratoren sichtbar.'
            isBlocked = true
          }

          // Parse dates
          let startDate = new Date(event.start_date)
          let endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date)

          // Check if event has time information
          const hasTimeInfo = event.start_date && event.start_date.includes('T')
          
          // Format time display for title
          const formatTime = (date) => {
            if (!hasTimeInfo) return ''
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          }
          
          const startTime = formatTime(startDate)
          const endTime = formatTime(endDate)
          const timeDisplay = hasTimeInfo ? `${startTime}${endTime && startTime !== endTime ? `-${endTime}` : ''}` : ''
          
          // Update title with time if available and not blocked
          if (timeDisplay && !isBlocked) {
            eventTitle = `${timeDisplay} ${eventTitle}`
          }

          if (!isNaN(startDate.getTime())) {
            calendarEvents.push({
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
                isBlocked: isBlocked
              }
            })
          }
        })
      }

      // Process pending requests (admin only)
      if (isAdmin() && pendingRequests.length > 0) {
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
            console.error('Error parsing dates for blocked event:', e, blocked)
          }
          
          if (blockedStartDate && !isNaN(blockedStartDate.getTime())) {
            // Show as "Temporarily blocked" for normal users, event name for admins
            const title = isAdmin() ? `${blocked.event_name || blocked.title} (Vorläufig)` : 'Vorübergehend blockiert'
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

      console.log('📅 Calendar loaded:', {
        approved: allEvents?.length || 0,
        pending: pendingRequests?.length || 0,
        blocked: temporarilyBlocked?.length || 0,
        total: calendarEvents.length
      })

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // Load events on component mount and when dependencies change
  useEffect(() => {
    loadAllEvents()
  }, [loadAllEvents])

  // Force month view on mount
  useEffect(() => {
    // Force month view by manipulating DOM if needed
    const timer = setTimeout(() => {
      const timeView = document.querySelector('.rbc-time-view')
      const monthView = document.querySelector('.rbc-month-view')
      
      if (timeView) {
        timeView.style.display = 'none !important'
      }
      if (monthView) {
        monthView.style.display = 'block !important'
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Handle date selection
  const handleSelectSlot = useCallback((slotInfo) => {
    if (onDateClick) {
      setSelectedDate(slotInfo.start)
      onDateClick(slotInfo.start)
    }
  }, [onDateClick])

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }, [])

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

  // Custom toolbar with proper navigation
  const CustomToolbar = ({ label, onNavigate, onView, view }) => {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0 4px'
      }}>
        <button
          onClick={() => onNavigate('PREV')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: isDarkMode ? '#ffffff' : '#252422',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = isDarkMode ? '#333333' : '#f0f0f0'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ‹
        </button>
        
        <span style={{
          fontSize: '16px',
          fontWeight: '600',
          color: isDarkMode ? '#ffffff' : '#252422'
        }}>
          {label}
        </span>
        
        <button
          onClick={() => onNavigate('NEXT')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: isDarkMode ? '#ffffff' : '#252422',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = isDarkMode ? '#333333' : '#f0f0f0'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ›
        </button>
      </div>
    )
  }

  if (loading) {
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
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-sm text-gray-600">Public Event</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded opacity-60" style={{ backgroundColor: '#6b7280', opacity: 0.6 }}></div>
          <span className="text-sm text-gray-600">Blockiert</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded border-2 border-yellow-500 border-dashed opacity-80" style={{ backgroundColor: '#fbbf24', border: '2px dashed #f59e0b', opacity: 0.8 }}></div>
          <span className="text-sm text-gray-600">Anfrage</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded border-2 border-orange-600 border-dashed opacity-70" style={{ backgroundColor: '#f59e0b', border: '2px dashed #d97706', opacity: 0.7 }}></div>
          <span className="text-sm text-gray-600">Vorläufig blockiert</span>
        </div>
        {isAdmin() && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded" style={{ backgroundColor: '#6054d9' }}></div>
            <span className="text-sm text-gray-600">Privates Event</span>
          </div>
        )}
      </div>

      <style>{`
        /* Style default toolbar */
        .rbc-toolbar {
          margin-bottom: 16px;
          padding: 0 4px;
        }

        /* Calendar container - force month view */
        .rbc-calendar {
          background: ${isDarkMode ? '#000000' : '#ffffff'};
          color: ${isDarkMode ? '#ffffff' : '#252422'};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          height: 600px;
        }

        /* Ensure proper month view layout */
        .rbc-month-view {
          display: block !important;
        }

        /* Force month view to show all days */
        .rbc-month-view .rbc-calendar {
          display: block !important;
        }

        /* Ensure all days are visible in month grid */
        .rbc-month-view .rbc-body {
          display: block !important;
        }

        .rbc-month-view .rbc-month-header {
          display: flex !important;
        }

        .rbc-month-view .rbc-header {
          flex: 1 !important;
          text-align: center !important;
        }

        /* Header styling */
        .rbc-header {
          background: ${isDarkMode ? '#1a1a1a' : '#f8f9fa'};
          color: ${isDarkMode ? '#ffffff' : '#252422'};
          border-bottom: 1px solid ${isDarkMode ? '#333333' : '#e9ecef'};
          font-weight: 600;
          padding: 8px 4px;
          font-size: 13px;
        }

        /* Day cells - ensure full month grid */
        .rbc-month-row {
          min-height: 120px;
          border-bottom: 1px solid ${isDarkMode ? '#333333' : '#e9ecef'};
          display: flex;
          flex: 1;
        }

        .rbc-day-bg {
          min-height: 120px;
          border-right: 1px solid ${isDarkMode ? '#333333' : '#e9ecef'};
          position: relative;
          flex: 1;
          width: calc(100% / 7);
        }

        /* Ensure all 7 days are visible */
        .rbc-row {
          display: flex;
          flex: 1;
        }

        .rbc-day-bg:hover {
          background-color: ${isDarkMode ? '#1a1a1a' : '#f8f9fa'};
        }

        /* Date numbers - make them very clear */
        .rbc-date-cell {
          position: absolute;
          top: 6px;
          left: 6px;
          font-size: 14px;
          font-weight: 700;
          color: ${isDarkMode ? '#ffffff' : '#252422'};
          z-index: 10;
          background: ${isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'};
          padding: 2px 6px;
          border-radius: 4px;
          min-width: 24px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        /* Events container */
        .rbc-events-container {
          margin: 20px 4px 4px 4px;
          padding: 0;
        }

        /* Today highlight */
        .rbc-today {
          background-color: ${isDarkMode ? '#2a2a2a' : '#fff3cd'};
        }

        /* Event styling - removed default styling to let eventPropGetter handle it */
        .rbc-event {
          padding: 2px 4px !important;
          margin: 1px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          height: auto !important;
          min-height: 18px !important;
          display: block !important;
          width: calc(100% - 2px) !important;
          position: relative !important;
          z-index: 2 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .rbc-event-content {
          overflow: hidden !important;
          white-space: nowrap !important;
          text-overflow: ellipsis !important;
        }

        /* Show more link */
        .rbc-show-more {
          background: #6054d9 !important;
          color: white !important;
          padding: 1px 4px !important;
          border-radius: 2px !important;
          font-size: 9px !important;
          font-weight: 600 !important;
          margin-top: 1px !important;
          cursor: pointer !important;
        }

        .rbc-show-more:hover {
          background: #4A3BB5 !important;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .rbc-calendar {
            height: 500px;
          }
          
          .rbc-month-row {
            min-height: 80px;
          }
          
          .rbc-day-bg {
            min-height: 80px;
          }
          
          .rbc-event {
            font-size: 10px !important;
            min-height: 16px !important;
          }
        }

        /* Dark mode specific adjustments */
        .dark .rbc-calendar {
          background: #000000;
          color: #ffffff;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .dark .rbc-header {
          background: #1a1a1a;
          color: #ffffff;
          border-bottom: 1px solid #333333;
        }

        .dark .rbc-day-bg {
          border-right: 1px solid #333333;
        }

        .dark .rbc-day-bg:hover {
          background-color: #1a1a1a;
        }

        .dark .rbc-today {
          background-color: #2a2a2a;
        }

        .dark .rbc-date-cell {
          color: #ffffff !important;
          background: rgba(0,0,0,0.7) !important;
        }

        /* FORCE MONTH VIEW - Override everything */
        .rbc-time-view {
          display: none !important;
        }

        .rbc-time-header {
          display: none !important;
        }

        .rbc-time-content {
          display: none !important;
        }

        /* Ensure month view is always shown */
        .rbc-month-view {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* Force month grid layout */
        .rbc-month-view .rbc-body {
          display: block !important;
        }

        .rbc-month-view .rbc-row {
          display: flex !important;
          width: 100% !important;
          min-height: 120px !important;
        }

        .rbc-month-view .rbc-day-bg {
          display: block !important;
          width: calc(100% / 7) !important;
          flex: 1 !important;
          min-height: 120px !important;
          border-right: 1px solid #ddd !important;
          position: relative !important;
        }

        .rbc-month-view .rbc-row-content {
          display: block !important;
        }

        /* Hide any week/day view elements */
        .rbc-week-view {
          display: none !important;
        }

        .rbc-day-view {
          display: none !important;
        }
      `}</style>

      <div className={isDarkMode ? 'dark' : ''}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '600px' }}
          view="month"
          views={['month']}
          onView={() => {}} // Prevent view changes
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          components={{
            event: EventComponent
          }}
          messages={{
            next: 'Nächster',
            previous: 'Vorheriger',
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag',
            agenda: 'Agenda',
            date: 'Datum',
            time: 'Zeit',
            event: 'Event',
            noEventsInRange: 'Keine Events in diesem Zeitraum',
            showMore: (total) => `+${total} weitere`
          }}
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 8, 0)}
          max={new Date(2026, 11, 31, 22, 0)}
          eventPropGetter={(event) => {
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

            return {
              style: {
                backgroundColor,
                borderColor,
                color: 'white',
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
            loadAllEvents()
          }}
        />
      )}
    </>
  )
}

export default NewEventCalendar