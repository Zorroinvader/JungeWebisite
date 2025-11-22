// Supabase Edge Function to fetch ICS calendar and bypass CORS
// This function acts as a proxy to fetch the ICS feed from the external server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ICS_FEED_URL = 'https://export.kalender.digital/ics/0/a6949578f7eb05dc5b2d/gesamterkalender.ics?past_months=3&future_months=36'

// CORS configuration with origin whitelist
const getAllowedOrigins = () => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS')
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim())
  }
  
  // Default allowed origins - include both production and development
  const defaultOrigins = [
    'https://www.jg-wedeswedel.de',
    'https://jg-wedeswedel.de',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]
  
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN')
  if (envOrigin) {
    return [envOrigin, ...defaultOrigins]
  }
  
  return defaultOrigins
}

const getCorsHeaders = (req: Request) => {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.get('origin')
  
  // Check if the request origin is in the allowed list
  const corsOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0] // Default to first allowed origin if not in list
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    console.log('📥 Fetching ICS feed from:', ICS_FEED_URL)
    console.log('🌐 Request origin:', req.headers.get('origin'))
    
    // Fetch the ICS feed
    const response = await fetch(ICS_FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function/1.0)'
      }
    })
    
    if (!response.ok) {
      console.error('❌ Failed to fetch ICS:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch ICS: ${response.statusText}`,
          status: response.status 
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Get the ICS content
    const icsContent = await response.text()
    console.log('✅ Successfully fetched ICS, length:', icsContent.length, 'characters')
    
    // Return the ICS content with CORS headers
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })

  } catch (error) {
    console.error('❌ Error fetching ICS:', error)
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production'
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch ICS calendar feed',
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

