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
  
  // First, handle line continuations in ICS format (lines starting with space)
  // ICS format allows fields to continue on next line if it starts with space
  const normalizedContent = icsContent
    .split('\n')
    .reduce((acc, line, index, array) => {
      // If line starts with space, it's a continuation of previous line
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (acc.length > 0) {
          // Append to previous line, removing leading space
          acc[acc.length - 1] += line.trimStart()
        } else {
          // First line is a continuation (unlikely but handle it)
          acc.push(line.trimStart())
        }
      } else {
        acc.push(line)
      }
      return acc
    }, [])
    .join('\n')
  
  // Split into individual events
  const eventBlocks = normalizedContent.split('BEGIN:VEVENT')
  
  // Skip the first element (it's the VCALENDAR header)
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i]
    const event = {}
    
    // Extract fields using regex
    // Note: DTSTART and DTEND can have parameters like ;VALUE=DATE:
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
        // Clean up the value: remove escaped characters and trim
        let value = match[1].trim()
          .replace(/\\,/g, ',')
          .replace(/\\n/g, '\n')
          .replace(/\\;/g, ';')
          .replace(/\\\\/g, '\\')
        event[key] = value
      }
    }
    
    // Parse dates
    if (event.DTSTART) {
      event.startDate = parseICSDate(event.DTSTART)
      // Determine if all-day: either has VALUE=DATE parameter or is 8-digit date without time
      const dtstartValue = event.DTSTART.split(':').pop() || event.DTSTART
      event.isAllDay = event.DTSTART.includes('VALUE=DATE') || 
                       (/^\d{8}$/.test(dtstartValue) && !event.DTSTART.includes('T'))
    }
    
    if (event.DTEND && event.startDate) {
      event.endDate = parseICSDate(event.DTEND)
      // For all-day events, DTEND is exclusive (day after the last day of the event)
      // So we need to subtract 1 day to get the actual last day
      if (event.isAllDay && event.endDate) {
        const endDate = new Date(event.endDate)
        endDate.setDate(endDate.getDate() - 1)
        event.endDate = endDate
      }
    } else if (event.startDate && !event.DTEND) {
      // If no end date, use start date as end date
      event.endDate = new Date(event.startDate)
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
  if (!icsDate) return null
  
  // Remove any leading parameters and VALUE=DATE: prefix
  // Handle formats like: "VALUE=DATE:20250821" or "20250821" or "20250821T160000Z"
  icsDate = icsDate.trim()
  
  // Extract just the date/time value, removing any parameter prefixes
  const valueMatch = icsDate.match(/:([^:]+)$/)
  if (valueMatch) {
    icsDate = valueMatch[1]
  }
  
  // All-day event format: YYYYMMDD (8 digits)
  if (/^\d{8}$/.test(icsDate)) {
    const year = icsDate.substring(0, 4)
    const month = icsDate.substring(4, 6)
    const day = icsDate.substring(6, 8)
    // Use local timezone for all-day events to avoid timezone issues
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0)
  }
  
  // DateTime format: YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  if (icsDate.includes('T')) {
    const dateTimeParts = icsDate.split('T')
    const datePart = dateTimeParts[0]
    let timePart = dateTimeParts[1] || ''
    
    // Remove Z (UTC indicator) but remember it's UTC
    const isUTC = timePart.endsWith('Z')
    timePart = timePart.replace(/Z$/, '')
    
    if (/^\d{8}$/.test(datePart) && /^\d{6}$/.test(timePart)) {
      const year = datePart.substring(0, 4)
      const month = datePart.substring(4, 6)
      const day = datePart.substring(6, 8)
      
      const hour = timePart.substring(0, 2)
      const minute = timePart.substring(2, 4)
      const second = timePart.substring(4, 6) || '00'
      
      const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}${isUTC ? 'Z' : ''}`
      return new Date(dateString)
    }
  }
  
  // Fallback: try to parse as-is
  const parsed = new Date(icsDate)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  
  console.warn('Failed to parse ICS date:', icsDate)
  return null
}

/**
 * Convert parsed ICS event to database event format
 * @param {Object} icsEvent - Parsed ICS event
 * @returns {Object} Database-ready event object
 */
export const convertToDBEvent = (icsEvent) => {
  // Validate that we have a start date
  if (!icsEvent.startDate) {
    throw new Error('Event missing start date')
  }
  
  const startDate = icsEvent.startDate instanceof Date ? icsEvent.startDate : new Date(icsEvent.startDate)
  const endDate = icsEvent.endDate 
    ? (icsEvent.endDate instanceof Date ? icsEvent.endDate : new Date(icsEvent.endDate))
    : new Date(icsEvent.startDate)
  
  // Validate dates
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start date: ${icsEvent.startDate}`)
  }
  if (isNaN(endDate.getTime())) {
    throw new Error(`Invalid end date: ${icsEvent.endDate}`)
  }
  
  // Check if the event has usable time information
  // An event is considered to have time if it's not an all-day event in the original ICS
  const hasTimeInfo = icsEvent.isAllDay === false
  
  let startDateStr, endDateStr
  
  if (hasTimeInfo) {
    // Event has specific times - keep them as ISO strings with time component
    // This preserves hours, minutes for events that need specific scheduling
    startDateStr = startDate.toISOString()
    endDateStr = endDate.toISOString()
    
  } else {
    // Event is all-day - store as ISO timestamp at midnight UTC
    // This ensures consistency with the database timestamp type
    const formatAllDayDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      // Return as ISO string at midnight UTC for all-day events
      return `${year}-${month}-${day}T00:00:00.000Z`
    }
    
    startDateStr = formatAllDayDate(startDate)
    endDateStr = formatAllDayDate(endDate)
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
    imported_uid: icsEvent.UID || null,
    category: icsEvent.category || '',
    attendee_info: icsEvent.ATTENDEE || ''
  }
}

/**
 * Fetch and parse ICS from URL
 * @param {string} url - ICS feed URL
 * @returns {Promise<Array>} Array of parsed events
 */
export const fetchAndParseICS = async (url, supabaseAnonKey = null) => {
  try {
    console.log('🌐 Fetching ICS from:', url)
    
    // Prepare fetch options with authentication if using Supabase Edge Function
    const fetchOptions = {
      headers: {
        'Accept': 'text/calendar, text/plain, */*'
      }
    }
    if (supabaseAnonKey && url.includes('supabase')) {
      fetchOptions.headers['Authorization'] = `Bearer ${supabaseAnonKey}`
    }
    
    const response = await fetch(url, fetchOptions)
    
    console.log('📡 ICS fetch response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to fetch ICS:', errorText)
      throw new Error(`Failed to fetch ICS: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`)
    }
    
    const icsContent = await response.text()
    console.log('📄 Received ICS content, length:', icsContent.length, 'characters')
    
    if (!icsContent || icsContent.length < 100) {
      throw new Error('ICS content is too short or empty')
    }
    
    const events = parseICSContent(icsContent)
    console.log(`✅ Parsed ${events.length} events from ICS content`)
    
    // Show category breakdown
    const categoryCount = {}
    events.forEach(evt => {
      const cat = evt.CATEGORIES || 'Unknown'
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })
    
    console.log('📊 Event categories:', categoryCount)
    
    return events
  } catch (error) {
    console.error('❌ Error in fetchAndParseICS:', error)
    throw error
  }
}

