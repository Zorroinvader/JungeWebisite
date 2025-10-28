import { supabase } from '../lib/supabase'

const BUCKET = 'special-event-images'

export async function getActiveSpecialEvents() {
  const { data, error } = await supabase
    .from('special_events')
    .select('*')
    .eq('is_active', true)
    .order('starts_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSpecialEventBySlug(slug) {
  const { data, error } = await supabase
    .from('special_events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function listApprovedEntries(eventId) {
  const { data, error } = await supabase
    .from('special_event_entries')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })

  if (error) throw error
  return data || []
}

export function getPublicImageUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data?.publicUrl || ''
}

function getOrCreateAnonToken() {
  const key = 'se_voter_anon_token'
  let token = localStorage.getItem(key)
  if (!token) {
    token = crypto.getRandomValues(new Uint32Array(4)).join('-')
    localStorage.setItem(key, token)
  }
  return token
}

export async function uploadEntry({ event, file, title, description, contact }) {
  if (!file) throw new Error('Datei fehlt')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const path = `${event.slug}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data: inserted, error } = await supabase
    .from('special_event_entries')
    .insert({
      event_id: event.id,
      title: title || null,
      description: description || null,
      image_path: path,
      submitter_contact: contact || null,
      status: 'pending'
    })
    .select('*')
    .single()

  if (error) {
    // Rollback uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
  return inserted
}

export async function castVote({ eventId, entryId }) {
  const voter_anon_token = getOrCreateAnonToken()

  // Upsert: one vote per anon token per event; change vote by updating entry_id
  const { data, error } = await supabase
    .from('special_event_votes')
    .upsert(
      { event_id: eventId, entry_id: entryId, voter_anon_token },
      { onConflict: 'event_id,voter_anon_token' }
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function revokeVote({ eventId }) {
  const voter_anon_token = localStorage.getItem('se_voter_anon_token')
  if (!voter_anon_token) return
  // Delete vote by matching anon token + event
  const { error } = await supabase
    .from('special_event_votes')
    .delete()
    .match({ event_id: eventId, voter_anon_token })

  if (error) throw error
}

export async function listPendingEntries(eventId) {
  const { data, error } = await supabase
    .from('special_event_entries')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function approveEntry(entryId) {
  const { data, error } = await supabase
    .from('special_event_entries')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function rejectEntry(entryId) {
  const { data, error } = await supabase
    .from('special_event_entries')
    .update({ status: 'rejected' })
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getUserUploadForEvent(eventId) {
  // Try to find by anon token saved in localStorage (stored as metadata via a future enhancement)
  // Fallback: return the most recent pending/approved entry for this event from this browser (not guaranteed)
  const { data, error } = await supabase
    .from('special_event_entries')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function deleteUserUpload(entryId, imagePath) {
  // Delete associated votes for this entry (public temp policy enabled)
  const { error: votesError } = await supabase
    .from('special_event_votes')
    .delete()
    .eq('entry_id', entryId)
  if (votesError) throw votesError

  // Delete DB entry
  const { error: delEntryError } = await supabase
    .from('special_event_entries')
    .delete()
    .eq('id', entryId)
  if (delEntryError) throw delEntryError

  // Delete storage file
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([imagePath])
  if (storageError) throw storageError
}



