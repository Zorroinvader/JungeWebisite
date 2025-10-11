import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { profilesAPI } from '../../services/httpApi'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Moon, Sun } from 'lucide-react'

const RegisterForm = ({ onSuccess, isModal = false }) => {
  const { signUp } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Note: Auth state change listener removed - we handle redirect directly after signup

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Bitte geben Sie Ihren vollständigen Namen ein')
      return false
    }
    // Email is now optional - no validation needed
    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submitted!', formData)
    setIsSubmitting(true)
    setError('')

    if (!validateForm()) {
      console.log('Form validation failed')
      setIsSubmitting(false)
      return
    }
    
    console.log('Form validation passed, proceeding with registration')

    try {
      if (isModal) {
        // Admin panel mode - create user without signing in
        console.log('Creating user via admin panel (no sign-in)')
        const result = await profilesAPI.createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: 'member' // Default role for admin-created users
        })
        
        console.log('User created successfully:', result)
        setSuccess(true)
        
        // Use callback to close modal and refresh user list
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        // Public registration mode - sign up and sign in
        console.log('Calling signUp with:', { email: formData.email, password: formData.password, fullName: formData.fullName })
        
        // Add timeout to prevent hanging
        const signUpPromise = signUp(formData.email, formData.password, formData.fullName)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SignUp timeout after 1 seconds')), 1000)
        )
        
        const { data, error } = await Promise.race([signUpPromise, timeoutPromise])
        console.log('SignUp response:', { data, error })
        
        if (error) {
          console.log('SignUp error:', error)
          setError(error.message)
        } else {
          console.log('SignUp successful')
          setSuccess(true)
          
          // Redirect to homepage
          setTimeout(() => {
            console.log('Redirecting to homepage...')
            navigate('/')
          }, 500)
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      
      if (isModal) {
        // Admin panel error handling
        setError(`Fehler beim Erstellen des Benutzers: ${err.message}`)
      } else {
        // Public registration error handling
        // Check if it's a timeout error but user might be signed in
        if (err.message.includes('SignUp timeout')) {
          console.log('SignUp timed out, but user might be signed in')
          setSuccess(true)
          
          // Redirect to homepage after timeout
          setTimeout(() => {
            console.log('Redirecting to homepage after timeout...')
            navigate('/')
          }, 500)
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    console.log('Success screen is being rendered!')
    
    if (isModal) {
      // Modal success screen
      return (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-[#252422] dark:text-[#F4F1E8] mb-2">
            Benutzer erfolgreich erstellt!
          </h3>
          <p className="text-sm text-gray-600 dark:text-[#EBE9E9] mb-4">
            Der neue Benutzer kann sich jetzt mit den angegebenen Daten anmelden.
          </p>
        </div>
      )
    }
    
    // Full page success screen
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
        {/* Navigation Header */}
        <nav className="w-full border-b border-[#A58C81] dark:border-[#EBE9E9] bg-[#F4F1E8] dark:bg-[#252422]">
          <div className="w-full px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo on the left */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-lg font-semibold text-[#252422] dark:text-[#F4F1E8]">Junge Gesellschaft</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Success Content */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white dark:bg-[#252422] rounded-2xl shadow-xl p-8 text-center border-2 border-[#A58C81] dark:border-[#EBE9E9]">
              <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-600 dark:text-green-400" />
              <h2 className="text-3xl font-bold mb-4 text-[#252422] dark:text-[#F4F1E8]">
                Registrierung erfolgreich!
              </h2>
              <p className="text-base mb-6 text-[#A58C81] dark:text-[#EBE9E9]">
                {error ? (
                  <>
                    Registrierung erfolgreich!<br/>
                    <span className="text-red-600 dark:text-red-400">{error}</span>
                  </>
                ) : (
                  'Registrierung erfolgreich! Sie werden zur Startseite weitergeleitet.'
                )}
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto border-[#A58C81] dark:border-[#EBE9E9]"></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-[#EBE9E9]">
                Weiterleitung zur Startseite...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isModal) {
    // Modal form - no header, no dark mode toggle
    return (
      <div className="space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Vollständiger Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-3 pl-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  placeholder="Max Mustermann"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                E-Mail-Adresse <span className="text-gray-600 dark:text-[#EBE9E9]">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-3 pl-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  placeholder="ihre@email.de (optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-3 pl-10 pr-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  placeholder="Mindestens 6 Zeichen"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Passwort bestätigen
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-3 pl-10 pr-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  placeholder="Passwort wiederholen"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#2E07D4] hover:bg-[#2506B8]"
            >
              {isSubmitting ? 'Wird registriert...' : 'Konto erstellen'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Full page form
  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      {/* Navigation Header */}
      <nav className="w-full border-b border-[#A58C81] dark:border-[#EBE9E9] bg-[#F4F1E8] dark:bg-[#252422]">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo on the left */}
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                alt="Junge Gesellschaft Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold text-[#252422] dark:text-[#F4F1E8]">Junge Gesellschaft</span>
            </div>
            
            {/* Navigation on the right */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:opacity-70 transition-opacity rounded-lg text-[#252422] dark:text-[#F4F1E8]"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link
                to="/"
                className="text-sm font-medium hover:opacity-70 transition-opacity text-[#252422] dark:text-[#F4F1E8]"
              >
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white dark:bg-[#252422] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#EBE9E9]">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-4 bg-[#A58C81] dark:bg-[#EBE9E9]">
                <User className="h-6 w-6 text-white dark:text-[#252422]" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Neues Konto erstellen
              </h2>
              <p className="text-base text-[#A58C81] dark:text-[#EBE9E9]">
                Erstellen Sie Ihr Konto für die Junge Gesellschaft
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    Vollständiger Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    E-Mail-Adresse <span className="text-gray-600 dark:text-[#EBE9E9]">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                      placeholder="ihre@email.de (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    Passwort
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 pr-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                      placeholder="Mindestens 6 Zeichen"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    Passwort bestätigen
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9]" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 pr-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                      placeholder="Passwort wiederholen"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => console.log('Register button clicked!')}
                  className="w-full flex justify-center py-3 px-4 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#2E07D4] hover:bg-[#2506B8]"
                >
                  {isSubmitting ? 'Wird registriert...' : 'Konto erstellen'}
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-[#EBE9E9]">
                    Bereits ein Konto?{' '}
                    <Link
                      to="/login"
                      className="font-medium hover:opacity-80 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]"
                    >
                      Jetzt anmelden
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
