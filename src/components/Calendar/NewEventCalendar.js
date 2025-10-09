import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '../../contexts/AuthContext'
import { eventsAPI, eventRequestsAPI } from '../../services/httpApi'
import { MapPin, Clock, X } from 'lucide-react'
import EventRequestModalHTTP from './EventRequestModalHTTP'
import EventDetailsModal from './EventDetailsModal'
import eventBus from '../../utils/eventBus'

// Set up moment locale
moment.locale('de')
const localizer = momentLocalizer(moment)

const NewEventCalendar = () => {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showEventRequestModal, setShowEventRequestModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Load all events (simplified approach)
  const loadAllEvents = useCallback(async () => {
    setLoading(true)
    
    try {
      // Get all events from database
      const allEvents = await eventsAPI.getAll()
      
      
      if (!allEvents) {
        console.error('Error loading events')
        setEvents([])
        return
      }

      // Get pending event requests (only for admin)
      let pendingRequests = []
      if (isAdmin() && user) {
        const requests = await eventRequestsAPI.getAll()
        if (requests) {
          // Filter for pending requests
          pendingRequests = requests.filter(req => req.status === 'pending')
        }
      }

      // Process events for calendar
      const calendarEvents = []
      const isAdminUser = isAdmin()

      // Process approved events
      if (allEvents && allEvents.length > 0) {
        allEvents.forEach(event => {
          const isPrivate = event.is_private || false
          
          let eventTitle = event.title
          let eventDescription = event.description
          let isBlocked = false

          // Handle privacy
          if (isPrivate && !isAdminUser) {
            eventTitle = 'Blockiert'
            eventDescription = 'Dieses Event ist privat und nur für Administratoren sichtbar.'
            isBlocked = true
          }

          const startDate = new Date(event.start_date)
          const endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date)


          if (!isNaN(startDate.getTime())) {
            calendarEvents.push({
              id: event.id,
              title: eventTitle,
              start: startDate,
              end: endDate,
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
      if (isAdminUser && pendingRequests.length > 0) {
        pendingRequests.forEach(request => {
          const startDate = new Date(request.start_date)
          const endDate = request.end_date ? new Date(request.end_date) : new Date(request.start_date)

          if (!isNaN(startDate.getTime())) {
            calendarEvents.push({
              id: `request-${request.id}`,
              title: `${request.title} (Anfrage)`,
              start: startDate,
              end: endDate,
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

      setEvents(calendarEvents)

    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user])

  // Load events on mount and when user changes
  useEffect(() => {
    loadAllEvents()
  }, [loadAllEvents])

  // Listen for event updates (when events are approved/rejected)
  useEffect(() => {
    const handleEventUpdate = () => {
      loadAllEvents()
    }

    // Listen for event updates
    eventBus.on('eventUpdated', handleEventUpdate)
    eventBus.on('eventRequestApproved', handleEventUpdate)
    eventBus.on('eventRequestRejected', handleEventUpdate)

    return () => {
      eventBus.off('eventUpdated', handleEventUpdate)
      eventBus.off('eventRequestApproved', handleEventUpdate)
      eventBus.off('eventRequestRejected', handleEventUpdate)
    }
  }, [loadAllEvents])

  // Listen for custom event from HomePage button
  useEffect(() => {
    const handleOpenEventRequestModal = (event) => {
      if (user) {
        const selectedDate = event.detail?.selectedDate || new Date()
        setSelectedDate({ 
          start: selectedDate, 
          end: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day
        })
        setShowEventRequestModal(true)
      } else {
        window.location.href = '/login'
      }
    }

    window.addEventListener('openEventRequestModal', handleOpenEventRequestModal)
    
    return () => {
      window.removeEventListener('openEventRequestModal', handleOpenEventRequestModal)
    }
  }, [user])

  // Handle date selection for event requests
  const handleSelectSlot = useCallback(({ start, end }) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setSelectedDate({ start, end })
    setShowEventRequestModal(true)
  }, [user])

  // Handle event click for details
  const handleSelectEvent = useCallback((event) => {
    if (event.resource?.isBlocked && !isAdmin()) {
      return
    }
    setSelectedEvent(event.resource)
    setShowEventDetailsModal(true)
  }, [isAdmin])

  // Handle navigation (month change)
  const handleNavigate = useCallback((date) => {
    setCurrentDate(date)
    // Don't reload all events - the calendar should already have them loaded
    // The loadAllEvents function loads events for multiple months
  }, [])

  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    const isRequest = event.resource?.isRequest || false
    const isBlocked = event.resource?.isBlocked || false

    // Blocked events (private events for normal users) - gray
    if (isBlocked) {
      return {
        style: {
          backgroundColor: '#6b7280',
          borderColor: '#4b5563',
          color: 'white',
          opacity: 0.6,
          borderRadius: '4px',
          border: '2px solid #4b5563',
          fontSize: '12px',
          padding: '2px 4px'
        }
      }
    }

    // Special events (event requests) - yellow
    if (isRequest) {
      return {
        style: {
          backgroundColor: '#fbbf24',
          borderColor: '#f59e0b',
          color: 'white',
          borderStyle: 'dashed',
          opacity: 0.8,
          borderRadius: '4px',
          border: '2px dashed #f59e0b',
          fontSize: '12px',
          padding: '2px 4px'
        }
      }
    }

    // Public events - blue
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    }
  }, [])

  // Custom event component
  const EventComponent = useCallback(({ event }) => (
    <div className="flex items-center space-x-1">
      <span className="truncate">{event.title}</span>
      {event.resource?.isRequest && (
        <Clock className="h-3 w-3 flex-shrink-0" title="Special Event" />
      )}
      {event.resource?.location && !event.resource?.isRequest && !event.resource?.isBlocked && (
        <MapPin className="h-3 w-3 flex-shrink-0" />
      )}
    </div>
  ), [])



  return (
    <div className="w-full">
      {/* Compact mobile styles for react-big-calendar */}
      <style>{`
        .compact-calendar .rbc-toolbar {
          padding: 6px 8px;
          gap: 6px;
          flex-wrap: wrap;
        }
        .compact-calendar .rbc-toolbar-label {
          font-size: 13px;
        }
        .compact-calendar .rbc-btn-group > button {
          padding: 4px 8px;
          font-size: 12px;
          line-height: 1.2;
        }
        .compact-calendar .rbc-month-view {
          font-size: 12px;
        }
        .compact-calendar .rbc-month-row {
          min-height: 72px;
        }
        .compact-calendar .rbc-date-cell {
          padding: 2px 4px;
        }
        .compact-calendar .rbc-event {
          padding: 1px 3px;
        }
        .compact-calendar .rbc-calendar { height: 400px !important; width: 100% !important; }
        .compact-calendar .rbc-month-view { width: 100% !important; }
        .compact-calendar .rbc-time-view, .compact-calendar .rbc-agenda-view { width: 100% !important; }
        @media (min-width: 640px) {
          .compact-calendar .rbc-calendar { height: 560px !important; }
          .compact-calendar .rbc-toolbar-label { font-size: 14px; }
          .compact-calendar .rbc-month-view { font-size: 13px; }
        }
        @media (max-width: 360px) {
          .compact-calendar .rbc-calendar { height: 360px !important; }
          .compact-calendar .rbc-month-row { min-height: 64px; }
        }
      `}</style>
      {/* Header with Refresh Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#252422' }}>Event-Kalender</h2>
          <p className="text-base" style={{ color: '#A58C81' }}>
            {user && 'Klicken Sie auf ein Datum, um ein Event anzufragen.'}
          </p>
        </div>
        <button
          onClick={loadAllEvents}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
          style={{ backgroundColor: '#A58C81' }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Lädt...' : 'Aktualisieren'}
        </button>
      </div>

      {/* Event Type Legend */}
      <div className="mb-6 flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-blue-500 rounded"></div>
          <span className="text-sm font-medium" style={{ color: '#252422' }}>Public Event</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-500 rounded opacity-60"></div>
          <X className="h-4 w-4" style={{ color: '#252422' }} />
          <span className="text-sm font-medium" style={{ color: '#252422' }}>Blocked</span>
        </div>
        {isAdmin() && (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-yellow-400 rounded border-2 border-yellow-500 border-dashed opacity-80"></div>
            <Clock className="h-4 w-4" style={{ color: '#252422' }} />
            <span className="text-sm font-medium" style={{ color: '#252422' }}>Special Event</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-600">Lade Events...</span>
          </div>
        </div>
      ) : (
        <div className="compact-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '560px', width: '100%' }}
            view="month"
            views={['month']}
            date={currentDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            selectable={true}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent
            }}
            messages={{
              next: 'Nächster',
              previous: 'Vorheriger',
              today: 'Heute',
              month: 'Monat',
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
          />
        </div>
      )}

      {/* Event Request Modal */}
      {showEventRequestModal && (
        <EventRequestModalHTTP
          isOpen={showEventRequestModal}
          selectedDate={selectedDate}
          onClose={() => {
            setShowEventRequestModal(false)
            setSelectedDate(null)
          }}
        />
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetailsModal(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}

export default NewEventCalendar
