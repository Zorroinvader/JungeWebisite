import React, { useState, useEffect } from 'react'
import { profileAPI } from '../../services/api'
import { User, Shield, Mail, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react'
import moment from 'moment'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await profileAPI.getProfiles()
      
      if (error) {
        setError(error.message)
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      setError('Fehler beim Laden der Benutzer')
    } finally {
      setLoading(false)
    }
  }

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const { error } = await profileAPI.updateUserRole(userId, newRole)
      
      if (error) {
        setError(error.message)
      } else {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        setShowRoleModal(false)
        setSelectedUser(null)
      }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Benutzer verwalten</h2>
          <p className="text-sm text-gray-600">
            {users.length} Benutzer{users.length !== 1 ? '' : ''} gefunden
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer</h3>
          <p className="mt-1 text-sm text-gray-500">
            Es sind keine Benutzer vorhanden.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Unbekannt'}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{getRoleLabel(user.role)}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                      className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Benutzerrolle ändern
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Benutzer: <strong>{user.full_name || user.email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Aktuelle Rolle: <span className="font-medium">{roles.find(r => r.value === user.role)?.label}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      <div className="font-medium text-gray-900">{role.label}</div>
                      <div className="text-gray-500">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || selectedRole === user.role}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
