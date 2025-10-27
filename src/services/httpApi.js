// HTTP-based API service that bypasses the problematic Supabase client
// Uses direct HTTP calls to Supabase REST API with security hardening

import { supabase } from '../lib/supabase'
import { sendUserNotification, sendAdminNotification } from '../utils/settingsHelper'
import { getAdminNotificationEmails } from '../utils/settingsHelper'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

// Security validation functions
const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

const validatePhone = (phone) => {
  const phoneRegex = /^(\+49|0)[1-9]\d{1,14}$/
  return phoneRegex.test(phone) && phone.length <= 20
}

const sanitizeText = (text) => {
  if (!text) return text
  return text
    .replace(/[<>'"]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const detectSQLInjection = (text) => {
  if (!text) return false
  const dangerousPatterns = [
    /union|select|insert|update|delete|drop|create|alter|exec|execute/i,
    /[';]/,
    /--/,
    /\/\*.*\*\//
  ]
  return dangerousPatterns.some(pattern => pattern.test(text))
}

// eslint-disable-next-line no-unused-vars
const validateFileUpload = (fileName, fileSize, fileType, maxSize = 10485760) => {
  const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif']
  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  
  return fileSize <= maxSize && allowedExtensions.includes(fileExtension)
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

const getHeaders = async (userEmail = null) => {
  // Get the current session from Supabase
  const { data: { session } } = await supabase.auth.getSession()
  const userToken = session?.access_token || SUPABASE_KEY
  
  console.log('🔍 getHeaders: Session:', session?.user?.email || 'No session')
  console.log('🔍 getHeaders: Using token:', userToken ? 'Yes' : 'No')
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
    'X-User-Email': userEmail || '',
    'X-Session-ID': sessionStorage.getItem('sessionId') || ''
  }
  
  console.log('🔍 getHeaders: Headers created:', headers)
  return headers
}

// Events API
export const eventsAPI = {
  // New simple API call that bypasses complex authentication
  async getAll() {
    try {
      console.log('🔍 Events API: Starting simple getAll()...')
      
      // Use simple headers without complex authentication
      const simpleHeaders = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
      
      console.log('🔍 Events API: Using simple headers:', simpleHeaders)
      console.log('🔍 Events API: Making request to:', `${SUPABASE_URL}/rest/v1/events?select=id,title,description,start_date,end_date,created_by,is_private,status&order=start_date.asc`)
      
      // Add timeout to prevent hanging
           const controller = new AbortController()
           const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout for faster loading
      
      try {
        // Only select needed fields for faster loading
        const response = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,description,start_date,end_date,created_by,is_private,status&order=start_date.asc`, {
          method: 'GET',
          headers: simpleHeaders,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        console.log('🔍 Events API: Response status:', response.status)
        console.log('🔍 Events API: Response ok:', response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('🔍 Events API: Error response:', errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log('🔍 Events API: Response data:', result)
        console.log('🔍 Events API: Response count:', result.length)
        return result
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - API call took too long')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('🔍 Events API: Error:', error)
      throw error
    }
  },

  // Fallback API call using direct Supabase client
  async getAllDirect() {
    try {
      console.log('🔍 Events API: Trying direct Supabase call...')
      
      const { data, error } = await supabase
        .from('events')
        .select('id,title,description,start_date,end_date,created_by,is_private,status')
        .order('start_date', { ascending: true })
      
      if (error) {
        console.error('🔍 Events API: Direct call error:', error)
        throw error
      }
      
      console.log('🔍 Events API: Direct call success:', data?.length || 0, 'events')
      return data || []
    } catch (error) {
      console.error('🔍 Events API: Direct call failed:', error)
      throw error
    }
  },

  // Ultra-simple API call with minimal headers
  async getAllSimple() {
    try {
      console.log('🔍 Events API: Trying ultra-simple call...')
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,description,start_date,end_date,created_by,is_private,status&order=start_date.asc`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('🔍 Events API: Ultra-simple call success:', data?.length || 0, 'events')
      return data || []
    } catch (error) {
      console.error('🔍 Events API: Ultra-simple call failed:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}&select=*`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('HTTP API getEventById error:', error)
      throw error
    }
  },

  async create(data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        return result
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('HTTP API createEvent error:', error)
      throw error
    }
  },

  async update(id, data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        return result
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('HTTP API updateEvent error:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API deleteEvent error:', error)
      throw error
    }
  },

  // Optimized method for calendar display - only essential columns
  async getCalendarEvents(startDate = null, endDate = null) {
    try {
      const headers = await getHeaders()
      
      // Build date filter if provided
      let dateFilter = ''
      if (startDate && endDate) {
        try {
          const start = new Date(startDate).toISOString()
          const end = new Date(endDate).toISOString()
          dateFilter = `&start_date=gte.${start}&start_date=lte.${end}`
        } catch (dateError) {
          console.warn('Invalid date range provided, loading all events:', dateError)
          // Fallback to loading all events if date parsing fails
        }
      }
      
      // Only select essential columns for calendar display
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title,start_date,end_date,is_private,event_type,requester_name,schluesselannahme_time,schluesselabgabe_time,additional_notes,uploaded_mietvertrag_url&order=start_date.asc${dateFilter}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HTTP API getCalendarEvents error:', error)
      throw error
    }
  }
}

// Event Requests API - 3-Step Workflow
export const eventRequestsAPI = {
  // Get all event requests (admin only) - Optimized for admin panel
  async getAll() {
    try {
      const headers = await getHeaders()
      // Only select essential columns for admin panel display
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?select=id,title,event_name,requester_name,requester_email,start_date,end_date,requested_days,request_stage,status,is_private,event_type,created_at,initial_accepted_at,details_submitted_at,final_accepted_at,rejected_at,admin_notes,rejection_reason&order=created_at.desc`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HTTP API getEventRequests error:', error)
      throw error
    }
  },

  // Get admin panel data - Ultra-optimized for fast loading
  async getAdminPanelData(limit = 50, offset = 0) {
    try {
      const headers = await getHeaders()
      // Select columns needed for admin panel including PDF fields
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,exact_start_datetime,exact_end_datetime,event_type,additional_notes,admin_notes&order=created_at.desc&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HTTP API getAdminPanelData error:', error)
      throw error
    }
  },

  // Get requests by stage - Optimized
  async getByStage(stage) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?request_stage=eq.${stage}&select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at&order=created_at.desc`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('HTTP API getByStage error:', error)
      throw error
    }
  },

  // Get request by email (for non-logged-in users)
  async getByEmail(email) {
    try {
      console.log('Searching for requests with email:', email)
      const headers = await getHeaders(email)
      console.log('Headers for email search:', headers)
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?requester_email=eq.${email}&select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at&order=created_at.desc`, {
        method: 'GET',
        headers
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Found requests:', data)
      return data
    } catch (error) {
      console.error('HTTP API getByEmail error:', error)
      throw error
    }
  },

  async getByUser(userId) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?requested_by=eq.${userId}&select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at&order=created_at.desc`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('HTTP API getByUser error:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('HTTP API getEventRequestById error:', error)
      throw error
    }
  },

  // STEP 1: Create initial event request (no login required)
  async createInitialRequest(data) {
    try {
      // Security validation
      if (!validateEmail(data.requester_email)) {
        throw new Error('Invalid email format')
      }
      
      if (data.requester_phone && !validatePhone(data.requester_phone)) {
        throw new Error('Invalid phone format')
      }

      // Sanitize text inputs
      const sanitizedData = {
        requester_name: sanitizeText(data.requester_name),
        initial_notes: sanitizeText(data.initial_notes || data.description || ''),
        event_name: sanitizeText(data.event_name || data.title)
      }

      // Check for SQL injection
      const textFields = [sanitizedData.requester_name, sanitizedData.initial_notes, sanitizedData.event_name]
      for (const field of textFields) {
        if (detectSQLInjection(field)) {
          await securityAPI.logSuspiciousActivity('sql_injection_attempt', `SQL injection detected in event request: ${field}`, 'high')
          throw new Error('Invalid input detected')
        }
      }

      // Rate limiting check
      const rateLimitOk = await securityAPI.checkRateLimit(data.requester_email, 'event_request_create', 5, 60)
      if (!rateLimitOk) {
        throw new Error('Too many requests. Please try again later.')
      }

      const requestData = {
        // Existing fields
        title: sanitizedData.event_name,
        description: sanitizedData.initial_notes,
        requester_name: sanitizedData.requester_name,
        requester_email: data.requester_email,
        start_date: data.start_date,
        end_date: data.end_date,
        is_private: data.is_private !== undefined ? data.is_private : true,
        event_type: data.event_type || (data.is_private ? 'Privates Event' : 'Öffentliches Event'),
        status: 'pending',
        created_at: data.created_at || new Date().toISOString(),
        
        // New fields for 3-step workflow
        event_name: sanitizedData.event_name,
        requester_phone: data.requester_phone || null,
        requested_days: data.requested_days || null,
        initial_notes: sanitizedData.initial_notes,
        request_stage: 'initial'
      }

      const headers = await getHeaders(data.requester_email)
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      
      // Log successful creation
      await securityAPI.logSuspiciousActivity('event_request_created', `Event request created for ${data.requester_email}`, 'low', null, null)
      
      // Send emails
      try {
        const requestData = Array.isArray(result) ? result[0] : result
        // Send confirmation email to user
        await sendUserNotification(data.requester_email, requestData, 'initial_request_received')
        // Send notification email to admins
        await sendAdminNotification(requestData, 'initial_request')
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError)
        // Don't fail the request creation if emails fail
      }
      
      return Array.isArray(result) ? result[0] : result
    } catch (error) {
      console.error('HTTP API createInitialRequest error:', error)
      throw error
    }
  },

  // STEP 2: Admin accepts initial request
  async acceptInitialRequest(id, adminNotes = '') {
    try {
      const headers = await getHeaders()
      
      // First, get the request details
      const getRequestResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
        method: 'GET',
        headers
      })
      
      if (!getRequestResponse.ok) {
        throw new Error(`Failed to get request details`)
      }
      
      const requests = await getRequestResponse.json()
      const request = requests[0]
      
      if (!request) {
        throw new Error('Request not found')
      }
      
      // Update request status
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          request_stage: 'initial_accepted',
          initial_accepted_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Create temporary blocker for the dates
      try {
        const blockData = {
          request_id: id,
          event_name: request.title || request.event_name,
          requester_name: request.requester_name,
          requester_email: request.requester_email,
          start_date: request.start_date,
          end_date: request.end_date,
          request_stage: 'initial_accepted',
          is_temporary: true
        }
        
        await blockedDatesAPI.createTemporaryBlock(blockData)
        console.log('✅ Temporary blocker created for request:', id)
      } catch (blockError) {
        console.warn('Failed to create temporary blocker:', blockError)
        // Don't fail the whole operation if blocker creation fails
      }

      // Send email to user
      try {
        await sendUserNotification(request.requester_email, request, 'initial_request_accepted')
        // Also notify admins that the request was accepted
        await sendAdminNotification(request, 'detailed_info_submitted')
      } catch (emailError) {
        console.error('Failed to send acceptance email:', emailError)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API acceptInitialRequest error:', error)
      throw error
    }
  },

  // STEP 3: Admin rejects request
  async rejectRequest(id, rejectionReason = '') {
    try {
      const headers = await getHeaders()
      
      // Get request details first
      const getRequestResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
        method: 'GET',
        headers
      })
      
      if (!getRequestResponse.ok) {
        throw new Error(`Failed to get request details`)
      }
      
      const requests = await getRequestResponse.json()
      const request = requests[0]
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          request_stage: 'rejected',
          status: 'rejected',
          rejection_reason: rejectionReason
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Send email to user
      if (request) {
        try {
          await sendUserNotification(request.requester_email, {
            ...request,
            rejection_reason: rejectionReason
          }, 'rejected')
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API rejectRequest error:', error)
      throw error
    }
  },

  // USER: Cancel own request at any stage
  async cancelRequest(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          request_stage: 'cancelled',
          status: 'cancelled',
          rejection_reason: 'Vom Benutzer storniert'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API cancelRequest error:', error)
      throw error
    }
  },

  // STEP 4: User submits detailed information
  async submitDetailedRequest(id, data) {
    try {
      console.log('📝 Submitting detailed request for ID:', id)
      console.log('📝 Data to submit:', data)
      
      const requestData = {
        exact_start_datetime: data.exact_start_datetime,
        exact_end_datetime: data.exact_end_datetime,
        key_handover_datetime: data.key_handover_datetime,
        key_return_datetime: data.key_return_datetime,
        signed_contract_url: data.signed_contract_url,
        schluesselannahme_time: data.schluesselannahme_time || null,
        schluesselabgabe_time: data.schluesselabgabe_time || null,
        additional_notes: data.additional_notes || '',
        // Database fallback fields (from old system)
        uploaded_file_name: data.uploaded_file_name || null,
        uploaded_file_size: data.uploaded_file_size || null,
        uploaded_file_type: data.uploaded_file_type || null,
        uploaded_file_data: data.uploaded_file_data || null,
        request_stage: 'details_submitted',
        details_submitted_at: new Date().toISOString()
      }

      console.log('📝 Request data to send:', requestData)

      // For detailed form submission, use anon key to allow updates by email
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
      
      console.log('📝 Headers:', headers)
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestData)
      })

      console.log('📝 Response status:', response.status)
      console.log('📝 Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('📝 Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Send notifications
      try {
        // Get the updated request to send notifications
        const updatedRequestResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (updatedRequestResponse.ok) {
          const updatedRequests = await updatedRequestResponse.json()
          const updatedRequest = updatedRequests[0]
          
          if (updatedRequest) {
            // Notify admins that detailed info was submitted
            await sendAdminNotification(updatedRequest, 'detailed_info_submitted')
          }
        }
      } catch (emailError) {
        console.error('Failed to send notifications:', emailError)
        // Don't fail the request if notifications fail
      }

      console.log('✅ Detailed request submitted successfully')
      return { success: true }
    } catch (error) {
      console.error('HTTP API submitDetailedRequest error:', error)
      throw error
    }
  },

  // STEP 5: Admin gives final acceptance and creates event
  async finalAcceptRequest(id) {
    try {
      // First, get the request details
      const headers = await getHeaders()
      const requestResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
        method: 'GET',
        headers
      })

      if (!requestResponse.ok) {
        throw new Error('Failed to fetch request details')
      }

      const requests = await requestResponse.json()
      const request = requests[0]

      if (!request) {
        throw new Error('Request not found')
      }

      console.log('📋 Creating event from request:', request);

      // Update request status
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          request_stage: 'final_accepted',
          status: 'approved',
          final_accepted_at: new Date().toISOString()
        })
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Failed to update request: ${errorText}`)
      }

      // Create the event in the events table
      const eventData = {
        // Required fields
        title: request.event_name || request.title,
        start_date: request.exact_start_datetime || request.start_date,
        end_date: request.exact_end_datetime || request.end_date,
        
        // Optional existing fields
        description: request.additional_notes || request.initial_notes || '',
        event_type: request.event_type || (request.is_private ? 'Privates Event' : 'Öffentliches Event'),
        is_private: request.is_private,
        location: request.location || '',
        max_participants: request.max_participants || null,
        
        // Requester info
        requester_name: request.requester_name,
        requester_email: request.requester_email,
        requested_by: request.requested_by || null,
        created_by: request.requested_by || null,
        
        // Schlüssel times (stored as text in events table)
        schluesselannahme_time: request.key_handover_datetime 
          ? new Date(request.key_handover_datetime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          : request.schluesselannahme_time,
        schluesselabgabe_time: request.key_return_datetime
          ? new Date(request.key_return_datetime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          : request.schluesselabgabe_time,
        
        // Additional notes
        additional_notes: request.additional_notes,
        
        // Contract URL (only field that exists in events table)
        uploaded_mietvertrag_url: request.signed_contract_url,
        
        // Status
        status: 'approved'
      }

      console.log('📤 Creating event with data:', eventData);

      const createEventResponse = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData)
      })

      if (!createEventResponse.ok) {
        const errorText = await createEventResponse.text()
        console.error('❌ Event creation failed:', errorText);
        throw new Error(`Failed to create event: ${errorText}`)
      }

      console.log('✅ Event created successfully!');
      
      // Send notifications
      try {
        // Notify user of final approval
        await sendUserNotification(request.requester_email, request, 'final_approval')
        // Notify admins of final acceptance
        await sendAdminNotification(request, 'final_acceptance')
      } catch (emailError) {
        console.error('Failed to send final acceptance notifications:', emailError)
        // Don't fail if notifications fail
      }
      
      // Delete the temporary blocker since event is now created
      try {
        // Find and delete the temporary blocker for this request
        const blockers = await blockedDatesAPI.getTemporarilyBlocked()
        const blocker = blockers.find(b => b.request_id === id)
        
        if (blocker) {
          await blockedDatesAPI.deleteTemporaryBlock(blocker.id)
          console.log('✅ Temporary blocker deleted for request:', id)
        } else {
          console.log('⚠️ No temporary blocker found for request:', id)
        }
      } catch (blockError) {
        console.warn('Failed to delete temporary blocker:', blockError)
        // Don't fail the whole operation if blocker deletion fails
      }
      
      return { success: true }
    } catch (error) {
      console.error('HTTP API finalAcceptRequest error:', error)
      throw error
    }
  },

  // Legacy create method for backwards compatibility
  async create(data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        return result
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('HTTP API createEventRequest error:', error)
      throw error
    }
  },

  async update(id, data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        return result
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('HTTP API updateEventRequest error:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API deleteEventRequest error:', error)
      throw error
    }
  },

  // Optimized method for calendar display - only essential columns for requests
  async getCalendarRequests(startDate = null, endDate = null) {
    try {
      const headers = await getHeaders()
      
      // Build date filter if provided
      let dateFilter = ''
      if (startDate && endDate) {
        try {
          const start = new Date(startDate).toISOString()
          const end = new Date(endDate).toISOString()
          dateFilter = `&start_date=gte.${start}&start_date=lte.${end}`
        } catch (dateError) {
          console.warn('Invalid date range provided, loading all requests:', dateError)
          // Fallback to loading all requests if date parsing fails
        }
      }
      
      // Only select essential columns for calendar display
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?select=id,title,event_name,start_date,end_date,request_stage,status,is_private,requester_name,requester_email,exact_start_datetime,exact_end_datetime,additional_notes&order=start_date.asc${dateFilter}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HTTP API getCalendarRequests error:', error)
      throw error
    }
  }
}

// Profiles API
export const profilesAPI = {
  async getById(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('HTTP API getProfileById error:', error)
      throw error
    }
  },

  async create(data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        return result
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('HTTP API createProfile error:', error)
      throw error
    }
  },

  async update(id, data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json()
        return result
      } else {
        return { success: true }
      }
    } catch (error) {
      console.error('HTTP API updateProfile error:', error)
      throw error
    }
  },

  async getAll() {
    try {
      console.log('👥 Profiles API: Starting getAll()...')
      
      // Use simple headers for faster loading
      const simpleHeaders = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,role,created_at&order=created_at.desc`, {
          method: 'GET',
          headers: simpleHeaders,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log('👥 Profiles API: Loaded', result.length, 'users')
        return result
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - Profiles API call took too long')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('👥 Profiles API: Error:', error)
      throw error
    }
  },

  async getAllDirect() {
    try {
      console.log('👥 Profiles API: Trying direct Supabase call...')
      
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,role,created_at')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('👥 Profiles API: Direct call error:', error)
        throw error
      }
      
      console.log('👥 Profiles API: Direct call success:', data?.length || 0, 'users')
      return data || []
    } catch (error) {
      console.error('👥 Profiles API: Direct call failed:', error)
      throw error
    }
  },

  async getAllSimple() {
    try {
      console.log('👥 Profiles API: Trying ultra-simple call...')
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,role,created_at&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('👥 Profiles API: Ultra-simple call success:', data?.length || 0, 'users')
      return data || []
    } catch (error) {
      console.error('👥 Profiles API: Ultra-simple call failed:', error)
      throw error
    }
  },

  async updateUserRole(id, role) {
    try {
      console.log('👥 Profiles API: Updating role for user', id, 'to', role)
      
      // Use simple headers for faster updates
      const simpleHeaders = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
          method: 'PATCH',
          headers: simpleHeaders,
          body: JSON.stringify({ role }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        console.log('👥 Profiles API: Role updated successfully')
        return { success: true }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - Role update took too long')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('👥 Profiles API: updateUserRole error:', error)
      throw error
    }
  },

  async createUser(userData) {
    try {
      // Use Supabase admin API to create user with auto-confirmation
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email for admin-created users
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role || 'member'
          }
        })
      })

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        throw new Error(`User creation failed: ${errorText}`)
      }

      const authUser = await authResponse.json()

      // Check if profile already exists (might be created by trigger)
      const headers = await getHeaders()
      const existingProfileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.user.id}&select=*`, {
        method: 'GET',
        headers
      })

      if (existingProfileResponse.ok) {
        const existingProfile = await existingProfileResponse.json()
        
        if (existingProfile && existingProfile.length > 0) {
          // Profile already exists, update it with the provided data
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.user.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role || 'member'
            })
          })

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text()
            throw new Error(`Profile update failed: ${errorText}`)
          }
        } else {
          // Profile doesn't exist, create it
          const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id: authUser.user.id,
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role || 'member'
            })
          })

          if (!profileResponse.ok) {
            const errorText = await profileResponse.text()
            throw new Error(`Profile creation failed: ${errorText}`)
          }
        }
      } else {
        // If we can't check, try to create the profile
        const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: authUser.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role || 'member'
          })
        })

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text()
          // If it's a duplicate key error, the profile might already exist
          if (errorText.includes('duplicate key value violates unique constraint')) {
            console.log('Profile already exists, continuing...')
          } else {
            throw new Error(`Profile creation failed: ${errorText}`)
          }
        }
      }

      return { 
        success: true, 
        user: authUser.user
      }
    } catch (error) {
      console.error('HTTP API createUser error:', error)
      throw error
    }
  }
}

// Storage API for file uploads
export const storageAPI = {
  async uploadSignedContract(file, requestId) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Generate unique filename
      const timestamp = Date.now()
      const fileName = `contract_${requestId}_${timestamp}.pdf`
      
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/signed-contracts/${fileName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: file
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        console.error('Storage upload failed:', errorData);
        throw new Error(`Storage Upload fehlgeschlagen: ${errorData.message || errorText}`)
      }

      // IMPORTANT: For private buckets, use authenticated URL
      const authenticatedURL = `${SUPABASE_URL}/storage/v1/object/authenticated/signed-contracts/${fileName}`
      return { success: true, url: authenticatedURL, fileName }
    } catch (error) {
      console.error('HTTP API uploadSignedContract error:', error)
      throw error
    }
  },

  async deleteFile(fileName) {
    try {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/signed-contracts/${fileName}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Delete failed: ${errorText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API deleteFile error:', error)
      throw error
    }
  }
}

// Temporarily Blocked Dates API
export const blockedDatesAPI = {
  async getTemporarilyBlocked() {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/temporarily_blocked_dates?select=*`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('HTTP API getTemporarilyBlocked error:', error)
      throw error
    }
  },

  async createTemporaryBlock(data) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/temporarily_blocked_dates`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('HTTP API createTemporaryBlock error:', error)
      throw error
    }
  },

  async deleteTemporaryBlock(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/temporarily_blocked_dates?id=eq.${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API deleteTemporaryBlock error:', error)
      throw error
    }
  }
}

// Profile API alias for easier access
export const profileAPI = {
  getProfile: profilesAPI.getById
};

// DSGVO Compliance API
export const dsgvoAPI = {
  // Get user data export (Article 15 - Right to Access)
  async getUserDataExport(userId) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_data_export`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id_param: userId })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('DSGVO getUserDataExport error:', error)
      throw error
    }
  },

  // Delete user data (Article 17 - Right to Erasure)
  async deleteUserData(userId) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_user_data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id_param: userId })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('DSGVO deleteUserData error:', error)
      throw error
    }
  },

  // Update user data (Article 16 - Right to Rectification)
  async updateUserData(userId, newEmail = null, newFullName = null) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_user_data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          user_id_param: userId,
          new_email: newEmail,
          new_full_name: newFullName
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('DSGVO updateUserData error:', error)
      throw error
    }
  },

  // Record consent
  async recordConsent(userId, consentType, granted, consentText, expiresAt = null) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_consent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id_param: userId,
          consent_type_param: consentType,
          granted_param: granted,
          consent_text_param: consentText,
          expires_at_param: expiresAt
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('DSGVO recordConsent error:', error)
      throw error
    }
  },

  // Withdraw consent
  async withdrawConsent(consentId) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/withdraw_consent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ consent_id_param: consentId })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('DSGVO withdrawConsent error:', error)
      throw error
    }
  }
}

// Security API
export const securityAPI = {
  // Validate email
  async validateEmail(email) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email_input: email })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Security validateEmail error:', error)
      // Fallback to client-side validation
      return validateEmail(email)
    }
  },

  // Validate phone
  async validatePhone(phone) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_phone`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone_input: phone })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Security validatePhone error:', error)
      // Fallback to client-side validation
      return validatePhone(phone)
    }
  },

  // Sanitize text
  async sanitizeText(text) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sanitize_text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ input_text: text })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Security sanitizeText error:', error)
      // Fallback to client-side sanitization
      return sanitizeText(text)
    }
  },

  // Check rate limit
  async checkRateLimit(identifier, endpoint, maxRequests = 100, windowMinutes = 60) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_rate_limit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          identifier_param: identifier,
          endpoint_param: endpoint,
          max_requests: maxRequests,
          window_minutes: windowMinutes
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Security checkRateLimit error:', error)
      return true // Allow request if rate limiting fails
    }
  },

  // Log suspicious activity
  async logSuspiciousActivity(activityType, description, severity = 'low', userId = null, ipAddress = null) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/log_suspicious_activity`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          activity_type: activityType,
          description: description,
          severity: severity,
          user_id_param: userId,
          ip_address_param: ipAddress
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Security logSuspiciousActivity error:', error)
      return null
    }
  }
}

// Default export for backward compatibility
const httpAPI = {
  events: eventsAPI,
  eventRequests: eventRequestsAPI,
  profiles: profilesAPI,
  storage: storageAPI,
  blockedDates: blockedDatesAPI,
  dsgvo: dsgvoAPI,
  security: securityAPI
}

export default httpAPI