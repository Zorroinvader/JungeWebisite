import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { eventsAPI, eventRequestsAPI } from '../../services/httpApi'
import { CheckCircle, XCircle, Clock, FileText, User, Mail, Calendar, Eye, EyeOff, Download, AlertCircle } from 'lucide-react'

const EnhancedEventManagement = () => {
  const { user, isAdmin } = useAuth()
  const [eventRequests, setEventRequests] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load event requests
      const requests = await eventRequestsAPI.getAll()
      setEventRequests(requests || [])

      // Load events
      const eventsData = await eventsAPI.getAll()
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      // Get the request details first
      const request = eventRequests.find(r => r.id === requestId)
      if (!request) {
        console.error('Request not found')
        return
      }

      // Create event from request data
      const eventData = {
        title: request.title,
        description: request.description || '',
        start_date: request.start_date,
        end_date: request.end_date,
        location: request.location || '',
        event_type: request.event_type || 'Allgemein',
        max_participants: request.max_participants || null,
        is_private: request.is_private || false,
        created_by: request.created_by || request.requested_by,
        requester_name: request.requester_name,
        requester_email: request.requester_email,
        hausordnung_accepted: request.hausordnung_accepted,
        mietvertrag_accepted: request.mietvertrag_accepted,
        terms_accepted: request.terms_accepted,
        youth_protection_accepted: request.youth_protection_accepted,
        requested_by: request.requested_by,
        status: 'approved'
      }

      // Create the event
      await eventsAPI.create(eventData)

      // Update request status
      await eventRequestsAPI.update(requestId, {
        status: 'approved',
        reviewed_by: user.id,
        review_notes: 'Event approved and created',
        updated_at: new Date().toISOString()
      })

      loadData() // Reload data
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await eventRequestsAPI.update(requestId, {
        status: 'rejected',
        reviewed_by: user.id,
        review_notes: 'Request rejected by admin',
        updated_at: new Date().toISOString()
      })
      loadData() // Reload data
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

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
      console.error('Error downloading file:', error)
      alert('Fehler beim Herunterladen der Datei')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600">Sie haben keine Berechtigung, diese Seite zu besuchen.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Lade Daten...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event-Verwaltung</h1>
        <p className="text-gray-600">Verwalten Sie Event-Anfragen und genehmigte Events.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Event-Anfragen ({eventRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Genehmigte Events ({events.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Event Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {eventRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Event-Anfragen</h3>
              <p className="text-gray-600">Es sind derzeit keine Event-Anfragen vorhanden.</p>
            </div>
          ) : (
            eventRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{request.description}</p>
                    
                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(request.start_date).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{request.requester_name || 'Unbekannt'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{request.requester_email || 'Unbekannt'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {request.is_private ? (
                          <EyeOff className="h-4 w-4 text-red-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-green-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {request.is_private ? 'Privat' : 'Öffentlich'}
                        </span>
                      </div>
                    </div>

                    {/* PDF Acceptance Status */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Dokumenten-Akzeptanz</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Hausordnung:</span>
                          {request.hausordnung_accepted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Mietvertrag:</span>
                          {request.mietvertrag_accepted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PDF Links */}
                    <div className="space-y-3 mb-4">
                      <div className="flex space-x-3">
                        <a
                          href="/assets/Junge_Geseltschaft_Hausordnung.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Hausordnung anzeigen
                        </a>
                        <a
                          href="/assets/Junge_Geseltschaft_Mietvertrag.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Mietvertrag-Vorlage anzeigen
                        </a>
                      </div>
                      
                      {/* Uploaded Mietvertrag */}
                      {(request.uploaded_file_data || request.uploaded_mietvertrag_url) && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Ausgefüllter Mietvertrag hochgeladen</span>
                          </div>
                          <div className="space-y-2">
                            {request.uploaded_file_name && (
                              <div className="text-sm text-gray-600">
                                <strong>Dateiname:</strong> {request.uploaded_file_name}
                              </div>
                            )}
                            {request.uploaded_file_size && (
                              <div className="text-sm text-gray-600">
                                <strong>Größe:</strong> {(request.uploaded_file_size / 1024).toFixed(1)} KB
                              </div>
                            )}
                            {request.uploaded_file_type && (
                              <div className="text-sm text-gray-600">
                                <strong>Typ:</strong> {request.uploaded_file_type}
                              </div>
                            )}
                            <button
                              onClick={() => downloadUploadedFile(request)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Hochgeladenen Mietvertrag herunterladen
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!request.uploaded_file_data && !request.uploaded_mietvertrag_url && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">Kein ausgefüllter Mietvertrag hochgeladen</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Genehmigen
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ablehnen
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Events</h3>
              <p className="text-gray-600">Es sind derzeit keine genehmigten Events vorhanden.</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor('approved')}`}>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="ml-1">Genehmigt</span>
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{event.description}</p>
                    
                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(event.start_date).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {event.is_private ? (
                          <EyeOff className="h-4 w-4 text-red-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-green-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {event.is_private ? 'Privat' : 'Öffentlich'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedEventManagement
