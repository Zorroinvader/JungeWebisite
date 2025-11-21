// FILE OVERVIEW
// - Purpose: Haupt-Profilseite für eingeloggte Nutzer mit Übersicht zu persönlichen Daten und Event-Anfragen.
// - Used by: Route '/profile' (geschützt) in App.js; aufgerufen nach erfolgreicher Anmeldung/Registrierung.
// - Notes: Production member/admin page. Nutzt AuthContext, eventRequestsAPI, MyEventRequests und eventBus. This is the currently used profile page. A simplified test version ProfilePageSimple exists in Non-PROD/pages/ but is not used in production.

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { eventRequestsAPI } from '../services/databaseApi'
import { User, Mail } from 'lucide-react'
import eventBus from '../utils/eventBus'
import MyEventRequests from '../components/Profile/MyEventRequests'

const ProfilePage = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  const loadEventRequests = useCallback(async () => {
    if (isLoadingRequests || !user?.id) {
      return
    }
    setIsLoadingRequests(true)
    try {
      // Add timeout wrapper to prevent hanging
      const loadPromise = eventRequestsAPI.getByUser(user.id)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lade-Timeout')), 4000)
      )
      
      const data = await Promise.race([loadPromise, timeoutPromise])
      if (data) {
        setLoading(false)
      }
    } catch (err) {
      setLoading(false)
    } finally {
      setIsLoadingRequests(false)
    }
  }, [isLoadingRequests, user?.id])

  useEffect(() => {
    if (!user?.id) return // Don't load if no user
    
    loadEventRequests()
    
    // Remove auto-refresh to improve performance - user can manually refresh
    // const refreshInterval = setInterval(() => { loadEventRequests() }, 60000)
    
    // Listen for new event request creation
    const handleEventRequestCreated = (data) => {
      loadEventRequests()
    }
    
    eventBus.on('eventRequestCreated', handleEventRequestCreated)
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
      setIsLoadingRequests(false)
    }, 3000) // 3 second timeout
    
    return () => {
      // clearInterval(refreshInterval)
      clearTimeout(safetyTimeout)
      eventBus.off('eventRequestCreated', handleEventRequestCreated)
    }
  }, [user?.id, loadEventRequests])

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#A58C81]"></div>
      </div>
    )
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-xl p-12 max-w-md w-full text-center border-2 border-red-400">
          <h2 className="text-3xl font-bold mb-4 text-[#252422] dark:text-[#F4F1E8]">
            Nicht angemeldet
          </h2>
          <p className="text-[#A58C81] dark:text-[#EBE9E9] mb-6">
            Bitte melden Sie sich an, um Ihr Profil zu sehen.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-[#A58C81] text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            Zur Anmeldung
          </a>
        </div>
      </div>
    )
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
                {profile?.full_name || user?.email?.split('@')[0] || 'Benutzer'}
              </h1>
              <p className="text-base flex items-center mb-3 text-[#A58C81] dark:text-[#A58C81]">
                <Mail className="h-5 w-5 mr-2" />
                {user?.email}
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-[#A58C81]">
                {profile?.role === 'admin' || profile?.role === 'superadmin' ? 'Administrator' : 'Mitglied'}
              </span>
              {!profile && (
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Profil wird erstellt...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Event Requests Section */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-xl border-2 border-[#A58C81] dark:border-[#A58C81]">
          <div className="p-8 border-b border-[#A58C81] dark:border-[#A58C81]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-[#252422] dark:text-[#F4F1E8]">
                  Meine Veranstaltungs-Anfragen
                </h2>
                <p className="text-base text-[#A58C81] dark:text-[#EBE9E9]">
                  Hier sehen Sie alle Ihre eingereichten Veranstaltungs-Anfragen und deren Status
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