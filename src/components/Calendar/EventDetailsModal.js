import React, { useState } from 'react'
import { X, MapPin, Clock, Users, FileText, Calendar, Lock, Edit, Trash2 } from 'lucide-react'
import moment from 'moment'
import { useAuth } from '../../contexts/AuthContext'
import QuickEventEditModal from './QuickEventEditModal'
import { eventsAPI, eventRequestsAPI } from '../../services/httpApi'

const EventDetailsModal = ({ event, onClose, onEventUpdated }) => {
  const { isAdmin } = useAuth()
  const [showQuickEdit, setShowQuickEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  
  if (!event) return null

  // Debug logging
  console.log('EventDetailsModal - Event data:', event)
  console.log('EventDetailsModal - isPrivate:', event.isPrivate)
  console.log('EventDetailsModal - is_private:', event.is_private)
  console.log('EventDetailsModal - isAdmin:', isAdmin())
  console.log('EventDetailsModal - Admin check:', isAdmin())

  const formatDate = (dateString) => {
    return moment(dateString).format('dddd, DD. MMMM YYYY [um] HH:mm')
  }

  const formatDuration = (startDate, endDate) => {
    if (!endDate) return 'Keine Endzeit angegeben'
    
    const start = moment(startDate)
    const end = moment(endDate)
    const duration = moment.duration(end.diff(start))
    
    const hours = Math.floor(duration.asHours())
    const minutes = duration.minutes()
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    } else {
      return `${minutes}m`
    }
  }


  // Check if this is a blocked event for non-admin users
  const isPrivate = event.isPrivate || event.is_private || false
  const isBlocked = event.isBlocked || (isPrivate && !isAdmin())
  const isRequest = event.isRequest || false
  
  // Check if event ID starts with "request-" (it's a request)
  const isRequestById = typeof event.id === 'string' && event.id.startsWith('request-')
  
  // Check if it's a temporary blocker (temp-blocked-XXX)
  const isTemporaryBlocker = typeof event.id === 'string' && event.id.startsWith('temp-blocked-')
  
  const isAcceptedRequest = event.resource?.isRequest || event.resource?.status === 'pending' || false
  
  // Check if this event has a linked request ID
  const hasLinkedRequest = event.resource?.request_id || event.request_id || false
  
  console.log('Event details:', {
    id: event.id,
    isRequest,
    isRequestById,
    isTemporaryBlocker,
    isAcceptedRequest,
    hasLinkedRequest,
    resource: event.resource
  })

  // Handle delete event
  const handleDelete = async () => {
    setDeleting(true)
    
    // Close modal immediately for better UX
    setShowDeleteConfirm(false)
    onClose()
    
    try {
      console.log('🗑️ Deleting event:', event.id, 'Is request:', isRequest, 'Is request by ID:', isRequestById, 'Is temporary blocker:', isTemporaryBlocker, 'Has linked request:', hasLinkedRequest)
      
      // Extract actual request ID based on event ID format
      let actualRequestId = event.id
      if (isRequestById) {
        actualRequestId = event.id.replace('request-', '')
      } else if (isTemporaryBlocker) {
        actualRequestId = event.id.replace('temp-blocked-', '')
      }
      
      if (isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest) {
        // This is a temporary blocker or event request - decline it
        console.log('Declining request/blocker:', actualRequestId)
        await eventRequestsAPI.rejectRequest(actualRequestId, 'Vom Administrator abgelehnt')
        setDeleteMessage('Event-Anfrage wurde abgelehnt')
      } else if (hasLinkedRequest) {
        // This event was created from a request - delete both the event and the request
        console.log('Deleting event with linked request:', event.id, 'Request ID:', hasLinkedRequest)
        await eventsAPI.delete(event.id)
        await eventRequestsAPI.rejectRequest(hasLinkedRequest, 'Vom Administrator gelöscht')
        setDeleteMessage('Event und Anfrage wurden gelöscht')
      } else {
        // Regular event - delete it
        console.log('Deleting regular event:', event.id)
        await eventsAPI.delete(event.id)
        setDeleteMessage('Event wurde gelöscht')
      }
      
      // Show success message briefly
      setTimeout(() => setDeleteMessage(''), 3000)
      
      // Refresh calendar after successful deletion
      if (onEventUpdated) {
        onEventUpdated()
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      setDeleteMessage('Fehler: ' + err.message)
      setTimeout(() => setDeleteMessage(''), 5000)
      // Reopen modal if there was an error
      setShowDeleteConfirm(true)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isBlocked ? 'Blockiert' : event.title}
              </h2>
              <div className="flex items-center space-x-2">
                {isBlocked && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Blocked
                  </span>
                )}
                {isRequest && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Special Event
                  </span>
                )}
                {!isBlocked && !isRequest && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Public Event
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 ml-4"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            {isBlocked ? (
              /* Blocked Event Message */
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Privates Event
                </h3>
                <p className="text-gray-600">
                  Dieses Event ist privat und nur für Administratoren sichtbar.
                </p>
              </div>
            ) : (
              <>
                {/* Date and Time */}
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Datum und Zeit</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(event.start_date)}
                    </p>
                    {event.end_date && (
                      <p className="text-sm text-gray-500">
                        Dauer: {formatDuration(event.start_date, event.end_date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location - only show for public events or admin */}
                {event.location && (isAdmin() || !event.isPrivate) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Ort</h3>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Max Participants - only show for public events or admin */}
                {event.max_participants && (isAdmin() || !event.isPrivate) && (
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Teilnehmer</h3>
                      <p className="text-sm text-gray-600">
                        Maximal {event.max_participants} Teilnehmer
                      </p>
                    </div>
                  </div>
                )}

                {/* Description - only show for admin or public events */}
                {event.description && (isAdmin() || !isPrivate) && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Beschreibung</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Event Info - only show for admin */}
            {isAdmin() && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Event-Informationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Event-ID:</span>
                    <span className="ml-2 font-mono text-gray-700">{event.id}</span>
                  </div>
                  {event.created_at && (
                    <div>
                      <span className="text-gray-500">Erstellt am:</span>
                      <span className="ml-2 text-gray-700">
                        {moment(event.created_at).format('DD.MM.YYYY HH:mm')}
                      </span>
                    </div>
                  )}
                  {event.updated_at && event.updated_at !== event.created_at && (
                    <div>
                      <span className="text-gray-500">Aktualisiert am:</span>
                      <span className="ml-2 text-gray-700">
                        {moment(event.updated_at).format('DD.MM.YYYY HH:mm')}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Sichtbarkeit:</span>
                    <span className="ml-2 text-gray-700">
                      {isPrivate ? 'Privat' : 'Öffentlich'}
                    </span>
                  </div>
                  {isRequest && (
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 text-gray-700">Anfrage</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
            {isAdmin() && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuickEdit(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Event bearbeiten
                </button>
                <button
                  onClick={() => {
                    console.log('🗑️ Delete button clicked');
                    console.log('Is admin:', isAdmin());
                    console.log('Is request:', isRequest);
                    setShowDeleteConfirm(true);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {(isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest) ? 'Ablehnen' : hasLinkedRequest ? 'Event & Anfrage löschen' : 'Löschen'}
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 ml-auto"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {showQuickEdit && (
        <QuickEventEditModal
          isOpen={showQuickEdit}
          event={event}
          onClose={() => setShowQuickEdit(false)}
          onSuccess={() => {
            setShowQuickEdit(false);
            if (onEventUpdated) onEventUpdated();
            onClose();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {(isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest) ? 'Event-Anfrage ablehnen?' : hasLinkedRequest ? 'Event und Anfrage löschen?' : 'Event löschen?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {(isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest)
                ? 'Möchten Sie diese Event-Anfrage wirklich ablehnen? Die Anfrage wird als abgelehnt markiert und der Block wird entfernt.'
                : hasLinkedRequest
                ? 'Möchten Sie dieses Event und die zugehörige Anfrage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
                : 'Möchten Sie dieses Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gelöscht...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {(isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest) ? 'Anfrage ablehnen' : hasLinkedRequest ? 'Event & Anfrage löschen' : 'Event löschen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Toast */}
      {deleteMessage && (
        <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-[70] animate-slide-in">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${deleteMessage.includes('Fehler') ? 'text-red-600' : 'text-green-600'}`}>
              {deleteMessage.includes('Fehler') ? '❌' : '✅'}
            </div>
            <p className="ml-3 text-sm font-medium text-gray-900">{deleteMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailsModal
