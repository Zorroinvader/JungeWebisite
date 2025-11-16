// FILE OVERVIEW
// - Purpose: Email API service that handles all email operations: sending notifications (user/admin), managing admin email lists, and test emails via Supabase Edge Function (Resend API).
// - Used by: settingsHelper.js, admin settings, and email configuration flows for sending emails and managing admin recipient lists.
// - Notes: Production service file. Consolidates email sending and admin email management. Uses secureConfig for safe key access.

import { getSupabaseUrl, getSupabaseAnonKey, sanitizeError, secureLog } from '../utils/secureConfig'
import { supabase } from '../lib/supabase'

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
    return false;
  }

  // SECURITY: Use secure getters to prevent key exposure
  let supabaseUrl, supabaseKey
  try {
    supabaseUrl = getSupabaseUrl()
    supabaseKey = getSupabaseAnonKey()
  } catch (error) {
    // SECURITY: Never expose keys in error messages
    secureLog('error', 'Failed to get Supabase configuration', sanitizeError(error))
    return false
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
      return true;
    } else {
      throw new Error(result.error || 'Unknown error');
    }

  } catch (error) {
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
                `Junge Gesellschaft Wedes-Wedel`;
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
                `Junge Gesellschaft Wedes-Wedel`;
      break;

    case 'rejected':
      subject = 'Ihre Event-Anfrage - Update';
      message = `Guten Tag ${eventData.requester_name || ''},\n\n` +
                `leider konnte Ihre Event-Anfrage nicht angenommen werden.\n\n` +
                `Event: ${eventData.title || eventData.event_name}\n` +
                `Zeitraum: ${eventData.start_date ? new Date(eventData.start_date).toLocaleDateString('de-DE') : ''}\n\n` +
                `Für Rückfragen kontaktieren Sie uns bitte.\n\n` +
                `Mit freundlichen Grüßen\n` +
                `Junge Gesellschaft Wedes-Wedel`;
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
                `Das System :D`;
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
                  `Das System :D`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <div style="white-space: pre-line; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    </div>
  `;
  
  return await sendEmail([testEmail], subject, message, htmlContent);
}

// ============================================================================
// ADMIN EMAIL MANAGEMENT - Functions for managing admin notification emails
// ============================================================================

// SECURITY: Use secure getters to prevent key exposure
const getSupabaseConfig = () => ({
  url: getSupabaseUrl(),
  key: getSupabaseAnonKey()
})

/**
 * Get all active admin notification emails from database
 * @returns {Promise<Array<{id: string, email: string, added_at: string, notes: string}>>}
 */
export async function getAdminNotificationEmails() {
  try {
    // SECURITY: Use secure getters to prevent key exposure
    const { url, key } = getSupabaseConfig()

    const response = await fetch(`${url}/rest/v1/admin_notification_emails?select=id,email,added_at,notes,is_active&is_active=eq.true&order=added_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (!response.ok) {
      await response.text()
      return []
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    return []
  }
}

/**
 * Add a new admin notification email
 * @param {string} email - Email address to add
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>}
 */
export async function addAdminNotificationEmail(email, notes = '') {
  const insertData = {
    email: email.toLowerCase().trim(),
    notes: notes.trim() || null,
    is_active: true
  }
  
  try {
    // SECURITY: Use secure getters to prevent key exposure
    const { url, key } = getSupabaseConfig()
    
    const response = await fetch(`${url}/rest/v1/admin_notification_emails`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(insertData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add email: HTTP ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    return result[0] || result
  } catch (error) {
    throw error
  }
}

/**
 * Remove an admin notification email
 * @param {string} id - Email record ID
 * @returns {Promise<void>}
 */
export async function removeAdminNotificationEmail(id) {
  const { error } = await supabase
    .from('admin_notification_emails')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Deactivate an admin notification email
 * @param {string} id - Email record ID
 * @returns {Promise<void>}
 */
export async function deactivateAdminNotificationEmail(id) {
  const { error } = await supabase
    .from('admin_notification_emails')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

/**
 * Get admin emails as a simple array of strings
 * @returns {Promise<Array<string>>}
 */
export async function getAdminEmailsList() {
  const emails = await getAdminNotificationEmails()
  return emails.map(e => e.email)
}

