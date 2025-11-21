// FILE OVERVIEW
// - Purpose: Registration form component with email/password/full name fields, validation, password visibility toggle, and email confirmation handling.
// - Used by: RegisterPage (route '/register') and can be used as modal; handles pending event requests after registration.
// - Notes: Production component. Uses AuthContext.signUp and creates profile via profilesAPI; checks for pending event requests from sessionStorage.

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { profilesAPI } from '../../services/databaseApi'
import { secureLog, sanitizeError } from '../../utils/secureConfig'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Moon, Sun } from 'lucide-react'

const RegisterForm = ({ onSuccess, isModal = false }) => {
  const { signUp } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
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
    if (!formData.email || !formData.email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein')
      return false
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
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
    setIsSubmitting(true)
    setError('')

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }
    

    try {
      if (isModal) {
        // Admin panel mode - create user without signing in
        await profilesAPI.createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: 'member' // Default role for admin-created users
        })
        
        setSuccess(true)
        
        // Use callback to close modal and refresh user list
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        // Public registration mode - sign up and send confirmation email
        
        secureLog('log', '[RegisterForm] Attempting to register user', { email: formData.email.substring(0, 3) + '***' })
        
        // Call signup without timeout - let it complete naturally
        const { error, data } = await signUp(formData.email, formData.password, formData.fullName)
        
        if (error) {
          secureLog('error', '[RegisterForm] Registration error', { error: sanitizeError(error) })
          
          // Handle email sending errors
          if (error.message && (
            error.message.includes('Error sending confirmation email') ||
            error.message.includes('Fehler beim Senden der Bestätigungs-E-Mail') ||
            error.message.includes('email')
          )) {
            setError('Es gab ein Problem beim Senden der Bestätigungs-E-Mail. Bitte versuchen Sie sich anzumelden, um zu überprüfen, ob Ihr Konto existiert. Falls das Problem weiterhin besteht, kontaktieren Sie bitte den Administrator.')
          } else {
            setError(error.message)
          }
        } else {
          secureLog('log', '[RegisterForm] Registration successful', { email: formData.email.substring(0, 3) + '***' })
          setSuccess(true)
          
          // Don't auto-redirect - let user see the email verification message
          // They will be redirected after clicking the email link
        }
      }
    } catch (err) {
      
      if (isModal) {
        // Admin panel error handling
        setError(`Fehler beim Erstellen des Benutzers: ${err.message}`)
      } else {
        // Handle email sending errors
        if (err.message && err.message.includes('Error sending confirmation email')) {
          setError('Es gab ein Problem beim Senden der Bestätigungs-E-Mail. Bitte versuchen Sie sich anzumelden, um zu überprüfen, ob Ihr Konto existiert. Falls das Problem weiterhin besteht, kontaktieren Sie bitte den Administrator.')
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    
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
          <p className="text-sm text-gray-600 dark:text-[#EBE9E9] mb-2">
            Der neue Benutzer kann sich sofort anmelden.
          </p>
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-xs text-green-800 dark:text-green-300 font-medium">
              ✓ E-Mail automatisch bestätigt - Keine Verifikation erforderlich!
            </p>
          </div>
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
              <Mail className="mx-auto h-16 w-16 mb-4 text-[#A58C81] dark:text-[#EBE9E9]" />
              <h2 className="text-3xl font-bold mb-4 text-[#252422] dark:text-[#F4F1E8]">
                Fast geschafft!
              </h2>
              <p className="text-lg mb-4 text-[#252422] dark:text-[#F4F1E8] font-semibold">
                Bitte bestätigen Sie Ihre E-Mail-Adresse
              </p>
              <p className="text-base mb-6 text-[#A58C81] dark:text-[#EBE9E9]">
                Wir haben eine Bestätigungs-E-Mail an <strong className="break-all">{formData.email}</strong> gesendet.
                <br/><br/>
                Klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Wichtig:</strong> Überprüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten haben.
                </p>
              </div>

              <Link
                to="/"
                className="inline-block px-6 py-3 min-h-[44px] text-base bg-[#A58C81] dark:bg-[#6a6a6a] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all font-semibold touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                Zur Startseite
              </Link>
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
                  className="w-full px-3 py-3 pl-10 min-h-[44px] text-base border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  style={{ fontSize: '16px' }}
                  placeholder="Max Mustermann"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                E-Mail-Adresse <span className="text-red-600 dark:text-red-400">*</span>
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
                  required
                  className="w-full px-3 py-3 pl-10 min-h-[44px] text-base border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  style={{ fontSize: '16px' }}
                  placeholder="ihre@email.de"
                />
              </div>
              <p className={`text-xs mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                Erforderlich für E-Mail-Bestätigung und Benachrichtigungen
              </p>
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
              className="w-full flex justify-center py-3 px-4 min-h-[44px] text-base font-medium text-white rounded-lg hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-[#2E07D4] hover:bg-[#2506B8] touch-manipulation"
              style={{ touchAction: 'manipulation' }}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Konto wird erstellt & E-Mail wird gesendet...
                </span>
              ) : 'Konto erstellen'}
            </button>

            {isSubmitting && (
              <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Bitte warten Sie, während wir Ihr Konto erstellen und eine Bestätigungs-E-Mail senden...
                </p>
              </div>
            )}
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
                      className="w-full px-3 py-3 pl-10 min-h-[44px] text-base border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  style={{ fontSize: '16px' }}
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    E-Mail-Adresse <span className="text-red-600 dark:text-red-400">*</span>
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
                      required
                      className="w-full px-3 py-3 pl-10 min-h-[44px] text-base border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                  style={{ fontSize: '16px' }}
                      placeholder="ihre@email.de"
                    />
                  </div>
                  <p className={`text-xs mt-1 text-[#A58C81] ${isDarkMode ? 'dark:text-[#EBE9E9]' : ''}`}>
                    Erforderlich für E-Mail-Bestätigung und Benachrichtigungen
                  </p>
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
                  className="w-full flex justify-center py-3 px-4 min-h-[44px] text-base font-medium text-white rounded-lg hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-[#2E07D4] hover:bg-[#2506B8] touch-manipulation"
              style={{ touchAction: 'manipulation' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Konto wird erstellt & E-Mail wird gesendet...
                    </span>
                  ) : 'Konto erstellen'}
                </button>

                {isSubmitting && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Bitte warten Sie, während wir Ihr Konto erstellen und eine Bestätigungs-E-Mail senden...
                    </p>
                  </div>
                )}
                
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
