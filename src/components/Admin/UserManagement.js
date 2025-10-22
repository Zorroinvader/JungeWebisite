import React, { useState, useEffect } from 'react'
import { profilesAPI } from '../../services/httpApi'
import { User, Shield, Mail, Calendar, AlertCircle, X, Plus } from 'lucide-react'
import moment from 'moment'
import RegisterForm from '../Auth/RegisterForm'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await profilesAPI.getAll()
      setUsers(data || [])
      setError('')
    } catch (err) {
      setError('Fehler beim Laden der Benutzer')
    } finally {
      setLoading(false)
    }
  }

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    setShowRegisterForm(false)
    loadUsers() // Reload users list
  }

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await profilesAPI.updateUserRole(userId, newRole)
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      setShowRoleModal(false)
      setSelectedUser(null)
      setError('')
    } catch (err) {
      setError('Fehler beim Aktualisieren der Benutzerrolle')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      member: 'bg-blue-100 text-blue-800',
      guest: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      member: 'Mitglied',
      guest: 'Gast'
    }
    return labels[role] || role
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'member':
        return <User className="h-4 w-4" />
      case 'guest':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6054d9]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">Benutzer verwalten</h2>
          <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
            {users.length} Benutzer{users.length !== 1 ? '' : ''} gefunden
          </p>
        </div>
        <button
          onClick={() => setShowRegisterForm(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#6054d9] hover:bg-[#4f44c7] transition-colors shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Benutzer
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Hinweis:</strong> Als Admin erstellte Benutzer sind automatisch verifiziert und können sich sofort anmelden - keine E-Mail-Bestätigung erforderlich.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#2a2a2a] rounded-lg border-2 border-[#A58C81] dark:border-[#4a4a4a]">
          <User className="mx-auto h-12 w-12 text-[#A58C81] dark:text-[#EBE9E9]" />
          <h3 className="mt-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8]">Keine Benutzer</h3>
          <p className="mt-1 text-sm text-[#A58C81] dark:text-[#EBE9E9]">
            Es sind keine Benutzer vorhanden.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#2a2a2a] shadow overflow-hidden sm:rounded-md border-2 border-[#A58C81] dark:border-[#4a4a4a]">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-[#A58C81]/20 dark:bg-[#6a6a6a]/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-[#252422] dark:text-[#F4F1E8]">
                          {user.full_name || 'Unbekannt'}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{getRoleLabel(user.role)}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-[#A58C81] dark:text-[#EBE9E9]">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            Registriert: {moment(user.created_at).format('DD.MM.YYYY')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowRoleModal(true)
                      }}
                      className="px-3 py-1 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors"
                    >
                      Rolle ändern
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <RoleChangeModal
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedUser(null)
          }}
          onUpdateRole={handleUpdateRole}
        />
      )}

      {/* Register Form Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#252422] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#EBE9E9]/20">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#EBE9E9]/20">
              <div>
                <h3 className="text-xl font-bold text-[#252422] dark:text-[#F4F1E8]">
                  Neuen Benutzer registrieren
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#EBE9E9] mt-1">
                  Erstellen Sie einen neuen Benutzer mit der Standard-Registrierung
                </p>
              </div>
              <button
                onClick={() => setShowRegisterForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#EBE9E9]/10 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-[#F4F1E8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form Content */}
            <div className="p-6 bg-white dark:bg-[#252422]">
              <RegisterForm onSuccess={handleRegistrationSuccess} isModal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Role Change Modal Component
const RoleChangeModal = ({ user, onClose, onUpdateRole }) => {
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [loading, setLoading] = useState(false)

  const roles = [
    { value: 'guest', label: 'Gast', description: 'Kann Events ansehen' },
    { value: 'member', label: 'Mitglied', description: 'Kann Events ansehen und anfragen' },
    { value: 'admin', label: 'Administrator', description: 'Vollzugriff auf alle Funktionen' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onUpdateRole(user.id, selectedRole)
    } catch (err) {
      console.error('Error updating role:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2a2a] rounded-lg max-w-md w-full border-2 border-[#A58C81] dark:border-[#4a4a4a]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#252422] dark:text-[#F4F1E8]">
              Benutzerrolle ändern
            </h2>
            <button
              onClick={onClose}
              className="text-[#A58C81] dark:text-[#EBE9E9] hover:opacity-70"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-[#252422] dark:text-[#F4F1E8] mb-4">
              Benutzer: <strong>{user.full_name || user.email}</strong>
            </p>
            <p className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">
              Aktuelle Rolle: <span className="font-medium">{roles.find(r => r.value === user.role)?.label}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-3">
                Neue Rolle auswählen
              </label>
              <div className="space-y-3">
                {roles.map((role) => (
                  <label key={role.value} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <div className="font-medium text-[#252422] dark:text-[#F4F1E8]">{role.label}</div>
                      <div className="text-[#A58C81] dark:text-[#EBE9E9]">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#A58C81] dark:border-[#EBE9E9]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#252422] dark:text-[#e0e0e0] bg-white dark:bg-[#1a1a1a] border-2 border-[#A58C81] dark:border-[#6a6a6a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252422] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || selectedRole === user.role}
                className="px-4 py-2 text-sm font-medium text-white bg-[#6054d9] hover:bg-[#4f44c7] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird aktualisiert...' : 'Rolle aktualisieren'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


export default UserManagement
