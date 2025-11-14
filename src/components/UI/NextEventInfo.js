import React, { useState, useEffect } from 'react'
import { eventsAPI } from '../../services/httpApi'

const NextEventInfo = () => {
  const [nextEvent, setNextEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        setLoading(true)
        const events = await eventsAPI.getAll()
        
        // Filter for public events that haven't started yet
        const now = new Date()
        const publicEvents = events.filter(event => 
          !event.is_private && 
          new Date(event.start_date) > now
        )
        
        // Sort by start date and get the first one
        const sortedEvents = publicEvents.sort((a, b) => 
          new Date(a.start_date) - new Date(b.start_date)
        )
        
        if (sortedEvents.length > 0) {
          setNextEvent(sortedEvents[0])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNextEvent()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

      if (loading) {
        return (
          <div className="min-h-[6vw] sm:min-h-[5vw] md:min-h-[4vw] lg:min-h-[3vw] xl:min-h-[2.5vw] 2xl:min-h-[2vw] flex items-center">
            <div className="animate-pulse text-[#252422] dark:text-[#F4F1E8] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw]">
              Lade nächste Veranstaltung...
            </div>
          </div>
        )
      }

      if (error) {
        return (
          <div className="min-h-[6vw] sm:min-h-[5vw] md:min-h-[4vw] lg:min-h-[3vw] xl:min-h-[2.5vw] 2xl:min-h-[2vw] flex items-center">
            <div className="text-[#252422] dark:text-[#F4F1E8] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw]">
              Fehler beim Laden der Veranstaltungen
            </div>
          </div>
        )
      }

      if (!nextEvent) {
        return (
          <div className="min-h-[6vw] sm:min-h-[5vw] md:min-h-[4vw] lg:min-h-[3vw] xl:min-h-[2.5vw] 2xl:min-h-[2vw] flex items-center">
            <div className="text-[#252422] dark:text-[#F4F1E8] text-[2.5vw] sm:text-[2vw] md:text-[1.5vw] lg:text-[1.2vw] xl:text-[1vw] 2xl:text-[0.8vw]">
              Keine kommenden Veranstaltungen geplant
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-[6vw] sm:min-h-[5vw] md:min-h-[4vw] lg:min-h-[3vw] xl:min-h-[2.5vw] 2xl:min-h-[2vw]">
          <div className="space-y-[0.5vh] sm:space-y-[0.6vh] md:space-y-[0.7vh] text-right">
            <h3 className="text-[3vw] sm:text-[2.5vw] md:text-[2vw] lg:text-[1.5vw] xl:text-[1.2vw] 2xl:text-[1vw] font-bold text-[#252422] dark:text-[#F4F1E8]">
              Nächste Veranstaltung
            </h3>
            <h4 className="text-[2.5vw] sm:text-[2vw] md:text-[1.6vw] lg:text-[1.3vw] xl:text-[1.1vw] 2xl:text-[0.9vw] font-semibold text-[#252422] dark:text-[#F4F1E8]">
              {nextEvent.title}
            </h4>
            <div className="text-[1.8vw] sm:text-[1.5vw] md:text-[1.2vw] lg:text-[1vw] xl:text-[0.8vw] 2xl:text-[0.7vw] text-[#252422] dark:text-[#F4F1E8]">
              {formatDate(nextEvent.start_date)} um {formatTime(nextEvent.start_date)}
            </div>
          </div>
        </div>
      )
}

export default NextEventInfo
