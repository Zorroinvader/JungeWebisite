// FILE OVERVIEW
// - Purpose: Main database API service that provides all database operations (events, event requests, profiles, storage, blocked dates, DSGVO, security). Includes compatibility wrappers for legacy code.
// - Used by: Most components and pages (AdminPanelClean, EventRequestManagement, PublicEventRequestForm, ProfilePage, etc.) as the primary data access layer.
// - Notes: Production service file. Includes security validation, rate limiting, SQL injection detection, and 3-step event request workflow. This is the main database API. Also exports compatibility wrappers (eventAPI, eventRequestAPI, profileAPI) for legacy code that expects {data, error} format.

// PRIMARY CONNECTION METHOD: Supabase JavaScript Client (as per Supabase documentation)
// FALLBACK METHOD: HTTP REST API calls (only used when Supabase client fails)
// This ensures a singular way of connecting to Supabase backend as intended by Supabase documentation

import { supabase } from '../lib/supabase'
import { sendUserNotification, sendAdminNotification } from '../utils/settingsHelper'
import { getSupabaseUrl, getSupabaseAnonKey, sanitizeError, secureLog } from '../utils/secureConfig'

// SECURITY: Use secure getters to prevent key exposure
const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_KEY = getSupabaseAnonKey()

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
  // eslint-disable-next-line no-control-regex
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

// Keys are validated by secureConfig getters above
// No need for additional validation here

// ============================================================================
// FALLBACK HELPER: HTTP REST API (only used when Supabase client fails)
// ============================================================================
// This is a FALLBACK method - clearly marked and only used when primary Supabase client fails
// The primary method should always be the Supabase JavaScript client

const getHeaders = async (userEmail = null) => {
  try {
    // Try to get session token from localStorage first (faster, avoids hanging getSession call)
    // Supabase stores session in localStorage under 'sb-<project-ref>-auth-token'
    let userToken = SUPABASE_KEY
    let session = null
    
    // Try to get session from localStorage to avoid hanging getSession() call
    try {
      const storageKey = Object.keys(localStorage).find(key => key.includes('auth-token'))
      if (storageKey) {
        const storedSession = localStorage.getItem(storageKey)
        if (storedSession) {
          const parsed = JSON.parse(storedSession)
          session = parsed
          userToken = parsed?.access_token || SUPABASE_KEY
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Only call getSession if we don't have a token
    if (!session || !userToken || userToken === SUPABASE_KEY) {
      try {
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sitzungs-Timeout')), 2000)
        )
        const { data: { session: fetchedSession } } = await Promise.race([sessionPromise, timeoutPromise])
        if (fetchedSession?.access_token) {
          userToken = fetchedSession.access_token
          session = fetchedSession
        }
      } catch (error) {
        // Use anon key if getSession fails or times out
        secureLog('warn', '[getHeaders] getSession failed or timed out, using anon key', { error: sanitizeError(error) })
      }
    }
    
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      'X-User-Email': userEmail || '',
      'X-Session-ID': sessionStorage.getItem('sessionId') || ''
    }
    
    return headers
  } catch (error) {
    // Fallback to anon key if session check fails (for anonymous users)
    // SECURITY: Never log the actual key, only log the error message (sanitized)
    secureLog('warn', '[FALLBACK] Failed to get session, using anon key', { error: sanitizeError(error) })
    return {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      'X-User-Email': userEmail || '',
      'X-Session-ID': sessionStorage.getItem('sessionId') || ''
    }
  }
}

// ============================================================================
// PRIMARY/FALLBACK PATTERN HELPER
// ============================================================================
// This helper ensures we try Supabase client first (primary), then HTTP fetch (fallback)
// Only use HTTP fetch when Supabase client explicitly fails

const executeWithFallback = async (primaryOperation, fallbackOperation, operationName = 'operation') => {
  try {
    // PRIMARY: Try primary operation first
    // For events.getAll, primary is now HTTP (fast), fallback is Supabase client
    // Add timeout for operations that might hang
    let result;
    // Add timeout for operations that might hang (Supabase client operations)
    const operationsWithTimeout = [
      'eventRequests.getAdminPanelData', 
      'events.getAll',
      'events.delete',
      'eventRequests.delete',
      'eventRequests.getAll',
      'profiles.getById',
      'profiles.getAll',
      'eventRequests.getByUser'
    ];
    
    if (operationsWithTimeout.includes(operationName)) {
      // Set timeout based on operation
      let timeout = 5000; // default 5s
      if (operationName === 'profiles.getById' || 
          operationName === 'profiles.getAll' ||
          operationName === 'eventRequests.getByUser' ||
          operationName === 'eventRequests.getAll' ||
          operationName === 'eventRequests.getAdminPanelData') {
        timeout = 3000; // 3s for faster operations
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Vorgangs-Timeout nach ${timeout}ms`)), timeout)
      );
      result = await Promise.race([primaryOperation(), timeoutPromise]);
    } else {
      result = await primaryOperation();
    }
    
    // Supabase client returns { data, error } format
    if (result && result.error) {
      throw result.error
    }
    
    // Return data (could be array, object, or null)
    // If result has a data property, return it; otherwise return the result itself
    // EXCEPTION: For delete operations, return the full result object to preserve success indicators
    let returnValue = result
    
    // For delete operations, always return the full result to preserve success, deletedCount, etc.
    if (operationName.includes('.delete')) {
      return result
    }
    
    // For profiles.getById, return the result directly (already extracted by the API)
    if (operationName === 'profiles.getById') {
      // profilesAPI.getById already returns the profile object or null
      // Don't extract .data again
      return result
    }
    
    if (result && typeof result === 'object') {
      if (result.data !== undefined) {
        returnValue = result.data
      }
    }
    
    // For operations that should return arrays, ensure we return an array
    const arrayOperations = [
      'eventRequests.getAdminPanelData', 
      'events.getAll', 
      'eventRequests.getByUser',
      'eventRequests.getAll',
      'profiles.getAll'
    ];
    
    if (arrayOperations.includes(operationName)) {
      if (!Array.isArray(returnValue)) {
        // If it's null/undefined, return empty array
        if (returnValue == null) {
          returnValue = []
        } else {
          // Try to extract data if it's an object
          returnValue = Array.isArray(returnValue) ? returnValue : []
        }
      }
    }
    
    return returnValue
  } catch (primaryError) {
    // FALLBACK: Try fallback operation when primary fails
    // SECURITY: Sanitize error messages to prevent key exposure
    secureLog('warn', `[FALLBACK] Primary operation failed for ${operationName}, trying fallback`, { error: sanitizeError(primaryError) })
    
    try {
      const fallbackResult = await fallbackOperation()
      secureLog('info', `[FALLBACK] Fallback operation succeeded for ${operationName}`)
      return fallbackResult
    } catch (fallbackError) {
      // SECURITY: Sanitize error before throwing
      const sanitizedError = new Error(sanitizeError(fallbackError))
      secureLog('error', `[FALLBACK] Fallback operation also failed for ${operationName}`, { error: sanitizeError(fallbackError) })
      throw sanitizedError
    }
  }
}

// Events API
export const eventsAPI = {
  // PRIMARY: HTTP REST API (fast and reliable), FALLBACK: Supabase client
  // User requested to use HTTP fallback primarily since it works fast
  async getAll() {
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, reliable, user confirmed it works)
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        try {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/events?select=id,title,description,start_date,end_date,created_by,is_private,status,requested_by,event_type,requester_name,schluesselannahme_time,schluesselabgabe_time,additional_notes,uploaded_mietvertrag_url&order=start_date.asc`,
            {
              method: 'GET',
              headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              signal: controller.signal
            }
          )
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }
          
          const data = await response.json()
          // Ensure we return an array
          return Array.isArray(data) ? data : []
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Anfrage-Timeout - API-Aufruf dauerte zu lange')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only used when HTTP fails)
      async () => {
        const result = await supabase
          .from('events')
          .select('id,title,description,start_date,end_date,created_by,is_private,status,requested_by,event_type,requester_name,schluesselannahme_time,schluesselabgabe_time,additional_notes,uploaded_mietvertrag_url')
          .order('start_date', { ascending: true })
        
        if (result.error) {
          throw result.error
        }
        
        // Return the data array, not the { data, error } object
        const data = result.data || []
        
        // Ensure we always return an array
        return Array.isArray(data) ? data : []
      },
      'events.getAll'
    ).then(result => {
      // Ensure we always return an array, even if executeWithFallback returns something else
      if (Array.isArray(result)) {
        return result
      }
      if (result && typeof result === 'object' && Array.isArray(result.data)) {
        return result.data
      }
      return []
    })
  },

  async getById(id) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single()
      },
      // FALLBACK: HTTP REST API
      async () => {
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
      },
      'events.getById'
    )
  },

  async create(data) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('events')
          .insert(data)
          .select()
      },
      // FALLBACK: HTTP REST API
      async () => {
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
          return await response.json()
        } else {
          return { success: true }
        }
      },
      'events.create'
    )
  },

  async update(id, data) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('events')
          .update(data)
          .eq('id', id)
          .select()
      },
      // FALLBACK: HTTP REST API
      async () => {
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
          return await response.json()
        } else {
          return { success: true }
        }
      },
      'events.update'
    )
  },

  async delete(id) {
    if (!id) {
      throw new Error('Veranstaltungs-ID ist erforderlich')
    }
    
    secureLog('log', '[eventsAPI.delete] Starting delete', { eventId: id })
    
    // PRIMARY: HTTP REST API (fast and reliable, avoids Supabase client hanging)
    // FALLBACK: Supabase client (only if HTTP fails)
    const result = await executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids hanging)
      async () => {
        secureLog('log', '[eventsAPI.delete] Using HTTP REST API (primary)')
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
              ...headers,
              'Prefer': 'return=representation' // Return deleted rows
            },
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          secureLog('log', '[eventsAPI.delete] HTTP response', { status: response.status })

          if (!response.ok) {
            const errorText = await response.text()
            secureLog('error', '[eventsAPI.delete] HTTP error', { status: response.status, error: sanitizeError(errorText) })
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
          }

          const data = await response.json()
          const responseData = { 
            success: true, 
            data: Array.isArray(data) ? data : [],
            deletedCount: Array.isArray(data) ? data.length : 0
          }
          secureLog('log', '[eventsAPI.delete] HTTP success', { deletedCount: responseData.deletedCount })
          return responseData
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Lösch-Anfrage-Timeout')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        secureLog('log', '[eventsAPI.delete] Using Supabase client (fallback)')
        const result = await supabase
          .from('events')
          .delete()
          .eq('id', id)
          .select()
        
        // Check for errors
        if (result.error) {
          secureLog('error', '[eventsAPI.delete] Supabase error', { error: sanitizeError(result.error) })
          throw new Error(result.error.message || 'Fehler beim Löschen der Veranstaltung')
        }
        
        // Return success indicator
        // Supabase delete returns { data: [...deleted rows], error: null }
        const response = {
          success: true,
          data: result.data,
          deletedCount: result.data ? result.data.length : 0
        }
        secureLog('log', '[eventsAPI.delete] Supabase success', { deletedCount: response.deletedCount })
        return response
      },
      'events.delete'
    )
    
    return result
  },

  // Optimized method for calendar display - only essential columns
  async getCalendarEvents(startDate = null, endDate = null) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        let query = supabase
          .from('events')
          .select('id,title,start_date,end_date,is_private,event_type,requester_name,schluesselannahme_time,schluesselabgabe_time,additional_notes,uploaded_mietvertrag_url')
          .order('start_date', { ascending: true })
        
        if (startDate && endDate) {
          query = query
            .gte('start_date', startDate)
            .lte('start_date', endDate)
        }
        
        return await query
      },
      // FALLBACK: HTTP REST API
      async () => {
        const headers = await getHeaders()
        
        // Build date filter if provided
        let dateFilter = ''
        if (startDate && endDate) {
          try {
            const start = new Date(startDate).toISOString()
            const end = new Date(endDate).toISOString()
            dateFilter = `&start_date=gte.${start}&start_date=lte.${end}`
          } catch (dateError) {
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

        return await response.json()
      },
      'events.getCalendarEvents'
    )
  }
}

// Event Requests API - 3-Step Workflow
export const eventRequestsAPI = {
  // PRIMARY: Uses Supabase client, FALLBACK: HTTP REST API (only when client fails)
  async getAll() {
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids Supabase client hanging)
      async () => {
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?select=id,title,event_name,requester_name,requester_email,start_date,end_date,requested_days,request_stage,status,is_private,event_type,created_at,initial_accepted_at,details_submitted_at,final_accepted_at,rejected_at,admin_notes,rejection_reason&order=created_at.desc`, {
            method: 'GET',
            headers,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const data = await response.json()
          return Array.isArray(data) ? data : []
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Lade-Timeout für Veranstaltungs-Anfragen')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        const result = await supabase
          .from('event_requests')
          .select('id,title,event_name,requester_name,requester_email,start_date,end_date,requested_days,request_stage,status,is_private,event_type,created_at,initial_accepted_at,details_submitted_at,final_accepted_at,rejected_at,admin_notes,rejection_reason')
          .order('created_at', { ascending: false })
        
        if (result.error) {
          throw result.error
        }
        
        return Array.isArray(result.data) ? result.data : []
      },
      'eventRequests.getAll'
    )
  },

  // Get admin panel data - Ultra-optimized for fast loading
  async getAdminPanelData(limit = 50, offset = 0) {
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids Supabase client hanging)
      async () => {
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const url = `${SUPABASE_URL}/rest/v1/event_requests?select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,exact_start_datetime,exact_end_datetime,key_handover_datetime,key_return_datetime,schluesselannahme_time,schluesselabgabe_time,event_type,additional_notes,admin_notes&order=created_at.desc&limit=${limit}&offset=${offset}`
          
          const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const result = await response.json()
          return Array.isArray(result) ? result : []
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Lade-Timeout für Admin-Panel-Daten')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        const queryResult = await supabase
          .from('event_requests')
          .select('id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,exact_start_datetime,exact_end_datetime,key_handover_datetime,key_return_datetime,schluesselannahme_time,schluesselabgabe_time,event_type,additional_notes,admin_notes')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        if (queryResult.error) {
          throw queryResult.error
        }
        
        return Array.isArray(queryResult.data) ? queryResult.data : []
      },
      'eventRequests.getAdminPanelData'
    )
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
      throw error
    }
  },

  // Get request by email (for non-logged-in users)
  async getByEmail(email) {
    if (!email || !email.trim()) {
      throw new Error('E-Mail-Adresse ist erforderlich')
    }
    
    const trimmedEmail = email.trim()
    
    return executeWithFallback(
      // PRIMARY: Use Supabase client (respects RLS properly)
      async () => {
        return await supabase
          .from('event_requests')
          .select('id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,exact_start_datetime,exact_end_datetime,key_handover_datetime,key_return_datetime,schluesselannahme_time,schluesselabgabe_time,additional_notes,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,event_type,admin_notes,rejection_reason')
          .ilike('requester_email', trimmedEmail)
          .order('created_at', { ascending: false })
      },
      // FALLBACK: HTTP REST API
      async () => {
        const headers = await getHeaders(trimmedEmail)
        
        // Use ilike for case-insensitive match
        const encoded = encodeURIComponent(trimmedEmail)
        const url = `${SUPABASE_URL}/rest/v1/event_requests?requester_email=ilike.${encoded}&select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,exact_start_datetime,exact_end_datetime,key_handover_datetime,key_return_datetime,schluesselannahme_time,schluesselabgabe_time,additional_notes,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,event_type,admin_notes,rejection_reason&order=created_at.desc`
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        return data || []
      },
      'eventRequests.getByEmail'
    )
  },

  async getByUser(userId) {
    if (!userId) return []
    
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids Supabase client hanging)
      async () => {
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?requested_by=eq.${userId}&select=id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,exact_start_datetime,exact_end_datetime,key_handover_datetime,key_return_datetime,schluesselannahme_time,schluesselabgabe_time,additional_notes,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,event_type,admin_notes,rejection_reason&order=created_at.desc`, {
            method: 'GET',
            headers,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          return Array.isArray(data) ? data : []
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Lade-Timeout für Veranstaltungs-Anfragen')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        const result = await supabase
          .from('event_requests')
          .select('id,title,event_name,requester_name,requester_email,start_date,end_date,request_stage,status,created_at,details_submitted_at,initial_accepted_at,final_accepted_at,exact_start_datetime,exact_end_datetime,key_handover_datetime,key_return_datetime,schluesselannahme_time,schluesselabgabe_time,additional_notes,signed_contract_url,uploaded_file_data,uploaded_file_name,uploaded_file_size,uploaded_file_type,event_type,admin_notes,rejection_reason')
          .eq('requested_by', userId)
          .order('created_at', { ascending: false })
        
        if (result.error) {
          throw result.error
        }
        
        return Array.isArray(result.data) ? result.data : []
      },
      'eventRequests.getByUser'
    )
  },

  async getById(id) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('event_requests')
          .select('*')
          .eq('id', id)
          .single()
      },
      // FALLBACK: HTTP REST API
      async () => {
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
      },
      'eventRequests.getById'
    )
  },

  // STEP 1: Create initial event request (no login required)
  async createInitialRequest(data) {
    try {
      // Security validation (blocking)
      if (!validateEmail(data.requester_email)) {
        throw new Error('Ungültiges E-Mail-Format')
      }
      
      if (data.requester_phone && !validatePhone(data.requester_phone)) {
        throw new Error('Ungültiges Telefonnummern-Format')
      }

      // Sanitize text inputs
      const sanitizedData = {
        requester_name: sanitizeText(data.requester_name),
        initial_notes: sanitizeText(data.initial_notes || data.description || ''),
        event_name: sanitizeText(data.event_name || data.title)
      }

      // Check for SQL injection (blocking)
      const textFields = [sanitizedData.requester_name, sanitizedData.initial_notes, sanitizedData.event_name]
      for (const field of textFields) {
        if (detectSQLInjection(field)) {
          // Log but don't await (non-blocking)
          securityAPI.logSuspiciousActivity('sql_injection_attempt', `SQL injection detected in event request: ${field}`, 'high').catch(() => {})
          throw new Error('Ungültige Eingabe erkannt')
        }
      }

      // Rate limiting check (non-blocking - allow if check fails)
      let rateLimitOk = true
      try {
        rateLimitOk = await securityAPI.checkRateLimit(data.requester_email, 'event_request_create', 5, 60)
      } catch (rateLimitError) {
        secureLog('warn', 'Rate limit check failed, allowing request', sanitizeError(rateLimitError))
        rateLimitOk = true // Allow request if rate limiting check fails
      }
      
      if (!rateLimitOk) {
        throw new Error('Zu viele Anfragen. Bitte versuchen Sie es später erneut.')
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
        request_stage: 'initial',
        // Include user ID if available
        requested_by: data.requested_by || null,
        created_by: data.created_by || null
      }

      // Get headers - use anon key if no session (for anonymous users)
      let headers
      try {
        headers = await getHeaders(data.requester_email)
      } catch (headerError) {
        secureLog('warn', 'Failed to get auth headers, using anon key', sanitizeError(headerError))
        // Fallback to anon key for anonymous users
        headers = {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          'X-User-Email': data.requester_email || ''
        }
      }

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
        secureLog('error', 'Event request creation failed', {
          status: response.status,
          statusText: response.statusText,
          error: sanitizeError(errorText)
        })
        throw new Error(`HTTP ${response.status}: ${sanitizeError(errorText)}`)
      }

      const result = await response.json()
      const created = Array.isArray(result) ? result[0] : result
      
      if (!created || !created.id) {
        throw new Error('Veranstaltungs-Anfrage wurde erstellt, aber keine ID zurückgegeben')
      }
      
      // Log successful creation (non-blocking)
      securityAPI.logSuspiciousActivity('event_request_created', `Event request created for ${data.requester_email}`, 'low', null, null).catch(() => {})
      
      // Send emails (non-blocking)
      try {
        // Send confirmation email to user with proper event data
        sendUserNotification(data.requester_email, {
          ...created,
          requester_email: data.requester_email,
          requester_name: data.requester_name,
          title: created.title || created.event_name,
          event_name: created.event_name || created.title,
          start_date: created.start_date,
          end_date: created.end_date,
          event_type: created.event_type
        }, 'initial_request_received').catch(() => {})
        // Send notification email to admins
        sendAdminNotification({
          ...created,
          title: created.title || created.event_name,
          event_name: created.event_name || created.title,
          requester_name: created.requester_name,
          requester_email: created.requester_email,
          start_date: created.start_date,
          end_date: created.end_date,
          event_type: created.event_type
        }, 'initial_request').catch(() => {})
      } catch (emailError) {
        secureLog('warn', 'Email sending failed (non-critical)', sanitizeError(emailError))
      }
      
      return created
    } catch (error) {
      secureLog('error', 'createInitialRequest error', sanitizeError(error))
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
        throw new Error(`Fehler beim Abrufen der Anfrage-Details`)
      }
      
      const requests = await getRequestResponse.json()
      const request = requests[0]
      
      if (!request) {
        throw new Error('Anfrage nicht gefunden')
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

      // Create temporary blocker for the dates - BLOCKS TIME SLOT FROM INITIAL ACCEPTANCE
      // This ensures no other requests can be accepted for the same time slot
      try {
        const blockData = {
          request_id: id,
          event_name: request.title || request.event_name,
          requester_name: request.requester_name,
          requester_email: request.requester_email,
          start_date: request.start_date,
          end_date: request.end_date,
          // Use exact datetimes if available, otherwise use start_date/end_date
          exact_start_datetime: request.exact_start_datetime || request.start_date,
          exact_end_datetime: request.exact_end_datetime || request.end_date,
          request_stage: 'initial_accepted',
          is_temporary: true
        }
        
        await blockedDatesAPI.createTemporaryBlock(blockData)
        secureLog('info', 'Temporary block created for initial accepted request', { requestId: id, start_date: blockData.start_date, end_date: blockData.end_date })
      } catch (blockError) {
        // Don't fail the whole operation if blocker creation fails, but log it
        secureLog('warn', 'Failed to create temporary block', { requestId: id, error: sanitizeError(blockError) })
      }

      // Send email to user with proper event data including requester_email for link generation
      try {
        await sendUserNotification(request.requester_email, {
          ...request,
          requester_email: request.requester_email,
          requester_name: request.requester_name,
          title: request.title || request.event_name,
          event_name: request.event_name || request.title,
          start_date: request.start_date,
          end_date: request.end_date,
          event_type: request.event_type
        }, 'initial_request_accepted')
        // Do not notify admins yet; wait until the user submits detailed info
      } catch (emailError) {
        // Don't fail if email notification fails
        secureLog('warn', 'Email notification failed (non-critical)', sanitizeError(emailError))
      }
      
      return { success: true }
    } catch (error) {
      throw error
    }
  },

  // STEP 3: Admin accepts final request (after user submits details)
  async finalAcceptRequest(id) {
    // First, get the request details using Supabase client
    const requestResult = await executeWithFallback(
      async () => {
        const result = await supabase
          .from('event_requests')
          .select('*')
          .eq('id', id)
          .single()
        
        if (result.error) throw result.error
        return result.data
      },
      async () => {
        const headers = await getHeaders()
        const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
          method: 'GET',
          headers
        })
        
        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen der Anfrage-Details`)
        }
        
        const requests = await response.json()
        return requests[0]
      },
      'eventRequests.finalAcceptRequest.getRequest'
    )
    
    if (!requestResult) {
      throw new Error('Anfrage nicht gefunden')
    }
    
    const request = requestResult
    
    // Update request status to final_accepted using Supabase client
    await executeWithFallback(
      async () => {
        const result = await supabase
          .from('event_requests')
          .update({
            request_stage: 'final_accepted',
            status: 'approved',
            final_accepted_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (result.error) throw result.error
        return result.data
      },
      async () => {
        const headers = await getHeaders()
        const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            request_stage: 'final_accepted',
            status: 'approved',
            final_accepted_at: new Date().toISOString()
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Fehler beim Aktualisieren der Anfrage: ${errorText}`)
        }
        
        const result = await response.json()
        return Array.isArray(result) ? result[0] : result
      },
      'eventRequests.finalAcceptRequest.updateRequest'
    )

    // Create the event in the events table using Supabase client
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
    
    const createdEvent = await executeWithFallback(
      async () => {
        const result = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single()
        
        if (result.error) throw result.error
        return result.data
      },
      async () => {
        const headers = await getHeaders()
        const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(eventData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Fehler beim Erstellen der Veranstaltung: ${errorText}`)
        }
        
        const result = await response.json()
        return Array.isArray(result) ? result[0] : result
      },
      'eventRequests.finalAcceptRequest.createEvent'
    )
      
      // Send notifications
      try {
        // Notify user of final approval with proper event data
        await sendUserNotification(request.requester_email, {
          ...request,
          requester_email: request.requester_email,
          requester_name: request.requester_name,
          title: request.title || request.event_name,
          event_name: request.event_name || request.title,
          start_date: request.start_date,
          end_date: request.end_date,
          start_datetime: request.exact_start_datetime,
          end_datetime: request.exact_end_datetime,
          event_type: request.event_type
        }, 'final_approval')
        // Notify admins of final acceptance
        await sendAdminNotification({
          ...request,
          title: request.title || request.event_name,
          event_name: request.event_name || request.title,
          requester_name: request.requester_name,
          requester_email: request.requester_email,
          start_datetime: request.exact_start_datetime,
          end_datetime: request.exact_end_datetime,
          event_type: request.event_type
        }, 'final_acceptance')
      } catch (emailError) {
        // Don't fail if notifications fail
        secureLog('warn', 'Email notification failed (non-critical)', sanitizeError(emailError))
      }
      
      // Delete the temporary blocker since event is now created
      try {
        // Find and delete the temporary blocker for this request
        const blockers = await blockedDatesAPI.getTemporarilyBlocked()
        const blocker = blockers.find(b => b.request_id === id)
        
        if (blocker) {
          await blockedDatesAPI.deleteTemporaryBlock(blocker.id)
        }
      } catch (blockError) {
        // Don't fail the whole operation if blocker deletion fails
        secureLog('warn', 'Failed to delete temporary block', sanitizeError(blockError))
      }
      
      return { success: true, event: createdEvent }
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
      throw error
    }
  },

  async delete(id) {
    if (!id) {
      throw new Error('Anfrage-ID ist erforderlich')
    }
    
    secureLog('log', '[eventRequestsAPI.delete] Starting delete', { requestId: id })
    
    // PRIMARY: HTTP REST API (fast and reliable, avoids Supabase client hanging)
    // FALLBACK: Supabase client (only if HTTP fails)
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids hanging)
      async () => {
        secureLog('log', '[eventRequestsAPI.delete] Using HTTP REST API (primary)')
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
              ...headers,
              'Prefer': 'return=representation'
            },
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          secureLog('log', '[eventRequestsAPI.delete] HTTP response', { status: response.status })

          if (!response.ok) {
            const errorText = await response.text()
            secureLog('error', '[eventRequestsAPI.delete] HTTP error', { status: response.status, error: sanitizeError(errorText) })
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
          }

          const data = await response.json()
          const responseData = { 
            success: true, 
            data: Array.isArray(data) ? data : [],
            deletedCount: Array.isArray(data) ? data.length : 0
          }
          secureLog('log', '[eventRequestsAPI.delete] HTTP success', { deletedCount: responseData.deletedCount })
          return responseData
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Lösch-Anfrage-Timeout')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        secureLog('log', '[eventRequestsAPI.delete] Using Supabase client (fallback)')
        const result = await supabase
          .from('event_requests')
          .delete()
          .eq('id', id)
          .select()
        
        if (result.error) {
          secureLog('error', '[eventRequestsAPI.delete] Supabase error', { error: sanitizeError(result.error) })
          throw new Error(result.error.message || 'Fehler beim Löschen der Veranstaltungs-Anfrage')
        }
        
        const response = {
          success: true,
          data: result.data,
          deletedCount: result.data ? result.data.length : 0
        }
        secureLog('log', '[eventRequestsAPI.delete] Supabase success', { deletedCount: response.deletedCount })
        return response
      },
      'eventRequests.delete'
    )
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
      throw error
    }
  },

  // Cancel/delete a request (user can cancel their own requests)
  async cancelRequest(id) {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return Array.isArray(result) ? result[0] : result
    } catch (error) {
      throw error
    }
  },

  // Submit detailed request information (STEP 2: User submits details after initial acceptance)
  async submitDetailedRequest(id, detailedData) {
    // Prepare update data
    const updateData = {
      request_stage: 'details_submitted',
      details_submitted_at: new Date().toISOString(),
      exact_start_datetime: detailedData.exact_start_datetime || null,
      exact_end_datetime: detailedData.exact_end_datetime || null,
      location: detailedData.location || null,
      max_participants: detailedData.max_participants || null,
      additional_notes: detailedData.additional_notes || null,
      schluesselannahme_time: detailedData.schluesselannahme_time || null,
      schluesselabgabe_time: detailedData.schluesselabgabe_time || null,
      key_handover_datetime: detailedData.key_handover_datetime || null,
      key_return_datetime: detailedData.key_return_datetime || null,
      signed_contract_url: detailedData.signed_contract_url || null,
      uploaded_file_name: detailedData.uploaded_file_name || null,
      uploaded_file_size: detailedData.uploaded_file_size || null,
      uploaded_file_type: detailedData.uploaded_file_type || null,
      uploaded_file_data: detailedData.uploaded_file_data || null
    }

    return executeWithFallback(
      // PRIMARY: Use Supabase client
      async () => {
        const result = await supabase
          .from('event_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
        
        if (result.error) {
          throw result.error
        }
        
        return result.data
      },
      // FALLBACK: HTTP REST API
      async () => {
        const headers = await getHeaders()
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        const updated = Array.isArray(result) ? result[0] : result
        return updated
      },
      'eventRequests.submitDetailedRequest'
    ).then(async (updated) => {
      // Send notification to admins (non-blocking) with proper event data
      try {
        await sendAdminNotification({
          ...updated,
          title: updated.title || updated.event_name,
          event_name: updated.event_name || updated.title,
          requester_name: updated.requester_name,
          requester_email: updated.requester_email,
          start_datetime: updated.exact_start_datetime,
          end_datetime: updated.exact_end_datetime,
          event_type: updated.event_type
        }, 'detailed_info_submitted')
      } catch (emailError) {
        secureLog('warn', 'Email notification failed (non-critical)', sanitizeError(emailError))
      }
      
      return updated
    }).catch((error) => {
      secureLog('error', 'submitDetailedRequest error', sanitizeError(error))
      throw error
    })
  },

  // Reject a request (admin action)
  async rejectRequest(id, rejectionReason = '') {
    try {
      const headers = await getHeaders()
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          request_stage: 'rejected',
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      const rejected = Array.isArray(result) ? result[0] : result
      
      // Send notification to user (non-blocking)
      try {
        await sendUserNotification(rejected.requester_email, rejected, 'request_rejected')
      } catch (emailError) {
        secureLog('warn', 'Email notification failed (non-critical)', sanitizeError(emailError))
      }
      
      return rejected
    } catch (error) {
      secureLog('error', 'rejectRequest error', sanitizeError(error))
      throw error
    }
  }
}

// Profiles API
export const profilesAPI = {
  async getById(id) {
    if (!id) return null
    
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids Supabase client hanging)
      async () => {
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
            method: 'GET',
            headers,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          return data[0] || null
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Profile load timeout')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()
        
        if (result.error) {
          throw result.error
        }
        
        return result.data
      },
      'profiles.getById'
    )
  },

  async create(data) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('profiles')
          .insert(data)
          .select()
      },
      // FALLBACK: HTTP REST API
      async () => {
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
          return await response.json()
        } else {
          return { success: true }
        }
      },
      'profiles.create'
    )
  },

  async update(id, data) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('profiles')
          .update(data)
          .eq('id', id)
          .select()
      },
      // FALLBACK: HTTP REST API
      async () => {
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
          return await response.json()
        } else {
          return { success: true }
        }
      },
      'profiles.update'
    )
  },

  // PRIMARY: HTTP REST API (fast, avoids Supabase client hanging), FALLBACK: Supabase client
  async getAll() {
    return executeWithFallback(
      // PRIMARY: HTTP REST API (fast, avoids Supabase client hanging)
      async () => {
        const headers = await getHeaders()
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,role,created_at&order=created_at.desc`,
            {
              method: 'GET',
              headers: {
                ...headers,
                'Prefer': 'return=minimal'
              },
              signal: controller.signal
            }
          )

          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const data = await response.json()
          return Array.isArray(data) ? data : []
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Profiles load timeout')
          }
          throw fetchError
        }
      },
      // FALLBACK: Supabase client (only if HTTP fails)
      async () => {
        const result = await supabase
          .from('profiles')
          .select('id,email,full_name,role,created_at')
          .order('created_at', { ascending: false })
        
        if (result.error) {
          throw result.error
        }
        
        return Array.isArray(result.data) ? result.data : []
      },
      'profiles.getAll'
    )
  },

  async updateUserRole(id, role) {
    return executeWithFallback(
      // PRIMARY: Supabase client
      async () => {
        return await supabase
          .from('profiles')
          .update({ role })
          .eq('id', id)
      },
      // FALLBACK: HTTP REST API
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ role }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          return { success: true }
        } catch (fetchError) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error('Anfrage-Timeout - Rollen-Update dauerte zu lange')
          }
          throw fetchError
        }
      },
      'profiles.updateUserRole'
    )
  },

  async checkAndCreateProfileForUser(email) {
    // Check if user exists in auth without a profile (orphaned user)
    // We can't use admin API from client-side, so we'll use a different approach
    // Since we can't access admin API, just return false
    // The actual fix should be done server-side or manually in Supabase dashboard
    return false
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
        throw new Error(`Storage Upload fehlgeschlagen: ${errorData.message || errorText}`)
      }

      // IMPORTANT: For private buckets, use authenticated URL
      const authenticatedURL = `${SUPABASE_URL}/storage/v1/object/authenticated/signed-contracts/${fileName}`
      return { success: true, url: authenticatedURL, fileName }
    } catch (error) {
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
      throw error
    }
  }
}

