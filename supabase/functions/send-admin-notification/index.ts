// Edge Function to send admin notification emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Resend API key
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment')
      throw new Error('RESEND_API_KEY not configured')
    }

    console.log('✅ API Key found, length:', RESEND_API_KEY.length)

    // Parse request body
    const { adminEmails, subject, message, htmlContent } = await req.json()

    console.log('📧 Request received:')
    console.log('  - To:', adminEmails)
    console.log('  - Subject:', subject)
    console.log('  - Has HTML:', !!htmlContent)

    // Validate input
    if (!adminEmails || !Array.isArray(adminEmails) || adminEmails.length === 0) {
      throw new Error('No admin emails provided')
    }

    // Send email using Resend API
    console.log('📤 Sending to Resend API...')
    
    const emailPayload = {
      from: 'Event Management <onboarding@resend.dev>',
      to: adminEmails,
      subject: subject,
      html: htmlContent || message,
      text: message,
    }

    console.log('📦 Email payload:', JSON.stringify(emailPayload, null, 2))

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('📬 Resend API response status:', response.status)

    const responseText = await response.text()
    console.log('📬 Resend API response:', responseText)

    if (!response.ok) {
      console.error('❌ Resend API error:', responseText)
      throw new Error(`Resend API error (${response.status}): ${responseText}`)
    }

    const result = JSON.parse(responseText)
    console.log('✅ Email sent successfully! ID:', result.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: result.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in function:', error)
    console.error('❌ Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
