import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Users, FileText, Settings, AlertCircle, Check, X, Clock, Eye, Download, ArrowLeft } from 'lucide-react'
import { eventRequestsAPI, eventsAPI } from '../../services/httpApi'
import eventBus from '../../utils/eventBus'

const AdminPanelClean = () => {
  const { isAdmin, user, profile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('events')

  const tabs = [
    { id: 'events', name: 'Events verwalten', icon: Calendar },
    { id: 'requests', name: 'Event-Anfragen', icon: FileText },
    { id: 'users', name: 'Benutzer verwalten', icon: Users },
    { id: 'settings', name: 'Einstellungen', icon: Settings }
  ]

  if (!isAdmin()) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
        {/* Navigation Header */}
        <nav className="w-full border-b" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
          <div className="w-full px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo on the left */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-lg font-semibold" style={{ color: '#252422' }}>Junge Gesellschaft</span>
              </div>
              
              {/* Navigation on the right */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#252422' }}
                >
                  Zurück zur Startseite
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Access Denied Content */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center" style={{ border: '2px solid #A58C81' }}>
              <AlertCircle className="mx-auto h-12 w-12 mb-4" style={{ color: '#dc2626' }} />
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#252422' }}>
                Zugriff verweigert
              </h2>
              <p className="text-base mb-6" style={{ color: '#A58C81' }}>
                Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen.
              </p>
              <div className="text-sm mb-6" style={{ color: '#666' }}>
                <p>User Email: {user?.email || 'Not logged in'}</p>
                <p>Profile Role: {profile?.role || 'No profile'}</p>
                <p>Is Admin: {isAdmin() ? 'Yes' : 'No'}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#A58C81' }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Startseite
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventsTab />
      case 'requests':
        return <RequestsTab />
      case 'users':
        return <UsersTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <EventsTab />
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
      {/* Navigation Header */}
      <nav className="w-full border-b sticky top-0 z-40" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo on the left */}
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                alt="Junge Gesellschaft Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold" style={{ color: '#252422' }}>Junge Gesellschaft</span>
            </div>
            
            {/* Navigation on the right */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#252422' }}
              >
                Zurück zur Startseite
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#252422' }}>Admin Panel</h1>
            <p className="text-lg" style={{ color: '#A58C81' }}>
              Verwalten Sie Events, Benutzer und Einstellungen
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl" style={{ border: '2px solid #A58C81' }}>
          {/* Tab Navigation */}
          <div style={{ borderBottom: '1px solid #A58C81' }}>
            <nav className="-mb-px flex flex-wrap gap-x-4 gap-y-2 px-4 sm:px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-b-2 font-semibold'
                        : 'border-transparent hover:opacity-70'
                    } whitespace-nowrap py-3 px-2 font-medium text-sm flex items-center space-x-2 transition-opacity duration-200`}
                    style={{
                      borderColor: activeTab === tab.id ? '#A58C81' : 'transparent',
                      color: activeTab === tab.id ? '#A58C81' : '#666'
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Events tab component
const EventsTab = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await eventRequestsAPI.getAll()
      
      if (data) {
        // Filter for approved events
        const approvedEvents = data.filter(req => req.status === 'approved')
        setEvents(approvedEvents || [])
      } else {
        setEvents([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Lade Events...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-red-900">Fehler beim Laden</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={loadEvents}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Events verwalten ({events.length})</h2>
        <button
          onClick={loadEvents}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Aktualisieren
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Events geplant</h3>
          <p className="mt-1 text-sm text-gray-500">
            Es sind noch keine Events geplant. Events werden automatisch erstellt, wenn Event-Anfragen genehmigt werden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-4 w-4 mr-1" />
                      Genehmigt
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-2">{event.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p><strong>Datum:</strong> {new Date(event.start_date).toLocaleDateString('de-DE')}</p>
                    <p><strong>Zeit:</strong> {new Date(event.start_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Genehmigt am:</strong> {new Date(event.updated_at).toLocaleDateString('de-DE')} um {new Date(event.updated_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const RequestsTab = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const data = await eventRequestsAPI.getAll()
      
      if (data) {
        setRequests(data || [])
      } else {
        setRequests([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    try {
      // First, get the request details
      const requests = await eventRequestsAPI.getAll()
      const request = requests.find(req => req.id === requestId)
      
      if (!request) {
        alert('Event-Anfrage nicht gefunden!')
        return
      }

      // Create an event from the request data
      const eventData = {
        title: request.title,
        description: request.description || '',
        start_date: request.start_date,
        end_date: request.end_date || request.start_date,
        location: request.location || '',
        event_type: request.event_type || 'Allgemein',
        max_participants: request.max_participants || null,
        is_private: request.is_private || false,
        created_by: request.requested_by,
        requester_name: request.requester_name,
        requester_email: request.requester_email,
        uploaded_file_name: request.uploaded_file_name,
        uploaded_file_size: request.uploaded_file_size,
        uploaded_file_type: request.uploaded_file_type,
        uploaded_file_data: request.uploaded_file_data,
        uploaded_mietvertrag_url: request.uploaded_mietvertrag_url,
        hausordnung_accepted: request.hausordnung_accepted,
        mietvertrag_accepted: request.mietvertrag_accepted,
        terms_accepted: request.terms_accepted,
        youth_protection_accepted: request.youth_protection_accepted
      }

      // Create the event in the events table
      await eventsAPI.create(eventData)

      // Update the request status to approved
      await eventRequestsAPI.update(requestId, { 
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      
      alert('Event-Anfrage wurde genehmigt und Event wurde erstellt!')
      loadRequests() // Reload the list
      
      // Emit event to refresh calendar
      eventBus.emit('eventRequestApproved', { requestId })
    } catch (err) {
      console.error('Approval error:', err)
      alert(`Fehler: ${err.message}`)
    }
  }

  const handleReject = async (requestId) => {
    const reason = prompt('Grund für die Ablehnung:')
    if (!reason) return

    try {
      // Update the request status to rejected
      await eventRequestsAPI.update(requestId, { 
        status: 'rejected',
        review_notes: reason,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      alert('Event-Anfrage wurde abgelehnt!')
      loadRequests() // Reload the list
      
      // Emit event to refresh calendar
      eventBus.emit('eventRequestRejected', { requestId })
    } catch (err) {
      alert(`Fehler: ${err.message}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <Check className="h-4 w-4" />
      case 'rejected': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ausstehend'
      case 'approved': return 'Genehmigt'
      case 'rejected': return 'Abgelehnt'
      default: return status
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
      console.error('Error downloading file:', error)
      alert('Fehler beim Herunterladen der Datei')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Lade Event-Anfragen...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-red-900">Fehler beim Laden</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={loadRequests}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Event-Anfragen</h3>
        <p className="mt-1 text-sm text-gray-500">
          Es sind noch keine Event-Anfragen eingegangen.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Event-Anfragen ({requests.length})</h2>
        <button
          onClick={loadRequests}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Aktualisieren
        </button>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{getStatusText(request.status)}</span>
                  </span>
                </div>
                
                {request.description && (
                  <p className="text-gray-600 mb-2">{request.description}</p>
                )}
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p><strong>Datum:</strong> {new Date(request.start_date).toLocaleDateString('de-DE')}</p>
                  <p><strong>Zeit:</strong> {new Date(request.start_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {new Date(request.end_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Eingereicht:</strong> {new Date(request.created_at).toLocaleDateString('de-DE')} um {new Date(request.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {request.review_notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Bemerkungen:</strong> {request.review_notes}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedRequest(request)
                    setShowDetails(true)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Details anzeigen"
                >
                  <Eye className="h-4 w-4" />
                </button>
                
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="p-2 text-green-600 hover:text-green-700 bg-green-50 rounded hover:bg-green-100"
                      title="Genehmigen"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="p-2 text-red-600 hover:text-red-700 bg-red-50 rounded hover:bg-red-100"
                      title="Ablehnen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Event-Anfrage Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Titel</h4>
                <p className="text-gray-600">{selectedRequest.title}</p>
              </div>
              
              {selectedRequest.description && (
                <div>
                  <h4 className="font-medium text-gray-900">Beschreibung</h4>
                  <p className="text-gray-600">{selectedRequest.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Startdatum</h4>
                  <p className="text-gray-600">{new Date(selectedRequest.start_date).toLocaleString('de-DE')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Enddatum</h4>
                  <p className="text-gray-600">{new Date(selectedRequest.end_date).toLocaleString('de-DE')}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  <span className="ml-1">{getStatusText(selectedRequest.status)}</span>
                </span>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Eingereicht am</h4>
                <p className="text-gray-600">{new Date(selectedRequest.created_at).toLocaleString('de-DE')}</p>
              </div>

              {/* PDF Upload Information */}
              {(selectedRequest.uploaded_file_data || selectedRequest.uploaded_mietvertrag_url) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Ausgefüllter Mietvertrag hochgeladen</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    {selectedRequest.uploaded_file_name && (
                      <div>
                        <strong>Dateiname:</strong> {selectedRequest.uploaded_file_name}
                      </div>
                    )}
                    {selectedRequest.uploaded_file_size && (
                      <div>
                        <strong>Größe:</strong> {(selectedRequest.uploaded_file_size / 1024).toFixed(1)} KB
                      </div>
                    )}
                    {selectedRequest.uploaded_file_type && (
                      <div>
                        <strong>Typ:</strong> {selectedRequest.uploaded_file_type}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => downloadUploadedFile(selectedRequest)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Mietvertrag herunterladen
                  </button>
                </div>
              )}

              {!selectedRequest.uploaded_file_data && !selectedRequest.uploaded_mietvertrag_url && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Kein ausgefüllter Mietvertrag hochgeladen</span>
                  </div>
                </div>
              )}
              
              {selectedRequest.review_notes && (
                <div>
                  <h4 className="font-medium text-gray-900">Bemerkungen</h4>
                  <p className="text-gray-600">{selectedRequest.review_notes}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Schließen
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest.id)
                      setShowDetails(false)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Genehmigen
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedRequest.id)
                      setShowDetails(false)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    Ablehnen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const UsersTab = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Benutzer verwalten</h2>
      </div>
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Benutzerverwaltung</h3>
        <p className="mt-1 text-sm text-gray-500">
          Hier können Sie Benutzer verwalten.
        </p>
      </div>
    </div>
  )
}

const SettingsTab = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Einstellungen</h2>
      </div>
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Settings className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Systemeinstellungen</h3>
        <p className="mt-1 text-sm text-gray-500">
          Hier können Sie Systemeinstellungen vornehmen.
        </p>
      </div>
    </div>
  )
}

export default AdminPanelClean
