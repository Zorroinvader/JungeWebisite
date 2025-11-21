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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Resend API key - SECURITY: Validate required environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'RESEND_API_KEY not configured. Please set this environment variable in Supabase Dashboard.',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Validate key format (basic check - Resend keys typically start with 're_')
    if (!RESEND_API_KEY.startsWith('re_') && RESEND_API_KEY.length < 20) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid RESEND_API_KEY format.',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
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
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        ...(isProduction ? {} : { details: error.stack })
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
