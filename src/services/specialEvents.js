import { supabase } from '../lib/supabase'

const BUCKET = 'special-event-images'

// Simple session cache to speed up mobile loads
const CACHE_KEY = 'special_events_active_cache_v1'
const DETAIL_CACHE_PREFIX = 'special_event_detail_'
const ENTRIES_CACHE_PREFIX = 'special_event_entries_'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.expiresAt || Date.now() > parsed.expiresAt) return null
    return parsed.data || null
  } catch {
    return null
  }
}

function writeCache(data, ttlMs = CACHE_TTL_MS) {
  try {
    const payload = { data, expiresAt: Date.now() + ttlMs }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

export async function getActiveSpecialEvents({ useCache = true } = {}) {
  const nocache = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('nocache')
  console.log('[SE] getActiveSpecialEvents called. useCache=', useCache, 'nocache=', nocache)
  if (useCache && !nocache) {
    const cached = readCache()
    if (cached) return cached
  }

  // Fetch minimal fields needed for UI with a timeout + REST fallback
  const fetchPromise = supabase
    .from('special_events')
    .select('id, title, slug, description, starts_at, is_active')
    .eq('is_active', true)
    .order('starts_at', { ascending: false })
    .limit(1)

  const timeoutMs = 3000
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id)
      reject(new Error('timeout'))
    }, timeoutMs)
  })

  try {
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
    if (error) throw error
    let list = data || []
    console.log('[SE] client getActiveSpecialEvents result count=', list.length)
    if (list.length === 0) {
      // Retry without order in case null starts_at interferes
      const { data: data2, error: err2 } = await supabase
        .from('special_events')
        .select('id, title, slug, description, starts_at, is_active')
        .eq('is_active', true)
        .limit(1)
      if (err2) console.warn('[SE] retry without order error:', err2.message)
      if (!err2 && data2 && data2.length > 0) list = data2
    }
    if (!nocache) writeCache(list)
    return list
  } catch (e) {
    console.warn('[SE] client getActiveSpecialEvents failed:', e?.message)
    // Try REST fallback with anon key
    try {
      const url = process.env.REACT_APP_SUPABASE_URL
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY
      if (url && key) {
        const controller = new AbortController()
        const to = setTimeout(() => controller.abort(), timeoutMs)
        let resp = await fetch(`${url}/rest/v1/special_events?select=id,title,slug,description,starts_at,is_active&is_active=eq.true&order=starts_at.desc&limit=1`, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
          signal: controller.signal
        })
        clearTimeout(to)
        if (!resp.ok) {
          // Retry without order
          resp = await fetch(`${url}/rest/v1/special_events?select=id,title,slug,description,starts_at,is_active&is_active=eq.true&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
          })
        }
        if (!resp.ok) {
          // Retry without filter; RLS will still enforce is_active=true
          resp = await fetch(`${url}/rest/v1/special_events?select=id,title,slug,description,starts_at,is_active&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
          })
        }
        if (resp.ok) {
          const json = await resp.json()
          const list = Array.isArray(json) ? json : []
          console.log('[SE] REST getActiveSpecialEvents result count=', list.length)
          if (!nocache) writeCache(list)
          return list
        }
      }
    } catch {}
    const cached = readCache()
    if (cached) return cached
    return []
  }
}

export async function prefetchActiveSpecialEvents() {
  try {
    // Use network, refresh cache but don't throw
    const { data, error } = await supabase
      .from('special_events')
      .select('id, title, slug, description, starts_at, is_active')
      .eq('is_active', true)
      .order('starts_at', { ascending: false })
    if (!error) writeCache(data || [])
  } catch {
    // ignore
  }
}

export async function getSpecialEventBySlug(slug) {
  const nocache = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('nocache')
  console.log('[SE] getSpecialEventBySlug:', slug, 'nocache=', nocache)
  // Try detail cache first
  try {
    const cached = sessionStorage.getItem(DETAIL_CACHE_PREFIX + slug)
    if (cached && !nocache) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt) {
        console.log('[SE] detail cache hit for slug', slug)
        return parsed.data
      }
    }
  } catch {}

  const { data, error } = await supabase
    .from('special_events')
    .select('id, title, slug, description, starts_at, is_active')
    .eq('slug', slug)
    .single()

  if (error) {
    console.warn('[SE] getSpecialEventBySlug error:', error.message)
    throw error
  }
  console.log('[SE] getSpecialEventBySlug found?', !!data)
  try {
    if (!nocache) sessionStorage.setItem(DETAIL_CACHE_PREFIX + slug, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }))
  } catch {}
  return data
}

export async function getSpecialEventBySlugREST(slug) {
  try {
    const url = process.env.REACT_APP_SUPABASE_URL
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY
    if (!url || !key) return null
    const resp = await fetch(`${url}/rest/v1/special_events?slug=eq.${encodeURIComponent(slug)}&select=id,title,slug,description,starts_at,is_active&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return Array.isArray(json) && json.length > 0 ? json[0] : null
  } catch (e) {
    console.warn('[SE] getSpecialEventBySlugREST error:', e?.message)
    return null
  }
}

export async function getFirstSpecialEventAny() {
  console.log('[SE] getFirstSpecialEventAny called')
  // Attempt to fetch any single event regardless of is_active
  try {
    const { data, error } = await supabase
      .from('special_events')
      .select('id, title, slug, description, starts_at, is_active')
      .limit(1)
    if (error) console.warn('[SE] getFirstSpecialEventAny client error:', error.message)
    if (!error && data && data.length > 0) {
      console.log('[SE] getFirstSpecialEventAny client found slug=', data[0]?.slug)
      return data[0]
    }
  } catch {}

  // REST fallback
  try {
    const url = process.env.REACT_APP_SUPABASE_URL
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY
    if (url && key) {
      const resp = await fetch(`${url}/rest/v1/special_events?select=id,title,slug,description,starts_at,is_active&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      })
      if (resp.ok) {
        const json = await resp.json()
        if (Array.isArray(json) && json.length > 0) {
          console.log('[SE] getFirstSpecialEventAny REST found slug=', json[0]?.slug)
          return json[0]
        }
      }
    }
  } catch {}
  return null
}

