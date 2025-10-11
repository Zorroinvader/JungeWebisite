import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DarkModeProvider } from './contexts/DarkModeContext'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import FAQPage from './pages/FAQPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import ProfilePageSimple from './pages/ProfilePageSimple'
import AdminPanelClean from './components/Admin/AdminPanelClean'
import './index.css'

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const { user, isAdmin, loading } = useAuth()
  const [forceLoad, setForceLoad] = React.useState(false)

  // Force load after 5 seconds to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoad(true)
    }, 5000) // 5 second timeout

    return () => clearTimeout(timer)
  }, [])

  if (loading && !forceLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading...</p>
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin) {
    // Quick admin check based on email (doesn't require profile to be loaded)
    const isAdminByEmail = user?.email === 'admin@admin.com'
    const adminStatus = isAdmin()
    
    // Allow access if user is admin by email OR by role
    if (!isAdminByEmail && !adminStatus) {
      return <Navigate to="/" replace />
    }
  }

  return children
}


// Main App Component
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        
        {/* Test Route */}
        <Route path="/test" element={<div>Test Route Works!</div>} />
        <Route path="/profile-test" element={<Layout><ProfilePageSimple /></Layout>} />
        <Route path="/admin-test" element={<Layout><AdminPanelClean /></Layout>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Layout><AdminPanelClean /></Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route - but exclude assets */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

// App Component with AuthProvider and DarkModeProvider
const App = () => {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DarkModeProvider>
  )
}

export default App
