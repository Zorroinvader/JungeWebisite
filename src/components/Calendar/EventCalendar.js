import React, { useState, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '../../contexts/AuthContext'
import { eventAPI, eventRequestAPI } from '../../services/api'
import { Plus, MapPin, Clock, Users, X } from 'lucide-react'
import EventRequestModalHTTP from './EventRequestModalHTTP'
import EventDetailsModal from './EventDetailsModal'

// Set up moment locale
moment.locale('de')

const localizer = momentLocalizer(moment)

const EventCalendar = () => {
  const { user, isMember, isAdmin } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showEventRequestModal, setShowEventRequestModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [loadedMonths, setLoadedMonths] = useState(new Set())

  // Load events for multiple months (current + 3 months ahead)
  const loadEvents = useCallback(async (date) => {
    console.log('🔵 Calendar: loadEvents called with date:', date)
    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const monthKey = `${year}-${month}`
      
      console.log('🔵 Calendar: Processing date - year:', year, 'month:', month, 'key:', monthKey)
      
      // Check if we already loaded this month
      if (loadedMonths.has(monthKey)) {
        console.log('🔵 Calendar: Month already loaded, skipping')
        console.log('🔵 Calendar: Current events count:', events.length)
        setLoading(false)
        return
      }
      
      console.log('🔵 Calendar: Starting to load events...')
      setLoading(true)
      
      // Load events for current month + 3 months ahead
      const monthsToLoad = []
      for (let i = 0; i < 4; i++) {
        const targetDate = new Date(year, month - 1 + i, 1)
        const targetYear = targetDate.getFullYear()
        const targetMonth = targetDate.getMonth() + 1
        const targetKey = `${targetYear}-${targetMonth}`
        
        if (!loadedMonths.has(targetKey)) {
          monthsToLoad.push({ year: targetYear, month: targetMonth, key: targetKey })
        }
      }
      
      if (monthsToLoad.length === 0) {
        setLoading(false)
        return
      }
      
          // Load events for all months in parallel (fallback to original method)
          const eventPromises = monthsToLoad.map(({ year, month }) => {
            return eventAPI.getEventsForMonth(year, month)
          })
          
          // Import the httpApi for temporarily blocked dates
          const { blockedDatesAPI } = await import('../../services/httpApi')
          
          const [eventsResults, requestsResult, blockedDatesResult] = await Promise.allSettled([
            Promise.all(eventPromises),
            eventRequestAPI.getEventRequests('pending'),
            blockedDatesAPI.getTemporarilyBlocked()
          ])
          
          
      
      const allEvents = []
      const isAdminUser = isAdmin()
      
      // Process approved events from all months
      if (eventsResults.status === 'fulfilled' && eventsResults.value) {
        console.log('🔵 Calendar: Processing events results:', eventsResults.value)
        eventsResults.value.forEach((monthResult, index) => {
          console.log(`🔵 Calendar: Processing month ${index}:`, monthResult)
          if (monthResult.status === 'fulfilled' && monthResult.value.data) {
            console.log(`🔵 Calendar: Found ${monthResult.value.data.length} events for month ${index}`)
            const approvedEvents = monthResult.value.data
              .map(event => {
                const isPrivate = event.is_private || false
                
                // Determine event type and visibility
                let eventTitle = event.title
                let eventDescription = event.description
                let eventStatus = 'approved'
                let isBlocked = false
                
                if (isPrivate && !isAdminUser) {
                  // Private event for normal users - show as blocked
                  eventTitle = 'Blockiert'
                  eventDescription = 'Dieses Event ist privat und nur für Administratoren sichtbar.'
                  isBlocked = true
                } else if (!isPrivate) {
                  // Public event - show normally
                  eventTitle = event.title
                  eventDescription = event.description
                  isBlocked = false
                }
                
                const startDate = new Date(event.start_date)
                const endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date)
                
                
                return {
                  id: event.id,
                  title: eventTitle,
                  start: startDate,
                  end: endDate,
                  resource: {
                    ...event,
                    location: event.location,
                    event_type: event.event_type,
                    max_participants: event.max_participants,
                    description: eventDescription,
                    status: eventStatus,
                    isRequest: false,
                    isPrivate: isPrivate,
                    isBlocked: isBlocked
                  }
                }
              })
            allEvents.push(...approvedEvents)
          }
        })
      }
      
      // Process pending event requests (only for admin)
      if (isAdminUser && user && requestsResult.status === 'fulfilled' && requestsResult.value.data) {
        const pendingRequests = requestsResult.value.data
          .map(request => {
            const isPrivate = request.is_private || false
            
            return {
              id: `request-${request.id}`,
              title: `${request.title} (Anfrage)`,
              start: new Date(request.start_date),
              end: request.end_date ? new Date(request.end_date) : new Date(request.start_date),
              resource: {
                ...request,
                location: request.location,
                event_type: request.event_type,
                max_participants: request.max_participants,
                description: request.description,
                status: 'pending',
                isRequest: true,
                isPrivate: isPrivate,
                isBlocked: false // Requests are never blocked for admin
              }
            }
          })
        allEvents.push(...pendingRequests)
      }
      
      // Process temporarily blocked dates (show to all users)
      if (blockedDatesResult.status === 'fulfilled' && blockedDatesResult.value) {
        console.log('🟡 Calendar: Processing temporarily blocked dates:', blockedDatesResult.value)
        const tempBlockedEvents = blockedDatesResult.value.map(blocked => {
          const isPrivate = blocked.is_private || false
          
          // Parse requested days to get date range
          let startDate, endDate
          try {
            const requestedDays = JSON.parse(blocked.requested_days)
            if (Array.isArray(requestedDays) && requestedDays.length > 0) {
              startDate = new Date(requestedDays[0])
              endDate = new Date(requestedDays[requestedDays.length - 1])
            } else if (blocked.exact_start_datetime) {
              startDate = new Date(blocked.exact_start_datetime)
              endDate = new Date(blocked.exact_end_datetime || blocked.exact_start_datetime)
            }
          } catch (e) {
            console.error('Error parsing requested_days:', e)
            if (blocked.exact_start_datetime) {
              startDate = new Date(blocked.exact_start_datetime)
              endDate = new Date(blocked.exact_end_datetime || blocked.exact_start_datetime)
            }
          }
          
          if (!startDate) {
            return null
          }
          
          // Show as "Temporarily blocked" or "Vorübergehend blockiert"
          const title = isAdminUser ? `${blocked.event_name} (Vorläufig)` : 'Vorübergehend blockiert'
          
          return {
            id: `temp-blocked-${blocked.id}`,
            title: title,
            start: startDate,
            end: endDate,
            resource: {
              ...blocked,
              event_name: blocked.event_name,
              description: isAdminUser ? `Anfrage von ${blocked.requester_name} - Status: ${blocked.request_stage}` : 'Dieser Zeitraum ist vorübergehend blockiert',
              status: 'temporary_block',
              isRequest: true,
              isPrivate: isPrivate,
              isBlocked: true,
              isTemporaryBlock: true,
              request_stage: blocked.request_stage
            }
          }
        }).filter(Boolean)
        
        allEvents.push(...tempBlockedEvents)
      }
      
          // Update events and mark all loaded months as cached
          
          setEvents(allEvents)
          setLoadedMonths(prev => {
            const newSet = new Set(prev)
            monthsToLoad.forEach(({ key }) => newSet.add(key))
            return newSet
          })
    } catch (error) {
      console.error('Error in loadEvents:', error)
      setEvents([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [loadedMonths])

  // Handle date selection for event requests
  const handleSelectSlot = useCallback(({ start, end }) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }
    console.log('Date selected:', { start, end })
    setSelectedDate({ start, end })
    setShowEventRequestModal(true)
  }, [user])

  // Handle event click for details
  const handleSelectEvent = useCallback((event) => {
    // Prevent non-admin users from clicking on blocked events
    if (event.resource?.isBlocked && !isAdmin()) {
      return
    }
    
    setSelectedEvent(event.resource)
    setShowEventDetailsModal(true)
  }, [isAdmin])

  // Handle navigation (month change)
  const handleNavigate = useCallback((date) => {
    loadEvents(date)
    
    // Preload next 3 months for smooth navigation
    const nextMonths = []
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(date.getFullYear(), date.getMonth() + i, 1)
      const futureYear = futureDate.getFullYear()
      const futureMonth = futureDate.getMonth() + 1
      const futureKey = `${futureYear}-${futureMonth}`
      
      if (!loadedMonths.has(futureKey)) {
        nextMonths.push(futureDate)
      }
    }
    
    // Preload future months in background
    if (nextMonths.length > 0) {
      setTimeout(() => {
        nextMonths.forEach(monthDate => loadEvents(monthDate))
      }, 100) // Small delay to not block UI
    }
  }, [loadEvents, loadedMonths])

  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    const isRequest = event.resource?.isRequest || false
    const isBlocked = event.resource?.isBlocked || false
    const isPrivate = event.resource?.isPrivate || false
    const isTemporaryBlock = event.resource?.isTemporaryBlock || false
    
    // 1. Temporarily blocked events (pending approval) - yellow/orange
    if (isTemporaryBlock) {
      return {
        style: {
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          color: 'white',
          opacity: 0.7,
          borderRadius: '4px',
          borderWidth: '2px',
          borderStyle: 'dashed',
          fontStyle: 'italic'
        }
      }
    }
    
    // 2. Blocked events (private events for normal users) - gray
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
    
    // 2. Special events (event requests) - yellow
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
    
    // 3. Public events - blue
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
        <Clock className="h-3 w-3 flex-shrink-0" title="Event-Anfrage" />
      )}
      {event.resource?.location && !event.resource?.isRequest && !event.resource?.isBlocked && (
        <MapPin className="h-3 w-3 flex-shrink-0" />
      )}
    </div>
  ), [])

  // Custom toolbar
  const CustomToolbar = useCallback(({ label, onNavigate, onView, view }) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          ← Vorheriger
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Heute
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Nächster →
        </button>
      </div>
      
      <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
      
      <div className="flex items-center space-x-2">
        {user ? (
          <button
            onClick={() => setShowEventRequestModal(true)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Event anfragen
          </button>
        ) : (
          <div className="text-sm text-gray-600">
            <a 
              href="/login" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Anmelden
            </a> um Events anzufragen
          </div>
        )}
      </div>
    </div>
  ), [user])

  // Load events on component mount
  React.useEffect(() => {
    console.log('EventCalendar useEffect - loading events on mount')
    const today = new Date()
    console.log('Today is:', today)
    console.log('Today month/year:', today.getMonth() + 1, today.getFullYear())
    
    loadEvents(today)
  }, []) // Empty dependency array to run only once on mount

  console.log('🔵 Calendar: Using events for calendar:', events.length, 'events')

  // Memoized calendar props
  const calendarProps = useMemo(() => {
    console.log('🔵 Calendar: Creating calendar props with events:', events)
    console.log('🔵 Calendar: Events count:', events.length)
    return {
      localizer,
      events,
      startAccessor: 'start',
      endAccessor: 'end',
      style: { height: '600px' },
      defaultView: 'month',
      onSelectSlot: handleSelectSlot,
      onSelectEvent: handleSelectEvent,
      onNavigate: handleNavigate,
      selectable: true,
      eventPropGetter: eventStyleGetter,
      components: {
        event: EventComponent,
        toolbar: CustomToolbar
      },
    messages: {
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
    },
    step: 30,
    timeslots: 2,
    min: new Date(2024, 0, 1, 8, 0),
    max: new Date(2026, 11, 31, 22, 0)
  }
  }, [events, handleSelectSlot, handleSelectEvent, handleNavigate, eventStyleGetter, EventComponent, CustomToolbar, isMember])


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="ml-3 text-gray-600">Lade Kalender...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event-Kalender</h1>
          <p className="text-gray-600">
            Entdecken Sie kommende Events und Veranstaltungen. 
            {isMember() && ' Klicken Sie auf ein Datum, um ein Event anzufragen.'}
          </p>
        </div>

        {/* Event Type Legend */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Public Event</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded opacity-60"></div>
            <X className="h-3 w-3 text-gray-600" />
            <span className="text-sm text-gray-600">Blocked</span>
          </div>
          {isAdmin() && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded border-2 border-yellow-500 border-dashed opacity-80"></div>
              <Clock className="h-3 w-3 text-gray-600" />
              <span className="text-sm text-gray-600">Special Event</span>
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
          <Calendar {...calendarProps} />
        )}
      </div>

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
      {showEventDetailsModal && selectedEvent && (
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

export default EventCalendar
