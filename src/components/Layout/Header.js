import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, Calendar, Users, Settings, LogOut, User } from 'lucide-react'

const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  console.log('Header render - user:', user, 'profile:', profile, 'isAdmin():', isAdmin())
  console.log('Admin navigation should show:', isAdmin())
  console.log('User email check:', user?.email === 'admin@admin.com')

  const handleSignOut = async () => {
    console.log('Logout button clicked!')
    try {
      console.log('Calling signOut...')
      
      // Add timeout to prevent hanging
      const signOutPromise = signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Header signOut timeout after 5 seconds')), 5000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      console.log('SignOut completed, closing mobile menu')
      setIsMobileMenuOpen(false)
      console.log('Logout process completed')
    } catch (error) {
      console.error('Error during logout:', error)
      
      // If timeout, force reload to clear session
      if (error.message.includes('timeout')) {
        console.log('Logout timed out, forcing page reload...')
        window.location.reload()
      }
    }
  }

  const navigation = [
    { name: 'Startseite', href: '/', icon: Calendar },
    { name: 'Über uns', href: '/about', icon: null },
  ]

  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: Settings },
    { name: 'Benutzer', href: '/admin/users', icon: Users },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Jungengesellschaft
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </Link>
              )
            })}
            
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    console.log('Profile clicked - starting navigation')
                    console.log('Current location before navigate:', window.location.pathname)
                    try {
                      navigate('/profile')
                      console.log('Navigate called successfully')
                    } catch (error) {
                      console.error('Navigation error:', error)
                    }
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Profil
                </button>
                {isAdmin() && (
                  <Link
                    to="/admin"
                    onClick={() => console.log('Admin panel clicked')}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border-2 border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors duration-200"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    console.log('Email clicked - navigating to profile')
                    try {
                      navigate('/profile')
                    } catch (error) {
                      console.error('Navigation error:', error)
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-700 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  {profile?.full_name || user.email}
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Anmelden
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded="false"
            >
              <span className="sr-only">Hauptmenü öffnen</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {Icon && <Icon className="h-5 w-5 mr-3" />}
                      {item.name}
                    </div>
                  </Link>
                )
              })}
              
              {isAdmin() && adminNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-white bg-red-600'
                        : 'text-red-600 bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {Icon && <Icon className="h-5 w-5 mr-3" />}
                      {item.name}
                    </div>
                  </Link>
                )
              })}


              {/* Mobile User Menu */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-3" />
                        {profile?.full_name || user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Mobile profile clicked - starting navigation')
                        console.log('Current location before navigate:', window.location.pathname)
                        setIsMobileMenuOpen(false)
                        try {
                          navigate('/profile')
                          console.log('Mobile navigate called successfully')
                        } catch (error) {
                          console.error('Mobile navigation error:', error)
                        }
                      }}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-3" />
                        Profil
                      </div>
                    </button>
                    {isAdmin() && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-base font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <Settings className="h-5 w-5 mr-3" />
                          Admin Panel
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-5 w-5 mr-3" />
                        Abmelden
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    >
                      Anmelden
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors duration-200"
                    >
                      Registrieren
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
