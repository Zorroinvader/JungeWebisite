// Supabase Edge Function to check FritzBox devices via external service with WireGuard VPN
// This function orchestrates the device checking by calling an external service
// that can handle WireGuard VPN connections

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore - Deno HTTP imports are valid in Edge Functions runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno HTTP imports are valid in Edge Functions runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Minimal global Deno typing to satisfy local TS tooling
declare global {
  // deno-lint-ignore no-var
  var Deno: {
    env: { get: (key: string) => string | undefined }
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// URL to the FritzBox Worker Service (deployed separately but called from Supabase)
// This service handles WireGuard VPN and device checking
// Clean and validate the URL - remove trailing slashes, whitespace, and invalid characters
const FRITZ_SERVICE_URL_RAW = Deno.env.get('FRITZ_SERVICE_URL') ?? ''
const FRITZ_SERVICE_URL = FRITZ_SERVICE_URL_RAW.trim().replace(/[`'"]/g, '').replace(/\/+$/, '') // Remove backticks, quotes, and trailing slashes
const FRITZ_SERVICE_API_KEY = Deno.env.get('FRITZ_SERVICE_API_KEY') ?? ''

serve(async (req) => {
  // Handle CORS with origin whitelist
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN') || 'https://www.jg-wedeswedel.de/','https://junge-webisite-mvn3.vercel.app/',
    'http://localhost:3000', // Development
  ]
  
  const origin = req.headers.get('origin')
  const corsOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let hasNewDevices = false
    let message = 'Aktuell ist niemand im Club'
    let devices: any[] = []
    let isFallback = false
    let responseFromEC2 = false

    // Call the external FritzBox service that handles VPN
    if (FRITZ_SERVICE_URL) {
      try {
        // Log service call without exposing full URL
        const serviceHost = FRITZ_SERVICE_URL ? new URL(FRITZ_SERVICE_URL).hostname : 'not configured'
        console.log(`Calling Fritz service: ${serviceHost}/check-devices`)
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
            
            // Always use new messages based on EC2 response, ignore EC2's message field
            message = hasNewDevices ? 'Aktuell ist jemand im Club, komm doch mal vorbei!' : 'Aktuell ist niemand im Club'
            console.log(`Using EC2 service response: has_new=${hasNewDevices}, message="${message}" (overridden with new messages)`)
          } else {
            console.error('EC2 service returned invalid response format:', data)
            isFallback = true
            // Fallback to database status but use new messages
            const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
            if (currentStatus && currentStatus.length > 0) {
              hasNewDevices = currentStatus[0].has_new_devices
              message = hasNewDevices ? 'Aktuell ist jemand im Club, komm doch mal vorbei!' : 'Aktuell ist niemand im Club'
            }
          }
        } else {
          const errorText = await response.text()
          console.error('Fritz service error:', response.status, errorText)
          isFallback = true
          // On error, keep current status from database but use new messages
          const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
          if (currentStatus && currentStatus.length > 0) {
            hasNewDevices = currentStatus[0].has_new_devices
            message = hasNewDevices ? 'Aktuell ist jemand im Club, komm doch mal vorbei!' : 'Aktuell ist niemand im Club'
            console.log(`Using fallback from database: has_new=${hasNewDevices}, message="${message}" (overridden with new messages)`)
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
        
        // On error, keep current status from database but use new messages
        const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
        if (currentStatus && currentStatus.length > 0) {
          hasNewDevices = currentStatus[0].has_new_devices
          message = hasNewDevices ? 'Aktuell ist jemand im Club, komm doch mal vorbei!' : 'Aktuell ist niemand im Club'
          console.log(`Using fallback from database (error occurred): has_new=${hasNewDevices}, message="${message}" (overridden with new messages)`)
        } else {
          // Default to not occupied on error if no database status exists
          hasNewDevices = false
          message = 'Aktuell ist niemand im Club'
          console.log('Using default fallback: has_new=false, message="Aktuell ist niemand im Club"')
        }
      }
    } else {
      console.warn('FRITZ_SERVICE_URL not set')
      isFallback = true
      // Keep current status from database but use new messages
      const { data: currentStatus } = await supabase.rpc('get_latest_club_status')
      if (currentStatus && currentStatus.length > 0) {
        hasNewDevices = currentStatus[0].has_new_devices
        message = hasNewDevices ? 'Aktuell ist jemand im Club, komm doch mal vorbei!' : 'Aktuell ist niemand im Club'
        console.log(`Using fallback from database (no URL set): has_new=${hasNewDevices}, message="${message}" (overridden with new messages)`)
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
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Error in check-devices function:', error)
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production'
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to check devices and update club status',
        ...(isProduction ? {} : { stack: error.stack }),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})

