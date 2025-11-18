// Supabase Edge Function to check FritzBox devices via external service with WireGuard VPN
// This function orchestrates the device checking by calling an external service
// that can handle WireGuard VPN connections

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// URL to the FritzBox Worker Service (deployed separately but called from Supabase)
// This service handles WireGuard VPN and device checking
// Clean and validate the URL - remove trailing slashes, whitespace, and invalid characters
const FRITZ_SERVICE_URL_RAW = Deno.env.get('FRITZ_SERVICE_URL') ?? ''
const FRITZ_SERVICE_URL = FRITZ_SERVICE_URL_RAW.trim().replace(/[`'"]/g, '').replace(/\/+$/, '') // Remove backticks, quotes, and trailing slashes
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
    let message = 'Niemand ist gerade im Club'
    let devices: any[] = []
    let isFallback = false
    let responseFromEC2 = false

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
          // Only use EC2 response if it's valid and has expected fields
          if (data && typeof data.has_new !== 'undefined') {
            responseFromEC2 = true
            hasNewDevices = data.has_new === true
            devices = data.new_devices || []
            
            // Use message from EC2 service if provided, otherwise generate one
            if (data.message && typeof data.message === 'string') {
              message = data.message
            } else {
              message = hasNewDevices ? 'Jemand ist im Club' : 'Niemand ist gerade im Club'
            }
            console.log(`Using EC2 service response: has_new=${hasNewDevices}, message="${message}"`)
          } else {
            console.error('EC2 service returned invalid response format:', data)
            isFallback = true
            // Fallback to database status
            const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
            if (currentStatus && currentStatus.length > 0) {
              hasNewDevices = currentStatus[0].has_new_devices
              message = currentStatus[0].message || message
            }
          }
        } else {
          const errorText = await response.text()
          console.error('Fritz service error:', response.status, errorText)
          isFallback = true
          // On error, keep current status from database
          const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
          if (currentStatus && currentStatus.length > 0) {
            hasNewDevices = currentStatus[0].has_new_devices
            message = currentStatus[0].message || message
            console.log(`Using fallback from database: has_new=${hasNewDevices}, message="${message}"`)
          }
        }
      } catch (error) {
        console.error('Error calling Fritz service:', error)
        isFallback = true
        
        // Check if it's a timeout error
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.error('Timeout: EC2 service took longer than 58 seconds. This indicates the service needs optimization.')
          console.error('Consider: 1) Deploy WireGuard reuse optimization, 2) Check EC2 service performance, 3) Upgrade to Supabase Pro Plan for longer timeouts')
        }
        
        // On error, keep current status from database
        const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
        if (currentStatus && currentStatus.length > 0) {
          hasNewDevices = currentStatus[0].has_new_devices
          message = currentStatus[0].message || message
          console.log(`Using fallback from database (error occurred): has_new=${hasNewDevices}, message="${message}"`)
        } else {
          // Default to not occupied on error if no database status exists
          hasNewDevices = false
          message = 'Niemand ist gerade im Club'
          console.log('Using default fallback: has_new=false, message="Niemand ist gerade im Club"')
        }
      }
    } else {
      console.warn('FRITZ_SERVICE_URL not set')
      isFallback = true
      // Keep current status from database
      const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
      if (currentStatus && currentStatus.length > 0) {
        hasNewDevices = currentStatus[0].has_new_devices
        message = currentStatus[0].message || message
        console.log(`Using fallback from database (no URL set): has_new=${hasNewDevices}, message="${message}"`)
      }
    }

    // Update the status in the database
    // Don't fail the entire request if database update fails - log error but continue
    try {
      const { error: dbError } = await supabase.rpc('update_club_status', {
        has_new_devices_value: hasNewDevices,
        message_value: message,
      })

      if (dbError) {
        console.error('Error updating club_status in database:', dbError)
        // Don't throw - allow response to be returned even if DB update fails
      } else {
        console.log('Club status updated successfully in database')
      }
    } catch (dbUpdateError) {
      console.error('Exception updating club_status:', dbUpdateError)
      // Don't throw - allow response to be returned even if DB update fails
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
        response_source: responseFromEC2 ? 'ec2_service' : 'fallback',
        is_fallback: isFallback,
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

