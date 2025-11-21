// FILE OVERVIEW
// - Purpose: Helper utilities for reading, writing, and interpreting admin settings and for generating email content/links.
// - Used by: Admin UI components and email/notification services when sending user or admin emails and reading settings.
// - Notes: Production helper file. Relies on localStorage and Supabase Edge Functions; edits can affect email behavior. Uses secureConfig for safe key access.

// Helper functions for reading and managing admin settings

/**
 * Get all admin settings from localStorage
 * @returns {Object} Settings object with all configuration
 */
export const getAdminSettings = () => {
  try {
    const savedSettings = localStorage.getItem('adminSettings')
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  } catch (error) {
  }
  
  // Return default settings if none exist
  return {
    notificationsEnabled: true,
    autoApprovePublic: false,
    showPrivateEvents: true,
    showBlockedDates: true,
    defaultToWeekView: false,
    adminEmails: []
  }
}

// Resolve the correct public base URL for links in emails (prod-safe)
// This matches the logic in secureConfig.getSiteUrl() for consistency
const getBaseUrl = () => {
  try {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      // Development/localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        return origin
      }
      // Production - use primary domain (www.jg-wedeswedel.de)
      if (origin.includes('jg-wedeswedel.de') || origin.includes('junge-webisite-mvn3.vercel.app')) {
        return 'https://www.jg-wedeswedel.de'
      }
      return origin
    }
    // Fallback to production domain
    return 'https://www.jg-wedeswedel.de'
  } catch (_) {
    // Fallback to production domain if anything fails
    return 'https://www.jg-wedeswedel.de'
  }
}

/**
 * Get the list of admin emails for notifications
 * @returns {Array<string>} Array of admin email addresses
 */
export const getAdminNotificationEmails = () => {
  const settings = getAdminSettings()
  const emails = settings.adminEmails || []
  
  // DEVELOPMENT: Use Juan.Wiegmann@web.de for testing
  // If no emails configured, use development admin email
  if (emails.length === 0) {
    return ['Juan.Wiegmann@web.de']
  }
  
  return emails
}

/**
 * Check if email notifications are enabled
 * @returns {boolean} True if notifications are enabled
 */
export const areNotificationsEnabled = () => {
  const settings = getAdminSettings()
  return settings.notificationsEnabled !== false
}

/**
 * Check if auto-approve for public events is enabled
 * @returns {boolean} True if auto-approve is enabled
 */
export const isAutoApproveEnabled = () => {
  const settings = getAdminSettings()
  return settings.autoApprovePublic === true
}

/**
 * Check if private events should be shown in public calendar
 * @returns {boolean} True if private events should be shown
 */
export const shouldShowPrivateEvents = () => {
  const settings = getAdminSettings()
  return settings.showPrivateEvents !== false
}

/**
 * Check if blocked dates should be shown
 * @returns {boolean} True if blocked dates should be shown
 */
export const shouldShowBlockedDates = () => {
  const settings = getAdminSettings()
  return settings.showBlockedDates !== false
}

/**
 * Get default calendar view preference
 * @returns {string} 'week' or 'month'
 */
export const getDefaultCalendarView = () => {
  const settings = getAdminSettings()
  return settings.defaultToWeekView ? 'week' : 'month'
}

/**
 * Send notification email to user (event requester)
 * @param {string} userEmail - User's email address
 * @param {Object} eventData - The event data
 * @param {string} type - Type of notification
 */
