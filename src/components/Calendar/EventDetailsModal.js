// FILE OVERVIEW
// - Purpose: Modal showing detailed event information with edit/delete actions for admins; displays event metadata and contract links.
// - Used by: SimpleMonthCalendar and admin panels when clicking on events; allows quick editing via QuickEventEditModal.
// - Notes: Production component. Admin-only actions (edit/delete) are shown based on AuthContext.isAdmin().

import React, { useState } from 'react'
import { X, Users, Calendar, Lock, Edit, Trash2 } from 'lucide-react'
import moment from 'moment'
import { useAuth } from '../../contexts/AuthContext'
import QuickEventEditModal from './QuickEventEditModal'
import { eventsAPI, eventRequestsAPI } from '../../services/databaseApi'

const EventDetailsModal = ({ event, onClose, onEventUpdated }) => {
  const { isAdmin } = useAuth()
  const [showQuickEdit, setShowQuickEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  
  if (!event) return null

  // Determine event type for deletion
  const isTemporaryBlocker = event.is_temporary
  const isRequest = event.request_stage
  const isRequestById = event.request_id
  const isAcceptedRequest = event.request_stage === 'initial_accepted' || event.request_stage === 'final_accepted'
  const hasLinkedRequest = event.request_id || event.id

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest) {
        // Delete request
        if (event.id) {
          await eventRequestsAPI.delete(event.id)
        }
      } else {
        // Delete event
        if (hasLinkedRequest && event.request_id) {
          await eventRequestsAPI.delete(event.request_id)
        }
        if (event.id) {
          await eventsAPI.delete(event.id)
        }
      }
      setDeleteMessage('Event erfolgreich gelöscht')
      setTimeout(() => {
        setDeleteMessage('')
        onClose()
        if (onEventUpdated) onEventUpdated()
      }, 1500)
    } catch (err) {
      setDeleteMessage('Fehler beim Löschen: ' + (err.message || 'Unbekannter Fehler'))
      setTimeout(() => setDeleteMessage(''), 3000)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
            <div className="flex gap-2">
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQuickEdit(true)}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Beschreibung</h3>
                <p className="text-gray-600">{event.description}</p>
              </div>
            )}
            
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{moment(event.start_date).format('DD.MM.YYYY')} - {moment(event.end_date).format('DD.MM.YYYY')}</span>
            </div>
            
            {event.requester_name && (
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>{event.requester_name}</span>
              </div>
            )}
            
            {event.is_private && (
              <div className="flex items-center text-gray-600">
                <Lock className="h-5 w-5 mr-2" />
                <span>Privates Event</span>
              </div>
            )}
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
