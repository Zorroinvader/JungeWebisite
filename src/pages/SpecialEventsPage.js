import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveSpecialEvents } from '../services/specialEventsApi'

const SpecialEventsPage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    getActiveSpecialEvents()
      .then(list => { if (isMounted) setEvents(list) })
      .catch(err => { if (isMounted) setError(err.message || String(err)) })
      .finally(() => { if (isMounted) setLoading(false) })
    return () => { isMounted = false }
  }, [])

  if (loading) return <div className="p-6">Laden…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#252422] dark:text-[#F4F1E8] mb-6">Special Events</h1>
        {events.length === 0 && (
          <p className="text-[#252422] dark:text-[#F4F1E8]">Aktuell keine Special Events.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {events.map(ev => (
            <Link key={ev.id} to={`/special-events/${ev.slug}`} className="block border-2 border-[#A58C81] dark:border-[#EBE9E9] rounded-xl p-4 bg-white dark:bg-[#2a2a2a] hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">{ev.title}</h2>
              <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9] mt-1 line-clamp-3">{ev.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SpecialEventsPage