export const sendUserNotification = async (userEmail, eventData, type) => {
  if (!userEmail) {
    return
  }

  let subject = ''
  let message = ''

  switch (type) {
    case 'initial_request_received':
      subject = 'Ihre Veranstaltungs-Anfrage wurde empfangen'
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `vielen Dank für Ihre Veranstaltungs-Anfrage!\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}${eventData.end_date && eventData.end_date !== eventData.start_date ? ' - ' + new Date(eventData.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}\n` +
                `Kategorie: ${eventData.event_type}\n\n` +
                `STATUS\n` +
                `${'-'.repeat(50)}\n` +
                `Anfrage eingegangen: Ja\n` +
                `Zeitraum reserviert: Der gewünschte Zeitraum ist vorläufig für Sie reserviert\n` +
                `In Bearbeitung: Ein Administrator prüft Ihre Anfrage\n\n` +
                `Sie erhalten eine weitere E-Mail, sobald Ihre Anfrage bearbeitet wurde.\n\n` +
                `Status verfolgen: ${getBaseUrl()}/event-tracking\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-Team\n\n` +
                `Junge Gesellschaft Pferdestall Wedes Wedel\n` +
                `Veranstaltungs-Anfragen: kontakt@junge-gesellschaft-wedel.de`
      break

    case 'initial_request_accepted':
      subject = 'Ihre Veranstaltungs-Anfrage wurde akzeptiert - Weitere Informationen erforderlich'
      // Generate a link with email parameter for easy access
      const trackingUrl = `${getBaseUrl()}/event-tracking?email=${encodeURIComponent(eventData.requester_email || '')}`
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `gute Neuigkeiten! Ihre Veranstaltungs-Anfrage wurde initial akzeptiert.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}${eventData.end_date && eventData.end_date !== eventData.start_date ? ' - ' + new Date(eventData.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}\n\n` +
                `WICHTIG: Der Zeitraum ist jetzt für Sie blockiert und reserviert.\n\n` +
                `NÄCHSTE SCHRITTE\n` +
                `${'-'.repeat(50)}\n` +
                `Um Ihre Buchung abzuschließen, benötigen wir:\n\n` +
                `1. Genaue Start- und Endzeiten\n` +
                `2. Gewünschte Schlüsselübergabe- und Rückgabezeiten\n` +
                `3. Signierter Mietvertrag (als PDF)\n\n` +
                `Bitte füllen Sie das Formular aus:\n${trackingUrl}\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-Team\n\n` +
                `Junge Gesellschaft Pferdestall Wedes Wedel\n` +
                `Veranstaltungs-Anfragen: kontakt@junge-gesellschaft-wedel.de`
      break

    case 'final_approval':
      subject = 'Ihre Veranstaltungs-Buchung wurde final genehmigt!'
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `herzlichen Glückwunsch! Ihre Veranstaltungs-Buchung wurde final genehmigt.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Start: ${eventData.start_datetime ? new Date(eventData.start_datetime).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : eventData.start_date}\n` +
                `Ende: ${eventData.end_datetime ? new Date(eventData.end_datetime).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : eventData.end_date}\n\n` +
                `BESTÄTIGUNG\n` +
                `${'-'.repeat(50)}\n` +
                `Ihre Veranstaltung ist jetzt im Kalender eingetragen und reserviert.\n` +
                `Alle Details wurden bestätigt.\n\n` +
                `Kalender ansehen: ${getBaseUrl()}/\n\n` +
                `Wir wünschen Ihnen eine erfolgreiche Veranstaltung!\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-Team\n\n` +
                `Junge Gesellschaft Pferdestall Wedes Wedel\n` +
                `Veranstaltungs-Anfragen: kontakt@junge-gesellschaft-wedel.de`
      break

    default:
      subject = 'Update zu Ihrer Veranstaltungs-Anfrage'
      message = `Guten Tag,\n\nEs gibt ein Update zu Ihrer Veranstaltungs-Anfrage.\n\nMit freundlichen Grüßen\nIhr Veranstaltungs-Team`
  }

  const htmlContent = generateUserEmailHTML(subject, message, eventData, type)

  // Send via Supabase Edge Function
  // SECURITY: Use secure getters to prevent key exposure
  try {
    const { getSupabaseUrl, getSupabaseAnonKey } = await import('../utils/secureConfig')
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabaseAnonKey()

    const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        recipients: [userEmail],
        subject,
        message,
        htmlContent,
        eventData,
        type
      })
    })

    if (response.ok) {
    }
  } catch (error) {
  }
}

/**
 * Send notification emails to all configured admin addresses
 * @param {Object} eventData - The event data to notify about
 * @param {string} type - Type of notification ('initial_request', 'detailed_info_submitted', 'final_acceptance', etc.)
 */
