import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { eventsAPI, eventRequestsAPI } from '../../services/httpApi'
import { MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import EventRequestModalHTTP from './EventRequestModalHTTP'
import EventDetailsModal from './EventDetailsModal'
import eventBus from '../../utils/eventBus'

// Set up moment locale
moment.locale('de')
const localizer = momentLocalizer(moment)

// Custom Toolbar Component - Modern Minimal Design
const CustomToolbar = ({ date, onNavigate, label }) => {
  const goToBack = () => {
    onNavigate('PREV')
  }

  const goToNext = () => {
    onNavigate('NEXT')
  }

  const goToCurrent = () => {
    onNavigate('TODAY')
  }

  return (
    <div className="flex items-center justify-center w-full mb-[0.5vw] mt-[0.8vw] relative z-10">
      {/* Modern Navigation Container - Match button colors and reduced spacing */}
      <div className="flex items-center bg-[#A58C81] dark:bg-[#F4F1E8] rounded-xl px-6 py-3 shadow-lg border-2 border-[#A58C81] dark:border-[#F4F1E8]">
        {/* Previous Button */}
        <button
          onClick={goToBack}
          className="flex items-center justify-center w-10 h-10 text-[#252422] dark:text-[#252422] hover:bg-[#8B6F5F] dark:hover:bg-[#EBE9E9] rounded-lg transition-colors duration-200"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Current Month/Year */}
        <button
          onClick={goToCurrent}
          className="mx-4 px-6 py-2 text-[#252422] dark:text-[#252422] font-semibold text-base hover:bg-[#8B6F5F] dark:hover:bg-[#EBE9E9] rounded-lg transition-colors duration-200 min-w-[160px]"
        >
          {label}
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="flex items-center justify-center w-10 h-10 text-[#252422] dark:text-[#252422] hover:bg-[#8B6F5F] dark:hover:bg-[#EBE9E9] rounded-lg transition-colors duration-200"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

const NewEventCalendar = () => {
  const { user, isAdmin } = useAuth()
  // eslint-disable-next-line no-unused-vars
  const { isDarkMode } = useDarkMode()
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
    const isPrivate = event.resource?.isPrivate || false
    const isAdminUser = isAdmin()

    // Event requests (pending) - orange for admin
    if (isRequest && isAdminUser) {
      return {
        style: {
          backgroundColor: '#f97316',
          borderColor: '#ea580c',
          color: 'white',
          borderStyle: 'dashed',
          opacity: 0.9,
          borderRadius: '4px',
          border: '2px dashed #ea580c',
          fontSize: '12px',
          padding: '2px 4px'
        }
      }
    }

    // Private events - green for admin, grey for normal users
    if (isPrivate) {
      if (isAdminUser) {
        // Admin view: green for private events
        return {
          style: {
            backgroundColor: '#10b981',
            borderColor: '#059669',
            color: 'white',
            opacity: 0.9,
            borderRadius: '4px',
            border: '2px solid #059669',
            fontSize: '12px',
            padding: '2px 4px'
          }
        }
      } else {
        // Normal user view: grey with "Blockiert" text
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
    }

    // Public events - purple
    return {
      style: {
        backgroundColor: '#6054d9',
        borderColor: '#2563eb',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    }
  }, [isAdmin])

  // Custom event component
  const EventComponent = useCallback(({ event }) => {
    const isAdminUser = isAdmin()
    const isPrivate = event.resource?.isPrivate || false
    const isRequest = event.resource?.isRequest || false

    return (
      <div className="flex items-center space-x-1">
        <span className="truncate">
          {/* Show "Blockiert" for private events when viewed by normal users */}
          {isPrivate && !isAdminUser ? 'Blockiert' : event.title}
        </span>
        {isRequest && isAdminUser && (
          <Clock className="h-3 w-3 flex-shrink-0" title="Event Request" />
        )}
        {event.resource?.location && !isRequest && !isPrivate && (
          <MapPin className="h-3 w-3 flex-shrink-0" />
        )}
      </div>
    )
  }, [isAdmin])



  return (
    <div className="w-full">
      {/* Compact mobile styles for react-big-calendar */}
      <style>{`
        /* Hide default toolbar since we're using custom toolbar */
        .compact-calendar .rbc-toolbar {
          display: none !important;
        }
        .dark .compact-calendar .rbc-calendar {
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          margin-top: 0.5vw;
        }
        .dark .compact-calendar .rbc-header {
          background: #1a1a1a;
          color: #ffffff;
          border-bottom: 1px solid #333333;
          font-weight: 600;
          padding: 12px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .dark .compact-calendar .rbc-header > div {
          flex: 1 1 0;
          width: calc(100% / 7);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
        }
        .dark .compact-calendar .rbc-month-view {
          background: #000000;
          color: #ffffff;
        }
        .dark .compact-calendar .rbc-month-row {
          border-bottom: 1px solid #333333;
          display: flex;
          align-items: stretch;
        }
        .dark .compact-calendar .rbc-date-cell {
          flex: 1 1 0;
          width: calc(100% / 7);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 80px;
          background: #000000;
          color: #ffffff;
          border-right: 1px solid #333333;
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
          box-sizing: border-box;
        }
        .dark .compact-calendar .rbc-date-cell:hover {
          background: #2a2a2a;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
          z-index: 10;
        }
        .dark .compact-calendar .rbc-date-cell:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #D93124;
          border-radius: 6px;
          pointer-events: none;
          box-shadow: 0 0 15px rgba(217, 49, 36, 0.5);
        }
        .dark .compact-calendar .rbc-off-range {
          color: #666666;
        }
        .dark .compact-calendar .rbc-today .rbc-date-cell {
          background: #ffffff;
          color: #000000;
          font-weight: 700;
        }
        .dark .compact-calendar .rbc-today .rbc-date-cell:hover {
          background: #e0e0e0;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .dark .compact-calendar .rbc-today .rbc-date-cell:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #ff6b35;
          border-radius: 6px;
          pointer-events: none;
          box-shadow: 0 0 15px rgba(255, 107, 53, 0.5);
        }
        /* Light mode styles - also using black background for modern look */
        .compact-calendar .rbc-calendar {
          background: #000000;
          color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          margin-top: 0.5vw;
        }
        .compact-calendar .rbc-header {
          background: #1a1a1a;
          color: #ffffff;
          border-bottom: 1px solid #333333;
          padding: 12px 8px;
          font-weight: 600;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .compact-calendar .rbc-header > div {
          flex: 1 1 0;
          width: calc(100% / 7);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
        }
        .compact-calendar .rbc-month-view {
          background: #000000;
          color: #ffffff;
        }
        .compact-calendar .rbc-month-row {
          border-bottom: 1px solid #333333;
          min-height: 80px;
          display: flex;
          align-items: stretch;
        }
        .compact-calendar .rbc-date-cell {
          flex: 1 1 0;
          width: calc(100% / 7);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 80px;
          background: #000000;
          color: #ffffff;
          border-right: 1px solid #333333;
          padding: 4px;
          font-size: 12px;
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
          box-sizing: border-box;
        }
        .compact-calendar .rbc-date-cell:hover {
          background: #2a2a2a;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
          z-index: 10;
        }
        .compact-calendar .rbc-date-cell:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #D93124;
          border-radius: 6px;
          pointer-events: none;
          box-shadow: 0 0 15px rgba(217, 49, 36, 0.5);
        }
        .compact-calendar .rbc-off-range-bg {
          background: #0a0a0a;
          color: #666666;
        }
        .compact-calendar .rbc-today .rbc-date-cell {
          background: #ffffff;
          color: #000000;
          font-weight: 700;
        }
        .compact-calendar .rbc-today .rbc-date-cell:hover {
          background: #e0e0e0;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .compact-calendar .rbc-today .rbc-date-cell:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px solid #ff6b35;
          border-radius: 6px;
          pointer-events: none;
          box-shadow: 0 0 15px rgba(255, 107, 53, 0.5);
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
        .compact-calendar .rbc-calendar { 
          height: 400px !important; 
          width: 100% !important; 
          margin-top: 20px;
        }
        .compact-calendar .rbc-month-view { width: 100% !important; }
        .compact-calendar .rbc-time-view, .compact-calendar .rbc-agenda-view { width: 100% !important; }
        @media (min-width: 640px) {
          .compact-calendar .rbc-calendar { 
            height: 560px !important; 
            margin-top: 20px;
          }
          .compact-calendar .rbc-month-view { font-size: 13px; }
        }
        @media (max-width: 360px) {
          .compact-calendar .rbc-calendar { 
            height: 360px !important; 
            margin-top: 20px;
          }
          .compact-calendar .rbc-month-row { min-height: 64px; }
        }
      `}</style>
      {/* Header */}
      <div className="mb-[0.5vh] sm:mb-[0.8vh] md:mb-[1vh] lg:mb-[1.2vh] xl:mb-[1.5vh] 2xl:mb-[1.8vh]">
        <h2 className="text-[6vw] sm:text-[5vw] md:text-[4vw] lg:text-[3.5vw] xl:text-[3vw] 2xl:text-[2.5vw] font-extrabold mb-[0.3vh] sm:mb-[0.5vh] md:mb-[0.8vh] tracking-tight text-[#252422] dark:text-[#F4F1E8]">Event-Kalender</h2>
        <p className="text-[2.8vw] sm:text-[2.2vw] md:text-[1.8vw] lg:text-[1.4vw] xl:text-[1.1vw] 2xl:text-[0.9vw] text-[#A58C81] dark:text-[#EBE9E9]">
          {user && 'Klicken Sie auf ein Datum, um ein Event anzufragen.'}
        </p>
      </div>

      {/* Event Type Legend with Refresh Button */}
      <div className="mb-[1vh] sm:mb-[1.2vh] md:mb-[1.5vh] lg:mb-[1.8vh] xl:mb-[2vh] 2xl:mb-[2.2vh] flex flex-wrap items-center justify-between gap-[2vw] sm:gap-[1.5vw] md:gap-[1vw] lg:gap-[0.8vw] xl:gap-[0.6vw] 2xl:gap-[0.5vw]">
        <div className="flex flex-wrap gap-[2vw] sm:gap-[1.5vw] md:gap-[1vw] lg:gap-[0.8vw] xl:gap-[0.6vw] 2xl:gap-[0.5vw]">
        <div className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw]">
          <div className="w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] bg-blue-500 rounded"></div>
          <span className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-medium text-[#252422] dark:text-[#F4F1E8]">Public Event</span>
        </div>
        {isAdmin() ? (
          // Admin view legend
          <>
            <div className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw]">
              <div className="w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] bg-green-500 rounded"></div>
              <span className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-medium text-[#252422] dark:text-[#F4F1E8]">Private Event</span>
            </div>
            <div className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw]">
              <div className="w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] bg-orange-500 rounded border-2 border-orange-600 border-dashed opacity-90"></div>
              <Clock className="h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] text-[#252422] dark:text-[#F4F1E8]" />
              <span className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-medium text-[#252422] dark:text-[#F4F1E8]">Event Request</span>
            </div>
          </>
        ) : (
          // Normal user view legend
          <div className="flex items-center space-x-[1vw] sm:space-x-[0.8vw] md:space-x-[0.6vw] lg:space-x-[0.4vw] xl:space-x-[0.3vw] 2xl:space-x-[0.2vw]">
            <div className="w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] bg-gray-500 rounded opacity-60"></div>
            <span className="text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-medium text-[#252422] dark:text-[#F4F1E8]">Blockiert</span>
          </div>
        )}
        </div>
        <button
          onClick={loadAllEvents}
          disabled={loading}
          className="inline-flex items-center px-[2vw] sm:px-[1.5vw] md:px-[1vw] lg:px-[0.8vw] xl:px-[0.6vw] 2xl:px-[0.5vw] py-[1vh] sm:py-[0.8vh] md:py-[0.6vh] lg:py-[0.5vh] xl:py-[0.4vh] 2xl:py-[0.3vh] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw] font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
          style={{ backgroundColor: '#A58C81' }}
        >
          <svg className="w-[3vw] sm:w-[2.5vw] md:w-[2vw] lg:w-[1.5vw] xl:w-[1.2vw] 2xl:w-[1vw] h-[3vw] sm:h-[2.5vw] md:h-[2vw] lg:h-[1.5vw] xl:h-[1.2vw] 2xl:h-[1vw] mr-[1vw] sm:mr-[0.8vw] md:mr-[0.6vw] lg:mr-[0.4vw] xl:mr-[0.3vw] 2xl:mr-[0.2vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Lädt...' : 'Aktualisieren'}
        </button>
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
              event: EventComponent,
              toolbar: CustomToolbar
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
