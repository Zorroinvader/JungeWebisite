// Supabase Edge Function to fetch ICS calendar and bypass CORS
// This function acts as a proxy to fetch the ICS feed from the external server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ICS_FEED_URL = 'https://export.kalender.digital/ics/0/a6949578f7eb05dc5b2d/gesamterkalender.ics?past_months=3&future_months=36'

serve(async (req) => {
  // Handle CORS preflight
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
    console.log('📥 Fetching ICS feed from:', ICS_FEED_URL)
    
    // Fetch the ICS feed
    const response = await fetch(ICS_FEED_URL)
    
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
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Get the ICS content
    const icsContent = await response.text()
    
    console.log('✅ Successfully fetched ICS')
    console.log('📊 Content length:', icsContent.length, 'characters')
    
    // Return the ICS content with CORS headers
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })

  } catch (error) {
    console.error('❌ Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch ICS calendar feed'
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

