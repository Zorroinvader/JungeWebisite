import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'

const LoginForm = () => {
  const { signIn, user, loading: authLoading } = useAuth()
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
    console.log('LoginForm useEffect - user:', user, 'loading:', loading)
    if (user) {
      console.log('User logged in, navigating to home page')
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
    console.log('Login form submitted with:', formData)
    setLoading(true)
    setError('')

    try {
      console.log('Calling signIn...')
      const { data, error } = await signIn(formData.email, formData.password)
      console.log('SignIn result:', { data, error })
      
      if (error) {
        console.log('Login error:', error)
        setError(error.message)
        setLoading(false)
      } else {
        console.log('Login successful, waiting for auth state change...')
      }
      // If successful, the useEffect will handle navigation and loading state
    } catch (err) {
      console.log('Login exception:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  console.log('LoginForm rendering, loading:', loading, 'error:', error)
  
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
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#252422' }}>
                Bei Ihrem Konto anmelden
              </h2>
              <p className="text-base" style={{ color: '#A58C81' }}>
                Melden Sie sich in Ihrem Konto an
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
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#252422' }}>
                    E-Mail-Adresse
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
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                      style={{ 
                        borderColor: '#A58C81', 
                        focusRingColor: '#A58C81',
                        backgroundColor: '#ffffff'
                      }}
                      placeholder="ihre@email.de"
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
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                      style={{ 
                        borderColor: '#A58C81', 
                        focusRingColor: '#A58C81',
                        backgroundColor: '#ffffff'
                      }}
                      placeholder="Ihr Passwort"
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
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a
                    href="/forgot-password"
                    className="font-medium hover:opacity-80 transition-opacity"
                    style={{ color: '#A58C81' }}
                  >
                    Passwort vergessen?
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  style={{ backgroundColor: '#A58C81' }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Wird angemeldet...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>
                
                <div className="text-center">
                  <p className="text-sm" style={{ color: '#666' }}>
                    Noch kein Konto?{' '}
                    <Link
                      to="/register"
                      className="font-medium hover:opacity-80 transition-opacity"
                      style={{ color: '#A58C81' }}
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