export async function listApprovedEntries(eventId) {
  const nocache = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('nocache')
  console.log('[SE] listApprovedEntries for eventId=', eventId, 'nocache=', nocache)
  // Cache per event to speed up mobile
  try {
    if (!nocache) {
      const cached = sessionStorage.getItem(ENTRIES_CACHE_PREFIX + eventId)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt) {
          console.log('[SE] entries cache hit. count=', parsed.data?.length || 0)
          return parsed.data || []
        }
      }
    }
  } catch {}

  const { data, error } = await supabase
    .from('special_event_entries')
    .select('id, title, description, image_path, status, approved_at')
    .eq('event_id', eventId)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })

  if (error) {
    console.warn('[SE] listApprovedEntries error:', error.message)
    throw error
  }
  const list = data || []
  console.log('[SE] listApprovedEntries fetched count=', list.length)
  try {
    if (!nocache) sessionStorage.setItem(ENTRIES_CACHE_PREFIX + eventId, JSON.stringify({ data: list, expiresAt: Date.now() + CACHE_TTL_MS }))
  } catch {}
  return list
}

export async function listApprovedEntriesREST(eventId) {
  try {
    const url = process.env.REACT_APP_SUPABASE_URL
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY
    if (!url || !key) return []
    const resp = await fetch(`${url}/rest/v1/special_event_entries?event_id=eq.${encodeURIComponent(eventId)}&status=eq.approved&select=id,title,description,image_path,status,approved_at&order=approved_at.desc`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    })
    if (!resp.ok) return []
    const json = await resp.json()
    return Array.isArray(json) ? json : []
  } catch (e) {
    console.warn('[SE] listApprovedEntriesREST error:', e?.message)
    return []
  }
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

  // Check if user already voted for this specific entry
  const { data: existing } = await supabase
    .from('special_event_votes')
    .select('*')
    .eq('entry_id', entryId)
    .eq('voter_anon_token', voter_anon_token)
    .single()

  // If already voted for this entry, do nothing
  if (existing) return existing

  // Insert new vote
  const { data, error } = await supabase
    .from('special_event_votes')
    .insert({ event_id: eventId, entry_id: entryId, voter_anon_token })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function revokeVote({ eventId, entryId }) {
  const voter_anon_token = localStorage.getItem('se_voter_anon_token')
  if (!voter_anon_token) return
  
  // Use the security definer function to delete the vote
  // This bypasses RLS and ensures only votes with matching token are deleted
  const { error } = await supabase.rpc('delete_vote_by_token', {
    entry_id_param: entryId,
    token_param: voter_anon_token
  })

  if (error) {
    console.error('Error revoking vote:', error)
    throw error
  }
}

export async function getUserVoteForEntry(entryId) {
  const voter_anon_token = localStorage.getItem('se_voter_anon_token')
  if (!voter_anon_token) return null
  
  const { data, error } = await supabase
    .from('special_event_votes')
    .select('*')
    .eq('entry_id', entryId)
    .eq('voter_anon_token', voter_anon_token)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
  return data || null
}

export async function getVoteCountForEntry(entryId) {
  const { count, error } = await supabase
    .from('special_event_votes')
    .select('*', { count: 'exact', head: true })
    .eq('entry_id', entryId)

  if (error) throw error
  return count || 0
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

export async function listPendingEntriesREST(eventId) {
  try {
    const url = process.env.REACT_APP_SUPABASE_URL
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY
    if (!url || !key) return []
    const resp = await fetch(`${url}/rest/v1/special_event_entries?event_id=eq.${encodeURIComponent(eventId)}&status=eq.pending&select=id,title,description,image_path,submitter_contact,status,created_at&order=created_at.asc`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    })
    if (!resp.ok) return []
    const json = await resp.json()
    return Array.isArray(json) ? json : []
  } catch (e) {
    console.warn('[SE] listPendingEntriesREST error:', e?.message)
    return []
  }
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

export async function approveEntryREST(entryId) {
  try {
    const url = process.env.REACT_APP_SUPABASE_URL
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env')
    const resp = await fetch(`${url}/rest/v1/special_event_entries?id=eq.${encodeURIComponent(entryId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: 'approved', approved_at: new Date().toISOString() })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json()
    return Array.isArray(json) ? json[0] : json
  } catch (e) {
    console.warn('[SE] approveEntryREST error:', e?.message)
    throw e
  }
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

export async function rejectEntryREST(entryId) {
  try {
    const url = process.env.REACT_APP_SUPABASE_URL
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env')
    const resp = await fetch(`${url}/rest/v1/special_event_entries?id=eq.${encodeURIComponent(entryId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: 'rejected' })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json()
    return Array.isArray(json) ? json[0] : json
  } catch (e) {
    console.warn('[SE] rejectEntryREST error:', e?.message)
    throw e
  }
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

export async function getVoteStatsForEvent(eventId) {
  const { data, error } = await supabase
    .from('special_event_vote_stats')
    .select('*')
    .eq('event_id', eventId)
    .order('vote_count', { ascending: false })

  if (error) throw error
  return data || []
}



