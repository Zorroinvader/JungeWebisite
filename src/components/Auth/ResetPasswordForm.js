// FILE OVERVIEW
// - Purpose: Reset password form component that handles password reset from email link.
// - Used by: ResetPasswordPage (route '/reset-password').
// - Notes: Production component. Handles PASSWORD_RECOVERY event and updates user password via supabase.auth.updateUser().

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { supabase } from '../../lib/supabase'
import { secureLog, sanitizeError } from '../../utils/secureConfig'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Moon, Sun, ArrowLeft } from 'lucide-react'

const ResetPasswordForm = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)

  // Check if we have a valid password recovery session
  useEffect(() => {
    let mounted = true

    const checkRecoverySession = async () => {
      try {
        // Check URL parameters for recovery tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const urlParams = new URLSearchParams(window.location.search)
        
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type') || urlParams.get('type')
        
        secureLog('log', '[ResetPassword] Checking recovery session', { type })
        
        // If we have tokens in URL with recovery type, set session
        if (accessToken && type === 'recovery') {
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            secureLog('log', '[ResetPassword] Setting session from recovery tokens')
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (!sessionError && session && mounted) {
              secureLog('log', '[ResetPassword] Session set successfully')
              setIsValidToken(true)
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname)
              setChecking(false)
              return
            } else if (sessionError && mounted) {
              secureLog('error', '[ResetPassword] Session error', { error: sanitizeError(sessionError) })
              setError('Der Reset-Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.')
              setChecking(false)
              return
            }
          }
        }
        
        // Check if we have an active session (might be set by Supabase automatically)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          secureLog('log', '[ResetPassword] Active session found')
          // If we're on reset-password page with a session, assume it's valid
          setIsValidToken(true)
          setChecking(false)
          return
        }
        
        // No valid session found
        if (mounted) {
          // Only show error if we explicitly came from a recovery link
          if (type === 'recovery' || accessToken) {
            setError('Kein gültiger Reset-Link gefunden. Bitte fordern Sie einen neuen Link an.')
          } else {
            // User navigated directly to reset-password without a link
            setError('Bitte verwenden Sie den Link aus der E-Mail zum Zurücksetzen des Passworts.')
          }
          setChecking(false)
        }
      } catch (err) {
        secureLog('error', '[ResetPassword] Error checking recovery session', { error: sanitizeError(err) })
        if (mounted) {
          setError('Fehler beim Überprüfen des Reset-Links. Bitte versuchen Sie es erneut.')
          setChecking(false)
        }
      }
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      secureLog('log', '[ResetPassword] Auth state change', { event })
      
      if (event === 'PASSWORD_RECOVERY' && mounted) {
        secureLog('log', '[ResetPassword] PASSWORD_RECOVERY event detected')
        setIsValidToken(true)
        setChecking(false)
      } else if (event === 'SIGNED_IN' && session?.user && mounted) {
        // User signed in from recovery link
        secureLog('log', '[ResetPassword] User signed in from recovery')
        setIsValidToken(true)
        setChecking(false)
      }
    })

    checkRecoverySession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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
    if (!formData.password) {
      setError('Bitte geben Sie ein neues Passwort ein')
      return false
    }
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
    setLoading(true)
    setError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      secureLog('log', '[ResetPassword] Updating user password')
      
      // Update user password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (updateError) {
        secureLog('error', '[ResetPassword] Error updating password', { error: sanitizeError(updateError) })
        setError(updateError.message || 'Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.')
      } else {
        secureLog('log', '[ResetPassword] Password updated successfully')
        setSuccess(true)
        
        // Sign out the user after password reset for security
        // They should sign in again with the new password
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          secureLog('warn', '[ResetPassword] Error signing out', { error: sanitizeError(signOutError) })
          // Continue with redirect even if sign out fails
        }
        
        // Redirect to login after 2 seconds with success state
        setTimeout(() => {
          navigate('/login', { replace: true, state: { passwordReset: true } })
        }, 2000)
      }
    } catch (err) {
      secureLog('error', '[ResetPassword] Unexpected error', { error: sanitizeError(err) })
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking token
  if (checking) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A58C81] mx-auto mb-4"></div>
          <p className="text-[#252422] dark:text-[#F4F1E8]">Überprüfe Reset-Link...</p>
        </div>
      </div>
    )
  }

  // Show error if no valid token
  if (!isValidToken && error) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
        <nav className="w-full border-b border-[#A58C81] dark:border-[#EBE9E9] bg-[#F4F1E8] dark:bg-[#252422]">
          <div className="w-full px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-lg font-semibold text-[#252422] dark:text-[#F4F1E8]">Junge Gesellschaft</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  aria-label={isDarkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
                  className="p-2 hover:opacity-70 transition-opacity rounded-lg text-[#252422] dark:text-[#F4F1E8]"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-[#252422] rounded-2xl shadow-xl p-8 border-2 border-[#A58C81] dark:border-[#EBE9E9]">
              <div className="text-center mb-8">
                <div className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-[#252422] dark:text-[#F4F1E8]">
                  Ungültiger Link
                </h2>
              </div>

              <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center items-center py-3 px-4 min-h-[44px] text-base font-medium text-white rounded-lg hover:opacity-90 active:scale-95 transition-all bg-[#2E07D4] hover:bg-[#2506B8] touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  Neuen Reset-Link anfordern
                </Link>
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-3 px-4 min-h-[44px] text-base font-medium text-[#A58C81] dark:text-[#EBE9E9] rounded-lg hover:opacity-80 transition-opacity border border-[#A58C81] dark:border-[#EBE9E9] touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Zurück zur Anmeldung
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                aria-label={isDarkMode ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
                className="p-2 hover:opacity-70 transition-opacity rounded-lg text-[#252422] dark:text-[#F4F1E8]"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link
                to="/login"
                className="text-sm font-medium hover:opacity-70 transition-opacity text-[#252422] dark:text-[#F4F1E8]"
              >
                Zurück zur Anmeldung
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
                <Lock className="h-6 w-6 text-white dark:text-[#252422]" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Neues Passwort festlegen
              </h2>
              <p className="text-base text-[#A58C81] dark:text-[#EBE9E9]">
                Geben Sie Ihr neues Passwort ein
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Passwort erfolgreich zurückgesetzt!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Sie werden in Kürze zur Anmeldeseite weitergeleitet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm text-red-600 dark:text-red-400 break-words">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                      Neues Passwort
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9] flex-shrink-0" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full py-3 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ paddingLeft: '3.5rem', paddingRight: '3rem', minHeight: '44px', fontSize: '16px' }}
                        placeholder="Mindestens 6 Zeichen"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity text-[#A58C81] dark:text-[#EBE9E9] z-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <Eye className="h-5 w-5 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                      Passwort bestätigen
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9] flex-shrink-0" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full py-3 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ paddingLeft: '3.5rem', paddingRight: '3rem', minHeight: '44px', fontSize: '16px' }}
                        placeholder="Passwort wiederholen"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity text-[#A58C81] dark:text-[#EBE9E9] z-10"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <Eye className="h-5 w-5 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 min-h-[44px] text-base font-medium text-white rounded-lg hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-[#2E07D4] hover:bg-[#2506B8] touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-[#252422] mr-2 flex-shrink-0"></div>
                        <span>Passwort wird zurückgesetzt...</span>
                      </>
                    ) : (
                      'Passwort zurücksetzen'
                    )}
                  </button>
                  
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm font-medium hover:opacity-80 transition-opacity text-[#A58C81] dark:text-[#EBE9E9] inline-flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Zurück zur Anmeldung
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordForm

