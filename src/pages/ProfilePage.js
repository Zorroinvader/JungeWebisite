import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { eventRequestsAPI } from '../services/httpApi'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Mail } from 'lucide-react'
import moment from 'moment'
import eventBus from '../utils/eventBus'

const ProfilePage = () => {
  const { user, profile } = useAuth()
  const [eventRequests, setEventRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  useEffect(() => {
    // Load event requests immediately
    loadEventRequests()
    
    // Set up periodic refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      loadEventRequests()
    }, 60000)
    
    // Listen for new event request creation
    const handleEventRequestCreated = (data) => {
      loadEventRequests()
    }
    
    eventBus.on('eventRequestCreated', handleEventRequestCreated)
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
      setIsLoadingRequests(false)
    }, 10000) // 10 second timeout
    
    return () => {
      clearInterval(refreshInterval)
      clearTimeout(safetyTimeout)
      eventBus.off('eventRequestCreated', handleEventRequestCreated)
    }
  }, [user?.id])

  const loadEventRequests = async () => {
    if (isLoadingRequests) {
      return // Prevent multiple simultaneous calls
    }
    
    setIsLoadingRequests(true)
    
    try {
      const data = await eventRequestsAPI.getByUser(user?.id)
      
      if (data) {
        setEventRequests(data || [])
        setError('')
      } else {
        setEventRequests([])
        setError('Keine Event-Anfragen gefunden')
      }
    } catch (err) {
      setEventRequests([])
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${err.message}`)
    } finally {
      setLoading(false)
      setIsLoadingRequests(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Genehmigt'
      case 'rejected':
        return 'Abgelehnt'
      case 'pending':
        return 'Ausstehend'
      default:
        return 'Unbekannt'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { backgroundColor: '#d1fae5', color: '#065f46' }
      case 'rejected':
        return { backgroundColor: '#fee2e2', color: '#991b1b' }
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' }
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' }
    }
  }

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
              <a
                href="/"
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#252422' }}
              >
                Zurück zur Startseite
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8" style={{ border: '2px solid #A58C81' }}>
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A58C81' }}>
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#252422' }}>
                {profile?.full_name || 'Benutzer'}
              </h1>
              <p className="text-base flex items-center mb-3" style={{ color: '#A58C81' }}>
                <Mail className="h-5 w-5 mr-2" />
                {user?.email}
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#A58C81' }}>
                {profile?.role === 'admin' ? 'Administrator' : 'Mitglied'}
              </span>
            </div>
          </div>
        </div>

        {/* Event Requests Section */}
        <div className="bg-white rounded-2xl shadow-xl" style={{ border: '2px solid #A58C81' }}>
          <div className="p-8" style={{ borderBottom: '1px solid #A58C81' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#252422' }}>
                  Meine Event-Anfragen
                </h2>
                <p className="text-base" style={{ color: '#A58C81' }}>
                  Hier sehen Sie alle Ihre eingereichten Event-Anfragen und deren Status
                </p>
              </div>
              <button
                onClick={loadEventRequests}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ backgroundColor: '#A58C81' }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Lädt...' : 'Aktualisieren'}
              </button>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
                <div className="flex">
                  <AlertCircle className="h-5 w-5" style={{ color: '#f59e0b' }} />
                  <div className="ml-3 flex-1">
                    <p className="text-sm" style={{ color: '#92400e' }}>
                      {error === 'Profile timeout' ? 'Laden dauert länger als erwartet.' : error}
                    </p>
                    <button
                      onClick={loadEventRequests}
                      className="mt-2 text-sm underline hover:opacity-80 transition-opacity"
                      style={{ color: '#92400e' }}
                    >
                      Erneut versuchen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#A58C81' }}></div>
                <p className="mt-3 text-sm text-gray-600">Lade Event-Anfragen...</p>
              </div>
            ) : eventRequests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 mb-4" style={{ color: '#A58C81' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#252422' }}>Noch keine Event-Anfragen</h3>
                <p className="text-base mb-6" style={{ color: '#A58C81' }}>
                  Sie haben noch keine Event-Anfragen gestellt. Klicken Sie auf einen Tag im Kalender, um eine Anfrage zu stellen.
                </p>
                <div>
                  <a 
                    href="/" 
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#A58C81' }}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Zum Kalender
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {eventRequests.map((request) => (
                  <div key={request.id} className="rounded-lg p-6 hover:opacity-90 transition-opacity" style={{ border: '1px solid #A58C81', backgroundColor: '#fafafa' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold" style={{ color: '#252422' }}>
                            {request.title}
                          </h3>
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            style={getStatusColor(request.status)}
                          >
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{getStatusText(request.status)}</span>
                          </span>
                        </div>
                        
                        {request.description && (
                          <p className="text-base mb-4" style={{ color: '#666' }}>
                            {request.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 text-sm" style={{ color: '#A58C81' }}>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {moment(request.start_date).format('DD.MM.YYYY')}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {moment(request.start_date).format('HH:mm')} - {moment(request.end_date).format('HH:mm')}
                            </span>
                          </div>
                        </div>

                        {request.review_notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Bemerkungen:</strong> {request.review_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage