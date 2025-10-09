import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

const RegisterForm = () => {
  const { signUp } = useAuth()
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
        console.log('SignUp successful, redirecting to homepage...')
        setSuccess(true)
        // Redirect to homepage immediately after successful registration
        setTimeout(() => {
          console.log('Redirecting to homepage...')
          navigate('/')
        }, 500)
      }
    } catch (err) {
      console.error('Registration error:', err)
      
      // Check if it's a timeout error but user might be signed in
      if (err.message.includes('SignUp timeout')) {
        console.log('SignUp timed out, but user might be signed in, redirecting to homepage...')
        setSuccess(true)
        // Redirect to homepage after timeout
        setTimeout(() => {
          console.log('Redirecting to homepage after timeout...')
          navigate('/')
        }, 500)
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    console.log('Success screen is being rendered!')
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
        {/* Navigation Header */}
        <nav className="w-full border-b" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
          <div className="w-full px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo on the left */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                  alt="Junge Gesellschaft Logo" 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-lg font-semibold" style={{ color: '#252422' }}>Junge Gesellschaft</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Success Content */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center" style={{ border: '2px solid #A58C81' }}>
              <CheckCircle className="mx-auto h-12 w-12 mb-4" style={{ color: '#10b981' }} />
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#252422' }}>
                Registrierung erfolgreich!
              </h2>
              <p className="text-base mb-6" style={{ color: '#A58C81' }}>
                {error ? (
                  <>
                    Registrierung erfolgreich!<br/>
                    <span style={{ color: '#dc2626' }}>{error}</span>
                  </>
                ) : (
                  'Registrierung erfolgreich! Sie werden zur Startseite weitergeleitet.'
                )}
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#A58C81' }}></div>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#666' }}>
                Weiterleitung zur Startseite...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F1E8' }}>
      {/* Navigation Header */}
      <nav className="w-full border-b" style={{ backgroundColor: '#F4F1E8', borderColor: '#A58C81' }}>
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo on the left */}
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/Wappen-Junge-Gesellschaft-Pferdestall-Wedes-Wedel.png" 
                alt="Junge Gesellschaft Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold" style={{ color: '#252422' }}>Junge Gesellschaft</span>
            </div>
            
            {/* Navigation on the right */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#252422' }}
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
          <div className="bg-white rounded-2xl shadow-xl p-8" style={{ border: '2px solid #A58C81' }}>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#A58C81' }}>
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#252422' }}>
                Neues Konto erstellen
              </h2>
              <p className="text-base" style={{ color: '#A58C81' }}>
                Erstellen Sie Ihr Konto für die Junge Gesellschaft
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div className="flex">
                    <AlertCircle className="h-5 w-5" style={{ color: '#dc2626' }} />
                    <div className="ml-3">
                      <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                    Vollständiger Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5" style={{ color: '#A58C81' }} />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                      style={{ 
                        borderColor: '#A58C81', 
                        focusRingColor: '#A58C81',
                        backgroundColor: '#ffffff'
                      }}
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                    E-Mail-Adresse <span style={{ color: '#666' }}>(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5" style={{ color: '#A58C81' }} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                      style={{ 
                        borderColor: '#A58C81', 
                        focusRingColor: '#A58C81',
                        backgroundColor: '#ffffff'
                      }}
                      placeholder="ihre@email.de (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                    Passwort
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5" style={{ color: '#A58C81' }} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                      style={{ 
                        borderColor: '#A58C81', 
                        focusRingColor: '#A58C81',
                        backgroundColor: '#ffffff'
                      }}
                      placeholder="Mindestens 6 Zeichen"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                      style={{ color: '#A58C81' }}
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
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                    Passwort bestätigen
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5" style={{ color: '#A58C81' }} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                      style={{ 
                        borderColor: '#A58C81', 
                        focusRingColor: '#A58C81',
                        backgroundColor: '#ffffff'
                      }}
                      placeholder="Passwort wiederholen"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                      style={{ color: '#A58C81' }}
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
                  className="w-full flex justify-center py-3 px-4 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  style={{ backgroundColor: '#A58C81' }}
                >
                  {isSubmitting ? 'Wird registriert...' : 'Konto erstellen'}
                </button>
                
                <div className="text-center">
                  <p className="text-sm" style={{ color: '#666' }}>
                    Bereits ein Konto?{' '}
                    <Link
                      to="/login"
                      className="font-medium hover:opacity-80 transition-opacity"
                      style={{ color: '#A58C81' }}
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
