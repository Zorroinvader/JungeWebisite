import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Users, FileText, Settings, AlertCircle } from 'lucide-react'
import EventManagement from './EventManagement'
import EventRequestManagement from './EventRequestManagement'
import EnhancedEventManagement from './EnhancedEventManagement'
import UserManagement from './UserManagement'
import AdminSettings from './AdminSettings'

const AdminPanel = () => {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('events')


  const tabs = [
    { id: 'events', name: 'Events verwalten', icon: Calendar },
    { id: 'enhanced', name: 'Event-Verwaltung (Erweitert)', icon: FileText },
    { id: 'requests', name: 'Event-Anfragen', icon: FileText },
    { id: 'users', name: 'Benutzer verwalten', icon: Users },
    { id: 'settings', name: 'Einstellungen', icon: Settings }
  ]

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-600">
            Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen.
          </p>
        </div>
      </div>
    )
  }


  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventManagement />
      case 'enhanced':
        return <EnhancedEventManagement />
      case 'requests':
        return <EventRequestManagement />
      case 'users':
        return <UserManagement />
      case 'settings':
        return <AdminSettings />
      default:
        return <EventManagement />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Events, Benutzer und Einstellungen
          </p>
          
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
