import React from 'react'
import EventCalendar from '../components/Calendar/EventCalendar'

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventCalendar />
      </div>
    </div>
  )
}

export default CalendarPage