export const sendAdminNotification = async (eventData, type = 'initial_request') => {
  if (!areNotificationsEnabled()) {
    return
  }

  const adminEmails = getAdminNotificationEmails()
  
  if (adminEmails.length === 0) {
    return
  }
  
  // Format notification message based on type
  let subject = ''
  let message = ''
  
  switch (type) {
    case 'initial_request':
      subject = 'Neue Veranstaltungs-Anfrage eingegangen - Initiale Überprüfung erforderlich'
      const adminUrl = `${getBaseUrl()}/admin`
      message = `Guten Tag,\n\n` +
                `eine neue Veranstaltungs-Anfrage wurde eingereicht und benötigt Ihre Überprüfung.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name || 'Unbekannt'}\n` +
                `Antragsteller: ${eventData.requester_name}\n` +
                `Kontakt: ${eventData.requester_email}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}${eventData.end_date && eventData.end_date !== eventData.start_date ? ' - ' + new Date(eventData.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}\n` +
                `Kategorie: ${eventData.event_type}\n\n` +
                `AKTION ERFORDERLICH\n` +
                `${'-'.repeat(50)}\n` +
                `Bitte überprüfen Sie die Anfrage und führen Sie die initiale Akzeptanz durch.\n` +
                `Nach der initialen Akzeptanz wird der Zeitraum blockiert und der Benutzer kann Details einreichen.\n\n` +
                `Zum Admin-Panel: ${adminUrl}\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-System\n\n` +
                `Junge Gesellschaft Pferdestall Wedes Wedel\n` +
                `Veranstaltungs-Anfragen: kontakt@junge-gesellschaft-wedel.de`
      break
      
    case 'detailed_info_submitted':
      subject = 'Detaillierte Veranstaltungs-Informationen eingereicht - Finale Überprüfung erforderlich'
      const adminPanelUrl = `${getBaseUrl()}/admin`
      message = `Guten Tag,\n\n` +
                `ein Antragsteller hat die detaillierten Informationen für eine Veranstaltungs-Anfrage eingereicht.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name || 'Unbekannt'}\n` +
                `Antragsteller: ${eventData.requester_name}\n` +
                `Kontakt: ${eventData.requester_email}\n` +
                `Start: ${eventData.start_datetime ? new Date(eventData.start_datetime).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : 'N/A'}\n` +
                `Ende: ${eventData.end_datetime ? new Date(eventData.end_datetime).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : 'N/A'}\n` +
                `Kategorie: ${eventData.event_type}\n\n` +
                `STATUS\n` +
                `${'-'.repeat(50)}\n` +
                `Mietvertrag hochgeladen: Ja\n` +
                `Zeitraum blockiert: Ja (seit initialer Akzeptanz)\n\n` +
                `AKTION ERFORDERLICH\n` +
                `${'-'.repeat(50)}\n` +
                `Bitte überprüfen Sie die Details und führen Sie die finale Freigabe durch.\n\n` +
                `Zum Admin-Panel: ${adminPanelUrl}\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-System\n\n` +
                `Junge Gesellschaft Pferdestall Wedes Wedel\n` +
                `Veranstaltungs-Anfragen: kontakt@junge-gesellschaft-wedel.de`
      break
      
    case 'final_acceptance':
      subject = 'Veranstaltung genehmigt und aktiviert (Schritt 3/3)'
      message = `Guten Tag,\n\n` +
                `eine Veranstaltung wurde final genehmigt und ist nun im Kalender aktiv.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name || 'Unbekannt'}\n` +
                `Antragsteller: ${eventData.requester_name}\n` +
                `Kontakt: ${eventData.requester_email}\n\n` +
                `Die Veranstaltung ist jetzt für alle Benutzer im Kalender sichtbar.\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-System\n\n` +
                `Junge Gesellschaft Pferdestall Wedes Wedel\n` +
                `Veranstaltungs-Anfragen: kontakt@junge-gesellschaft-wedel.de`
      break
      
    default:
      subject = 'Veranstaltungs-Management - Neue Benachrichtigung'
      message = `Guten Tag,\n\n` +
                `Event: ${eventData.title || eventData.event_name || 'Neues Event'}\n` +
                `Von: ${eventData.requester_name || 'Unbekannt'}\n\n` +
                `Weitere Details finden Sie im Admin-Panel.\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Veranstaltungs-Management-System`
  }
  
  // Generate HTML email content
  const htmlContent = generateEmailHTML(subject, message, eventData, type)
  
  // Send email via Supabase Edge Function
  try {
    // SECURITY: Use secure getters to prevent key exposure
    const { getSupabaseUrl, getSupabaseAnonKey } = await import('../utils/secureConfig')
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabaseAnonKey()
    
    if (!supabaseUrl || !supabaseKey) {
      alert(`E-MAIL BENACHRICHTIGUNG\n\n` +
            `An: ${adminEmails.join(', ')}\n` +
            `Betreff: ${subject}\n\n` +
            `${message}\n\n` +
            `Hinweis: Konfigurieren Sie Supabase Umgebungsvariablen für E-Mail-Versand.`)
      return
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        recipients: adminEmails,
        subject,
        message,
        htmlContent,
        eventData,
        type
      })
    })

    if (!response.ok) {
      throw new Error('Email service returned an error')
    }

    const result = await response.json()
    
    if (result.success) {
      // Optionally show a subtle success notification
    } else {
      throw new Error(result.error || 'Unknown error')
    }
    
  } catch (error) {
    // Show alert as fallback
    alert(`E-MAIL BENACHRICHTIGUNG (Versand fehlgeschlagen)\n\n` +
          `An: ${adminEmails.join(', ')}\n` +
          `Betreff: ${subject}\n\n` +
          `${message}\n\n` +
          `Fehler: ${error.message}\n\n` +
          `Die Benachrichtigung wurde protokolliert, aber nicht per E-Mail versendet.`)
  }
}

/**
 * Generate HTML email template for user notifications
 */
export const generateUserEmailHTML = (subject, message, eventData, type) => {
  // Generate proper URLs with email parameter for easy access
  const trackingUrlWithEmail = eventData.requester_email 
    ? `${getBaseUrl()}/event-tracking?email=${encodeURIComponent(eventData.requester_email)}`
    : `${getBaseUrl()}/event-tracking`
  
  const buttonUrl = type === 'initial_request_accepted' 
    ? trackingUrlWithEmail 
    : type === 'final_approval' 
    ? `${getBaseUrl()}/`
    : `${getBaseUrl()}/event-tracking`
  const buttonText = type === 'initial_request_accepted' 
    ? 'Details ergänzen' 
    : type === 'final_approval' 
    ? 'Kalender ansehen' 
    : 'Status verfolgen'
  
  // Add note about blocking for initial acceptance
  const blockingNote = type === 'initial_request_accepted' 
    ? '<div class="info-box" style="background: #e8f5e9; border-left-color: #4CAF50; margin: 20px 0;"><p style="margin: 0; color: #2e7d32; font-weight: 600;">✓ Ihr Zeitraum ist jetzt reserviert und blockiert</p></div>'
    : ''
  
  // Format dates nicely
  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  
  const formatDateTime = (datetime) => {
    if (!datetime) return ''
    const d = new Date(datetime)
    return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr'
  }
  
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F4F1E8; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #F4F1E8; }
    .header { background: #252422; padding: 30px; text-align: center; border-bottom: 3px solid #A58C81; }
    .logo { max-width: 60px; margin-bottom: 15px; }
    .header-title { color: #F4F1E8; margin: 0; font-size: 20px; font-weight: 600; }
    .container { background: white; margin: 20px; border: 2px solid #A58C81; border-radius: 8px; overflow: hidden; }
    .content { padding: 40px 30px; color: #252422; line-height: 1.8; }
    .content p { margin: 0 0 15px 0; }
    .section-title { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #A58C81; margin: 25px 0 10px 0; letter-spacing: 1px; }
    .divider { height: 2px; background: #A58C81; margin: 20px 0; }
    .info-box { background: #F4F1E8; border-left: 4px solid #A58C81; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
    .info-row { margin: 8px 0; color: #252422; }
    .info-label { font-weight: 600; color: #A58C81; display: inline-block; min-width: 120px; }
    .cta-button { display: inline-block; background: #6054d9; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 500; transition: background 0.3s; }
    .cta-button:hover { background: #4f44c7; }
    .footer { background: #252422; padding: 25px 30px; text-align: center; color: #F4F1E8; font-size: 13px; }
    .footer-links { margin-top: 15px; }
    .footer-links a { color: #A58C81; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <img src="${getBaseUrl()}/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" alt="Junge Gesellschaft" class="logo" />
      <h1 class="header-title">Junge Gesellschaft Pferdestall</h1>
    </div>
    
    <div class="container">
      <div class="content">
        <h2 style="color: #252422; margin-top: 0;">${subject}</h2>
        
        <p>Guten Tag ${eventData.requester_name || ''},</p>
        
        ${type === 'initial_request_received' ? '<p>vielen Dank für Ihre Veranstaltungs-Anfrage!</p>' : ''}
        ${type === 'initial_request_accepted' ? '<p>gute Neuigkeiten! Ihre Veranstaltungs-Anfrage wurde initial akzeptiert.</p>' : ''}
        ${type === 'final_approval' ? '<p>herzlichen Glückwunsch! Ihre Veranstaltungs-Buchung wurde final genehmigt.</p>' : ''}
        
        <div class="info-box">
          <div class="section-title">Veranstaltungs-Details</div>
          <div class="info-row"><span class="info-label">Event:</span> ${eventData.title || eventData.event_name}</div>
          ${eventData.start_date ? `<div class="info-row"><span class="info-label">Zeitraum:</span> ${formatDate(eventData.start_date)}${eventData.end_date && eventData.end_date !== eventData.start_date ? ' - ' + formatDate(eventData.end_date) : ''}</div>` : ''}
          ${eventData.start_datetime ? `<div class="info-row"><span class="info-label">Start:</span> ${formatDateTime(eventData.start_datetime)}</div>` : ''}
          ${eventData.end_datetime ? `<div class="info-row"><span class="info-label">Ende:</span> ${formatDateTime(eventData.end_datetime)}</div>` : ''}
          ${eventData.event_type ? `<div class="info-row"><span class="info-label">Kategorie:</span> ${eventData.event_type}</div>` : ''}
        </div>
        
        ${type === 'initial_request_received' ? `
          <div class="section-title">Status</div>
          <div class="info-box" style="background: #e8f5e9; border-left-color: #4CAF50;">
            <div class="info-row">✓ Anfrage eingegangen</div>
            <div class="info-row">✓ Zeitraum vorläufig für Sie reserviert</div>
            <div class="info-row">✓ Ein Administrator prüft Ihre Anfrage</div>
          </div>
          <p>Sie erhalten eine weitere E-Mail, sobald Ihre Anfrage bearbeitet wurde.</p>
        ` : ''}
        
        ${type === 'initial_request_accepted' ? `
          ${blockingNote}
          <div class="section-title">Nächste Schritte</div>
          <p>Um Ihre Buchung abzuschließen, benötigen wir:</p>
          <ul style="color: #252422; line-height: 1.8;">
            <li>Genaue Start- und Endzeiten</li>
            <li>Gewünschte Schlüsselübergabe- und Rückgabezeiten</li>
            <li>Signierter Mietvertrag (als PDF)</li>
          </ul>
          <p style="color: #2e7d32; font-weight: 600; margin-top: 15px;">Ihr gewünschter Zeitraum ist jetzt für Sie reserviert und blockiert.</p>
        ` : ''}
        
        ${type === 'final_approval' ? `
          <div class="section-title">Bestätigung</div>
          <p>Ihre Veranstaltung ist jetzt im Kalender eingetragen und reserviert. Alle Details wurden bestätigt.</p>
        ` : ''}
        
        <center>
          <a href="${buttonUrl}" class="cta-button">${buttonText}</a>
        </center>
        
        <p style="margin-top: 30px; color: #A58C81; font-size: 14px;">
          Mit freundlichen Grüßen<br>
          Ihr Veranstaltungs-Team
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Junge Gesellschaft Pferdestall Wedes Wedel</p>
      <p style="margin: 0; color: #A58C81;">Event-Anfragen: kontakt@junge-gesellschaft-wedel.de</p>
      <div class="footer-links">
        <a href="${getBaseUrl()}/">Startseite</a> | 
        <a href="${getBaseUrl()}/event-tracking">Status verfolgen</a>
      </div>
      <p style="margin: 15px 0 0 0; color: #A58C81; font-size: 11px;">Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate HTML email template for professional email delivery
 * @param {string} subject - Email subject
 * @param {string} message - Plain text message
 * @param {Object} eventData - Event data for structured display
 * @param {string} type - Notification type
 * @returns {string} HTML email template
 */
export const generateEmailHTML = (subject, message, eventData, type) => {
  // Format dates nicely
  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  
  const formatDateTime = (datetime) => {
    if (!datetime) return ''
    const d = new Date(datetime)
    return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' Uhr'
  }
  
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F4F1E8; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #F4F1E8; }
    .header { background: #252422; padding: 30px; text-align: center; border-bottom: 3px solid #A58C81; }
    .logo { max-width: 60px; margin-bottom: 15px; }
    .header-title { color: #F4F1E8; margin: 0; font-size: 20px; font-weight: 600; }
    .container { background: white; margin: 20px; border: 2px solid #A58C81; border-radius: 8px; overflow: hidden; }
    .content { padding: 40px 30px; color: #252422; line-height: 1.8; }
    .content p { margin: 0 0 15px 0; }
    .section-title { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #A58C81; margin: 25px 0 10px 0; letter-spacing: 1px; }
    .info-box { background: #F4F1E8; border-left: 4px solid #A58C81; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
    .info-row { margin: 8px 0; color: #252422; }
    .info-label { font-weight: 600; color: #A58C81; display: inline-block; min-width: 130px; }
    .status-badge { display: inline-block; background: #6054d9; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 15px 0; }
    .cta-button { display: inline-block; background: #6054d9; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 500; }
    .cta-button:hover { background: #4f44c7; }
    .footer { background: #252422; padding: 25px 30px; text-align: center; color: #F4F1E8; font-size: 13px; }
    .footer-links { margin-top: 15px; }
    .footer-links a { color: #A58C81; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <img src="${getBaseUrl()}/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" alt="Junge Gesellschaft" class="logo" />
      <h1 class="header-title">Junge Gesellschaft Pferdestall</h1>
    </div>
    
    <div class="container">
      <div class="content">
        <h2 style="color: #252422; margin-top: 0;">${subject}</h2>
        
        <p>Guten Tag,</p>
        
        ${type === 'initial_request' ? '<p>eine neue Veranstaltungs-Anfrage steht zur Bearbeitung bereit.</p>' : ''}
        ${type === 'detailed_info_submitted' ? '<p>ein Antragsteller hat die detaillierten Informationen eingereicht.</p>' : ''}
        ${type === 'final_acceptance' ? '<p>eine Veranstaltung wurde final genehmigt und ist nun im Kalender aktiv.</p>' : ''}
        
        <div class="info-box">
          <div class="section-title">Veranstaltungs-Details</div>
          <div class="info-row"><span class="info-label">Event:</span> ${eventData.title || eventData.event_name || 'Unbekannt'}</div>
          <div class="info-row"><span class="info-label">Antragsteller:</span> ${eventData.requester_name}</div>
          <div class="info-row"><span class="info-label">Kontakt:</span> ${eventData.requester_email}</div>
          ${eventData.start_date ? `<div class="info-row"><span class="info-label">Zeitraum:</span> ${formatDate(eventData.start_date)}${eventData.end_date && eventData.end_date !== eventData.start_date ? ' - ' + formatDate(eventData.end_date) : ''}</div>` : ''}
          ${eventData.start_datetime ? `<div class="info-row"><span class="info-label">Start:</span> ${formatDateTime(eventData.start_datetime)}</div>` : ''}
          ${eventData.end_datetime ? `<div class="info-row"><span class="info-label">Ende:</span> ${formatDateTime(eventData.end_datetime)}</div>` : ''}
          ${eventData.event_type ? `<div class="info-row"><span class="info-label">Kategorie:</span> ${eventData.event_type}</div>` : ''}
        </div>
        
        ${type === 'detailed_info_submitted' ? '<div class="status-badge">Mietvertrag hochgeladen</div>' : ''}
        
        <center>
          <a href="${getBaseUrl()}/admin" class="cta-button">Zum Admin-Panel</a>
        </center>
        
        <p style="margin-top: 30px; color: #A58C81; font-size: 14px;">
          Die Anfrage kann im Admin-Panel eingesehen und bearbeitet werden.
        </p>
        
        <p style="margin-top: 20px; color: #A58C81; font-size: 14px;">
          Mit freundlichen Grüßen<br>
          Ihr Veranstaltungs-System
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Junge Gesellschaft Pferdestall Wedes Wedel</p>
      <p style="margin: 0; color: #A58C81;">Event-Anfragen: kontakt@junge-gesellschaft-wedel.de</p>
      <div class="footer-links">
        <a href="${getBaseUrl()}/">Startseite</a> | 
        <a href="${getBaseUrl()}/admin">Admin-Panel</a>
      </div>
      <p style="margin: 15px 0 0 0; color: #A58C81; font-size: 11px;">Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export const saveAdminSettings = (settings) => {
  try {
    const settingsWithTimestamp = {
      ...settings,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('adminSettings', JSON.stringify(settingsWithTimestamp))
    return true
  } catch (error) {
    return false
  }
}

