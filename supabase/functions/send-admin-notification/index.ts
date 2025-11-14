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
      throw new Error('RESEND_API_KEY not configured')
    }

    // Parse request body
    const { adminEmails, subject, message, htmlContent, recipients } = await req.json()

    // Determine recipients - prefer recipients parameter, fallback to adminEmails
    const emailRecipients = recipients || adminEmails

    // Validate input
    if (!emailRecipients || !Array.isArray(emailRecipients) || emailRecipients.length === 0) {
      throw new Error('No recipient emails provided')
    }

    // Send email using Resend API
    // Sender (must be verified with Resend)
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'jungegesellschaft@wedelheine.de'
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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`Resend API error (${response.status}): ${responseText}`)
    }

    const result = JSON.parse(responseText)

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
