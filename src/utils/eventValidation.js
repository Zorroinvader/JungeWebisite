// FILE OVERVIEW
// - Purpose: Event validation utilities for checking date conflicts, validating event times, and formatting conflict messages.
// - Used by: AdminEventCreationForm, AdminEventEditForm for conflict checking before creating/updating events.
// - Notes: Production utility. Prevents double-booking; validates date ranges and time overlaps.

/**
 * Event validation utilities to prevent overlapping bookings
 */

/**
 * Check if two time ranges overlap
 * @param {Date|string} start1 - Start time of first event
 * @param {Date|string} end1 - End time of first event
 * @param {Date|string} start2 - Start time of second event
 * @param {Date|string} end2 - End time of second event
 * @returns {boolean} True if events overlap
 */
export const checkTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)

  // Events overlap if:
  // (Start1 < End2) AND (End1 > Start2)
  return s1 < e2 && e1 > s2
}

/**
 * Check if a new event would conflict with existing events
 * @param {Array} existingEvents - Array of existing events
 * @param {Object} newEvent - New event to check
 * @param {string} excludeId - Optional ID to exclude from check (for updates)
 * @returns {Object} { hasConflict: boolean, conflictingEvents: Array }
 */
export const checkEventConflicts = (existingEvents, newEvent, excludeId = null) => {
  const conflicts = []

  for (const event of existingEvents) {
    // Skip the event being updated
    if (excludeId && event.id === excludeId) {
      continue
    }

    // Check if times overlap
    const overlap = checkTimeOverlap(
      newEvent.start_date || newEvent.start,
      newEvent.end_date || newEvent.end,
      event.start_date || event.start,
      event.end_date || event.end
    )

    if (overlap) {
      conflicts.push(event)
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflictingEvents: conflicts
  }
}

/**
 * Format conflict message for user display
 * @param {Array} conflictingEvents - Array of conflicting events
 * @returns {string} User-friendly error message
 */
export const formatConflictMessage = (conflictingEvents) => {
  if (conflictingEvents.length === 0) return ''

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const conflicts = conflictingEvents.map(event => 
    `- ${event.title || event.event_name || 'Event'}\n  (${formatDateTime(event.start_date || event.start)} - ${formatDateTime(event.end_date || event.end)})`
  ).join('\n\n')

  return `Der gewählte Zeitraum überschneidet sich mit folgenden Events:\n\n${conflicts}\n\nBitte wählen Sie einen anderen Zeitraum.`
}

/**
 * Validate event times are logical
 * @param {Date|string} startDate - Start date/time
 * @param {Date|string} endDate - End date/time
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateEventTimes = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Ungültiges Startdatum' }
  }

  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Ungültiges Enddatum' }
  }

  if (start >= end) {
    return { isValid: false, error: 'Das Enddatum muss nach dem Startdatum liegen' }
  }

  return { isValid: true, error: null }
}

/**
 * Check if events can be scheduled on the same day
 * @param {Array} eventsOnDay - Events already scheduled for that day
 * @param {Object} newEvent - New event to schedule
 * @returns {boolean} True if new event can be scheduled
 */
export const canScheduleOnSameDay = (eventsOnDay, newEvent) => {
  // If no events on that day, always OK
  if (!eventsOnDay || eventsOnDay.length === 0) return true

  // Check each event for time conflicts
  for (const event of eventsOnDay) {
    if (checkTimeOverlap(
      newEvent.start_date || newEvent.start,
      newEvent.end_date || newEvent.end,
      event.start_date || event.start,
      event.end_date || event.end
    )) {
      return false
    }
  }

  return true
}

