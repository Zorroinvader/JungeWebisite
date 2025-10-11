import React, { useState, useEffect } from 'react'
import { eventAPI } from '../../services/api'
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Users, AlertCircle, CheckCircle, X } from 'lucide-react'
import moment from 'moment'

const EventManagement = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(null)

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await eventAPI.getEvents()
      
      if (error) {
        setError(error.message)
      } else {
        setEvents(data || [])
      }
    } catch (err) {
      setError('Fehler beim Laden der Events')
    } finally {
      setLoading(false)
    }
  }

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    try {
      const { error } = await eventAPI.deleteEvent(eventId)
      
      if (error) {
        setError(error.message)
      } else {
        setEvents(events.filter(event => event.id !== eventId))
        setDeletingEvent(null)
      }
    } catch (err) {
      setError('Fehler beim Löschen des Events')
    }
  }

  // Handle create/edit success
  const handleEventSaved = () => {
    setShowCreateModal(false)
    setEditingEvent(null)
    loadEvents()
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const getEventTypeLabel = (type) => {
    const types = {
      general: 'Allgemein',
      meeting: 'Meeting',
      social: 'Sozial',
      workshop: 'Workshop'
    }
    return types[type] || 'Allgemein'
  }

  const getEventTypeColor = (type) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      meeting: 'bg-green-100 text-green-800',
      social: 'bg-yellow-100 text-yellow-800',
      workshop: 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Events verwalten</h2>
          <p className="text-sm text-gray-600">
            {events.length} Event{events.length !== 1 ? 's' : ''} gefunden
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neues Event
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Events</h3>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie Ihr erstes Event, um zu beginnen.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {event.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                      {getEventTypeLabel(event.event_type)}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {event.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {moment(event.start_date).format('DD.MM.YYYY HH:mm')}
                        {event.end_date && (
                          <span> - {moment(event.end_date).format('DD.MM.YYYY HH:mm')}</span>
                        )}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.max_participants && (
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Max. {event.max_participants} Teilnehmer</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    title="Event bearbeiten"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingEvent(event)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    title="Event löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {(showCreateModal || editingEvent) && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setShowCreateModal(false)
            setEditingEvent(null)
          }}
          onSuccess={handleEventSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Event löschen
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Sind Sie sicher, dass Sie das Event "{deletingEvent.title}" löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingEvent(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeleteEvent(deletingEvent.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Event Form Modal Component
const EventFormModal = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date ? moment(event.start_date).format('YYYY-MM-DDTHH:mm') : '',
    end_date: event?.end_date ? moment(event.end_date).format('YYYY-MM-DDTHH:mm') : '',
    location: event?.location || '',
    event_type: event?.event_type || 'general',
    max_participants: event?.max_participants || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const eventTypes = [
    { value: 'general', label: 'Allgemein' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'social', label: 'Sozial' },
    { value: 'workshop', label: 'Workshop' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const eventData = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        end_date: formData.end_date || null
      }

      let result
      if (event) {
        result = await eventAPI.updateEvent(event.id, eventData)
      } else {
        result = await eventAPI.createEvent(eventData)
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {event ? 'Event bearbeiten' : 'Neues Event erstellen'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event-Titel *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Startdatum und -zeit *
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Enddatum und -zeit
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Ort
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Event-Typ
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-2">
                Maximale Teilnehmerzahl
              </label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gespeichert...' : (event ? 'Aktualisieren' : 'Erstellen')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventManagement
