// HTTP-based API service that bypasses the problematic Supabase client
// Uses direct HTTP calls to Supabase REST API

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
})

// Events API
export const eventsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?select=*&order=start_date.asc`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HTTP API getEvents error:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}&select=*`, {
        method: 'GET',
        headers: getHeaders()
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: getHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API deleteEvent error:', error)
      throw error
    }
  }
}

// Event Requests API - 3-Step Workflow
export const eventRequestsAPI = {
  // Get all event requests (admin only)
  async getAll() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
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

  // Get requests by stage
  async getByStage(stage) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?request_stage=eq.${stage}&select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?requester_email=eq.${email}&select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('HTTP API getByEmail error:', error)
      throw error
    }
  },

  async getByUser(userId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?requested_by=eq.${userId}&select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
        method: 'GET',
        headers: getHeaders()
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
  // Uses same structure as existing event requests for compatibility
  async createInitialRequest(data) {
    try {
      const requestData = {
        // Existing fields
        title: data.title || data.event_name,
        description: data.description || data.initial_notes || '',
        requester_name: data.requester_name,
        requester_email: data.requester_email,
        start_date: data.start_date,
        end_date: data.end_date,
        is_private: data.is_private !== undefined ? data.is_private : true,
        event_type: data.event_type || (data.is_private ? 'Privates Event' : 'Öffentliches Event'),
        status: 'pending',
        created_at: data.created_at || new Date().toISOString(),
        
        // New fields for 3-step workflow
        event_name: data.event_name || data.title,
        requester_phone: data.requester_phone || null,
        requested_days: data.requested_days || null,
        initial_notes: data.initial_notes || data.description || '',
        request_stage: 'initial'
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return Array.isArray(result) ? result[0] : result
    } catch (error) {
      console.error('HTTP API createInitialRequest error:', error)
      throw error
    }
  },

  // STEP 2: Admin accepts initial request
  async acceptInitialRequest(id, adminNotes = '') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
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

      return { success: true }
    } catch (error) {
      console.error('HTTP API acceptInitialRequest error:', error)
      throw error
    }
  },

  // STEP 3: Admin rejects request
  async rejectRequest(id, rejectionReason = '') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
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

      return { success: true }
    } catch (error) {
      console.error('HTTP API rejectRequest error:', error)
      throw error
    }
  },

  // USER: Cancel own request at any stage
  async cancelRequest(id) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
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

      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

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
      const requestResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}&select=*`, {
        method: 'GET',
        headers: getHeaders()
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
        headers: getHeaders(),
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
      // Use ONLY fields that exist in the events table schema
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
        
        // File data (from database backup)
        uploaded_file_name: request.uploaded_file_name,
        uploaded_file_size: request.uploaded_file_size,
        uploaded_file_type: request.uploaded_file_type,
        uploaded_file_data: request.uploaded_file_data,
        uploaded_mietvertrag_url: request.signed_contract_url,
        
        // Status
        status: 'approved'
      }

      console.log('📤 Creating event with data:', eventData);

      const createEventResponse = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventData)
      })

      if (!createEventResponse.ok) {
        const errorText = await createEventResponse.text()
        console.error('❌ Event creation failed:', errorText);
        throw new Error(`Failed to create event: ${errorText}`)
      }

      console.log('✅ Event created successfully!');
      return { success: true }
    } catch (error) {
      console.error('HTTP API finalAcceptRequest error:', error)
      throw error
    }
  },

  // Legacy create method for backwards compatibility
  async create(data) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests`, {
        method: 'POST',
        headers: getHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/event_requests?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API deleteEventRequest error:', error)
      throw error
    }
  }
}

// Profiles API
export const profilesAPI = {
  async getById(id) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
        method: 'GET',
        headers: getHeaders()
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: getHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HTTP API getProfiles error:', error)
      throw error
    }
  },

  async updateUserRole(id, role) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('HTTP API updateUserRole error:', error)
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
      const existingProfileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.user.id}&select=*`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (existingProfileResponse.ok) {
        const existingProfile = await existingProfileResponse.json()
        
        if (existingProfile && existingProfile.length > 0) {
          // Profile already exists, update it with the provided data
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.user.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
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
            headers: getHeaders(),
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
          headers: getHeaders(),
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
      // Don't use /public/ in the URL for private buckets!
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/temporarily_blocked_dates?select=*`, {
        method: 'GET',
        headers: getHeaders()
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
  }
}

// Profile API alias for easier access
export const profileAPI = {
  getProfile: profilesAPI.getById
};

// Default export for backward compatibility
const httpAPI = {
  events: eventsAPI,
  eventRequests: eventRequestsAPI,
  profiles: profilesAPI,
  storage: storageAPI,
  blockedDates: blockedDatesAPI
}

export default httpAPI