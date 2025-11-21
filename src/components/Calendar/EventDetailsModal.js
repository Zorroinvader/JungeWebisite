// FILE OVERVIEW
// - Purpose: Modal showing detailed event information with edit/delete actions for admins; displays event metadata and contract links.
// - Used by: SimpleMonthCalendar and admin panels when clicking on events; allows quick editing via QuickEventEditModal.
// - Notes: Production component. Admin-only actions (edit/delete) are shown based on AuthContext.isAdmin().

import React, { useState, useMemo } from 'react'
import { X, Users, Calendar, Lock, Edit, Trash2, Clock } from 'lucide-react'
import moment from 'moment'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import QuickEventEditModal from './QuickEventEditModal'
import { eventsAPI, eventRequestsAPI } from '../../services/databaseApi'
import { secureLog, sanitizeError } from '../../utils/secureConfig'

const EventDetailsModal = ({ event, isOpen, onClose, onEventUpdated }) => {
  const { isAdmin } = useAuth()
  const { isDarkMode } = useDarkMode()
  const [showQuickEdit, setShowQuickEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  
  // Normalize event data - handle both resource object from calendar and direct event from list
  // Must be called before early return (React Hooks rules)
  const eventData = useMemo(() => {
    if (!event) return null
    // If event has resource (from calendar), use resource, otherwise use event directly
    const data = event.resource || event
    
    // Parse dates properly
    let startDate = null
    let endDate = null
    let startDateTime = null
    let endDateTime = null
    
    // Try multiple date fields
    const startDateStr = data.start_date || data.startDate || (data.start ? data.start.toISOString() : null)
    const endDateStr = data.end_date || data.endDate || (data.end ? data.end.toISOString() : null)
    const exactStart = data.exact_start_datetime
    const exactEnd = data.exact_end_datetime
    
    if (exactStart) {
      startDateTime = new Date(exactStart)
      endDateTime = new Date(exactEnd || exactStart)
    } else if (startDateStr) {
      startDateTime = new Date(startDateStr)
      endDateTime = new Date(endDateStr || startDateStr)
    }
    
    if (startDateTime && !isNaN(startDateTime.getTime())) {
      startDate = startDateTime
    }
    if (endDateTime && !isNaN(endDateTime.getTime())) {
      endDate = endDateTime
    }
    
    return {
      ...data,
      id: data.id,
      title: data.title || 'Event',
      description: data.description,
      start_date: startDateStr,
      end_date: endDateStr,
      startDate,
      endDate,
      is_private: data.is_private || data.isPrivate || false,
      requester_name: data.requester_name || data.requesterName,
      event_type: data.event_type,
      isTemporaryBlock: data.isTemporaryBlock || data.is_temporary,
      request_stage: data.request_stage,
      request_id: data.request_id,
      schluesselannahme_time: data.schluesselannahme_time,
      schluesselabgabe_time: data.schluesselabgabe_time,
      additional_notes: data.additional_notes,
      uploaded_mietvertrag_url: data.uploaded_mietvertrag_url
    }
  }, [event])
  
  // Early return after all hooks
  if (!event || !isOpen || !eventData) {
    return null
  }

  // Determine event type for deletion
  const isTemporaryBlocker = eventData.isTemporaryBlock || eventData.is_temporary
  const isRequest = eventData.request_stage
  const isRequestById = eventData.request_id
  const isAcceptedRequest = eventData.request_stage === 'initial_accepted' || eventData.request_stage === 'final_accepted'
  const isRegularEvent = !isTemporaryBlocker && !isRequest && eventData.id && !eventData.id.toString().startsWith('temp-blocked-')

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteMessage('')
    
    try {
      const eventId = eventData.id
      
      if (!eventId) {
        throw new Error('Keine Veranstaltungs-ID gefunden')
      }
      
      // Skip temporary blocks (they're not deletable directly)
      if (eventId.toString().startsWith('temp-blocked-')) {
        setDeleteMessage('Vorläufige Blöcke können nicht direkt gelöscht werden')
        setTimeout(() => setDeleteMessage(''), 3000)
        setDeleting(false)
        return
      }
      
      secureLog('log', '[EventDetailsModal] Starting delete', { eventId, isRegularEvent })
      
      let deleteSuccess = false
      let deleteResult = null
      
      if (isTemporaryBlocker || isRequest || isRequestById || isAcceptedRequest) {
        // Delete request
        secureLog('log', '[EventDetailsModal] Deleting request', { eventId })
        deleteResult = await eventRequestsAPI.delete(eventId)
        if (deleteResult && !deleteResult.error) {
          deleteSuccess = true
        } else {
          throw new Error(deleteResult?.error?.message || 'Fehler beim Löschen der Anfrage')
        }
      } else if (isRegularEvent) {
        // Delete regular event
        secureLog('log', '[EventDetailsModal] Deleting regular event', { eventId })
        
        // First try to delete linked request if exists
        if (eventData.request_id) {
          try {
            secureLog('log', '[EventDetailsModal] Also deleting linked request', { requestId: eventData.request_id })
            await eventRequestsAPI.delete(eventData.request_id)
          } catch (reqErr) {
            // Log but continue - request might not exist
            secureLog('warn', '[EventDetailsModal] Failed to delete linked request (continuing)', { error: sanitizeError(reqErr) })
          }
        }
        
        // Delete the event
        secureLog('log', '[EventDetailsModal] Calling eventsAPI.delete', { eventId })
        deleteResult = await eventsAPI.delete(eventId)
        
        // Check if delete was successful
        // Supabase delete can return { data, error } or { success, data, deletedCount }
        if (deleteResult) {
          // Check for error first
          if (deleteResult.error) {
            secureLog('error', '[EventDetailsModal] Delete error', { error: sanitizeError(deleteResult.error) })
            throw new Error(deleteResult.error.message || 'Fehler beim Löschen der Veranstaltung')
          }
          
          // Check for success indicators
          if (deleteResult.success === true) {
            secureLog('log', '[EventDetailsModal] Delete successful (success=true)')
            deleteSuccess = true
          } else if (deleteResult.deletedCount !== undefined && deleteResult.deletedCount > 0) {
            secureLog('log', '[EventDetailsModal] Delete successful', { deletedCount: deleteResult.deletedCount })
            deleteSuccess = true
          } else if (Array.isArray(deleteResult.data) && deleteResult.data.length > 0) {
            secureLog('log', '[EventDetailsModal] Delete successful', { dataLength: deleteResult.data.length })
            deleteSuccess = true
          } else if (Array.isArray(deleteResult) && deleteResult.length > 0) {
            secureLog('log', '[EventDetailsModal] Delete successful', { resultLength: deleteResult.length })
            deleteSuccess = true
          } else if (deleteResult.data && Array.isArray(deleteResult.data) && deleteResult.data.length > 0) {
            secureLog('log', '[EventDetailsModal] Delete successful', { dataLength: deleteResult.data.length })
            deleteSuccess = true
          } else if (deleteResult.data === null || deleteResult.data === undefined) {
            // Some delete operations return null/undefined on success
            secureLog('log', '[EventDetailsModal] Delete successful (no error, assuming success)')
            deleteSuccess = true
          } else {
            secureLog('warn', '[EventDetailsModal] Delete result unclear')
            // If we got a result with no error, assume success
            deleteSuccess = true
          }
        } else {
          // If no result, check if it's actually an error
          secureLog('error', '[EventDetailsModal] No result from delete')
          throw new Error('Keine Antwort vom Server')
        }
      } else {
        secureLog('error', '[EventDetailsModal] Unknown event type')
        throw new Error('Unbekannter Veranstaltungs-Typ')
      }
      
      if (deleteSuccess) {
        secureLog('log', '[EventDetailsModal] Delete successful, closing modal')
        setDeleteMessage('Event erfolgreich gelöscht')
        setTimeout(() => {
          setDeleteMessage('')
          onClose()
          // Trigger refresh
          if (onEventUpdated) onEventUpdated()
          // Also dispatch refresh event for calendar
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('refreshCalendar'))
          }
        }, 1000)
      } else {
        secureLog('error', '[EventDetailsModal] Delete did not succeed')
        throw new Error('Veranstaltung konnte nicht gelöscht werden. Bitte RLS-Policies überprüfen.')
      }
    } catch (err) {
      const errorMsg = err.message || err.toString() || 'Unbekannter Fehler'
      secureLog('error', '[EventDetailsModal] Delete error', {
        error: sanitizeError(err),
        eventId: eventData?.id,
        isRegularEvent,
        isAdmin: isAdmin()
      })
      setDeleteMessage('Fehler beim Löschen: ' + errorMsg)
      setTimeout(() => setDeleteMessage(''), 5000)
    } finally {
      setDeleting(false)
    }
  }

  // Format date and time
  const formatDateTime = (date) => {
    if (!date || isNaN(date.getTime())) return ''
    return moment(date).format('DD.MM.YYYY HH:mm')
  }
  
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return ''
    return moment(date).format('DD.MM.YYYY')
  }
  
  const formatTime = (date) => {
    if (!date || isNaN(date.getTime())) return ''
    return moment(date).format('HH:mm')
  }
  
  const isSameDay = eventData.startDate && eventData.endDate && 
    eventData.startDate.toDateString() === eventData.endDate.toDateString()

  // MOBILE RESPONSIVE: Modal with proper mobile sizing and touch-friendly interactions
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-50" 
      onClick={onClose}
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
    >
      <div 
        className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-lg sm:rounded-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl border-2 border-[#A58C81] ${isDarkMode ? 'dark:border-[#4a4a4a]' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        {/* MOBILE RESPONSIVE: Reduced padding on mobile, more on desktop */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-[#F4F1E8]' : 'text-[#252422]'} truncate`}>
                {eventData.title}
              </h2>
              {eventData.isTemporaryBlock && (
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'} mt-1`}>
                  Vorläufig blockiert
                </p>
              )}
            </div>
            {/* MOBILE RESPONSIVE: Buttons with proper tap targets (min 44x44px) */}
            <div className="flex gap-2 flex-shrink-0">
              {isAdmin() && isRegularEvent && (
                <>
                  <button
                    onClick={() => setShowQuickEdit(true)}
                    disabled={deleting}
                    className={`min-w-[44px] min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-white bg-[#A58C81] ${isDarkMode ? 'dark:bg-[#6a6a6a]' : ''} hover:opacity-90 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 active:scale-95 touch-manipulation`}
                    title="Veranstaltung bearbeiten"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Edit className="h-4 w-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline ml-1">Bearbeiten</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className={`min-w-[44px] min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 active:scale-95 touch-manipulation`}
                    title="Veranstaltung löschen"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Trash2 className="h-4 w-4 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline ml-1">Löschen</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className={`min-w-[44px] min-h-[44px] p-2 ${isDarkMode ? 'text-[#F4F1E8] hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} rounded-lg transition-colors touch-manipulation flex items-center justify-center`}
                title="Schließen"
                style={{ touchAction: 'manipulation' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Event Details - Minimal and Clean */}
          <div className="space-y-3">
            {/* Date & Time */}
            {eventData.startDate && (
              <div className={`flex items-start gap-2 ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-700'}`}>
                <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#A58C81]" />
                <div className="flex-1 text-sm">
                  {isSameDay ? (
                    <>
                      <div className="font-medium">{formatDate(eventData.startDate)}</div>
                      <div className="text-xs opacity-80">
                        {formatTime(eventData.startDate)} - {formatTime(eventData.endDate)} Uhr
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium">{formatDateTime(eventData.startDate)}</div>
                      <div className="text-xs opacity-80">bis {formatDateTime(eventData.endDate)}</div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Requester */}
            {eventData.requester_name && (
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-700'}`}>
                <Users className="h-5 w-5 flex-shrink-0 text-[#A58C81]" />
                <span className="text-sm">{eventData.requester_name}</span>
              </div>
            )}
            
            {/* Description */}
            {eventData.description && (
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-600'}`}>
                  {eventData.description}
                </p>
              </div>
            )}
            
            {/* Key Times */}
            {(eventData.schluesselannahme_time || eventData.schluesselabgabe_time) && (
              <div className={`flex flex-col gap-1 text-sm ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-700'}`}>
                {eventData.schluesselannahme_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#A58C81]" />
                    <span>Schlüsselannahme: {eventData.schluesselannahme_time}</span>
                  </div>
                )}
                {eventData.schluesselabgabe_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#A58C81]" />
                    <span>Schlüsselabgabe: {eventData.schluesselabgabe_time}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Additional Notes */}
            {eventData.additional_notes && (
              <div className={`text-sm ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-600'}`}>
                <p className="font-medium mb-1">Notizen:</p>
                <p>{eventData.additional_notes}</p>
              </div>
            )}
            
            {/* Private Badge */}
            {eventData.is_private && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                <Lock className="h-3 w-3" />
                Private Veranstaltung
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {showQuickEdit && (
        <QuickEventEditModal
          isOpen={showQuickEdit}
          event={eventData}
          onClose={() => setShowQuickEdit(false)}
          onSuccess={() => {
            setShowQuickEdit(false);
            // Trigger refresh
            if (onEventUpdated) onEventUpdated();
            // Also dispatch refresh event for calendar
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('refreshCalendar'))
            }
            onClose();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" onClick={() => setShowDeleteConfirm(false)}>
          <div 
            className={`bg-white ${isDarkMode ? 'dark:bg-[#2a2a2a]' : ''} rounded-lg max-w-md w-full p-4 sm:p-6 border-2 border-red-200 ${isDarkMode ? 'dark:border-red-800' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-900'}`}>
              Veranstaltung löschen?
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Möchten Sie diese Veranstaltung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            {/* MOBILE RESPONSIVE: Buttons stack on mobile */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className={`w-full sm:w-auto px-4 py-2 min-h-[44px] text-base font-medium ${isDarkMode ? 'text-[#F4F1E8] bg-[#333] hover:bg-[#444]' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'} rounded-lg disabled:opacity-50 active:scale-95 transition-all touch-manipulation`}
                style={{ touchAction: 'manipulation' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-base font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-lg disabled:opacity-50 flex items-center justify-center transition-all touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gelöscht...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Toast */}
      {deleteMessage && (
        <div className={`fixed top-4 right-4 ${isDarkMode ? 'bg-[#2a2a2a] border-gray-700' : 'bg-white border-gray-300'} border rounded-lg shadow-lg p-3 sm:p-4 z-[70] animate-slide-in`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${deleteMessage.includes('Fehler') ? 'text-red-600' : 'text-green-600'}`}>
              {deleteMessage.includes('Fehler') ? '❌' : '✅'}
            </div>
            <p className={`ml-3 text-sm font-medium ${isDarkMode ? 'text-[#F4F1E8]' : 'text-gray-900'}`}>{deleteMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetailsModal
