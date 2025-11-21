// FILE OVERVIEW
// - Purpose: Forgot password form component that sends password reset email via Supabase.
// - Used by: ForgotPasswordPage (route '/forgot-password').
// - Notes: Production component. Uses supabase.auth.resetPasswordForEmail() to send recovery email.

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { supabase } from '../../lib/supabase'
import { getSiteUrl, secureLog, sanitizeError } from '../../utils/secureConfig'
import { Mail, Lock, AlertCircle, CheckCircle, Moon, Sun, ArrowLeft } from 'lucide-react'

const ForgotPasswordForm = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate email
      if (!email.trim()) {
        setError('Bitte geben Sie Ihre E-Mail-Adresse ein')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
        setLoading(false)
        return
      }

      // Get site URL for redirect
      const siteUrl = getSiteUrl()
      const redirectTo = `${siteUrl}/reset-password`

      secureLog('log', '[ForgotPassword] Sending password reset email', { email: email.trim().substring(0, 3) + '***' })
      secureLog('log', '[ForgotPassword] Redirect URL', { redirectTo })

      // Send password reset email
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo
      })

      if (resetError) {
        secureLog('error', '[ForgotPassword] Error sending reset email', { error: sanitizeError(resetError) })
        
        // Handle specific errors
        if (resetError.message && resetError.message.includes('rate limit')) {
          setError('Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.')
        } else {
          // For security, don't reveal if user exists or not
          // Show success message even on error to prevent email enumeration
          secureLog('log', '[ForgotPassword] Showing success message (security: prevent email enumeration)')
          setSuccess(true)
        }
      } else {
        secureLog('log', '[ForgotPassword] Password reset email sent successfully')
        setSuccess(true)
      }
    } catch (err) {
      secureLog('error', '[ForgotPassword] Unexpected error', { error: sanitizeError(err) })
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
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
                Passwort zurücksetzen
              </h2>
              <p className="text-base text-[#A58C81] dark:text-[#EBE9E9]">
                Geben Sie Ihre E-Mail-Adresse ein, um ein Passwort-Reset-Link zu erhalten
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        E-Mail wurde gesendet
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Falls ein Konto mit der E-Mail-Adresse <strong className="break-all">{email}</strong> existiert, 
                        haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Wichtig:</strong> Überprüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten haben.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="w-full flex justify-center items-center py-3 px-4 min-h-[44px] text-base font-medium text-white rounded-lg hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-[#2E07D4] hover:bg-[#2506B8] touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Zurück zur Anmeldung
                  </Link>
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

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-[#A58C81] dark:text-[#EBE9E9] flex-shrink-0" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full py-3 pr-4 min-h-[44px] text-base border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontSize: '16px', paddingLeft: '3.5rem' }}
                      placeholder="ihre@email.de"
                    />
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
                        <span>Wird gesendet...</span>
                      </>
                    ) : (
                      'Passwort-Reset-Link senden'
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

export default ForgotPasswordForm

