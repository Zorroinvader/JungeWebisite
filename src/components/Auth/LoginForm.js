// FILE OVERVIEW
// - Purpose: Login form component with email/password fields, password visibility toggle, dark mode toggle, and redirect handling.
// - Used by: LoginPage (route '/login') and can be used as modal in other contexts.
// - Notes: Production component. Handles authentication via AuthContext.signIn and redirects after successful login.

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Moon, Sun } from 'lucide-react'

const LoginForm = () => {
  const { signIn, user } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset loading when user logs in successfully
  useEffect(() => {
    if (user) {
      setLoading(false)
      navigate('/')
    }
  }, [user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signIn(formData.email, formData.password)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
      }
      // If successful, the useEffect will handle navigation and loading state
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
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
                <Lock className="h-6 w-6 text-white dark:text-[#252422]" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-[#252422] dark:text-[#F4F1E8]">
                Bei Ihrem Konto anmelden
              </h2>
              <p className="text-base text-[#A58C81] dark:text-[#EBE9E9]">
                Melden Sie sich in Ihrem Konto an
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
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#252422] dark:text-[#F4F1E8]">
                    E-Mail-Adresse
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
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                      placeholder="ihre@email.de"
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
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 pr-10 border border-[#A58C81] dark:border-[#EBE9E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A58C81] dark:focus:ring-[#EBE9E9] focus:ring-opacity-50 transition-colors bg-white dark:bg-[#252422] text-[#252422] dark:text-[#F4F1E8]"
                      placeholder="Ihr Passwort"
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
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a
                    href="/forgot-password"
                    className="font-medium hover:opacity-80 transition-opacity text-[#A58C81] dark:text-[#EBE9E9]"
                  >
                    Passwort vergessen?
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-[#2E07D4] hover:bg-[#2506B8]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-[#252422] mr-2"></div>
                      Wird angemeldet...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-[#EBE9E9]">
                    Noch kein Konto?{' '}
                    <Link
                      to="/register"
                      className="font-medium hover:opacity-80 transition-opacity text-[#A58C81] dark:text-[#F4F1E8]"
                    >
                      Jetzt registrieren
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

export default LoginForm
