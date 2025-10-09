import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { eventRequestAPI } from '../services/api'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Mail } from 'lucide-react'
import moment from 'moment'

const ProfilePageSimple = () => {
  const { user, profile } = useAuth()
  const [eventRequests, setEventRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  console.log('ProfilePageSimple render - user:', user, 'profile:', profile)

  const loadEventRequests = useCallback(async () => {
    try {
      console.log('Loading event requests for user ID:', user?.id)
      setLoading(true)
      if (!user?.id) {
        console.log('No user ID available')
        setError('Benutzer nicht gefunden')
        setEventRequests([])
        return
      }
      const { data, error } = await eventRequestAPI.getUserEventRequests(user.id)
      console.log('Event requests API response:', { data, error })
      if (error) {
        console.error('Error loading event requests:', error)
        setEventRequests([])
        setError(`Fehler beim Laden der Event-Anfragen: ${error.message || 'Unbekannter Fehler'}`)
      } else {
        console.log('Event requests loaded successfully:', data)
        setEventRequests(data || [])
        setError('')
      }
    } catch (err) {
      console.error('Exception loading event requests:', err)
      setEventRequests([])
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    console.log('ProfilePageSimple useEffect - loading event requests')
    loadEventRequests()
  }, [loadEventRequests])

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

  const getStatusLabel = (status) => {
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

  const getStatusClasses = (status) => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Debug message */}
        <div className="mb-4 p-2 bg-green-100 text-green-800 text-sm rounded">
          ProfilePageSimple Loaded Successfully!
        </div>
        
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || 'Benutzer'}
              </h1>
              <p className="text-gray-600 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {user?.email}
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-2">
                {profile?.role === 'admin' ? 'Administrator' : 'Mitglied'}
              </span>
            </div>
          </div>
        </div>

        {/* Event Requests Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ihre Event-Anfragen
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Hier sehen Sie alle Ihre eingereichten Event-Anfragen und deren Status
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-yellow-800">{error}</p>
                    <button
                      onClick={loadEventRequests}
                      className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
                    >
                      Erneut versuchen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-600">Lade Event-Anfragen...</p>
              </div>
            ) : eventRequests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Noch keine Event-Anfragen</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie haben noch keine Event-Anfragen gestellt. Klicken Sie auf einen Tag im Kalender, um eine Anfrage zu stellen.
                </p>
                <div className="mt-4">
                  <a 
                    href="/" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors duration-200"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Zum Kalender
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {eventRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2" />
                          {moment(request.start_date).format('DD.MM.YYYY')}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-500 mt-2">{request.description}</p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(request.status)}`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-2">{getStatusLabel(request.status)}</span>
                        </span>
                      </div>
                    </div>
                    {request.status === 'rejected' && request.review_notes && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">Ablehnungsgrund:</p>
                        <p className="text-sm text-red-700">{request.review_notes}</p>
                      </div>
                    )}
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

export default ProfilePageSimple
