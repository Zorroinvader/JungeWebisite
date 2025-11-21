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
  return [
    Deno.env.get('ALLOWED_ORIGIN') || 'https://your-production-domain.com',
    'http://localhost:3000', // Development
  ]
}

const getCorsHeaders = (req: Request) => {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.get('origin')
  const corsOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]
  
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Fetch the ICS feed
    const response = await fetch(ICS_FEED_URL)
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch ICS: ${response.statusText}`,
          status: response.status 
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Get the ICS content
    const icsContent = await response.text()
    
    // Return the ICS content with CORS headers
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })

  } catch (error) {
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