// Profile API alias removed - merged with compatibility wrapper below

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

// ============================================================================
// COMPATIBILITY WRAPPERS - For legacy code that expects {data, error} format
// ============================================================================

// Event API compatibility wrapper (from api.js/workingApi.js)
export const eventAPI = {
  getEvents: async (startDate, endDate) => {
    try {
      const allEvents = await eventsAPI.getAll()
      let filteredEvents = allEvents
      
      if (startDate && endDate) {
        filteredEvents = allEvents.filter(event => {
          const eventDate = new Date(event.start_date)
          return eventDate >= new Date(startDate) && eventDate <= new Date(endDate)
        })
      }
      
      filteredEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      return { data: filteredEvents, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  getEventsForMonth: async (year, month) => {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      return await eventAPI.getEvents(startDate.toISOString(), endDate.toISOString())
    } catch (error) {
      return { data: null, error }
    }
  },

  createEvent: async (eventData) => {
    try {
      const data = await eventsAPI.create(eventData)
      return { data: data[0], error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  updateEvent: async (eventId, updates) => {
    try {
      const data = await eventsAPI.update(eventId, updates)
      return { data: data[0], error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  deleteEvent: async (eventId) => {
    try {
      await eventsAPI.delete(eventId)
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Event Request API compatibility wrapper
export const eventRequestAPI = {
  getEventRequests: async (status = null) => {
    try {
      const allRequests = await eventRequestsAPI.getAll()
      let filteredRequests = allRequests
      
      if (status) {
        filteredRequests = allRequests.filter(request => request.status === status)
      }
      
      filteredRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return { data: filteredRequests, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  getUserEventRequests: async (userId) => {
    try {
      const data = await eventRequestsAPI.getByUser(userId)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  createEventRequest: async (requestData) => {
    try {
      const data = await eventRequestsAPI.create(requestData)
      return { data: data[0] || data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  updateEventRequestStatus: async (requestId, status, reviewNotes = null, reviewedBy = null) => {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      }
      if (reviewNotes) updates.review_notes = reviewNotes
      if (reviewedBy) updates.reviewed_by = reviewedBy

      const data = await eventRequestsAPI.update(requestId, updates)
      return { data: data[0] || data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  approveEventRequest: async (requestId, reviewedBy) => {
    try {
      const allRequests = await eventRequestsAPI.getAll()
      const request = allRequests.find(r => r.id === requestId)
      if (!request) throw new Error('Veranstaltungs-Anfrage nicht gefunden')

      const eventData = {
        title: request.title,
        description: request.description,
        start_date: request.start_date,
        end_date: request.end_date,
        location: request.location,
        event_type: request.event_type,
        max_participants: request.max_participants,
        created_by: request.requested_by,
        is_private: request.is_private || false
      }

      const { data: event, error: eventError } = await eventAPI.createEvent(eventData)
      if (eventError) throw eventError

      const { data: updatedRequest, error: updateError } = await eventRequestAPI.updateEventRequestStatus(
        requestId, 'approved', 'Veranstaltung genehmigt und erstellt', reviewedBy
      )
      if (updateError) throw updateError

      return { data: { event, request: updatedRequest }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  rejectEventRequest: async (requestId, reviewNotes, reviewedBy) => {
    try {
      const { data, error } = await eventRequestAPI.updateEventRequestStatus(
        requestId, 'rejected', reviewNotes, reviewedBy
      )
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Profile API compatibility wrapper
export const profileAPI = {
  getProfile: profilesAPI.getById,
  
  getProfiles: async () => {
    try {
      const data = await profilesAPI.getAll()
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const data = await profilesAPI.update(userId, { role })
      return { data: data[0] || data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}