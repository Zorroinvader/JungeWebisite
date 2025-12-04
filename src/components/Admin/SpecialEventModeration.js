// FILE OVERVIEW
// - Purpose: Admin component for moderating special event entries (e.g., costume contest submissions): approve/reject entries and view vote stats.
// - Used by: AdminPanelClean in the special events tab; manages pending entries and displays voting results.
// - Notes: Production component. Admin-only; uses specialEvents service for entry management and vote statistics.

import React, { useEffect, useState } from 'react'
import { Trophy, Vote, Users, RefreshCw } from 'lucide-react'
import { getActiveSpecialEvents, listPendingEntries, approveEntry, rejectEntry, getPublicImageUrl, listApprovedEntries, deleteUserUpload, getVoteStatsForEvent } from '../../services/specialEventsApi'
import { 
  listPendingNikolausfeierEntries, 
  listApprovedNikolausfeierEntries,
  approveNikolausfeierEntry, 
  rejectNikolausfeierEntry,
  deleteNikolausfeierEntry,
  getPublicVideoUrl,
  publishAllNikolausfeierVideos
} from '../../services/nikolausfeierApi'

const SpecialEventModeration = () => {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedEventSlug, setSelectedEventSlug] = useState('')
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [voteStats, setVoteStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', or 'results'
  const [actionState, setActionState] = useState({}) // { [entryId]: 'approving'|'rejecting' }
  const [publishingAll, setPublishingAll] = useState(false)
  const isNikolausfeier = selectedEventSlug === 'nikolausfeier'

  useEffect(() => {
    getActiveSpecialEvents().then(setEvents).catch(err => setError(err.message || String(err)))
  }, [])

  useEffect(() => {
    const event = events.find(e => e.id === selectedEventId)
    setSelectedEventSlug(event?.slug || '')
  }, [selectedEventId, events])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    
    if (isNikolausfeier) {
      // Load Nikolausfeier entries
      Promise.all([
        listPendingNikolausfeierEntries(),
        listApprovedNikolausfeierEntries()
      ])
        .then(([pendingData, approvedData]) => {
          setPending(pendingData)
          setApproved(approvedData)
          setVoteStats([]) // No voting for Nikolausfeier
        })
        .catch(err => {
          setError(`Fehler beim Laden der Daten. Details: ${err?.message || String(err)}`)
        })
        .finally(() => setLoading(false))
    } else {
      // Load special event entries (images)
      Promise.all([
        listPendingEntries(selectedEventId),
        listApprovedEntries(selectedEventId),
        getVoteStatsForEvent(selectedEventId)
      ])
        .then(([pendingData, approvedData, voteData]) => {
          setPending(pendingData)
          setApproved(approvedData)
          setVoteStats(voteData)
        })
        .catch(err => {
          setError(`Fehler beim Laden der Daten. Details: ${err?.message || String(err)}`)
        })
        .finally(() => setLoading(false))
    }
  }, [selectedEventId, isNikolausfeier])

  async function handleApprove(id) {
    try {
      setActionState(s => ({ ...s, [id]: 'approving' }))
      if (isNikolausfeier) {
        await approveNikolausfeierEntry(id)
      } else {
        const updated = await approveEntry(id)
        try { sessionStorage.removeItem('special_event_entries_' + (updated?.event_id || selectedEventId)) } catch {}
      }
      setPending(p => p.filter(x => x.id !== id))
    } catch (err) {
      setError(`Freigeben fehlgeschlagen: ${err?.message || String(err)}`)
    } finally {
      setActionState(s => ({ ...s, [id]: undefined }))
    }
  }

  async function handleReject(id) {
    try {
      setActionState(s => ({ ...s, [id]: 'rejecting' }))
      if (isNikolausfeier) {
        await rejectNikolausfeierEntry(id)
      } else {
        const updated = await rejectEntry(id)
        try { sessionStorage.removeItem('special_event_entries_' + (updated?.event_id || selectedEventId)) } catch {}
      }
      setPending(p => p.filter(x => x.id !== id))
    } catch (err) {
      setError(`Ablehnen fehlgeschlagen: ${err?.message || String(err)}`)
    } finally {
      setActionState(s => ({ ...s, [id]: undefined }))
    }
  }

  async function handleDeleteApproved(id, imagePath) {
    const confirmMsg = isNikolausfeier 
      ? 'Dieses Video aus der Galerie entfernen? Das Video wird gelöscht.'
      : 'Dieses Foto aus der Galerie entfernen? Das Foto und alle Votes werden gelöscht.'
    if (!window.confirm(confirmMsg)) return
    try {
      if (isNikolausfeier) {
        await deleteNikolausfeierEntry(id)
      } else {
        await deleteUserUpload(id, imagePath)
      }
      setApproved(p => p.filter(x => x.id !== id))
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  async function refreshData() {
    if (!selectedEventId) return
    setLoading(true)
    try {
      if (isNikolausfeier) {
        const [pendingData, approvedData] = await Promise.all([
          listPendingNikolausfeierEntries(),
          listApprovedNikolausfeierEntries()
        ])
        setPending(pendingData)
        setApproved(approvedData)
        setVoteStats([])
      } else {
        const [pendingData, approvedData, voteData] = await Promise.all([
          listPendingEntries(selectedEventId),
          listApprovedEntries(selectedEventId),
          getVoteStatsForEvent(selectedEventId)
        ])
        setPending(pendingData)
        setApproved(approvedData)
        setVoteStats(voteData)
      }
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return ''
    if (seconds < 60) {
      return `${seconds} Sekunden`
    }
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${minutes} Min ${secs} Sek` : `${minutes} Minuten`
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-[#2a2a2a] border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-2xl p-4 md:p-6 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-6">Moderation besonderer Veranstaltungen</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <div className="font-semibold mb-1">Es ist ein Fehler aufgetreten</div>
              <div className="mb-3">{error}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setError(null); refreshData() }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#6054d9] hover:bg-[#4f44c7] text-white rounded-md"
                >
                  <RefreshCw className="h-4 w-4" /> Erneut versuchen
                </button>
                <button
                  onClick={() => setError(null)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#A58C81] text-[#252422] dark:text-[#F4F1E8] rounded-md hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                >
                  Schließen
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="text-sm font-semibold text-[#252422] dark:text-[#F4F1E8] sm:w-auto">
              Veranstaltung wählen:
            </label>
            <select 
              className="flex-1 sm:flex-initial border-2 border-[#A58C81]/40 dark:border-[#EBE9E9]/40 focus:border-[#A58C81] dark:focus:border-[#EBE9E9] rounded-lg px-4 py-2 bg-white dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] font-medium" 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="">— Veranstaltung auswählen —</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="bg-white dark:bg-[#2a2a2a] border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-2xl p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#A58C81] dark:text-[#EBE9E9] mx-auto mb-4" />
            <p className="text-[#252422] dark:text-[#F4F1E8] font-medium">Laden…</p>
          </div>
        )}
        
        {!loading && selectedEventId && (
          <div className="bg-white dark:bg-[#2a2a2a] border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-2xl p-4 md:p-6 shadow-lg">
            {/* Tabs and Refresh Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#A58C81]/20 dark:border-[#EBE9E9]/20">
              {/* Tabs */}
              <div className="flex flex-col sm:flex-row gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'pending'
                      ? 'bg-[#A58C81] text-white shadow-md'
                      : 'bg-[#F4F1E8] dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] hover:bg-[#A58C81]/20 dark:hover:bg-[#A58C81]/10'
                  }`}
                >
                  Wartend
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 dark:bg-black/30 text-xs">({pending.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'approved'
                      ? 'bg-[#A58C81] text-white shadow-md'
                      : 'bg-[#F4F1E8] dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] hover:bg-[#A58C81]/20 dark:hover:bg-[#A58C81]/10'
                  }`}
                >
                  Freigegeben
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 dark:bg-black/30 text-xs">({approved.length})</span>
                </button>
                {!isNikolausfeier && (
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                      activeTab === 'results'
                        ? 'bg-[#A58C81] text-white shadow-md'
                        : 'bg-[#F4F1E8] dark:bg-[#1a1a1a] text-[#252422] dark:text-[#F4F1E8] hover:bg-[#A58C81]/20 dark:hover:bg-[#A58C81]/10'
                    }`}
                  >
                    <Trophy className="h-4 w-4" />
                    Ergebnisse
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 dark:bg-black/30 text-xs">({voteStats.length})</span>
                  </button>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {isNikolausfeier && activeTab === 'approved' && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Möchten Sie wirklich ALLE freigegebenen Videos öffentlich veröffentlichen? Dies kann nicht rückgängig gemacht werden.')) {
                        return
                      }
                      try {
                        setPublishingAll(true)
                        await publishAllNikolausfeierVideos()
                        setError(null)
                        await refreshData()
                        alert('Alle Videos wurden erfolgreich veröffentlicht!')
                      } catch (err) {
                        setError(`Fehler beim Veröffentlichen: ${err?.message || String(err)}`)
                      } finally {
                        setPublishingAll(false)
                      }
                    }}
                    disabled={publishingAll || loading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f57105] hover:bg-[#e06600] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    <Trophy className={`h-4 w-4 ${publishingAll ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Alle Videos veröffentlichen</span>
                    <span className="sm:hidden">Veröffentlichen</span>
                  </button>
                )}
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6054d9] hover:bg-[#4f44c7] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Aktualisieren</span>
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {activeTab === 'pending' && pending.map(en => (
              <div key={en.id} className={`border-2 rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-md hover:shadow-lg transition-shadow ${
                en.replaces_entry_id ? 'border-amber-500 dark:border-amber-600' : 'border-[#A58C81]/30 dark:border-[#EBE9E9]/30'
              }`}>
                {/* Replacement Warning Banner */}
                {isNikolausfeier && en.replaces_entry_id && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 border-b-2 border-amber-300 dark:border-amber-600 p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          ⚠️ Ersetzt einen alten Beitrag
                        </p>
                        {en.replaced_entry ? (
                          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                            <p><strong>Alter Beitrag:</strong> {en.replaced_entry.video_name || 'Unbenannt'}</p>
                            <p><strong>Teilnehmer:</strong> {en.replaced_entry.participant_name || 'Unbekannt'}</p>
                            <p><strong>Erstellt:</strong> {new Date(en.replaced_entry.created_at).toLocaleDateString('de-DE')}</p>
                            <p className="text-amber-700 dark:text-amber-300 font-medium mt-2">
                              ⚠️ Der alte Beitrag wird beim Freigeben automatisch gelöscht!
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Der zu ersetzende Beitrag konnte nicht geladen werden (möglicherweise bereits gelöscht).
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {isNikolausfeier ? (
                  <>
                    <div className="w-full h-48 bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
                      <video
                        src={getPublicVideoUrl(en.video_url)}
                        controls
                        className="max-w-full max-h-full"
                        style={{ maxHeight: '192px' }}
                      >
                        Ihr Browser unterstützt das Video-Element nicht.
                      </video>
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">{en.video_name || en.event_name}</div>
                      {en.participant_name && (
                        <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-2">von {en.participant_name}</div>
                      )}
                      {en.beer_drink_time && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Bier-Trinkzeit: {formatTime(en.beer_drink_time)}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-48 bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
                      <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="p-4">
                      {en.title && <div className="font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">{en.title}</div>}
                      {en.description && <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-3">{en.description}</div>}
                      {en.submitter_contact && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Kontakt: {en.submitter_contact}</div>
                      )}
                    </div>
                  </>
                )}
                <div className="p-4 pt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => handleApprove(en.id)} 
                      disabled={actionState[en.id] === 'approving'}
                      className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors shadow-md ${actionState[en.id] === 'approving' ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {actionState[en.id] === 'approving' ? 'Freigeben…' : 'Freigeben'}
                    </button>
                    <button 
                      onClick={() => handleReject(en.id)} 
                      disabled={actionState[en.id] === 'rejecting'}
                      className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors shadow-md ${actionState[en.id] === 'rejecting' ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {actionState[en.id] === 'rejecting' ? 'Ablehnen…' : 'Ablehnen'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'approved' && approved.map(en => (
              <div key={en.id} className="border-2 border-green-300 dark:border-green-700 rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-md hover:shadow-lg transition-shadow">
                <div className="relative">
                  {isNikolausfeier ? (
                    <div className="w-full h-48 bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
                      <video
                        src={getPublicVideoUrl(en.video_url)}
                        controls
                        className="max-w-full max-h-full"
                        style={{ maxHeight: '192px' }}
                      >
                        Ihr Browser unterstützt das Video-Element nicht.
                      </video>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
                      <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ Freigegeben
                  </div>
                </div>
                <div className="p-4">
                  {isNikolausfeier ? (
                    <>
                      <div className="font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">{en.video_name || en.event_name}</div>
                      {en.participant_name && (
                        <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-2">von {en.participant_name}</div>
                      )}
                      {en.beer_drink_time && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Bier-Trinkzeit: {formatTime(en.beer_drink_time)}</div>
                      )}
                    </>
                  ) : (
                    <>
                      {en.title && <div className="font-semibold text-[#252422] dark:text-[#F4F1E8] mb-2">{en.title}</div>}
                      {en.description && <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-3">{en.description}</div>}
                      {en.submitter_contact && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Kontakt: {en.submitter_contact}</div>
                      )}
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteApproved(en.id, isNikolausfeier ? en.video_url : en.image_path)} 
                    className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-md"
                  >
                    Aus Galerie entfernen
                  </button>
                </div>
              </div>
            ))}

            {activeTab === 'pending' && pending.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-[#A58C81] dark:text-[#EBE9E9] font-semibold">Keine wartenden Beiträge.</div>
              </div>
            )}

            {activeTab === 'approved' && approved.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-[#A58C81] dark:text-[#EBE9E9] font-semibold">Keine freigegebenen Beiträge.</div>
              </div>
            )}

            {activeTab === 'results' && voteStats.length > 0 && (
              <div className="col-span-full space-y-4">
                {/* Current Leader Banner */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-2xl p-4 md:p-6 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div className="bg-yellow-500 dark:bg-yellow-600 rounded-full p-3 flex-shrink-0">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Aktueller Führender</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-full">
                          <span className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">{voteStats[0].vote_count}</span>
                          <span className="text-sm text-green-600 dark:text-green-400 ml-1">
                            {voteStats[0].vote_count === 1 ? 'Stimme' : 'Stimmen'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {voteStats[0].title && (
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{voteStats[0].title}</div>
                  )}
                  {voteStats[0].submitter_contact && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4 inline mr-1" />
                      Von: {voteStats[0].submitter_contact}
                    </div>
                  )}
                </div>

                {/* Total Votes Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 md:p-6 shadow-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Gesamt-Stimmen</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {voteStats.reduce((sum, entry) => sum + entry.vote_count, 0)} Stimmen insgesamt
                      </p>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {voteStats.length} {voteStats.length === 1 ? 'Beitrag' : 'Beiträge'}
                    </div>
                  </div>
                </div>

                {/* Ranking Grid */}
                <h4 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Vollständiges Ranking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {voteStats.map((entry, index) => (
                    <div key={entry.entry_id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a] hover:shadow-xl transition-all">
                      <div className="relative">
                        <div className="w-full h-48 bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
                          <img src={getPublicImageUrl(entry.image_path)} alt={entry.title || 'Beitrag'} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                          {index === 0 && <Trophy className="h-5 w-5" />}
                          <span className="text-base md:text-lg">#{entry.rank}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        {entry.title && <div className="font-semibold text-gray-900 dark:text-white mb-2">{entry.title}</div>}
                        {entry.description && <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-3 line-clamp-2">{entry.description}</div>}
                        
                        {/* Large Vote Count Display */}
                        <div className="bg-green-100 dark:bg-green-900/40 rounded-xl p-4 mb-3">
                          <div className="flex items-center justify-center gap-2">
                            <Vote className="h-6 w-6 text-green-600 dark:text-green-400" />
                            <div className="text-center">
                              <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">{entry.vote_count}</div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {entry.vote_count === 1 ? 'Stimme' : 'Stimmen'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {entry.submitter_contact && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {entry.submitter_contact}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'results' && voteStats.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-[#A58C81] dark:text-[#EBE9E9] font-semibold">Noch keine Abstimmungen vorhanden.</div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default SpecialEventModeration



