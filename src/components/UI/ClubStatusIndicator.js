// FILE OVERVIEW
// - Purpose: Displays the current club status with a green/red indicator
// - Used by: HomePage and other public pages
// - Notes: Shows German messages based on device status

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useDarkMode } from '../../contexts/DarkModeContext'

const ClubStatusIndicator = () => {
  const { isDarkMode } = useDarkMode()
  const [isOccupied, setIsOccupied] = useState(false)
  const [message, setMessage] = useState('Niemand ist gerade im Club')
  const [isLoading, setIsLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)

  useEffect(() => {
    // Fetch initial status
    fetchStatus()

    // Set up realtime subscription to listen for changes
    const channel = supabase
      .channel('club_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_status'
        },
        (payload) => {
          console.log('Club status changed:', payload)
          if (payload.new) {
            setIsOccupied(payload.new.is_occupied)
            setMessage(payload.new.message || 'Niemand ist gerade im Club')
            setLastChecked(payload.new.last_checked)
          } else {
            fetchStatus()
          }
        }
      )
      .subscribe()

    // Poll every 30 seconds as backup (in case realtime fails)
    const interval = setInterval(() => {
      fetchStatus()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('club_status')
        .select('is_occupied, has_new_devices, message, last_checked')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching club status:', error)
        return
      }

      if (data) {
        setIsOccupied(data.is_occupied)
        setMessage(data.message || 'Niemand ist gerade im Club')
        setLastChecked(data.last_checked)
      }
    } catch (error) {
      console.error('Error fetching club status:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
        title={isOccupied ? 'Jemand ist im Club' : 'Niemand ist gerade im Club'}
      />
      
      {/* Status text */}
      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {message}
      </span>
    </div>
  )
}

export default ClubStatusIndicator

