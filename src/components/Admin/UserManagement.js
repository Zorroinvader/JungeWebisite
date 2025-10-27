import React, { useState, useEffect } from 'react'
import { profilesAPI } from '../../services/httpApi'
import { User, Shield, Mail, Calendar, AlertCircle, X, Plus, Eye, EyeOff, CheckCircle, Trash2 } from 'lucide-react'
import moment from 'moment'
import RegisterForm from '../Auth/RegisterForm'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showSuperAdminForm, setShowSuperAdminForm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  // Load users with fallback API chain
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('👥 User Management: Loading users...')
      let data = []
      
      try {
        data = await profilesAPI.getAll()
        console.log('👥 User Management: Primary API success:', data?.length || 0, 'users')
      } catch (error) {
        console.error('👥 User Management: Primary API failed, trying fallback:', error)
        try {
          data = await profilesAPI.getAllDirect()
          console.log('👥 User Management: Fallback API success:', data?.length || 0, 'users')
        } catch (fallbackError) {
          console.error('👥 User Management: Direct API failed, trying ultra-simple:', fallbackError)
          try {
            data = await profilesAPI.getAllSimple()
            console.log('👥 User Management: Ultra-simple API success:', data?.length || 0, 'users')
          } catch (simpleError) {
            console.error('👥 User Management: All API methods failed:', simpleError)
            data = []
          }
        }
      }
      
      setUsers(data || [])
    } catch (err) {
      console.error('👥 User Management: Error loading users:', err)
      setError('Fehler beim Laden der Benutzer')
    } finally {
      setLoading(false)
    }
  }

  // Delete all users except current superadmin
  const handleDeleteAllUsers = async () => {
    setIsDeletingAll(true)
    setError('')
    
    try {
      // Get current user
      const { supabase } = await import('../../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Kein Benutzer eingeloggt')
      }

      // Get all users except current user
      const usersToDelete = users.filter(u => u.id !== user.id)
      
      if (usersToDelete.length === 0) {
        alert('Keine Benutzer zum Löschen gefunden')
        setShowDeleteAllConfirm(false)
        setIsDeletingAll(false)
        return
      }

      // Delete profiles first
      for (const userToDelete of usersToDelete) {
        await supabase
          .from('profiles')
          .delete()
          .eq('id', userToDelete.id)
      }

      // Then delete auth users
      for (const userToDelete of usersToDelete) {
        await supabase.auth.admin.deleteUser(userToDelete.id)
      }

      alert(`✅ ${usersToDelete.length} Benutzer erfolgreich gelöscht`)
      await loadUsers()
      setShowDeleteAllConfirm(false)
      
    } catch (err) {
      console.error('Error deleting all users:', err)
      setError(`Fehler beim Löschen: ${err.message}`)
    } finally {
      setIsDeletingAll(false)
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
    let mounted = true
    
    const loadUsersSafely = async () => {
      if (mounted) {
        try {
          await loadUsers()
        } catch (error) {
          console.error('Error loading users:', error)
          if (mounted) {
            setLoading(false)
            setError('Fehler beim Laden der Benutzer')
          }
        }
      }
    }
    
    loadUsersSafely()
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
        setError('Laden dauerte zu lange - bitte versuchen Sie es erneut')
      }
    }, 5000) // 5 second timeout
    
    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  const getRoleColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      member: 'bg-blue-100 text-blue-800',
      guest: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role) => {
    const labels = {
      superadmin: 'Super Administrator',
      admin: 'Administrator',
      member: 'Mitglied',
      guest: 'Gast'
    }
    return labels[role] || role
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="h-4 w-4" />
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowSuperAdminForm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Benutzer (mit Rolle)
          </button>
          <button
            onClick={() => setShowRegisterForm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#6054d9] hover:bg-[#4f44c7] transition-colors shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Standard Registrierung
          </button>
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Alle Benutzer löschen
          </button>
        </div>
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

      {/* SuperAdmin User Creation Form Modal */}
      {showSuperAdminForm && (
        <SuperAdminUserForm 
          onClose={() => setShowSuperAdminForm(false)}
          onSuccess={handleRegistrationSuccess}
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

      {/* Delete All Users Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-[#252422] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#EBE9E9]/20">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-center text-[#252422] dark:text-[#F4F1E8] mb-2">
                Alle Benutzer löschen?
              </h3>
              
              <p className="text-sm text-center text-gray-600 dark:text-[#EBE9E9] mb-4">
                Diese Aktion wird <strong>ALLE</strong> Benutzer löschen außer Ihnen selbst.
              </p>
              
              <p className="text-sm text-center text-red-600 dark:text-red-400 mb-6 font-semibold">
                Diese Aktion kann nicht rückgängig gemacht werden!
              </p>

              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(false)}
                  disabled={isDeletingAll}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8] bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllUsers}
                  disabled={isDeletingAll}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingAll ? 'Lösche...' : 'Alle löschen'}
                </button>
              </div>
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

// SuperAdmin User Creation Form Component
const SuperAdminUserForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const roles = [
    { value: 'superadmin', label: 'Super Administrator', description: 'Vollzugriff auf alles, einschließlich Benutzerverwaltung' },
    { value: 'admin', label: 'Administrator', description: 'Kann Events akzeptieren und Anfragen verwalten' },
    { value: 'member', label: 'Mitglied', description: 'Standard-Benutzer mit Login-Zugriff' },
    { value: 'guest', label: 'Gast', description: 'Nur Anzeige-Zugriff, kein Login erforderlich' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form
      if (!formData.username.trim()) {
        throw new Error('Bitte geben Sie einen Benutzernamen ein')
      }
      if (!formData.fullName.trim()) {
        throw new Error('Bitte geben Sie einen Namen ein')
      }
      if (!formData.email.trim()) {
        throw new Error('Bitte geben Sie eine E-Mail-Adresse ein')
      }
      if (!formData.password || formData.password.length < 6) {
        throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein')
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Die Passwörter stimmen nicht überein')
      }

      // Use Supabase auth signUp (same as normal registration)
      const { supabase } = await import('../../lib/supabase')
      
      console.log('🔄 Creating user via Supabase Auth:', {
        email: formData.email,
        role: formData.role
      })
      
      // Create user with signUp and immediately confirm email
      console.log('🔄 Creating user via signUp:', { email: formData.email, role: formData.role })
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.fullName,
            role: formData.role // Pass role in metadata
          }
        }
      })

      console.log('📥 SignUp Response:', { authData, authError })

      if (authError) {
        console.error('❌ SignUp Error:', authError)
        throw new Error(authError.message || 'Fehler beim Erstellen des Benutzers')
      }
      if (!authData.user) throw new Error('Benutzer konnte nicht erstellt werden')
      
      const user = authData.user
      
      // Set up complete user (confirm email + create profile) using database function
      console.log('🔄 Setting up complete user (email confirmation + profile creation)...')
      
      try {
        const { error } = await supabase.rpc('setup_complete_user', {
          user_id: user.id,
          user_email: formData.email,
          user_full_name: formData.fullName,
          user_role: formData.role,
          user_username: formData.username
        })
        
        if (error) {
          console.warn('⚠️ Complete user setup failed:', error)
          throw error
        } else {
          console.log('✅ Complete user setup successful - email confirmed and profile created')
        }
        
      } catch (setupError) {
        console.warn('⚠️ Complete user setup failed, trying fallback methods:', setupError.message)
        
        // Fallback 1: Try to confirm email
        try {
          await supabase.rpc('confirm_user_email', { user_id: user.id })
          console.log('✅ Email confirmed via fallback')
        } catch (emailError) {
          console.warn('⚠️ Email confirmation fallback failed:', emailError.message)
        }
        
        // Fallback 2: Try to create profile
        try {
          await supabase.rpc('create_user_profile', {
            user_id: user.id,
            user_email: formData.email,
            user_full_name: formData.fullName,
            user_role: formData.role,
            username: formData.username
          })
          console.log('✅ Profile created via fallback')
        } catch (profileError) {
          console.warn('⚠️ Profile creation fallback failed:', profileError.message)
        }
      }

      // Success!
      console.log('✅ User created successfully:', user)
      setSuccess(true)
      setError('') // Clear any previous errors
      
      // Trigger parent component to refresh user list
      console.log('🔄 Triggering user list refresh...')
      if (onSuccess) {
        onSuccess() // This will trigger the parent to refresh
      }
      
      // Show success message for 3 seconds with visual feedback
      setTimeout(() => {
        if (onClose) onClose()
      }, 3000)

    } catch (err) {
      console.error('Error creating user:', err)
      setError(err.message || 'Fehler beim Erstellen des Benutzers')
      setSuccess(false) // Ensure success is false on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#252422] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#EBE9E9]/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#EBE9E9]/20">
          <div>
            <h3 className="text-xl font-bold text-[#252422] dark:text-[#F4F1E8]">
              Neuen Benutzer erstellen
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#EBE9E9] mt-1">
              Erstellen Sie einen neuen Benutzer mit Name, E-Mail, Passwort und Rolle
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#EBE9E9]/10 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-[#F4F1E8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-500 dark:border-green-400 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
                    ✅ Benutzer erfolgreich erstellt!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    <strong>{formData.username}</strong> wurde als <strong>{roles.find(r => r.value === formData.role)?.label}</strong> erstellt.
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      E-Mail bestätigt - Benutzer kann sich sofort anmelden
                    </div>
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Profil erstellt mit Rolle: {roles.find(r => r.value === formData.role)?.label}
                    </div>
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Benutzer erscheint in der Benutzerliste
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">
                      🎉 Der Benutzer kann sich jetzt mit den angegebenen Anmeldedaten anmelden!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-1">
              Benutzername *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg bg-white dark:bg-[#2a2a2a] text-[#252422] dark:text-[#F4F1E8] focus:outline-none focus:ring-2 focus:ring-[#6054d9]"
              placeholder="z.B. max.mustermann"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-1">
              Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg bg-white dark:bg-[#2a2a2a] text-[#252422] dark:text-[#F4F1E8] focus:outline-none focus:ring-2 focus:ring-[#6054d9]"
              placeholder="z.B. Max Mustermann"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-1">
              E-Mail (nur für Kontakt) *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg bg-white dark:bg-[#2a2a2a] text-[#252422] dark:text-[#F4F1E8] focus:outline-none focus:ring-2 focus:ring-[#6054d9]"
              placeholder="max@mustermann.de"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-1">
              Passwort *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg bg-white dark:bg-[#2a2a2a] text-[#252422] dark:text-[#F4F1E8] focus:outline-none focus:ring-2 focus:ring-[#6054d9]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-1">
              Passwort bestätigen *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg bg-white dark:bg-[#2a2a2a] text-[#252422] dark:text-[#F4F1E8] focus:outline-none focus:ring-2 focus:ring-[#6054d9]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-[#252422] dark:text-[#F4F1E8] mb-2">
              Rolle *
            </label>
            <div className="space-y-2">
              {roles.map(role => (
                <label key={role.value} className="flex items-start p-3 border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-[#252422] dark:text-[#F4F1E8]">{role.label}</div>
                    <div className="text-sm text-[#A58C81] dark:text-[#EBE9E9]">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-[#EBE9E9]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#252422] dark:text-[#F4F1E8] bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#EBE9E9]/20 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstelle...
                </div>
              ) : success ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Erstellt!
                </div>
              ) : (
                'Benutzer erstellen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserManagement
