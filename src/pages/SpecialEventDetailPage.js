import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Upload, ImagePlus, Trash2, RefreshCw } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getSpecialEventBySlug,
  listApprovedEntries,
  uploadEntry,
  castVote,
  revokeVote,
  getPublicImageUrl,
  getUserUploadForEvent,
  deleteUserUpload,
  getUserVoteForEntry,
  getVoteStatsForEvent
} from '../services/specialEvents'

const SpecialEventDetailPage = () => {
  const { user, isAdmin } = useAuth()
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [voting, setVoting] = useState(false)
  const [alreadyUploaded, setAlreadyUploaded] = useState(false)
  const [userEntry, setUserEntry] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [currentVoteEntryId, setCurrentVoteEntryId] = useState('')
  const [notification, setNotification] = useState(null) // { type: 'success'|'error'|'info'|'warning', text: string }
  const [showMoveLikeConfirm, setShowMoveLikeConfirm] = useState(false)
  const [pendingLikeEntryId, setPendingLikeEntryId] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [userLikes, setUserLikes] = useState({}) // {entryId: true/false}
  const fileInputCameraRef = useRef(null)
  const fileInputGalleryRef = useRef(null)
  const [refreshingEntries, setRefreshingEntries] = useState(false)
  const [showVotePrompt, setShowVotePrompt] = useState(false)
  const [voteStats, setVoteStats] = useState([])
  const [refreshingResults, setRefreshingResults] = useState(false)

  const voterToken = useMemo(() => localStorage.getItem('se_voter_anon_token') || '', [])

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        // Seed from cache synchronously for instant paint
        try {
          const raw = sessionStorage.getItem('special_event_detail_' + slug)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.data && parsed.expiresAt && Date.now() < parsed.expiresAt) {
              setEvent(parsed.data)
            }
          }
        } catch {}

        let ev = null
        try {
          // Try REST first (simplest path, anon-friendly)
          const { getSpecialEventBySlugREST } = await import('../services/specialEvents')
          ev = await getSpecialEventBySlugREST(slug)
          if (!ev) {
            ev = await getSpecialEventBySlug(slug)
          }
        } catch (e) {
        }
        if (!ev) {
          // Fallback: load the first available event regardless of status
          const { getFirstSpecialEventAny } = await import('../services/specialEvents')
          ev = await getFirstSpecialEventAny()
        }
        if (!ev) {
          // Last-resort: use cached active events (banner cache)
          try {
            const raw = sessionStorage.getItem('special_events_active_cache_v1')
            if (raw) {
              const parsed = JSON.parse(raw)
              const list = Array.isArray(parsed?.data) ? parsed.data : []
              if (list.length) {
                const bySlug = list.find(x => x.slug === slug)
                ev = bySlug || list[0]
              }
            }
          } catch {}
        }
        if (!isMounted) return
        setEvent(ev)
        const uploadedFlag = localStorage.getItem(`se_uploaded_${ev.id}`)
        setAlreadyUploaded(!!uploadedFlag)
        if (uploadedFlag) {
          const userUpload = await getUserUploadForEvent(ev.id)
          if (userUpload) setUserEntry(userUpload)
        }
        if (ev && ev.id) {
          let latestEntries = []
          // Try entries cache first
          try {
            const rawEntries = sessionStorage.getItem('special_event_entries_' + ev.id)
            if (rawEntries) {
              const parsed = JSON.parse(rawEntries)
              if (parsed?.data && parsed.expiresAt && Date.now() < parsed.expiresAt) {
                setEntries(parsed.data)
                latestEntries = parsed.data
              }
            }
          } catch {}

          try {
            const list = await listApprovedEntries(ev.id)
            if (!isMounted) return
            setEntries(list)
            latestEntries = list
          } catch (_) {
            // ignore entries failure
          }
          // Load user likes for all entries
          if (latestEntries && latestEntries.length) {
            const likesMap = {}
            for (const entry of latestEntries) {
              const vote = await getUserVoteForEntry(entry.id)
              likesMap[entry.id] = !!vote
            }
            setUserLikes(likesMap)
          }
          // Load public vote stats for results section
          try {
            const stats = await getVoteStatsForEvent(ev.id)
            if (isMounted) setVoteStats(Array.isArray(stats) ? stats : [])
          } catch {}
        }
        setCurrentVoteEntryId('') // No longer needed for event-wide voting
      } catch (e) {
        if (!isMounted) return
        setError(e.message || String(e))
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    // Hard stop loading after 1500ms in case network hangs
    const stop = setTimeout(() => { if (isMounted) setLoading(false) }, 2500)
    load().finally(() => { if (isMounted) setLoading(false); clearTimeout(stop) })
    return () => { isMounted = false }
  }, [slug])

  // Handle hash navigation to results section
  useEffect(() => {
    const handleHashScroll = () => {
      if (window.location.hash === '#special-event-results') {
        // Multiple attempts to ensure it works on mobile
        const attemptScroll = (attempt = 1) => {
          const el = document.getElementById('special-event-results')
          if (el && !loading) {
            // Use scrollIntoView with better mobile support
            const yOffset = -20 // Small offset for better visibility
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })
          } else if (attempt < 5) {
            // Retry if element not found yet
            setTimeout(() => attemptScroll(attempt + 1), 300)
          }
        }
        
        // Start scrolling after a short delay
        setTimeout(() => attemptScroll(), 500)
      }
    }
    
    // Check immediately on mount if hash is present
    if (window.location.hash === '#special-event-results') {
      // Initial check
      setTimeout(handleHashScroll, 500)
    }
    
    // Check when voteStats load and page finishes loading
    if (!loading && voteStats && voteStats.length > 0) {
      handleHashScroll()
    }
    
    // Also listen for hash changes
    window.addEventListener('hashchange', handleHashScroll)
    return () => window.removeEventListener('hashchange', handleHashScroll)
  }, [voteStats, loading])

  async function handleUpload(e) {
    e.preventDefault()
    if (!event || !file) return
    if (alreadyUploaded) {
      setNotification({ type: 'warning', text: 'Du hast bereits ein Foto für dieses Event hochgeladen. Pro Person ist nur ein Upload erlaubt.' })
      return
    }
    setUploading(true)
    try {
      await uploadEntry({ event, file, title, description, contact })
      setFile(null)
      setTitle('')
      setDescription('')
      setContact('')
      localStorage.setItem(`se_uploaded_${event.id}`, 'true')
      setAlreadyUploaded(true)
      // No auto-approve: entries appear after admin approval
      setNotification({ type: 'success', text: 'Upload erfolgreich! Nach Freigabe wird es sichtbar.' })
      // setShowVotePrompt(true) // Removed - no upload form
    } catch (err) {
      const msg = (err?.message || String(err)).toLowerCase()
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setNotification({ type: 'warning', text: 'Für dieses Event wurde bereits ein Foto von dir hochgeladen. Pro Person ist nur ein Upload erlaubt.' })
      } else {
        setNotification({ type: 'error', text: err.message || String(err) })
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleVote(entryId) {
    if (!event) return
    setVoting(true)
    try {
      await castVote({ eventId: event.id, entryId })
      setUserLikes(prev => ({ ...prev, [entryId]: true }))
      setNotification({ type: 'success', text: 'Dein Like wurde gezählt.' })
    } catch (err) {
      setNotification({ type: 'error', text: err.message || String(err) })
    } finally {
      setVoting(false)
    }
  }

  async function handleRevokeVote(entryId) {
    if (!event || !entryId) return
    setVoting(true)
    try {
      await revokeVote({ eventId: event.id, entryId })
      setUserLikes(prev => ({ ...prev, [entryId]: false }))
      setNotification({ type: 'info', text: 'Dein Like wurde zurückgezogen.' })
    } catch (err) {
      setNotification({ type: 'error', text: err.message || String(err) })
    } finally {
      setVoting(false)
    }
  }

  async function handleDeleteUpload() {
    if (!userEntry || !event) return
    try {
      await deleteUserUpload(userEntry.id, userEntry.image_path)
      localStorage.removeItem(`se_uploaded_${event.id}`)
      setAlreadyUploaded(false)
      setUserEntry(null)
      setShowDeleteConfirm(false)
      setDeleteSuccess(true)
      setNotification({ type: 'success', text: 'Ihr Foto wurde gelöscht. Du kannst nun ein neues Foto hochladen.' })
    } catch (err) {
      setNotification({ type: 'error', text: err.message || String(err) })
    }
  }

  // Remove move like confirm functionality as users can like multiple photos now

  async function handleAdminDelete(entryId, imagePath) {
    if (!isAdmin()) return
    if (!window.confirm('Dieses Foto aus der Galerie entfernen? Das Foto und alle Votes werden gelöscht.')) return
    try {
      await deleteUserUpload(entryId, imagePath)
      setEntries(entries.filter(x => x.id !== entryId))
      setNotification({ type: 'success', text: 'Foto wurde aus der Galerie entfernt.' })
    } catch (err) {
      setNotification({ type: 'error', text: err.message || String(err) })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-[#333] animate-pulse mb-3" />
          <div className="h-4 w-80 max-w-full rounded bg-gray-200 dark:bg-[#333] animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                <div className="w-full h-56 bg-gray-200 dark:bg-[#333] animate-pulse" />
                <div className="p-3">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-[#333] rounded mb-2 animate-pulse" />
                  <div className="h-3 w-full bg-gray-200 dark:bg-[#333] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!event) return <div className="p-6">Event nicht gefunden</div>

  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border ${
            notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
            : notification.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
            : notification.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300'
            : 'bg-[#A58C81]/10 dark:bg-[#A58C81]/20 border-[#A58C81] dark:border-[#A58C81]/30 text-[#252422] dark:text-[#F4F1E8]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm">{notification.text}</span>
              <button onClick={() => setNotification(null)} className="text-xs underline">Schließen</button>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">{event.title}</h1>
        {event.description && (
          <p className="text-[#A58C81] dark:text-[#EBE9E9] mb-6">{event.description}</p>
        )}

        {/* Gallery hidden - showing results instead */}
        {false && !alreadyUploaded && (
          <>
            <h2 className="text-2xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4 text-center ">Galerie</h2>
            <div className="flex justify-end mb-3">
              <button
                onClick={async () => {
                  if (!event) return
                  setRefreshingEntries(true)
                  try {
                    const { listApprovedEntriesREST } = await import('../services/specialEvents')
                    const fresh = await listApprovedEntriesREST(event.id)
                    setEntries(fresh)
                  } finally {
                    setRefreshingEntries(false)
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingEntries ? 'animate-spin' : ''}`} /> Aktualisieren
              </button>
            </div>
            <div id="special-event-gallery" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {entries.map(en => (
              <div key={en.id} className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                <div className="w-full h-56 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                  <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="max-h-full max-w-full object-contain" />
                </div>
                  <div className="p-3">
                    {en.title && <div className="font-semibold text-[#252422] dark:text-[#F4F1E8]">{en.title}</div>}
                    {en.description && <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mt-1 line-clamp-3">{en.description}</div>}
                    {isAdmin() && (
                      <button onClick={() => handleAdminDelete(en.id, en.image_path)} className="mt-2 px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md inline-flex items-center">
                        <Trash2 className="h-3 w-3 mr-1" /> Entfernen
                      </button>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {userLikes[en.id] ? (
                        <button onClick={() => handleRevokeVote(en.id)} disabled={voting} className="px-3 py-1.5 rounded-md border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] text-sm font-semibold disabled:opacity-60">Like zurückziehen</button>
                      ) : (
                        <button onClick={() => handleVote(en.id)} disabled={voting} className="px-3 py-1.5 rounded-md bg-[#A58C81] text-white text-sm font-semibold disabled:opacity-60">Like</button>
                      )}
                    </div>
                    {voterToken && userLikes[en.id] && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Du hast dieses Foto geliked</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Öffentliche Ergebnisse */}
        {voteStats && voteStats.length > 0 && (
          <div id="special-event-results" className="mt-8 scroll-mt-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-semibold text-[#252422] dark:text-[#F4F1E8]">Ergebnisse</h2>
              <button
                onClick={async () => {
                  if (!event) return
                  setRefreshingResults(true)
                  try {
                    const fresh = await getVoteStatsForEvent(event.id)
                    setVoteStats(Array.isArray(fresh) ? fresh : [])
                  } finally {
                    setRefreshingResults(false)
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                <span className={refreshingResults ? 'animate-pulse' : ''}>Aktualisieren</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {voteStats.map((entry, index) => (
                <div key={entry.entry_id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                      <img src={getPublicImageUrl(entry.image_path)} alt={entry.title || 'Beitrag'} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                      #{entry.rank}{index === 0 ? ' • Leader' : ''}
                    </div>
                  </div>
                  <div className="p-4">
                    {entry.title && <div className="font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">{entry.title}</div>}
                    {entry.description && (
                      <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-2 line-clamp-2">{entry.description}</div>
                    )}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold">
                      <span>{entry.vote_count}</span>
                      <span>{entry.vote_count === 1 ? 'Stimme' : 'Stimmen'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload form removed - only showing results */}

        {/* Gallery hidden - showing results instead */}
        {false && alreadyUploaded && (
          <>
            <h2 className="text-2xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">Galerie</h2>
            <div className="flex justify-end mb-3">
              <button
                onClick={async () => {
                  if (!event) return
                  setRefreshingEntries(true)
                  try {
                    const { listApprovedEntriesREST } = await import('../services/specialEvents')
                    const fresh = await listApprovedEntriesREST(event.id)
                    setEntries(fresh)
                  } finally {
                    setRefreshingEntries(false)
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingEntries ? 'animate-spin' : ''}`} /> Aktualisieren
              </button>
            </div>
            <div id="special-event-gallery" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {entries.map(en => (
              <div key={en.id} className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                <div className="w-full h-56 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                  <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="max-h-full max-w-full object-contain" />
                </div>
                  <div className="p-3">
                    {en.title && <div className="font-semibold text-[#252422] dark:text-[#F4F1E8]">{en.title}</div>}
                    {en.description && <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mt-1 line-clamp-3">{en.description}</div>}
                    {isAdmin() && (
                      <button onClick={() => handleAdminDelete(en.id, en.image_path)} className="mt-2 px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md inline-flex items-center">
                        <Trash2 className="h-3 w-3 mr-1" /> Entfernen
                      </button>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {userLikes[en.id] ? (
                        <button onClick={() => handleRevokeVote(en.id)} disabled={voting} className="px-3 py-1.5 rounded-md border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] text-sm font-semibold disabled:opacity-60">Like zurückziehen</button>
                      ) : (
                        <button onClick={() => handleVote(en.id)} disabled={voting} className="px-3 py-1.5 rounded-md bg-[#A58C81] text-white text-sm font-semibold disabled:opacity-60">Like</button>
                      )}
                    </div>
                    {voterToken && userLikes[en.id] && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">✓ Du hast dieses Foto geliked</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Vote Prompt Overlay - Removed since upload form is removed */}
      {false && showVotePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-[#252422] dark:text-[#F4F1E8]">Danke für deinen Upload!</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Jetzt bist du dran: Sieh dir die aktuellen Ergebnisse an und stimme für dein Lieblingsbild!
              </p>
              <p className="text-xs text-[#A58C81] dark:text-[#EBE9E9]">
                Hinweis: Dein Foto erscheint erst nach Freigabe durch das Team.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                onClick={() => setShowVotePrompt(false)}
              >
                Später
              </button>
              <button
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#A58C81] text-white hover:opacity-90"
                onClick={() => {
                  setShowVotePrompt(false)
                  setTimeout(() => {
                    const el = document.getElementById('special-event-results')
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
              >
                Zu den Ergebnissen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpecialEventDetailPage



