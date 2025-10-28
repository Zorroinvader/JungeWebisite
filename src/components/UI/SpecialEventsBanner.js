import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { getActiveSpecialEvents } from '../../services/specialEvents'
import { useDarkMode } from '../../contexts/DarkModeContext'

const SpecialEventsBanner = () => {
  const { isDarkMode } = useDarkMode()
  const [activeEvents, setActiveEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveSpecialEvents()
      .then(events => setActiveEvents(events || []))
      .catch(err => console.error('Error loading special events:', err))
      .finally(() => setLoading(false))
  }, [])

  // Only show if there are active events
  if (loading || activeEvents.length === 0) return null

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


