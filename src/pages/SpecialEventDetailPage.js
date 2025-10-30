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
  getUserVoteForEntry
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
  const fileInputRef = useRef(null)
  const [refreshingEntries, setRefreshingEntries] = useState(false)

  const voterToken = useMemo(() => localStorage.getItem('se_voter_anon_token') || '', [])

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        console.log('[SE:Detail] slug=', slug)
        // Seed from cache synchronously for instant paint
        try {
          const raw = sessionStorage.getItem('special_event_detail_' + slug)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.data && parsed.expiresAt && Date.now() < parsed.expiresAt) {
              console.log('[SE:Detail] detail cache hit for slug', slug)
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
          console.warn('[SE:Detail] slug fetch failed:', e?.message)
        }
        if (!ev) {
          // Fallback: load the first available event regardless of status
          const { getFirstSpecialEventAny } = await import('../services/specialEvents')
          ev = await getFirstSpecialEventAny()
          console.log('[SE:Detail] Fallback first event slug=', ev?.slug)
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
                console.log('[SE:Detail] Last-resort picked slug=', ev?.slug)
              }
            }
          } catch {}
        }
        if (!isMounted) return
        setEvent(ev)
        console.log('[SE:Detail] Selected event id=', ev?.id, 'slug=', ev?.slug)
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
        }
        setCurrentVoteEntryId('') // No longer needed for event-wide voting
      } catch (e) {
        if (!isMounted) return
        setError(e.message || String(e))
        console.error('[SE:Detail] Fatal load error:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    // Hard stop loading after 1500ms in case network hangs
    const stop = setTimeout(() => { if (isMounted) setLoading(false) }, 2500)
    load().finally(() => { if (isMounted) setLoading(false); clearTimeout(stop) })
    return () => { isMounted = false }
  }, [slug])

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

        {/* Show gallery first for users who haven't uploaded yet (mobile one-hand priority) */}
        {!alreadyUploaded && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {entries.map(en => (
                <div key={en.id} className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                  <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="w-full h-56 object-cover" />
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

        <div className="bg-white dark:bg-[#2a2a2a] border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-2xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-[#A58C81]/15 text-[#A58C81]"><Upload className="h-5 w-5" /></div>
            <h2 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">Foto hochladen</h2>
          </div>
          <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-4">Zeig uns dein bestes Bild. Bitte nur ein Foto pro Person.</p>
          {alreadyUploaded && (
            <div className="mb-3 p-3 rounded-lg bg-[#A58C81]/10 dark:bg-[#A58C81]/20 border border-[#A58C81] dark:border-[#A58C81]/30">
              <p className="text-sm font-medium text-[#252422] dark:text-[#F4F1E8]">
                ✓ Du hast bereits ein Foto für dieses Event hochgeladen.
              </p>
              <p className="text-xs text-[#A58C81] dark:text-[#EBE9E9] mt-1">
                Pro Person ist nur ein Upload erlaubt. Weitere Uploads sind nicht möglich.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors"
              >
                Meinen Upload löschen
              </button>
              {showDeleteConfirm && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Bist du dir sicher?
                  </p>
                  <p className="text-xs text-red-700/90 dark:text-red-200 mt-1">
                    Das Foto und alle Stimmen für diesen Beitrag werden dauerhaft gelöscht.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={handleDeleteUpload} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                      Ja, endgültig löschen
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm font-medium border border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] rounded-md">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {userEntry && userEntry.status === 'rejected' && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Ihr Beitrag wurde abgelehnt.</p>
              <p className="text-xs text-red-700/90 dark:text-red-200 mt-1">Bitte versucht es mit einem anderen Foto erneut.</p>
            </div>
          )}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Titel (optional)</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="z. B. Vampir Kostüm" className="w-full rounded-lg border-2 border-[#A58C81]/40 focus:border-[#A58C81] focus:ring-0 px-3 py-2 bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Beschreibung (optional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Kurzbeschreibung deines Fotos" className="w-full rounded-lg border-2 border-[#A58C81]/40 focus:border-[#A58C81] focus:ring-0 px-3 py-2 bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] min-h-[88px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">Kontakt/Name (für Gewinn)</label>
                  <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Name oder Kontaktinfo" className="w-full rounded-lg border-2 border-[#A58C81]/40 focus:border-[#A58C81] focus:ring-0 px-3 py-2 bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">Bilddatei</label>
                <div className="rounded-xl border-2 border-dashed border-[#A58C81]/50 hover:border-[#A58C81] transition-colors bg-[#F4F1E8]/40 dark:bg-[#1a1a1a] p-4 flex flex-col items-center justify-center text-center cursor-pointer"
                     onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Vorschau" className="w-full h-40 object-cover rounded-lg border border-[#A58C81]/40" />
                  ) : (
                    <div className="flex flex-col items-center text-[#A58C81]">
                      <ImagePlus className="h-8 w-8 mb-2" />
                      <p className="text-xs">Tippe hier, um ein Foto aufzunehmen oder auszuwählen</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => {
                      const f = e.target.files?.[0] || null
                      if (f && f.size > 5 * 1024 * 1024) {
                        setNotification({ type: 'error', text: 'Bild ist größer als 5MB. Bitte kleineres Bild wählen.' })
                        return
                      }
                      setFile(f)
                      if (f) {
                        const url = URL.createObjectURL(f)
                        setPreviewUrl(url)
                      } else {
                        setPreviewUrl('')
                      }
                    }}
                    className="sr-only"
                  />
                </div>
                <p className="mt-2 text-[11px] text-[#A58C81] dark:text-[#EBE9E9]">Max. 5 MB. Erlaubte Formate: JPG/PNG.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={uploading || alreadyUploaded} className="px-4 py-2 rounded-lg bg-[#6054d9] hover:bg-[#4f44c7] text-white font-semibold disabled:opacity-60">
                {uploading ? 'Lädt…' : 'Hochladen'}
              </button>
              {previewUrl && (
                <button type="button" onClick={() => { setFile(null); setPreviewUrl('') }} className="px-3 py-2 rounded-lg border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] text-sm">
                  Auswahl löschen
                </button>
              )}
            </div>
          </form>
        </div>

        {alreadyUploaded && (
          <>
            <h2 className="text-2xl font-semibold text-[#252422] dark:text-[#F4F1E8] mb-4">Galerie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {entries.map(en => (
                <div key={en.id} className="border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                  <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="w-full h-56 object-cover" />
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
    </div>
  )
}

export default SpecialEventDetailPage



