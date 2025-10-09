import { supabase, TABLES, EVENT_STATUS } from '../lib/supabase'
import { profilesAPI, eventsAPI, eventRequestsAPI } from './httpApi'

// Event API functions using HTTP requests
export const eventAPI = {
  // Get all approved events
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
      
      // Sort by start date
      filteredEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      
      return { data: filteredEvents, error: null }
    } catch (error) {
      console.error('Error fetching events:', error)
      return { data: null, error }
    }
  },

  // Get events for a specific month
  getEventsForMonth: async (year, month) => {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      return await eventAPI.getEvents(startDate.toISOString(), endDate.toISOString())
    } catch (error) {
      console.error('Error fetching events for month:', error)
      return { data: null, error }
    }
  },

  // Get events for multiple months (optimized)
  getEventsForMonths: async (months) => {
    try {
      const promises = months.map(({ year, month }) => {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
        return eventAPI.getEvents(startDate.toISOString(), endDate.toISOString())
      })
      
      const results = await Promise.allSettled(promises)
      return results.map((result, index) => ({
        ...result,
        month: months[index]
      }))
    } catch (error) {
      console.error('Error fetching events for months:', error)
      return []
    }
  },

  // Create a new event (admin only)
  createEvent: async (eventData) => {
    try {
      const data = await eventsAPI.create(eventData)
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error creating event:', error)
      return { data: null, error }
    }
  },

  // Update an event (admin only)
  updateEvent: async (eventId, updates) => {
    try {
      const data = await eventsAPI.update(eventId, updates)
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error updating event:', error)
      return { data: null, error }
    }
  },

  // Delete an event (admin only)
  deleteEvent: async (eventId) => {
    try {
      await eventsAPI.delete(eventId)
      return { data: true, error: null }
    } catch (error) {
      console.error('Error deleting event:', error)
      return { data: null, error }
    }
  }
}

// Event Request API functions using HTTP requests
export const eventRequestAPI = {
  // Get all event requests (admin only)
  getEventRequests: async (status = null) => {
    try {
      const allRequests = await eventRequestsAPI.getAll()
      
      let filteredRequests = allRequests
      
      if (status) {
        filteredRequests = allRequests.filter(request => request.status === status)
      }
      
      // Sort by created date (newest first)
      filteredRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      return { data: filteredRequests, error: null }
    } catch (error) {
      console.error('Error fetching event requests:', error)
      return { data: null, error }
    }
  },

  // Get user's own event requests
  getUserEventRequests: async (userId) => {
    try {
      const timestamp = new Date().toLocaleTimeString()
      console.log(`[${timestamp}] getUserEventRequests called with userId:`, userId)
      
      const data = await eventRequestsAPI.getByUser(userId)
      
      console.log(`[${timestamp}] getUserEventRequests success - found ${data?.length || 0} requests`)
      return { data, error: null }
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString()
      console.error(`[${timestamp}] Error fetching user event requests:`, error)
      return { data: null, error }
    }
  },

  // Create a new event request
  createEventRequest: async (requestData) => {
    try {
      console.log('Creating event request with data:', requestData)
      const data = await eventRequestsAPI.create(requestData)
      console.log('Event request created successfully:', data)
      return { data: data[0] || data, error: null }
    } catch (error) {
      console.error('Error creating event request:', error)
      return { data: null, error }
    }
  },

  // Update event request status (admin only)
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
      console.error('Error updating event request status:', error)
      return { data: null, error }
    }
  },

  // Approve event request and create event (admin only)
  approveEventRequest: async (requestId, reviewedBy) => {
    try {
      // First, get the event request
      const allRequests = await eventRequestsAPI.getAll()
      const request = allRequests.find(r => r.id === requestId)
      
      if (!request) {
        throw new Error('Event request not found')
      }

      // Create the event
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

      // Update the request status
      const { data: updatedRequest, error: updateError } = await eventRequestAPI.updateEventRequestStatus(
        requestId,
        'approved',
        'Event approved and created',
        reviewedBy
      )

      if (updateError) throw updateError

      return { data: { event, request: updatedRequest }, error: null }
    } catch (error) {
      console.error('Error approving event request:', error)
      return { data: null, error }
    }
  },

  // Reject event request (admin only)
  rejectEventRequest: async (requestId, reviewNotes, reviewedBy) => {
    try {
      const { data, error } = await eventRequestAPI.updateEventRequestStatus(
        requestId,
        'rejected',
        reviewNotes,
        reviewedBy
      )

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error rejecting event request:', error)
      return { data: null, error }
    }
  }
}

// Profile API functions using HTTP requests
export const profileAPI = {
  // Get all profiles (admin only)
  getProfiles: async () => {
    try {
      const data = await profilesAPI.getAll()
      
      // Sort by created date (newest first)
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching profiles:', error)
      return { data: null, error }
    }
  },

  // Update user role (admin only)
  updateUserRole: async (userId, role) => {
    try {
      const data = await profilesAPI.update(userId, { role })
      return { data: data[0] || data, error: null }
    } catch (error) {
      console.error('Error updating user role:', error)
      return { data: null, error }
    }
  }
}
