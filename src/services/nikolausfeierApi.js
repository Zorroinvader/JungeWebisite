// FILE OVERVIEW
// - Purpose: Handle all data access and storage operations for Nikolausfeier events (video uploads, beer drink time, DSGVO consent).
// - Used by: NikolausfeierPage and related components for creating and listing Nikolausfeier entries.
// - Notes: Production service file. Handles video uploads to Supabase storage and database operations.

import { supabase } from '../lib/supabase'
import { getSupabaseUrl, getSupabaseAnonKey } from '../utils/secureConfig'

const BUCKET = 'event-videos'

export async function createNikolausfeierEntry({ video_name, participant_name, videoFile, beer_drink_time, dsgvo_consent, drinking_rules_consent, replaces_entry_id }) {
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
  const { data, error } = await supabase
    .from('nikolausfeier_events')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
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

export async function approveNikolausfeierEntry(entryId) {
  const { data: { user } } = await supabase.auth.getUser()
  
  // First, get the entry to check if it replaces another entry
  const { data: entry, error: fetchError } = await supabase
    .from('nikolausfeier_events')
    .select('replaces_entry_id')
    .eq('id', entryId)
    .single()
  
  if (fetchError) throw fetchError
  
  // Update entry to approved
  const { data: updated, error } = await supabase
    .from('nikolausfeier_events')
    .update({ 
      status: 'approved', 
      approved_at: new Date().toISOString(),
      approved_by: user?.id || null
    })
    .eq('id', entryId)
    .select('*')

  if (error) throw error
  
  // If this entry replaces another, delete the old entry
  if (entry?.replaces_entry_id) {
    try {
      await deleteNikolausfeierEntry(entry.replaces_entry_id)
    } catch (deleteError) {
      console.warn('Could not delete replaced entry:', deleteError)
      // Don't fail the approval if deletion fails
    }
  }
  
  if (!updated || updated.length === 0) {
    throw new Error('Eintrag nicht gefunden')
  }
  return updated[0]
}

export async function rejectNikolausfeierEntry(entryId) {
  const { data: updated, error } = await supabase
    .from('nikolausfeier_events')
    .update({ status: 'rejected' })
    .eq('id', entryId)
    .select('*')

  if (error) throw error
  if (!updated || updated.length === 0) {
    throw new Error('Eintrag nicht gefunden')
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

