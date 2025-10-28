import React, { useEffect, useState } from 'react'
import { getActiveSpecialEvents, listPendingEntries, approveEntry, rejectEntry, getPublicImageUrl } from '../../services/specialEvents'

const SpecialEventModeration = () => {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getActiveSpecialEvents().then(setEvents).catch(err => setError(err.message || String(err)))
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    listPendingEntries(selectedEventId)
      .then(setPending)
      .catch(err => setError(err.message || String(err)))
      .finally(() => setLoading(false))
  }, [selectedEventId])

  async function handleApprove(id) {
    await approveEntry(id)
    setPending(p => p.filter(x => x.id !== id))
  }

  async function handleReject(id) {
    await rejectEntry(id)
    setPending(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Special Event Moderation</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex items-center gap-2">
        <label className="text-sm">Event wählen:</label>
        <select className="border rounded px-2 py-1" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
          <option value="">—</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {loading && <div>Laden…</div>}
      {!loading && selectedEventId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pending.map(en => (
            <div key={en.id} className="border rounded-lg overflow-hidden">
              <img src={getPublicImageUrl(en.image_path)} alt={en.title || 'Beitrag'} className="w-full h-48 object-cover" />
              <div className="p-3">
                {en.title && <div className="font-semibold">{en.title}</div>}
                {en.description && <div className="text-sm text-gray-600 mt-1">{en.description}</div>}
                {en.submitter_contact && <div className="text-xs text-gray-500 mt-1">Kontakt: {en.submitter_contact}</div>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleApprove(en.id)} className="px-3 py-1.5 rounded bg-green-600 text-white text-sm">Freigeben</button>
                  <button onClick={() => handleReject(en.id)} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm">Ablehnen</button>
                </div>
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <div className="text-sm text-gray-600">Keine offenen Beiträge.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default SpecialEventModeration



