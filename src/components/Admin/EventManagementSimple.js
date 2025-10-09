import React, { useState, useEffect } from 'react'
import { eventAPI } from '../../services/api'
import { Plus, Calendar, MapPin, Clock, Users, AlertCircle, Edit, Trash2 } from 'lucide-react'
import moment from 'moment'

const EventManagementSimple = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load events
  const loadEvents = async () => {
    try {
      console.log('EventManagementSimple: Starting to load events...')
      setLoading(true)
      setError('')
      
      console.log('EventManagementSimple: Calling eventAPI.getEvents()...')
      const { data, error } = await eventAPI.getEvents()
      console.log('EventManagementSimple: API call completed:', { data, error })
      
      if (error) {
        console.error('EventManagementSimple: Error loading events:', error)
        setError(error.message || 'Fehler beim Laden der Events')
        setEvents([])
      } else {
        console.log('EventManagementSimple: Events loaded successfully:', data)
        setEvents(data || [])
      }
    } catch (err) {
      console.error('EventManagementSimple: Exception loading events:', err)
      setError('Fehler beim Laden der Events')
      setEvents([])
    } finally {
      console.log('EventManagementSimple: Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('EventManagementSimple: Safety timeout - forcing loading to false')
      setLoading(false)
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-600">Lade Events...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Fehler beim Laden der Events</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadEvents}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Events verwalten</h2>
        <button
          onClick={() => {}}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neues Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Events geplant</h3>
          <p className="mt-1 text-sm text-gray-500">
            Es sind noch keine Events geplant. Klicken Sie auf "Neues Event", um ein Event zu erstellen.
          </p>
          <div className="mt-4">
            <button
              onClick={() => {}}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Erstes Event erstellen
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {moment(event.start_date).format('DD.MM.YYYY HH:mm')} - {moment(event.end_date).format('DD.MM.YYYY HH:mm')}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </p>
                    )}
                    {event.max_participants && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Max. {event.max_participants} Teilnehmer
                      </p>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-gray-500">{event.description}</p>
                  )}
                </div>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => {}}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {}}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventManagementSimple
