// FILE OVERVIEW
// - Purpose: Admin-Ansicht zur Übersicht und Bewertung aller Event-Anfragen inkl. Mietvertrags-Download.
// - Used by: Eingebettet im Admin-Dashboard (AdminPanelClean) für die Verwaltung der Anfragen.
// - Notes: Production admin tool. Nutzt eventRequestsAPI; Änderungen betreffen Admin-Workflow und Freigaben.

import React, { useState, useEffect } from 'react'
import { eventRequestsAPI } from '../../services/databaseApi'
import { CheckCircle, XCircle, Clock, User, Calendar, MapPin, AlertCircle, X, Download, FileText, Mail } from 'lucide-react'
import moment from 'moment'

const EventRequestManagement = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Load event requests
  const loadRequests = async () => {
    try {
      setLoading(true)
      
      // Add timeout wrapper to prevent hanging
      const loadPromise = eventRequestsAPI.getAll()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lade-Timeout')), 4000)
      )
      
      const allRequests = await Promise.race([loadPromise, timeoutPromise])
      const requestsArray = Array.isArray(allRequests) ? allRequests : []
      
      // Filter by status if not 'all'
      const filteredRequests = filter === 'all' 
        ? requestsArray 
        : requestsArray.filter(request => request.status === filter)
      
      setRequests(filteredRequests || [])
    } catch (err) {
      setError('Fehler beim Laden der Veranstaltungs-Anfragen')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  // Approve event request
  const handleApproveRequest = async (requestId) => {
    try {
      // Get the request details first
      const request = requests.find(r => r.id === requestId)
      if (!request) {
        setError('Anfrage nicht gefunden')
        return
      }

      // Update request status to approved
      await eventRequestsAPI.update(requestId, {
        status: 'approved',
        reviewed_by: 'admin',
        review_notes: 'Veranstaltung von Admin genehmigt',
        updated_at: new Date().toISOString()
      })

      loadRequests()
      setShowReviewModal(false)
      setSelectedRequest(null)
    } catch (err) {
      setError('Fehler beim Genehmigen der Anfrage')
    }
  }

  // Reject event request
  const handleRejectRequest = async (requestId, reviewNotes) => {
    try {
      await eventRequestsAPI.update(requestId, {
        status: 'rejected',
        reviewed_by: 'admin',
        review_notes: reviewNotes || 'Request rejected by admin',
        updated_at: new Date().toISOString()
      })

      loadRequests()
      setShowReviewModal(false)
      setSelectedRequest(null)
    } catch (err) {
      setError('Fehler beim Ablehnen der Anfrage')
    }
  }

  // Download uploaded PDF file
  const downloadUploadedFile = (request) => {
    try {
      // Check if we have base64 data (new format)
      if (request.uploaded_file_data) {
        // Convert base64 to blob
        const byteCharacters = atob(request.uploaded_file_data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: request.uploaded_file_type || 'application/pdf' })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = request.uploaded_file_name || 'mietvertrag.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } 
      // Fallback to URL (old format)
      else if (request.uploaded_mietvertrag_url) {
        const link = document.createElement('a')
        link.href = request.uploaded_mietvertrag_url
        link.download = 'mietvertrag.pdf'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Keine Datei zum Herunterladen verfügbar')
      }
    } catch (error) {
      alert('Fehler beim Herunterladen der Datei')
    }
  }

  useEffect(() => {
    loadRequests()
  }, [filter])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
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
          <h2 className="text-xl font-semibold text-gray-900">Veranstaltungs-Anfragen verwalten</h2>
          <p className="text-sm text-gray-600">
            {requests.length} Anfrage{requests.length !== 1 ? 'n' : ''} gefunden
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'Alle', count: requests.length },
            { id: 'pending', name: 'Ausstehend', count: requests.filter(r => r.status === 'pending').length },
            { id: 'approved', name: 'Genehmigt', count: requests.filter(r => r.status === 'approved').length },
            { id: 'rejected', name: 'Abgelehnt', count: requests.filter(r => r.status === 'rejected').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`${
                filter === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
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

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Anfragen</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Es sind keine Veranstaltungs-Anfragen vorhanden.'
              : `Es sind keine ${getStatusLabel(filter).toLowerCase()} Anfragen vorhanden.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{getStatusLabel(request.status)}</span>
                    </span>
                  </div>
                  
                  {request.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {request.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center text-gray-500">
                      <User className="h-4 w-4 mr-2" />
                      <span>
                        Anfrage von: {request.requester_name || request.profiles?.full_name || request.profiles?.email || 'Unbekannt'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>
                        {request.requester_email || 'Unbekannt'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {moment(request.start_date).format('DD.MM.YYYY HH:mm')}
                        {request.end_date && (
                          <span> - {moment(request.end_date).format('DD.MM.YYYY HH:mm')}</span>
                        )}
                      </span>
                    </div>
                    
                    {request.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{request.location}</span>
                      </div>
                    )}
                    
                    {request.max_participants && (
                      <div className="flex items-center text-gray-500">
                        <span>Max. {request.max_participants} Teilnehmer</span>
                      </div>
                    )}
                  </div>

                  {/* PDF Upload Information */}
                  {(request.uploaded_file_data || request.uploaded_mietvertrag_url) && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Ausgefüllter Mietvertrag hochgeladen</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        {request.uploaded_file_name && (
                          <div>
                            <strong>Dateiname:</strong> {request.uploaded_file_name}
                          </div>
                        )}
                        {request.uploaded_file_size && (
                          <div>
                            <strong>Größe:</strong> {(request.uploaded_file_size / 1024).toFixed(1)} KB
                          </div>
                        )}
                        {request.uploaded_file_type && (
                          <div>
                            <strong>Typ:</strong> {request.uploaded_file_type}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => downloadUploadedFile(request)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Mietvertrag herunterladen
                      </button>
                    </div>
                  )}

                  {!request.uploaded_file_data && !request.uploaded_mietvertrag_url && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Kein ausgefüllter Mietvertrag hochgeladen</span>
                      </div>
                    </div>
                  )}

                  {request.review_notes && (
                    <div className="bg-gray-50 rounded-md p-3 mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Bewertung:</strong> {request.review_notes}
                      </p>
                      {request.reviewer && (
                        <p className="text-xs text-gray-500 mt-1">
                          Bewertet von: {request.reviewer.full_name || request.reviewer.email}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Erstellt am: {moment(request.created_at).format('DD.MM.YYYY HH:mm')}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowReviewModal(true)
                      }}
                      className="px-3 py-1 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                    >
                      Bewerten
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedRequest(null)
          }}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}
    </div>
  )
}

// Review Modal Component
const ReviewModal = ({ request, onClose, onApprove, onReject }) => {
  const [reviewNotes, setReviewNotes] = useState('')
  const [action, setAction] = useState('') // 'approve' or 'reject'
  const [loading, setLoading] = useState(false)

  // Download uploaded PDF file
  const downloadUploadedFile = (request) => {
    try {
      // Check if we have base64 data (new format)
      if (request.uploaded_file_data) {
        // Convert base64 to blob
        const byteCharacters = atob(request.uploaded_file_data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: request.uploaded_file_type || 'application/pdf' })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = request.uploaded_file_name || 'mietvertrag.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } 
      // Fallback to URL (old format)
      else if (request.uploaded_mietvertrag_url) {
        const link = document.createElement('a')
        link.href = request.uploaded_mietvertrag_url
        link.download = 'mietvertrag.pdf'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Keine Datei zum Herunterladen verfügbar')
      }
    } catch (error) {
      alert('Fehler beim Herunterladen der Datei')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (action === 'approve') {
        await onApprove(request.id)
      } else if (action === 'reject') {
        await onReject(request.id, reviewNotes)
      }
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    {/* MOBILE RESPONSIVE: Modal with proper mobile sizing */}
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 md:p-4 z-50"
      style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Veranstaltungs-Anfrage bewerten
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Request Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{request.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Anfrage von:</strong> {request.requester_name || request.profiles?.full_name || request.profiles?.email}</p>
              <p><strong>E-Mail:</strong> {request.requester_email || 'Unbekannt'}</p>
              <p><strong>Datum:</strong> {moment(request.start_date).format('DD.MM.YYYY HH:mm')}</p>
              {request.location && <p><strong>Ort:</strong> {request.location}</p>}
              {request.description && (
                <p><strong>Beschreibung:</strong> {request.description}</p>
              )}
            </div>
          </div>

          {/* PDF Upload Information */}
          {(request.uploaded_file_data || request.uploaded_mietvertrag_url) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Ausgefüllter Mietvertrag hochgeladen</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                {request.uploaded_file_name && (
                  <div>
                    <strong>Dateiname:</strong> {request.uploaded_file_name}
                  </div>
                )}
                {request.uploaded_file_size && (
                  <div>
                    <strong>Größe:</strong> {(request.uploaded_file_size / 1024).toFixed(1)} KB
                  </div>
                )}
                {request.uploaded_file_type && (
                  <div>
                    <strong>Typ:</strong> {request.uploaded_file_type}
                  </div>
                )}
              </div>
              <button
                onClick={() => downloadUploadedFile(request)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Mietvertrag herunterladen
              </button>
            </div>
          )}

          {!request.uploaded_file_data && !request.uploaded_mietvertrag_url && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">Kein ausgefüllter Mietvertrag hochgeladen</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Bewertungskommentar
              </label>
              <textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Geben Sie einen Kommentar zur Bewertung ein..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction('reject')
                  handleSubmit(new Event('submit'))
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird abgelehnt...' : 'Ablehnen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction('approve')
                  handleSubmit(new Event('submit'))
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird genehmigt...' : 'Genehmigen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EventRequestManagement
