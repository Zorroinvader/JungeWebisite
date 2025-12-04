// FILE OVERVIEW
// - Purpose: Handle all data access and storage operations for Nikolausfeier events (video uploads, beer drink time, DSGVO consent).
// - Used by: NikolausfeierPage and related components for creating and listing Nikolausfeier entries.
// - Notes: Production service file. Handles video uploads to Supabase storage and database operations.

import { supabase } from '../lib/supabase'
import { getSupabaseUrl, getSupabaseAnonKey } from '../utils/secureConfig'

const BUCKET = 'event-videos'

export async function createNikolausfeierEntry({ video_name, participant_name, videoFile, beer_drink_time, dsgvo_consent, drinking_rules_consent, time_verification_consent, replaces_entry_id }) {
  if (!video_name || !video_name.trim()) {
    throw new Error('Bitte geben Sie einen Namen für das Video/Clip ein')
  }
  if (!participant_name || !participant_name.trim()) {
    throw new Error('Bitte geben Sie Ihren Namen ein')
  }
  if (!videoFile) {
    throw new Error('Bitte laden Sie ein Video hoch')
  }
  if (beer_drink_time === null || beer_drink_time === undefined || beer_drink_time < 0) {
    throw new Error('Bitte geben Sie eine gültige Bier-Trinkzeit ein')
  }
  if (!drinking_rules_consent) {
    throw new Error('Bitte akzeptieren Sie die Trinkregeln')
  }
  if (!dsgvo_consent) {
    throw new Error('Bitte bestätigen Sie die DSGVO-Einwilligung')
  }
  if (!time_verification_consent) {
    throw new Error('Bitte bestätigen Sie, dass die Zeit im Video sichtbar sein muss')
  }

  // Validate video file
  const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  const maxFileSize = 100 * 1024 * 1024 // 100MB
  if (!allowedVideoTypes.includes(videoFile.type)) {
    throw new Error('Nur Video-Dateien sind erlaubt (MP4, MOV, AVI, WEBM)')
  }
  if (videoFile.size > maxFileSize) {
    throw new Error('Die Video-Datei ist zu groß (max. 100MB)')
  }

  // Generate unique filename
  const ext = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4'
  const filename = `${crypto.randomUUID()}.${ext}`
  const path = `nikolausfeier/${filename}`

  // Upload video to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, videoFile, { 
      cacheControl: '3600', 
      upsert: false,
      contentType: videoFile.type
    })

  if (uploadError) {
    throw new Error(`Fehler beim Hochladen des Videos: ${uploadError.message}`)
  }

  // Get public URL for the video
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const video_url = urlData?.publicUrl || path

  // Insert record into database with pending status
  const insertData = {
      video_name: video_name.trim(),
      participant_name: participant_name.trim(),
      video_url,
      beer_drink_time: parseInt(beer_drink_time, 10),
      dsgvo_consent: true,
      drinking_rules_consent: drinking_rules_consent,
      time_verification_consent: time_verification_consent,
      status: 'pending',
      created_at: new Date().toISOString()
  }
  
  // Add replaces_entry_id if provided
  if (replaces_entry_id) {
    insertData.replaces_entry_id = replaces_entry_id
  }
  
  const { data: inserted, error } = await supabase
    .from('nikolausfeier_events')
    .insert(insertData)
    .select('*')
    .single()

  if (error) {
    // Rollback uploaded file if DB insert fails
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }

  return inserted
}

export async function listNikolausfeierEntries() {
  // Note: This function is called from the client, so localStorage is available
  // Get device entries from localStorage to show user's own entries
  let deviceEntryIds = []
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('nikolausfeier_device_entries')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          deviceEntryIds = parsed
        }
      }
    } catch (e) {
      console.warn('Error reading device entries from localStorage:', e)
    }
  }

  // Get all approved entries
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching approved entries:', error)
    throw error
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // Filter: show only user's own entries OR publicly published entries
  const filtered = data.filter(entry => {
    // Show if it's from this device
    if (deviceEntryIds.length > 0 && deviceEntryIds.includes(entry.id)) {
      return true
    }
    // Show if it's publicly published
    if (entry.is_publicly_published === true) {
      return true
    }
    // Otherwise hide it
    return false
  })
  
  // If we have device entry IDs but none matched, try to sync: check if any approved entries
  // should be added to localStorage (in case localStorage was cleared or entry was approved elsewhere)
  if (deviceEntryIds.length > 0 && filtered.length === 0) {
    // Check if any of the device entry IDs exist in the approved entries
    const matchingEntries = data.filter(entry => deviceEntryIds.includes(entry.id))
    if (matchingEntries.length > 0) {
      // These should have been shown, so return them
      return matchingEntries
    }
  }
  
  // Sort by beer_drink_time (ascending - lowest time = winner) if all videos are public
  // Check if all approved entries in DB are public, not just filtered ones
  const allPublic = data.length > 0 && data.every(entry => entry.is_publicly_published === true)
  if (allPublic && filtered.length > 0) {
    filtered.sort((a, b) => a.beer_drink_time - b.beer_drink_time)
  }
  
  return filtered
}

