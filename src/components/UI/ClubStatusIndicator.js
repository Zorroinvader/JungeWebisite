// FILE OVERVIEW
// - Purpose: Displays the current club status with a green/red indicator
// - Used by: HomePage and other public pages
// - Notes: Shows German messages based on device status

import React, { useState, useEffect, useCallback } from 'react'
import { getSupabaseUrl, getSupabaseAnonKey, secureLog, sanitizeError } from '../../utils/secureConfig'
import { useDarkMode } from '../../contexts/DarkModeContext'

const ClubStatusIndicator = () => {
  const { isDarkMode } = useDarkMode()
  const [isOccupied, setIsOccupied] = useState(false)
  const [message, setMessage] = useState('Fehler beim Abrufen der Anwesenheit')
  const [isLoading, setIsLoading] = useState(true)

  // Call edge function for device check and update label based on result
  const checkDevices = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabaseUrl = getSupabaseUrl()
      const supabaseAnonKey = getSupabaseAnonKey()
      
      const response = await fetch(`${supabaseUrl}/functions/v1/check-devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to check devices: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Update label based on edge request result
      if (data.success) {
        setIsOccupied(data.is_occupied)
        setMessage(data.message || 'aktuell ist niemand im Club')
      }
    } catch (error) {
      secureLog('error', '[ClubStatusIndicator] Error checking devices', { error: sanitizeError(error) })
      // Keep default message on error
      setIsOccupied(false)
      setMessage('Fehler beim Abrufen der Anwesenheit')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Call edge function when site is opened
    checkDevices()
  }, [checkDevices])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
        <span>Status wird geladen...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Status indicator (lamp/point) */}
      <div
        className={`w-3 h-3 rounded-full transition-all ${
          isOccupied
            ? 'bg-green-500 shadow-lg shadow-green-500/50'
            : 'bg-red-500 shadow-lg shadow-red-500/50'
        }`}
        title={isOccupied ? 'aktuell ist jemand im club' : 'aktuell ist niemand im Club'}
      />
      
      {/* Status text */}
      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {message}
      </span>
    </div>
  )
}

export default ClubStatusIndicator

