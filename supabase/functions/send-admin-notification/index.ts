// Edge Function to send admin notification emails via Resend
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// No import needed; use Deno.serve provided by Supabase Edge Runtime

// Minimal global Deno typing to satisfy local TS tooling
declare global {
  // deno-lint-ignore no-var
  var Deno: {
    serve: (handler: (req: Request) => Response | Promise<Response>) => void
    env: { get: (key: string) => string | undefined }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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
    const { adminEmails, subject, message, htmlContent, recipients } = await req.json()

    console.log('📧 Request received:')
    console.log('  - Admin emails:', adminEmails)
    console.log('  - Recipients:', recipients)
    console.log('  - Subject:', subject)
    console.log('  - Has HTML:', !!htmlContent)

    // Determine recipients - prefer recipients parameter, fallback to adminEmails
    const emailRecipients = recipients || adminEmails

    // Validate input
    if (!emailRecipients || !Array.isArray(emailRecipients) || emailRecipients.length === 0) {
      throw new Error('No recipient emails provided')
    }

    // Send email using Resend API
    console.log('📤 Sending to Resend API...')
    
    // Sender (must be verified with Resend)
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'no-reply@jg-wedeswedel.de'
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Jungengesellschaft'
    
    // Always send to provided recipients; rely on Resend domain verification instead of filtering
    const recipientsToSend = emailRecipients
    
    const emailPayload = {
      from: `${fromName} <${fromEmail}>`,
      to: recipientsToSend,
      subject: subject,
      html: htmlContent || message,
      text: message,
    }

    console.log('📦 Email payload:', JSON.stringify(emailPayload, null, 2))
    console.log('📧 From address:', emailPayload.from)

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