export async function getUserEntriesByParticipantName(participantName) {
  if (!participantName || !participantName.trim()) {
    return []
  }
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('id, video_name, participant_name, created_at, status')
    .eq('participant_name', participantName.trim())
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getEntriesByIds(entryIds) {
  if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
    return []
  }
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('id, video_name, participant_name, created_at, status, replaces_entry_id')
    .in('id', entryIds)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getNikolausfeierEntry(entryId) {
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('*')
    .eq('id', entryId)
    .single()

  if (error) throw error
  return data
}

export async function listPendingNikolausfeierEntries() {
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  
  // For entries that replace another, fetch the replaced entry details
  const entriesWithReplaced = await Promise.all(
    (data || []).map(async (entry) => {
      if (entry.replaces_entry_id) {
        try {
          const replacedEntry = await getNikolausfeierEntry(entry.replaces_entry_id)
          return { ...entry, replaced_entry: replacedEntry }
        } catch (err) {
          // If replaced entry doesn't exist anymore, just continue
          return { ...entry, replaced_entry: null }
        }
      }
      return entry
    })
  )
  
  return entriesWithReplaced || []
}

export async function listApprovedNikolausfeierEntries() {
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('*')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function checkIfAllVideosArePublic() {
  // Check if all approved entries are publicly published
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('id, is_publicly_published')
    .eq('status', 'approved')

  if (error) throw error
  
  if (!data || data.length === 0) {
    return false
  }
  
  // Return true only if ALL approved entries are publicly published
  return data.every(entry => entry.is_publicly_published === true)
}

export async function getDeclinedEntryFromDevice() {
  // Get device entries from localStorage
  let deviceEntryIds = []
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('nikolausfeier_device_entries')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          deviceEntryIds = parsed
        }
      }
    } catch (e) {
      console.warn('Error reading device entries from localStorage:', e)
      return null
    }
  }
  
  if (deviceEntryIds.length === 0) {
    return null
  }
  
  // Get the most recent declined entry from this device
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('*')
    .in('id', deviceEntryIds)
    .eq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No declined entries found
      return null
    }
    throw error
  }
  
  return data
}

export async function publishAllNikolausfeierVideos() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Nicht autorisiert')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    throw new Error('Nur Administratoren können Videos veröffentlichen')
  }

  // Update all approved entries to be publicly published
  const { data: updated, error } = await supabase
    .from('nikolausfeier_events')
    .update({
      is_publicly_published: true,
      published_at: new Date().toISOString(),
      published_by: user.id
    })
    .eq('status', 'approved')
    .eq('is_publicly_published', false)
    .select('*')

  if (error) throw error
  return updated || []
}

