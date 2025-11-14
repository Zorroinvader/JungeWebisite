import React, { useState, useEffect } from 'react'
import { getPublicImageUrl, getActiveSpecialEvents, getVoteStatsForEvent } from '../services/specialEvents'

const CostumeContestResultsPage = () => {
  const [event, setEvent] = useState(null)
  const [voteStats, setVoteStats] = useState([])
  const [loading, setLoading] = useState(false) // Start with false to show cached data immediately
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    
    // Try to load from cache immediately (synchronous) - check if we have data
    let hasCachedData = false
    try {
      const cachedEvents = sessionStorage.getItem('special_events_active_cache_v1')
      if (cachedEvents) {
        const parsed = JSON.parse(cachedEvents)
        if (parsed?.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
          const cachedEvent = parsed.data[0]
          setEvent(cachedEvent)
          
          // Try to load cached vote stats
          try {
            const cachedStats = sessionStorage.getItem(`vote_stats_${cachedEvent.id}`)
            if (cachedStats) {
              const statsParsed = JSON.parse(cachedStats)
              if (statsParsed?.data && statsParsed.expiresAt && Date.now() < statsParsed.expiresAt) {
                setVoteStats(statsParsed.data)
                hasCachedData = true
              }
            }
          } catch {}
        }
      }
    } catch {}
    
    async function load() {
      try {
        // Get the first active special event (uses cache)
        const events = await getActiveSpecialEvents({ useCache: true })
        if (!isMounted) return
        
        const activeEvent = events && events.length > 0 ? events[0] : null
        if (!activeEvent) {
          if (!event) { // Only set error if we don't have cached event
            setError('Kein aktives Event gefunden')
          }
          setLoading(false)
          return
        }
        
        setEvent(activeEvent)
        
        // Load vote stats for this event - use REST for faster loading
        try {
          // Try REST first for faster loading
          const url = process.env.REACT_APP_SUPABASE_URL
          const key = process.env.REACT_APP_SUPABASE_ANON_KEY
          
          let stats = []
          if (url && key) {
            try {
              const resp = await fetch(
                `${url}/rest/v1/special_event_vote_stats?event_id=eq.${activeEvent.id}&order=vote_count.desc`,
                {
                  headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                }
              )
              if (resp.ok) {
                const json = await resp.json()
                stats = Array.isArray(json) ? json : []
              }
            } catch {}
          }
          
          // Fallback to regular function if REST fails
          if (stats.length === 0) {
            stats = await getVoteStatsForEvent(activeEvent.id)
          }
          
          if (isMounted) {
            setVoteStats(Array.isArray(stats) ? stats : [])
            // Cache the stats
            try {
              sessionStorage.setItem(`vote_stats_${activeEvent.id}`, JSON.stringify({
                data: stats,
                expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
              }))
            } catch {}
          }
        } catch (err) {
          // Don't set empty array if we have cached data
          if (isMounted) {
            // Check if we already have stats from cache
            try {
              const cachedStats = sessionStorage.getItem(`vote_stats_${activeEvent.id}`)
              if (!cachedStats) {
                setVoteStats([])
              }
            } catch {
              setVoteStats([])
            }
          }
        }
      } catch (err) {
        if (isMounted && !event) { // Only set error if we don't have cached event
          setError(err.message || 'Fehler beim Laden der Daten')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    // Load data - only show loading if we don't have cached data
    if (!hasCachedData) {
      setLoading(true)
    }
    
    load()
    return () => { isMounted = false }
  }, [])

  // Show loading only if we have no cached data
  if (loading && !voteStats.length && !event) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-[#333] animate-pulse mb-3" />
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-[#333] animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                <div className="w-full h-48 bg-gray-200 dark:bg-[#333] animate-pulse" />
                <div className="p-4">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-[#333] rounded mb-2 animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-[#333] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-2">
          {event?.title || 'Kostümwettbewerb Ergebnisse'}
        </h1>
        {event?.description && (
          <p className="text-[#A58C81] dark:text-[#EBE9E9] mb-8">
            {event.description}
          </p>
        )}

        {/* Results Grid */}
        {voteStats && voteStats.length > 0 ? (
          <div id="special-event-results" className="mt-8 scroll-mt-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[#252422] dark:text-[#F4F1E8]">Ergebnisse</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {voteStats.map((entry, index) => (
                <div key={entry.entry_id || entry.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a]">
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                      {entry.image_path ? (
                        <img 
                          src={getPublicImageUrl(entry.image_path)} 
                          alt={entry.title || 'Beitrag'} 
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">Bild nicht verfügbar</div>
                      )}
                    </div>
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                      #{entry.rank}{index === 0 ? ' • Leader' : ''}
                    </div>
                  </div>
                  <div className="p-4">
                    {entry.title && (
                      <div className="font-semibold text-[#252422] dark:text-[#F4F1E8] mb-1">
                        {entry.title}
                      </div>
                    )}
                    {entry.description && (
                      <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mb-2 line-clamp-2">
                        {entry.description}
                      </div>
                    )}
                    {entry.submitter_contact && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Von: {entry.submitter_contact}
                      </div>
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
        ) : (
          <div className="mt-8 p-6 bg-white dark:bg-[#2a2a2a] border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl text-center">
            <p className="text-[#252422] dark:text-[#F4F1E8]">Noch keine Ergebnisse verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CostumeContestResultsPage

