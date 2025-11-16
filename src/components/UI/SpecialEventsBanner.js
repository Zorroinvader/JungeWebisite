// FILE OVERVIEW
// - Purpose: Banner component displaying active special events (e.g., costume contest) with link to detail page.
// - Used by: HomePage and other pages to promote special events; shows event title, description, and CTA link.
// - Notes: Production component. Uses getActiveSpecialEvents service with caching; links to /special-events/:slug.

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { getActiveSpecialEvents } from '../../services/specialEventsApi'
import { useDarkMode } from '../../contexts/DarkModeContext'

const SpecialEventsBanner = () => {
  const [activeEvents, setActiveEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  useEffect(() => {
    let mounted = true
    // Seed from cache synchronously for instant render
    try {
      const raw = sessionStorage.getItem('special_events_active_cache_v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt && Array.isArray(parsed.data)) {
          setActiveEvents(parsed.data)
          setLoading(false)
        }
      }
    } catch {}

    // Show a quick placeholder if network takes too long
    const t = setTimeout(() => mounted && setShowPlaceholder(true), 150)
    // Hard stop loading after 1500ms to avoid stuck skeletons
    const hardStop = setTimeout(() => mounted && setLoading(false), 1500)

    getActiveSpecialEvents({ useCache: true })
      .then(events => { if (mounted && events) setActiveEvents(events) })
      .catch(err => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false; clearTimeout(t); clearTimeout(hardStop) }
  }, [])

  // While loading, show a slim placeholder bar so it's visible on mobile
  if (loading && showPlaceholder) {
    return (
      <div className="w-full bg-[#F4F1E8] dark:bg-[#252422] border-b border-[#A58C81]/50 dark:border-[#EBE9E9]/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="h-5 sm:h-6 w-48 rounded bg-gray-200 dark:bg-[#333] animate-pulse" />
        </div>
      </div>
    )
  }

  // Only show links if there are active events
  if (activeEvents.length === 0) return null

  return (
    <div className="w-full bg-[#F4F1E8] dark:bg-[#252422] border-b border-[#A58C81]/50 dark:border-[#EBE9E9]/20">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#6054d9] dark:text-[#EBE9E9] flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-[#252422] dark:text-[#F4F1E8]">
            {activeEvents.length === 1 ? 'Special Event' : 'Special Events'}
          </span>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {activeEvents.map(event => (
              <Link
                key={event.id}
                to={`/special-events/${event.slug}`}
                className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-[#252422] dark:text-[#F4F1E8] bg-white dark:bg-[#2a2a2a] border border-[#A58C81]/50 dark:border-[#EBE9E9]/20 rounded-md hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors"
              >
                {event.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpecialEventsBanner


