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

const SimpleMonthCalendar = ({ 
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
          // Check if user owns this event (check multiple possible ID fields)
          const isOwnEvent = user && (
            event.requester_id === user.id || 
            event.user_id === user.id ||
            event.created_by === user.id
          )
          
          let eventTitle = event.title
          let eventDescription = event.description
          let isBlocked = false

          // Handle privacy based on user role
          if (isPrivate) {
            // Debug logging
            console.log(`🔒 Private event: "${event.title}"`, {
              isAdmin: isAdmin(),
              isOwnEvent,
              userId: user?.id,
              eventRequesterId: event.requester_id,
              eventUserId: event.user_id,
              eventCreatedBy: event.created_by
            })
            
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
                isBlocked: isBlocked,
                isOwnEvent: isOwnEvent
              }
            })
          }
        })
      }

      // Process pending requests (admin only)
      if (isAdmin() && pendingRequests && pendingRequests.length > 0) {
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
  }, [isAdmin, user])

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
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Event-Kalender
        </h2>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Klicken Sie auf einen Tag, um ein Event anzufragen (keine Anmeldung erforderlich!)
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
        }
        
        /* Make date numbers more visible */
        .rbc-date-cell {
          font-size: 16px !important;
          font-weight: 700 !important;
          padding: 6px 10px !important;
          color: #252422 !important;
        }
        
        .rbc-off-range .rbc-date-cell {
          color: #999999 !important;
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
                    onClick={() => props.onNavigate('PREV')}
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
                    onClick={() => props.onNavigate('NEXT')}
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
            loadAllEvents()
          }}
        />
      )}
    </>
  )
}

export default SimpleMonthCalendar
