// FILE OVERVIEW
// - Purpose: ICS (iCalendar) file parser that converts .ics format to event objects for calendar import.
// - Used by: AdminPanelClean for importing events from the old calendar system.
// - Notes: Production utility. Used for calendar import functionality in admin settings.

/**
 * ICS Calendar Parser
 * Parses ICS (iCalendar) format and converts to event objects
 */

/**
 * Parse ICS content from the old calendar system
 * @param {string} icsContent - Raw ICS file content
 * @returns {Array} Array of parsed event objects
 */
export const parseICSContent = (icsContent) => {
  const events = []
  
  // Split into individual events
  const eventBlocks = icsContent.split('BEGIN:VEVENT')
  
  // Skip the first element (it's the VCALENDAR header)
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i]
    const event = {}
    
    // Extract fields using regex
    const fields = {
      UID: /UID:(.+)/,
      DTSTART: /DTSTART[^:]*:(.+)/,
      DTEND: /DTEND[^:]*:(.+)/,
      SUMMARY: /SUMMARY:(.+)/,
      DESCRIPTION: /DESCRIPTION:(.+?)(?=\n[A-Z]|\nEND:VEVENT)/s,
      LOCATION: /LOCATION:(.+)/,
      CATEGORIES: /CATEGORIES:(.+)/,
      ATTENDEE: /ATTENDEE:(.+)/,
      CLASS: /CLASS:(.+)/
    }
    
    // Parse each field
    for (const [key, regex] of Object.entries(fields)) {
      const match = block.match(regex)
      if (match) {
        event[key] = match[1].trim().replace(/\\,/g, ',').replace(/\\n/g, '\n')
      }
    }
    
    // Parse dates
    if (event.DTSTART) {
      event.startDate = parseICSDate(event.DTSTART)
      event.isAllDay = !event.DTSTART.includes('T')
    }
    
    if (event.DTEND) {
      event.endDate = parseICSDate(event.DTEND)
    }
    
    // Map category to event type and privacy
    if (event.CATEGORIES) {
      const category = event.CATEGORIES
      event.isPrivate = false
      event.eventType = 'public'
      
      if (category.includes('Vermietet - Privatveranstaltung')) {
        event.isPrivate = true
        event.eventType = 'private'
        event.category = 'Vermietet - Privatveranstaltung'
      } else if (category.includes('Vermietet - Öffentliche Veranstaltung')) {
        event.isPrivate = false
        event.eventType = 'public'
        event.category = 'Vermietet - Öffentliche Veranstaltung'
      } else if (category.includes('Geblockt - Regelveranstaltung')) {
        event.isPrivate = false
        event.eventType = 'blocked'
        event.category = 'Geblockt - Regelveranstaltung'
      } else if (category.includes('Geblockt - Veranstaltung Junge Gesellschaft')) {
        event.isPrivate = false
        event.eventType = 'blocked'
        event.category = 'Geblockt - Veranstaltung Junge Gesellschaft'
      } else if (category.includes('Geblockt - Öffentliche Veranstaltung')) {
        event.isPrivate = false
        event.eventType = 'blocked'
        event.category = 'Geblockt - Öffentliche Veranstaltung'
      }
    }
    
    // Only add events that have required fields
    if (event.SUMMARY && event.startDate) {
      events.push(event)
    }
  }
  
  return events
}

/**
 * Parse ICS date format to JavaScript Date
 * @param {string} icsDate - ICS format date (e.g., "20250712" or "20250723T160000Z")
 * @returns {Date} JavaScript Date object
 */
const parseICSDate = (icsDate) => {
  // Remove VALUE=DATE: prefix if present
  icsDate = icsDate.replace(/^VALUE=DATE:/, '')
  
  // All-day event format: YYYYMMDD
  if (icsDate.length === 8) {
    const year = icsDate.substring(0, 4)
    const month = icsDate.substring(4, 6)
    const day = icsDate.substring(6, 8)
    return new Date(`${year}-${month}-${day}T00:00:00`)
  }
  
  // DateTime format: YYYYMMDDTHHmmssZ
  if (icsDate.includes('T')) {
    const dateTimeParts = icsDate.split('T')
    const datePart = dateTimeParts[0]
    const timePart = dateTimeParts[1].replace('Z', '')
    
    const year = datePart.substring(0, 4)
    const month = datePart.substring(4, 6)
    const day = datePart.substring(6, 8)
    
    const hour = timePart.substring(0, 2)
    const minute = timePart.substring(2, 4)
    const second = timePart.substring(4, 6)
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`)
  }
  
  return new Date(icsDate)
}

/**
 * Convert parsed ICS event to database event format
 * @param {Object} icsEvent - Parsed ICS event
 * @returns {Object} Database-ready event object
 */
export const convertToDBEvent = (icsEvent) => {
  const startDate = new Date(icsEvent.startDate)
  const endDate = icsEvent.endDate ? new Date(icsEvent.endDate) : new Date(icsEvent.startDate)
  
  // Check if the event has usable time information
  // An event is considered to have time if it's not an all-day event in the original ICS
  const hasTimeInfo = icsEvent.isAllDay === false
  
  let startDateStr, endDateStr
  let isAllDay = true
  
  if (hasTimeInfo) {
    // Event has specific times - keep them as ISO strings with time component
    // This preserves hours, minutes for events that need specific scheduling
    startDateStr = startDate.toISOString()
    endDateStr = endDate.toISOString()
    isAllDay = false
    
  } else {
    // Event is all-day - store as date-only string (YYYY-MM-DD)
    const formatDateOnly = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Set time to midnight for consistency
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    
    startDateStr = formatDateOnly(startDate)
    endDateStr = formatDateOnly(endDate)
    // isAllDay = true // All-day events are handled by date-only format
    
  }
  
  return {
    title: icsEvent.SUMMARY || 'Untitled Event',
    description: icsEvent.DESCRIPTION || '',
    start_date: startDateStr,
    end_date: endDateStr,
    location: icsEvent.LOCATION || '',
    is_private: icsEvent.isPrivate || false,
    event_type: icsEvent.eventType || 'public',
    status: 'approved', // All imported events are pre-approved
    imported_from: 'old_calendar',
    imported_at: new Date().toISOString(),
    imported_uid: icsEvent.UID,
    category: icsEvent.category || '',
    attendee_info: icsEvent.ATTENDEE || ''
    // Note: is_all_day not included - determined by date format (with or without time)
  }
}

/**
 * Fetch and parse ICS from URL
 * @param {string} url - ICS feed URL
 * @returns {Promise<Array>} Array of parsed events
 */
export const fetchAndParseICS = async (url, supabaseAnonKey = null) => {
  try {
    
    // Prepare fetch options with authentication if using Supabase Edge Function
    const fetchOptions = {}
    if (supabaseAnonKey && url.includes('supabase')) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }
    
    const response = await fetch(url, fetchOptions)
    
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch ICS: ${response.statusText} - ${errorText}`)
    }
    
    const icsContent = await response.text()
    
    const events = parseICSContent(icsContent)
    
    
    // Show category breakdown
    const categoryCount = {}
    events.forEach(evt => {
      const cat = evt.CATEGORIES || 'Unknown'
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
    
    Object.entries(categoryCount).forEach(([cat, count]) => {
    })
    
    return events
  } catch (error) {
    throw error
  }
}

