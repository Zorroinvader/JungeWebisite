// FILE OVERVIEW
// - Purpose: Main admin dashboard component that provides tabs for event management, request management, user management, settings, and special events.
// - Used by: Route '/admin' in App.js (protected, admin-only); central hub for all admin operations.
// - Notes: Production component. Admin-only access; includes ThreeStepRequestManagement, EventRequestManagement, UserManagement, AdminSettings, SpecialEventModeration.

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { Calendar, Users, FileText, Settings, AlertCircle, Check, X, Eye, Download, ArrowLeft, Workflow, Plus, Edit, RefreshCw } from 'lucide-react'
import { eventsAPI } from '../../services/databaseApi'
import { secureLog, sanitizeError } from '../../utils/secureConfig'
import UserManagement from './UserManagement'
import ThreeStepRequestManagement from './ThreeStepRequestManagement'
import AdminEventCreationForm from './AdminEventCreationForm'
import AdminEventEditForm from './AdminEventEditForm'
import { fetchAndParseICS, convertToDBEvent } from '../../utils/icsParser'

const AdminPanelClean = () => {
  const { isAdmin, user, profile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('three-step-requests')

  const tabs = [
    { id: 'three-step-requests', name: '3-Schritt Anfragen', icon: Workflow },
    { id: 'events', name: 'Veranstaltungen verwalten', icon: FileText },
    { id: 'special-events', name: 'Besondere Veranstaltungen', icon: Eye },
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
                Sie haben keine Berechtigung, auf den Verwaltungsbereich zuzugreifen.
              </p>
              <div className="text-sm mb-6" style={{ color: '#666' }}>
                <p>E-Mail: {user?.email || 'Nicht angemeldet'}</p>
                <p>Rolle: {profile?.role || 'Kein Profil'}</p>
                <p>Administrator: {isAdmin() ? 'Ja' : 'Nein'}</p>
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
      case 'three-step-requests':
        return <ThreeStepRequestManagement />
      case 'events':
        return <EventsTab />
      case 'special-events':
        return <SpecialEventsTab />
      case 'users':
        return <UsersTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <ThreeStepRequestManagement />
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-[#252422] dark:text-[#F4F1E8]">Verwaltung</h1>
            <p className="text-lg text-[#A58C81] dark:text-[#EBE9E9]">
              Verwalten Sie Veranstaltungen, Benutzer und Einstellungen
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#252422] rounded-2xl shadow-xl border-2 border-[#A58C81] dark:border-[#EBE9E9]">
          {/* Tab Navigation */}
          <div className="border-b border-[#A58C81] dark:border-[#EBE9E9]">
            <nav className="-mb-px flex flex-wrap gap-x-4 gap-y-2 px-4 sm:px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-b-2 font-semibold border-[#A58C81] dark:border-[#EBE9E9] text-[#A58C81] dark:text-[#EBE9E9]'
                        : 'border-transparent hover:opacity-70 text-gray-600 dark:text-[#EBE9E9]'
                    } min-w-0 whitespace-normal text-center py-3 px-2 font-medium text-sm flex items-center justify-center space-x-2 transition-opacity duration-200`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="break-words">{tab.name}</span>
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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    loadEvents()
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000) // 3 second timeout
    
    return () => clearTimeout(timeout)
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add timeout wrapper to prevent hanging
      const loadPromise = eventsAPI.getAll()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lade-Timeout')), 4000)
      )
      
      let data = []
      try {
        data = await Promise.race([loadPromise, timeoutPromise])
        data = Array.isArray(data) ? data : []
      } catch (error) {
        secureLog('error', 'Failed to load events', sanitizeError(error))
        data = []
      }
      
      // Filter out past events - only show future events
      const now = new Date()
      const futureEvents = (data || []).filter(event => {
        const eventDate = new Date(event.start_date || event.end_date)
        const isFuture = eventDate >= now
        return isFuture
      })
      
      setEvents(futureEvents)
    } catch (err) {
      setError(err.message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleEventCreated = () => {
    setShowCreateForm(false)
    loadEvents() // Refresh the list
  }

  const handleEventUpdated = () => {
    setShowEditForm(false)
    setSelectedEvent(null)
    loadEvents() // Refresh the list
  }

  const handleEditClick = (event) => {
    setSelectedEvent(event)
    setShowEditForm(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Veranstaltungen werden geladen...</span>
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F4F1E8]">Veranstaltungen verwalten ({events.length})</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Veranstaltung erstellen
          </button>
          <button
            onClick={loadEvents}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#EBE9E9] bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/20 rounded-lg border-2 border-[#A58C81] dark:border-[#4a4a4a]">
          <Calendar className="mx-auto h-12 w-12 text-[#A58C81] dark:text-[#EBE9E9]" />
          <h3 className="mt-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8]">Keine Veranstaltungen vorhanden</h3>
          <p className="mt-1 text-sm text-[#A58C81] dark:text-[#EBE9E9]">
            Erstellen Sie eine neue Veranstaltung oder warten Sie auf genehmigte Anfragen.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Erste Veranstaltung erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-[#2a2a2a] border-2 border-[#A58C81] dark:border-[#4a4a4a] rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-[#252422] dark:text-[#F4F1E8]">{event.title}</h3>
                    
                    {/* Privacy Badge */}
                    {event.is_private ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                        🔒 Privat
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                        🌍 Öffentlich
                      </span>
                    )}
                    
                    {/* Event Type Badge */}
                    {event.event_type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {event.event_type}
                      </span>
                    )}
                    
                    {/* Imported Badge */}
                    {event.imported_from && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                        📥 Importiert
                      </span>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">{event.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p><strong>Zeitraum:</strong> {new Date(event.start_date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(event.start_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} → {new Date(event.end_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                    {event.location && (
                      <p><strong>Ort:</strong> {event.location}</p>
                    )}
                    {event.category && (
                      <p><strong>Kategorie:</strong> {event.category}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleEditClick(event)}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Event Form Modal */}
      {showEditForm && selectedEvent && (
        <AdminEventEditForm
          isOpen={showEditForm}
          event={selectedEvent}
          onClose={() => {
            setShowEditForm(false)
            setSelectedEvent(null)
          }}
          onSuccess={handleEventUpdated}
        />
      )}

      {/* Admin Event Creation Form Modal */}
      {showCreateForm && (
        <AdminEventCreationForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  )
}

const UsersTab = () => {
  return <UserManagement />
}

const SettingsTab = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoApprovePublic, setAutoApprovePublic] = useState(false)
  const [showPrivateEvents, setShowPrivateEvents] = useState(true)
  const [showBlockedDates, setShowBlockedDates] = useState(true)
  const [defaultToWeekView, setDefaultToWeekView] = useState(false)
  const [adminEmails, setAdminEmails] = useState([])
  const [adminEmailsFull, setAdminEmailsFull] = useState([]) // Full objects from DB
  const [pendingEmails, setPendingEmails] = useState([]) // Emails to be added
  const [emailsToRemove, setEmailsToRemove] = useState([]) // Email IDs to remove
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loadingEmails, setLoadingEmails] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setNotificationsEnabled(settings.notificationsEnabled ?? true)
        setAutoApprovePublic(settings.autoApprovePublic ?? false)
        setShowPrivateEvents(settings.showPrivateEvents ?? true)
        setShowBlockedDates(settings.showBlockedDates ?? true)
        setDefaultToWeekView(settings.defaultToWeekView ?? false)
      } catch (error) {
      }
    }
  }, [])

  // Load admin emails from database
  useEffect(() => {
    async function loadEmails() {
      try {
        const { getAdminNotificationEmails } = await import('../../services/emailApi')
        const emails = await getAdminNotificationEmails()
        setAdminEmailsFull(emails)
        setAdminEmails(emails.map(e => e.email))
      } catch (error) {
      } finally {
        setLoadingEmails(false)
      }
    }
    loadEmails()
  }, [])

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleAddEmail = () => {
    setEmailError('')
    setSaveSuccess(false)
    setSaveError('')
    
    if (!newEmail.trim()) {
      setEmailError('Bitte geben Sie eine oder mehrere E-Mail-Adressen ein')
      return
    }

    // Parse multiple emails (separated by comma, semicolon, or newline)
    const emailRegex = /[\s,;]+/
    const rawEmails = newEmail.split(emailRegex).map(e => e.trim()).filter(e => e.length > 0)
    
    if (rawEmails.length === 0) {
      setEmailError('Bitte geben Sie mindestens eine E-Mail-Adresse ein')
      return
    }

    const validEmails = []
    const invalidEmails = []
    const duplicates = []
    
    rawEmails.forEach(rawEmail => {
      if (!validateEmail(rawEmail)) {
        invalidEmails.push(rawEmail)
      } else {
        const emailLower = rawEmail.toLowerCase()
        
        // Check if already in database or pending
        if (adminEmails.map(e => e.toLowerCase()).includes(emailLower) || 
            pendingEmails.map(e => e.toLowerCase()).includes(emailLower)) {
          duplicates.push(rawEmail)
        } else {
          validEmails.push(rawEmail)
        }
      }
    })

    // Show errors if any
    if (invalidEmails.length > 0) {
      setEmailError(`Ungültige E-Mail-Adressen: ${invalidEmails.join(', ')}`)
      return
    }

    if (duplicates.length > 0) {
      setEmailError(`Diese E-Mail-Adressen existieren bereits: ${duplicates.join(', ')}`)
      return
    }

    // Add valid emails to pending list
    if (validEmails.length > 0) {
      setPendingEmails([...pendingEmails, ...validEmails])
      setNewEmail('')
    }
  }

  const handleRemoveEmail = (emailId, emailToRemove) => {
    setSaveSuccess(false)
    setSaveError('')
    
    // If email is in database, add to removal list
    if (emailId) {
      setEmailsToRemove([...emailsToRemove, emailId])
      setAdminEmailsFull(adminEmailsFull.filter(e => e.id !== emailId))
      setAdminEmails(adminEmails.filter(email => email !== emailToRemove))
    } else {
      // If it's a pending email, just remove from pending
      setPendingEmails(pendingEmails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase()))
    }
  }

  const handleImportOldCalendar = async () => {
    // Use Supabase Edge Function as proxy to bypass CORS
    // SECURITY: Use secure getters to prevent key exposure
    const { getSupabaseUrl, getSupabaseAnonKey } = await import('../../utils/secureConfig')
    const supabaseUrl = getSupabaseUrl()
    const ICS_FEED_URL = `${supabaseUrl}/functions/v1/fetch-ics`
    
    
    if (!window.confirm('Möchten Sie Events aus dem alten Kalender importieren?\n\nDies kann einige Minuten dauern.')) {
      return
    }
    
    try {
      // Show loading indicator
      
      alert('Import wird gestartet...\n\nBitte warten Sie, während die Events importiert werden.\n\nÖffnen Sie die Browser-Konsole (F12) für Live-Logs!')
      
      // Fetch and parse ICS feed
      const supabaseKey = getSupabaseAnonKey()
      console.log('📥 Starting ICS import from:', ICS_FEED_URL)
      const parsedEvents = await fetchAndParseICS(ICS_FEED_URL, supabaseKey)
      console.log(`✅ Parsed ${parsedEvents.length} events from ICS feed`)
      
      if (parsedEvents.length === 0) {
        alert('Keine Events im ICS Feed gefunden.')
        return
      }
      
      // Show sample of first few events
      console.log('Sample events:', parsedEvents.slice(0, 3).map(e => ({
        title: e.SUMMARY,
        start: e.startDate,
        uid: e.UID,
        category: e.CATEGORIES
      })))
      
      // Get existing events once
      console.log('📋 Loading existing events for duplicate check...')
      const existingEvents = await eventsAPI.getAll()
      console.log(`📋 Found ${existingEvents.length} existing events`)
      
      // Convert and import events
      
      let successCount = 0
      let errorCount = 0
      let skipCount = 0
      const errors = []
      const startImport = Date.now()
      
      for (let i = 0; i < parsedEvents.length; i++) {
        const icsEvent = parsedEvents[i]
        
        try {
          const dbEvent = convertToDBEvent(icsEvent)
          
          // Check if event already exists (by UID)
          const exists = existingEvents.some(e => e.imported_uid && e.imported_uid === dbEvent.imported_uid)
          
          if (exists) {
            skipCount++
            continue
          }
          
          // Create event in database
          try {
            const result = await eventsAPI.create(dbEvent)
            
            // Handle different response formats from eventsAPI
            // Supabase client returns {data, error}, HTTP API returns data directly
            if (result && result.error) {
              throw new Error(result.error.message || result.error || 'Failed to create event')
            }
            
            // If result has data array, check if it's empty (which would indicate failure)
            if (result && result.data && Array.isArray(result.data) && result.data.length === 0) {
              // Empty array might be OK if no error, but log it
              console.warn('Event creation returned empty data array for:', dbEvent.title)
            }
            
            successCount++
          } catch (createError) {
            // Re-throw to be caught by outer catch
            throw createError
          }
          
          // Log progress every 10 events
          if ((i + 1) % 10 === 0) {
            console.log(`Import progress: ${i + 1}/${parsedEvents.length} events processed`)
          }
          
        } catch (error) {
          errorCount++
          const errorMessage = error.message || String(error)
          errors.push({ event: icsEvent.SUMMARY || 'Unknown', error: errorMessage })
          console.error(`Failed to import event "${icsEvent.SUMMARY}":`, errorMessage)
        }
      }
      
      // Show results
      
      if (errors.length > 0) {
        errors.forEach((err, idx) => {
        })
      }
      
      
      const message = `Import abgeschlossen!\n\n✅ Erfolgreich importiert: ${successCount}\n❌ Fehler: ${errorCount}\n⏭️ Übersprungen (Duplikate): ${skipCount}\n\nDetails in der Browser-Konsole (F12)\n\nSeite wird neu geladen...`
      alert(message)
      
      // Reload events
      window.location.reload()
      
    } catch (error) {
      
      alert(`Import fehlgeschlagen!\n\nFehler: ${error.message}\n\nBitte überprüfen Sie die Browser-Konsole (F12) für Details.`)
    }
  }

  const handleExportData = () => {
    alert('Export-Funktion:\n\nAlle Veranstaltungen und Anfragen werden als CSV/JSON exportiert.\n(In Entwicklung)')
  }

  const handleClearCache = () => {
    if (window.confirm('Möchten Sie den System-Cache wirklich löschen?\n\nACHTUNG: Alle gespeicherten Einstellungen werden gelöscht!')) {
      localStorage.clear()
      // Reset to defaults
      setNotificationsEnabled(true)
      setAutoApprovePublic(false)
      setShowPrivateEvents(true)
      setShowBlockedDates(true)
      setDefaultToWeekView(false)
      setAdminEmails([])
      alert('Cache wurde erfolgreich geleert!')
    }
  }

  const handleDeleteAllEvents = async () => {
    // Triple confirmation for safety
    const confirmStep1 = window.confirm(
      '⚠️ WARNUNG: Alle Veranstaltungen löschen\n\n' +
      'Dies wird ALLE Veranstaltungen aus der Datenbank löschen!\n\n' +
      'Diese Aktion kann NICHT rückgängig gemacht werden!\n\n' +
      'Möchten Sie fortfahren?'
    )
    
    if (!confirmStep1) {
      return
    }

    const confirmStep2 = window.prompt(
      '⚠️ ZWEITE BESTÄTIGUNG\n\n' +
      'Um fortzufahren, geben Sie "ALLE VERANSTALTUNGEN LÖSCHEN" ein:\n\n' +
      '(Groß-/Kleinschreibung wird beachtet)'
    )
    
    if (confirmStep2 !== 'ALLE VERANSTALTUNGEN LÖSCHEN') {
      alert('❌ Abgebrochen: Falsche Eingabe')
      return
    }

    const confirmStep3 = window.confirm(
      '🔴 LETZTE WARNUNG\n\n' +
      'Dies ist Ihre letzte Chance!\n\n' +
      'Alle Veranstaltungen werden unwiderruflich gelöscht.\n\n' +
      'Sind Sie ABSOLUT SICHER?'
    )
    
    if (!confirmStep3) {
      return
    }

    try {

      // Fetch all events
      const allEvents = await eventsAPI.getAll()
      
      if (allEvents.length === 0) {
        alert('ℹ️ Keine Veranstaltungen zum Löschen gefunden.')
        return
      }


      let successCount = 0
      let errorCount = 0
      const errors = []

      for (let i = 0; i < allEvents.length; i++) {
        const event = allEvents[i]

        try {
          await eventsAPI.delete(event.id)
          successCount++
        } catch (error) {
          errorCount++
          errors.push({ event: event.title, error: error.message })
        }
      }


      if (errors.length > 0) {
        errors.forEach((err, idx) => {
        })
      }


      alert(
        `✅ Löschvorgang abgeschlossen!\n\n` +
        `Gelöscht: ${successCount}\n` +
        `Fehler: ${errorCount}\n\n` +
        `Seite wird neu geladen...`
      )

      // Reload page
      window.location.reload()

    } catch (error) {

      alert(`❌ Fehler beim Löschen!\n\n${error.message}\n\nDetails in der Konsole (F12).`)
    }
  }

  const handleSaveSettings = async () => {
    
    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    
    try {
      // Save basic settings to localStorage
      const settings = {
        notificationsEnabled,
        autoApprovePublic,
        showPrivateEvents,
        showBlockedDates,
        defaultToWeekView,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('adminSettings', JSON.stringify(settings))

      // Only save emails if there are changes
      if (pendingEmails.length > 0 || emailsToRemove.length > 0) {
        
        // Save admin emails to database
        const { addAdminNotificationEmail, removeAdminNotificationEmail } = await import('../../services/emailApi')
        
        // Add pending emails
        for (const email of pendingEmails) {
          await addAdminNotificationEmail(email)
        }
        
        // Remove marked emails
        for (const emailId of emailsToRemove) {
          await removeAdminNotificationEmail(emailId)
        }
        
        // Reload emails from database
        const { getAdminNotificationEmails } = await import('../../services/emailApi')
        const updatedEmails = await getAdminNotificationEmails()
        setAdminEmailsFull(updatedEmails)
        setAdminEmails(updatedEmails.map(e => e.email))
      }
      
      // Clear pending lists
      setPendingEmails([])
      setEmailsToRemove([])
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      
    } catch (error) {
      setSaveError('Fehler beim Speichern der Einstellungen: ' + (error.message || 'Unbekannter Fehler'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">Einstellungen</h2>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <p className="text-green-700 dark:text-green-300 font-medium">
            ✓ Einstellungen wurden erfolgreich gespeichert!
          </p>
        </div>
      )}
      
      {saveError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">
            ✗ {saveError}
          </p>
        </div>
      )}

      {/* Notification Settings */}
      <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg p-6 border-2 border-[#A58C81] dark:border-[#4a4a4a]`}>
        <div className={`border-l-4 border-[#6054d9] pl-4 py-2`}>
          <h3 className={`text-lg font-bold text-[#252422] dark:text-[#F4F1E8] mb-1`}>
            Benachrichtigungen
          </h3>
          <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-4`}>
            E-Mail-Benachrichtigungen für neue Veranstaltungs-Anfragen und Statusänderungen
          </p>

          <div className="space-y-3 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 text-[#6054d9] border-[#A58C81] rounded focus:ring-[#6054d9]"
              />
              <span className={`text-sm text-[#252422] dark:text-[#F4F1E8]`}>
                E-Mail-Benachrichtigungen bei neuen Anfragen aktivieren
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprovePublic}
                onChange={(e) => setAutoApprovePublic(e.target.checked)}
                className="w-4 h-4 text-[#6054d9] border-[#A58C81] rounded focus:ring-[#6054d9]"
              />
              <span className={`text-sm text-[#252422] dark:text-[#F4F1E8]`}>
                Öffentliche Events automatisch genehmigen
              </span>
            </label>
          </div>

          {/* Admin Email List */}
          <div className="mt-6 pt-6 border-t border-[#A58C81] dark:border-[#6a6a6a]">
            <h4 className={`text-sm font-bold text-[#252422] dark:text-[#F4F1E8] mb-2`}>
              Admin E-Mail-Adressen für Benachrichtigungen
            </h4>
              <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-3`}>
              Diese E-Mail-Adressen erhalten Benachrichtigungen bei neuen Veranstaltungs-Anfragen. 
              Sie können mehrere E-Mails gleichzeitig hinzufügen (durch Komma getrennt).
            </p>

            {/* Add Email Form */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value)
                    setEmailError('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddEmail()
                    }
                  }}
                  placeholder="admin@beispiel.de, admin2@beispiel.de (mehrere durch Komma getrennt)"
                  className="w-full px-3 py-2 border-2 border-[#A58C81] dark:border-[#6a6a6a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6054d9] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8]"
                />
                {emailError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{emailError}</p>
                )}
              </div>
              <button
                onClick={handleAddEmail}
                className="px-4 py-2 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Email List */}
            {loadingEmails ? (
              <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] italic text-center py-3`}>
                E-Mail-Adressen werden geladen...
              </p>
            ) : (adminEmailsFull.length > 0 || pendingEmails.length > 0) ? (
              <div className="space-y-2">
                {/* Pending emails (will be added when save is clicked) */}
                {pendingEmails.map((email, index) => (
                  <div
                    key={`pending-${index}`}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700"
                  >
                    <div className="flex-1">
                      <span className={`text-sm font-medium text-[#252422] dark:text-[#F4F1E8]`}>
                        {email} <span className="text-xs text-yellow-600 dark:text-yellow-400">(wird hinzugefügt)</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveEmail(null, email)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                      title="Entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {/* Database emails */}
                {adminEmailsFull.map((emailObj) => (
                  <div
                    key={emailObj.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-[#A58C81] dark:border-[#6a6a6a]"
                  >
                    <div className="flex-1">
                      <span className={`text-sm font-medium text-[#252422] dark:text-[#F4F1E8]`}>
                        {emailObj.email}
                        {emailsToRemove.includes(emailObj.id) && (
                          <span className="text-xs text-red-600 dark:text-red-400 ml-2">(wird entfernt)</span>
                        )}
                      </span>
                      {emailObj.added_at && (
                        <p className="text-xs text-[#A58C81] dark:text-[#EBE9E9] mt-1">
                          Hinzugefügt am {new Date(emailObj.added_at).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveEmail(emailObj.id, emailObj.email)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                      title="Entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] italic text-center py-3`}>
                Noch keine E-Mail-Adressen konfiguriert
              </p>
            )}
            
            {/* Info text about saving */}
            {(pendingEmails.length > 0 || emailsToRemove.length > 0) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 italic text-center py-2">
                ⚠️ Klicken Sie auf "Einstellungen speichern", um die Änderungen zu speichern
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Display Settings */}
      <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg p-6 border-2 border-[#A58C81] dark:border-[#4a4a4a]`}>
        <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
          <h3 className={`text-lg font-bold text-[#252422] dark:text-[#F4F1E8] mb-1`}>
            Kalender-Anzeigeeinstellungen
          </h3>
          <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-4`}>
            Anpassung der Kalender-Darstellung
          </p>

          <div className="space-y-3 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrivateEvents}
                onChange={(e) => setShowPrivateEvents(e.target.checked)}
                className="w-4 h-4 text-[#6054d9] border-[#A58C81] rounded focus:ring-[#6054d9]"
              />
              <span className={`text-sm text-[#252422] dark:text-[#F4F1E8]`}>
                Private Veranstaltungen im öffentlichen Kalender anzeigen
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showBlockedDates}
                onChange={(e) => setShowBlockedDates(e.target.checked)}
                className="w-4 h-4 text-[#6054d9] border-[#A58C81] rounded focus:ring-[#6054d9]"
              />
              <span className={`text-sm text-[#252422] dark:text-[#F4F1E8]`}>
                Blockierte Zeiträume anzeigen
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultToWeekView}
                onChange={(e) => setDefaultToWeekView(e.target.checked)}
                className="w-4 h-4 text-[#6054d9] border-[#A58C81] rounded focus:ring-[#6054d9]"
              />
              <span className={`text-sm text-[#252422] dark:text-[#F4F1E8]`}>
                Wochenansicht als Standard
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Data Export/Backup */}
      <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg p-6 border-2 border-[#A58C81] dark:border-[#4a4a4a]`}>
        <div className={`border-l-4 border-[#6054d9] pl-4 py-2`}>
          <h3 className={`text-lg font-bold text-[#252422] dark:text-[#F4F1E8] mb-1`}>
            Daten-Export & Backup
          </h3>
          <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-4`}>
            Exportieren und sichern Sie Ihre Daten
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8] bg-white dark:bg-[#1a1a1a] border-2 border-[#A58C81] dark:border-[#6a6a6a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252422] transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Alle Veranstaltungen exportieren (CSV)
            </button>
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8] bg-white dark:bg-[#1a1a1a] border-2 border-[#A58C81] dark:border-[#6a6a6a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252422] transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Anfragen exportieren (CSV)
            </button>
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8] bg-white dark:bg-[#1a1a1a] border-2 border-[#A58C81] dark:border-[#6a6a6a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252422] transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Backup erstellen (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg p-6 border-2 border-[#A58C81] dark:border-[#4a4a4a]`}>
        <div className={`border-l-4 border-[#6054d9] pl-4 py-2`}>
          <h3 className={`text-lg font-bold text-[#252422] dark:text-[#F4F1E8] mb-1`}>
            Daten Import
          </h3>
          <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-4`}>
            Importieren Sie Events aus dem alten Kalender-System
          </p>

          <div className="mt-4">
            <button
              onClick={handleImportOldCalendar}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Aus altem Kalender importieren
            </button>
            <p className={`text-xs mt-2 text-[#A58C81] dark:text-[#EBE9E9]`}>
              Importiert Events aus: kalender.digital (ICS Feed)
            </p>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg p-6 border-2 border-[#A58C81] dark:border-[#4a4a4a]`}>
        <div className={`border-l-4 border-red-500 pl-4 py-2`}>
          <h3 className={`text-lg font-bold text-[#252422] dark:text-[#F4F1E8] mb-1`}>
            System-Wartung
          </h3>
          <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-4`}>
            Wartungsfunktionen und Cache-Verwaltung
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleClearCache}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Cache leeren
            </button>
            
            <button
              onClick={handleDeleteAllEvents}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 border-2 border-red-700 dark:border-red-900 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors shadow-md"
            >
              <X className="h-4 w-4 mr-2" />
              Alle Veranstaltungen löschen
            </button>
          </div>
          
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded">
            <p className="text-xs text-red-700 dark:text-red-400">
              <strong>⚠️ Warnung:</strong> Der Button "Alle Veranstaltungen löschen" erfordert eine 3-fache Bestätigung und löscht unwiderruflich alle Veranstaltungen aus der Datenbank. Verwenden Sie diese Funktion nur zum Testen oder bei einem kompletten Neustart!
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className={`bg-white dark:bg-[#2a2a2a] rounded-lg p-6 border-2 border-[#A58C81] dark:border-[#4a4a4a]`}>
        <div className={`border-l-4 border-[#A58C81] pl-4 py-2`}>
          <h3 className={`text-lg font-bold text-[#252422] dark:text-[#F4F1E8] mb-1`}>
            System-Informationen
          </h3>
          <p className={`text-xs text-[#A58C81] dark:text-[#EBE9E9] mb-4`}>
            Allgemeine System- und Anwendungsinformationen
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`text-[#A58C81] dark:text-[#EBE9E9]`}>Version:</span>
              <span className={`font-medium text-[#252422] dark:text-[#F4F1E8]`}>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-[#A58C81] dark:text-[#EBE9E9]`}>Datenbank:</span>
              <span className={`font-medium text-[#252422] dark:text-[#F4F1E8]`}>Supabase</span>
            </div>
            <div className="flex justify-between">
              <span className={`text-[#A58C81] dark:text-[#EBE9E9]`}>Event-System:</span>
              <span className={`font-medium text-[#252422] dark:text-[#F4F1E8]`}>3-Schritt Workflow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanelClean

const SpecialEventsTab = () => {
  const [mounted, setMounted] = React.useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const SpecialEventModeration = require('./SpecialEventModeration').default
  return <SpecialEventModeration />
}
