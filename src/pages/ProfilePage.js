import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { eventRequestsAPI } from '../services/httpApi'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Mail } from 'lucide-react'
import moment from 'moment'
import eventBus from '../utils/eventBus'
import MyEventRequests from '../components/Profile/MyEventRequests'

const ProfilePage = () => {
  const { user, profile } = useAuth()
  const [eventRequests, setEventRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  const loadEventRequests = useCallback(async () => {
    if (isLoadingRequests) {
      return
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
  }, [isLoadingRequests, user?.id])

  useEffect(() => {
    loadEventRequests()
    
    // Set up periodic refresh every 60 seconds
    const refreshInterval = setInterval(() => { loadEventRequests() }, 60000)
    
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
  }, [user?.id, loadEventRequests])

  // loadEventRequests is memoized above

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
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center bg-[#A58C81]">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 text-[#252422] dark:text-[#F4F1E8]">
                {profile?.full_name || 'Benutzer'}
              </h1>
              <p className="text-base flex items-center mb-3 text-[#A58C81] dark:text-[#A58C81]">
                <Mail className="h-5 w-5 mr-2" />
                {user?.email}
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-[#A58C81]">
                {profile?.role === 'admin' ? 'Administrator' : 'Mitglied'}
              </span>
            </div>
          </div>
        </div>

        {/* Event Requests Section */}
        <div className="bg-white dark:bg-[#EBE9E9] rounded-2xl shadow-xl border-2 border-[#A58C81] dark:border-[#A58C81]">
          <div className="p-8 border-b border-[#A58C81] dark:border-[#A58C81]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-[#252422] dark:text-[#252422]">
                  Meine Event-Anfragen
                </h2>
                <p className="text-base text-[#A58C81] dark:text-[#A58C81]">
                  Hier sehen Sie alle Ihre eingereichten Event-Anfragen und deren Status
                </p>
              </div>
              <button
                onClick={loadEventRequests}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#A58C81]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Lädt...' : 'Aktualisieren'}
              </button>
            </div>
          </div>

          <div className="p-8">
            <MyEventRequests />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage