// Supabase Edge Function to check FritzBox devices via external service with WireGuard VPN
// This function orchestrates the device checking by calling an external service
// that can handle WireGuard VPN connections

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// URL to the FritzBox Worker Service (deployed separately but called from Supabase)
// This service handles WireGuard VPN and device checking
const FRITZ_SERVICE_URL = Deno.env.get('FRITZ_SERVICE_URL') ?? ''
const FRITZ_SERVICE_API_KEY = Deno.env.get('FRITZ_SERVICE_API_KEY') ?? ''

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let hasNewDevices = false
    let message = 'Außer den Baseline Geräten ist niemand im Club'
    let devices: any[] = []

    // Call the external FritzBox service that handles VPN
    if (FRITZ_SERVICE_URL) {
      try {
        console.log(`Calling Fritz service: ${FRITZ_SERVICE_URL}/check-devices`)
        const startTime = Date.now()
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function',
        }
        
        // Add API key if configured
        if (FRITZ_SERVICE_API_KEY) {
          headers['Authorization'] = `Bearer ${FRITZ_SERVICE_API_KEY}`
        }

        const response = await fetch(`${FRITZ_SERVICE_URL}/check-devices`, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(58000), // 58 second timeout (under Supabase Free Tier 60s limit)
        })
        
        const duration = Date.now() - startTime
        console.log(`Fritz service response received in ${duration}ms, status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          hasNewDevices = data.has_new === true
          devices = data.new_devices || []
          
          if (hasNewDevices) {
            message = 'Neue Geräte die nicht zum Baseline gehören'
          } else {
            message = 'Außer den Baseline Geräten ist niemand im Club'
          }
        } else {
          const errorText = await response.text()
          console.error('Fritz service error:', response.status, errorText)
          // On error, keep current status
          const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
          if (currentStatus && currentStatus.length > 0) {
            hasNewDevices = currentStatus[0].has_new_devices
            message = currentStatus[0].message || message
          }
        }
      } catch (error) {
        console.error('Error calling Fritz service:', error)
        // On error, keep current status
        const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
        if (currentStatus && currentStatus.length > 0) {
          hasNewDevices = currentStatus[0].has_new_devices
          message = currentStatus[0].message || message
        } else {
          // Default to not occupied on error
          hasNewDevices = false
          message = 'Außer den Baseline Geräten ist niemand im Club'
        }
      }
    } else {
      console.warn('FRITZ_SERVICE_URL not set')
      // Keep current status
      const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
      if (currentStatus && currentStatus.length > 0) {
        hasNewDevices = currentStatus[0].has_new_devices
        message = currentStatus[0].message || message
      }
    }

    // Update the status in the database
    const { error } = await supabase.rpc('update_club_status', {
      has_new_devices_value: hasNewDevices,
      message_value: message,
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        has_new_devices: hasNewDevices,
        is_occupied: hasNewDevices,
        message: message,
        device_count: devices.length,
        devices: devices,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error in check-devices function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to check devices and update club status',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