export async function approveNikolausfeierEntry(entryId) {
  // First, get the entry to check if it exists and if it replaces another entry
  const { data: entry, error: fetchError } = await supabase
    .from('nikolausfeier_events')
    .select('id, replaces_entry_id, status')
    .eq('id', entryId)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Eintrag nicht gefunden')
    }
    throw fetchError
  }
  
  if (!entry) {
    throw new Error('Eintrag nicht gefunden')
  }
  
  // Check if entry is already approved or rejected
  if (entry.status === 'approved') {
    throw new Error('Eintrag ist bereits freigegeben')
  }
  
  if (entry.status === 'rejected') {
    throw new Error('Eintrag wurde bereits abgelehnt')
  }
  
  if (entry.status !== 'pending') {
    throw new Error(`Eintrag hat einen unerwarteten Status: ${entry.status}`)
  }
  
  // Get current user for approved_by field
  const { data: { user } } = await supabase.auth.getUser()
  
  // Update entry to approved
  // RLS policy will enforce admin-only access
  // We already checked the status above, so we can update directly
  const { data: updated, error } = await supabase
    .from('nikolausfeier_events')
    .update({ 
      status: 'approved', 
      approved_at: new Date().toISOString(),
      approved_by: user?.id || null
    })
    .eq('id', entryId)
    .select('*')

  if (error) {
    console.error('Error updating entry:', error)
    // If RLS blocks the update, provide a clearer error message
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
      throw new Error('Nicht autorisiert: Nur Administratoren können Einträge freigeben')
    }
    throw error
  }
  
  if (!updated || updated.length === 0) {
    // Re-fetch the entry to see what the current status is
    const { data: currentEntry } = await supabase
      .from('nikolausfeier_events')
      .select('status')
      .eq('id', entryId)
      .single()
    
    if (currentEntry) {
      if (currentEntry.status === 'approved') {
        throw new Error('Eintrag wurde bereits von einem anderen Administrator freigegeben')
      } else if (currentEntry.status === 'rejected') {
        throw new Error('Eintrag wurde bereits abgelehnt')
      } else {
        throw new Error(`Eintrag konnte nicht aktualisiert werden. Aktueller Status: ${currentEntry.status}`)
      }
    } else {
      throw new Error('Eintrag konnte nicht aktualisiert werden. Eintrag wurde möglicherweise gelöscht.')
    }
  }
  
  // If this entry replaces another, delete the old entry
  if (entry?.replaces_entry_id) {
    try {
      await deleteNikolausfeierEntry(entry.replaces_entry_id)
    } catch (deleteError) {
      console.warn('Could not delete replaced entry:', deleteError)
      // Don't fail the approval if deletion fails
    }
  }
  
  return updated[0]
}

export async function rejectNikolausfeierEntry(entryId) {
  // First, check if entry exists
  const { data: entry, error: fetchError } = await supabase
    .from('nikolausfeier_events')
    .select('id, status')
    .eq('id', entryId)
    .single()
  
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Eintrag nicht gefunden')
    }
    throw fetchError
  }
  
  if (!entry) {
    throw new Error('Eintrag nicht gefunden')
  }
  
  // Update entry to rejected
  // RLS policy will enforce admin-only access
  // We already checked the status above, so we can update directly
  const { data: updated, error } = await supabase
    .from('nikolausfeier_events')
    .update({ status: 'rejected' })
    .eq('id', entryId)
    .select('*')

  if (error) {
    console.error('Error rejecting entry:', error)
    // If RLS blocks the update, provide a clearer error message
    if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
      throw new Error('Nicht autorisiert: Nur Administratoren können Einträge ablehnen')
    }
    throw error
  }
  
  if (!updated || updated.length === 0) {
    throw new Error('Eintrag konnte nicht abgelehnt werden. Möglicherweise wurde er bereits bearbeitet.')
  }
  
  return updated[0]
}

export async function deleteNikolausfeierEntry(id) {
  // Get entry to find video path
  const entry = await getNikolausfeierEntry(id)
  if (!entry) throw new Error('Eintrag nicht gefunden')

  // Extract path from video_url
  let videoPath = entry.video_url
  if (videoPath.includes('/storage/v1/object/public/')) {
    // Full public URL - extract path after bucket name
    const parts = videoPath.split('/storage/v1/object/public/event-videos/')
    videoPath = parts.length > 1 ? parts[1] : null
  } else if (videoPath.includes('/storage/v1/object/sign/')) {
    // Signed URL - extract path
    const parts = videoPath.split('/storage/v1/object/sign/event-videos/')
    if (parts.length > 1) {
      videoPath = parts[1].split('?')[0] // Remove query params
    }
  }
  
  // Ensure path starts with nikolausfeier/
  if (videoPath && !videoPath.startsWith('nikolausfeier/')) {
    videoPath = `nikolausfeier/${videoPath}`
  }

  // Delete from storage
  if (videoPath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([videoPath])
    // Don't fail if storage deletion fails (file might not exist)
    if (storageError) {
      console.warn('Storage deletion warning:', storageError)
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('nikolausfeier_events')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export function getPublicVideoUrl(videoUrl) {
  // If already a full URL, return as is
  if (videoUrl.startsWith('http')) {
    return videoUrl
  }
  // Otherwise, construct public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(videoUrl)
  return data?.publicUrl || videoUrl
}

