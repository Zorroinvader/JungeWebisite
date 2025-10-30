import { supabase } from '../lib/supabase'

/**
 * Get all active admin notification emails from database
 * @returns {Promise<Array<{id: string, email: string, added_at: string, notes: string}>>}
 */
export async function getAdminNotificationEmails() {
  console.log('📬 Fetching admin emails...')
  
  const { data, error } = await supabase
    .from('admin_notification_emails')
    .select('*')
    .eq('is_active', true)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching admin emails:', error)
    return []
  }

  console.log('✅ Fetched', data?.length || 0, 'admin emails')
  return data || []
}

/**
 * Add a new admin notification email
 * @param {string} email - Email address to add
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>}
 */
export async function addAdminNotificationEmail(email, notes = '') {
  console.log('📧 Attempting to add email:', email)
  
  const insertData = {
    email: email.toLowerCase().trim(),
    notes: notes.trim() || null,
    is_active: true
  }
  
  console.log('📝 Insert data:', insertData)
  
  try {
    // Use HTTP REST API instead of Supabase client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
    
    console.log('🚀 Making HTTP POST request to Supabase REST API...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/admin_notification_emails`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(insertData)
    })
    
    console.log('📥 HTTP response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ HTTP error:', errorText)
      throw new Error(`Failed to add email: HTTP ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Email added successfully via HTTP:', result)
    
    return result[0] || result
  } catch (error) {
    console.error('❌ Failed to add email:', error)
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

