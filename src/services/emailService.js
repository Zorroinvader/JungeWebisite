/**
 * Email Service using Supabase Edge Function with Resend
 * This service sends emails to both users and admins for event notifications
 */

/**
 * Send email using Supabase Edge Function (Resend API)
 * @param {Array<string>} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} messageText - Plain text message
 * @param {string} htmlContent - HTML formatted message
 * @returns {Promise<boolean>} Success status
 */
export const sendEmail = async (recipients, subject, messageText, htmlContent = null) => {
  if (!recipients || recipients.length === 0) {
    console.warn('No recipients provided for email');
    return false;
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found');
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        adminEmails: recipients,
        subject,
        message: messageText,
        htmlContent: htmlContent || messageText.replace(/\n/g, '<br>'),
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email service returned an error: ${errorText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Email sent successfully to:', recipients);
      return true;
    } else {
      throw new Error(result.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Send notification email to user (event requester)
 * @param {string} userEmail - User's email address
 * @param {Object} eventData - The event request data
 * @param {string} type - Type of notification ('initial_request', 'accepted', 'rejected', 'approved')
 */
export const sendUserNotification = async (userEmail, eventData, type = 'initial_request') => {
  if (!userEmail) {
    console.warn('No user email provided');
    return;
  }

  let subject = '';
  let message = '';

  switch (type) {
    case 'initial_request':
      subject = 'Ihre Event-Anfrage wurde empfangen';
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `vielen Dank für Ihre Event-Anfrage!\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE') : ''}\n` +
                `Kategorie: ${eventData.event_type || 'Nicht angegeben'}\n\n` +
                `STATUS\n` +
                `${'-'.repeat(50)}\n` +
                `Anfrage eingegangen: Ja\n` +
                `Zeitraum reserviert: Vorläufig\n` +
                `In Bearbeitung: Ein Administrator prüft Ihre Anfrage\n\n` +
                `Sie erhalten eine weitere E-Mail, sobald Ihre Anfrage bearbeitet wurde.\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Event-Management-Team`;
      break;

    case 'accepted':
      subject = 'Ihre Event-Anfrage wurde akzeptiert';
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `gute Neuigkeiten! Ihre Event-Anfrage wurde akzeptiert.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Start: ${eventData.start_datetime ? new Date(eventData.start_datetime).toLocaleString('de-DE') : eventData.start_date}\n` +
                `Ende: ${eventData.end_datetime ? new Date(eventData.end_datetime).toLocaleString('de-DE') : eventData.end_date}\n\n` +
                `Ihr Event ist jetzt im Kalender eingetragen.\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Event-Management-Team`;
      break;

    case 'rejected':
      subject = 'Ihre Event-Anfrage - Update';
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `leider konnte Ihre Event-Anfrage nicht angenommen werden.\n\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE') : ''}\n\n` +
                `Für Rückfragen kontaktieren Sie uns bitte.\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Event-Management-Team`;
      break;

    default:
      subject = 'Update zu Ihrer Event-Anfrage';
      message = `Guten Tag,\n\nEs gibt ein Update zu Ihrer Event-Anfrage.\n\nMit freundlichen Grüßen\nIhr Event-Management-Team`;
  }

  // Generate HTML content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <div style="white-space: pre-line; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    </div>
  `;

  return await sendEmail([userEmail], subject, message, htmlContent);
}

/**
 * Send notification email to admins
 * @param {Array<string>} adminEmails - Array of admin email addresses
 * @param {Object} eventData - The event request data
 * @param {string} type - Type of notification
 */
export const sendAdminNotificationEmail = async (adminEmails, eventData, type = 'new_request') => {
  if (!adminEmails || adminEmails.length === 0) {
    console.warn('No admin emails configured');
    return;
  }

  let subject = '';
  let message = '';

  switch (type) {
    case 'new_request':
      subject = 'Neue Event-Anfrage';
      message = `Guten Tag,\n\n` +
                `eine neue Event-Anfrage steht zur Bearbeitung bereit.\n\n` +
                `EVENT-DETAILS\n` +
                `${'-'.repeat(50)}\n` +
                `Event: ${eventData.title || eventData.event_name || 'Unbekannt'}\n` +
                `Antragsteller: ${eventData.requester_name}\n` +
                `Kontakt: ${eventData.requester_email}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE') : 'N/A'}\n` +
                `Kategorie: ${eventData.event_type || 'N/A'}\n\n` +
                `Zum Admin-Panel: ${window.location.origin}/admin\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Ihr Event-Management-System`;
      break;

    default:
      subject = 'Event-Anfrage Update';
      message = `Event: ${eventData.title || eventData.event_name}\n` +
                `Von: ${eventData.requester_name}\n\n` +
                `Weitere Details im Admin-Panel.`;
  }

  // Generate HTML content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">${subject}</h2>
      <div style="white-space: pre-line; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    </div>
  `;

  return await sendEmail(adminEmails, subject, message, htmlContent);
}

/**
 * Test email functionality
 * @param {string} testEmail - Email address to send test to
 */
export const sendTestEmail = async (testEmail) => {
  const subject = 'Test-E-Mail vom Event-Management-System';
  const message = `Guten Tag,\n\n` +
                  `dies ist eine Test-E-Mail.\n\n` +
                  `Wenn Sie diese E-Mail erhalten, funktioniert Ihr E-Mail-System korrekt.\n\n` +
                  `Mit freundlichen Grüßen\n` +
                  `Ihr Event-Management-System`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <div style="white-space: pre-line; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    </div>
  `;
  
  return await sendEmail([testEmail], subject, message, htmlContent);
}

