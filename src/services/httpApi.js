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

// Event Requests API
export const eventRequestsAPI = {
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
      // Use Supabase auth signup to create the user
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          data: {
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

// Default export for backward compatibility
const httpAPI = {
  events: eventsAPI,
  eventRequests: eventRequestsAPI,
  profiles: profilesAPI
}

export default httpAPI