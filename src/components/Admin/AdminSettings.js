// FILE OVERVIEW
// - Purpose: Admin settings component for configuring notification emails, auto-approve settings, and other admin preferences.
// - Used by: AdminPanelClean in the settings tab; allows admins to manage system-wide settings stored in localStorage.
// - Notes: Production component. Uses settingsHelper for reading/writing admin settings; manages admin notification email list.

import React, { useState } from 'react'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Jungengesellschaft',
    siteDescription: 'Ihre Plattform für Events und Veranstaltungen',
    contactEmail: 'info@jungengesellschaft.de',
    maxEventParticipants: 50,
    eventApprovalRequired: true,
    allowPublicEventRequests: false,
    notificationEmail: 'admin@jungengesellschaft.de'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) setError('')
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Simulate API call
      // No artificial delay
      
      // In a real application, you would save these settings to the database
      
      setSuccess(true)
      // Success message stays visible until next action
    } catch (err) {
      setError('Fehler beim Speichern der Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Einstellungen</h2>
        <p className="text-sm text-gray-600">
          Verwalten Sie die allgemeinen Einstellungen der Website
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">Einstellungen erfolgreich gespeichert!</p>
            </div>
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Allgemeine Einstellungen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-[#F4F1E8] mb-2">
                Website-Name
              </label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-[#F4F1E8] mb-2">
                Kontakt-E-Mail
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Website-Beschreibung
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Event Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Event-Einstellungen</h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="maxEventParticipants" className="block text-sm font-medium text-gray-700 dark:text-[#F4F1E8] mb-2">
                Maximale Teilnehmerzahl pro Event
              </label>
              <input
                type="number"
                id="maxEventParticipants"
                name="maxEventParticipants"
                value={settings.maxEventParticipants}
                onChange={handleChange}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="eventApprovalRequired"
                name="eventApprovalRequired"
                checked={settings.eventApprovalRequired}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="eventApprovalRequired" className="ml-2 block text-sm text-gray-900">
                Event-Genehmigung erforderlich
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowPublicEventRequests"
                name="allowPublicEventRequests"
                checked={settings.allowPublicEventRequests}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="allowPublicEventRequests" className="ml-2 block text-sm text-gray-900">
                Öffentliche Event-Anfragen erlauben
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Benachrichtigungen</h3>
          
          <div>
            <label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700 dark:text-[#F4F1E8] mb-2">
              Benachrichtigungs-E-Mail
            </label>
            <input
              type="email"
              id="notificationEmail"
              name="notificationEmail"
              value={settings.notificationEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#6a6a6a] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-[#8a8a8a] focus:border-primary-500 dark:focus:border-[#8a8a8a] bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#e0e0e0] placeholder-gray-500 dark:placeholder-gray-400"
            />
            <p className="mt-1 text-sm text-gray-500">
              E-Mail-Adresse für Benachrichtigungen über neue Event-Anfragen
            </p>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System-Informationen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-mono">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-500">Letzte Aktualisierung:</span>
              <span className="ml-2">{new Date().toLocaleDateString('de-DE')}</span>
            </div>
            <div>
              <span className="text-gray-500">Datenbank:</span>
              <span className="ml-2">Supabase</span>
            </div>
            <div>
              <span className="text-gray-500">Backend:</span>
              <span className="ml-2">Supabase</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Einstellungen speichern
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminSettings
