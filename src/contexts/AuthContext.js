// FILE OVERVIEW
// - Purpose: Global authentication and authorization context (user session, profile, roles, sign-in/out, admin checks).
// - Used by: Entire app via useAuth() hook and AuthProvider in App.js.
// - Notes: Production file. Changes affect login flow, email confirmation handling, and admin/member permissions.

/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, USER_ROLES } from '../lib/supabase'
import { profilesAPI } from '../services/databaseApi'
import { secureLog, sanitizeError } from '../utils/secureConfig'

// Create AuthContext
const AuthContext = createContext({})

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get user profile from database
  // Uses profilesAPI which has HTTP-first approach with timeout to avoid hanging
  const getProfile = async (userId) => {
    if (!userId) return null
    
    try {
      // Use profilesAPI which has executeWithFallback with HTTP-first approach
      // Add timeout wrapper to prevent hanging
      const profilePromise = profilesAPI.getById(userId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      )
      
      const result = await Promise.race([profilePromise, timeoutPromise])
      
      // Handle result format from executeWithFallback
      let profileData = result
      if (result && typeof result === 'object' && result.data !== undefined) {
        profileData = result.data
      }
      
      // If result is an array, take first element
      if (Array.isArray(profileData)) {
        profileData = profileData[0] || null
      }
      
      // If profile doesn't exist, create it
      if (!profileData) {
        return await createProfile(userId)
      }
      
      return profileData
    } catch (error) {
      // If timeout or error, try to create profile if it's a "not found" error
      if (error.message && error.message.includes('timeout')) {
        // On timeout, try creating profile
        try {
          return await createProfile(userId)
        } catch (createError) {
          return null
        }
      }
      // For other errors, check if it's a "not found" error
      if (error.code === 'PGRST116' || (error.message && error.message.includes('not found'))) {
        return await createProfile(userId)
      }
      return null
    }
  }

  // Create profile if it doesn't exist
  const createProfile = async (userId) => {
    try {
      // Add timeout to prevent hanging
      const getUserPromise = supabase.auth.getUser()
      const getUserTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 2000)
      )
      
      let userData = null
      try {
        const { data: user } = await Promise.race([getUserPromise, getUserTimeout])
        userData = user?.user
      } catch (getUserError) {
        // If getUser fails, try to get email from session
        try {
          const sessionPromise = supabase.auth.getSession()
          const sessionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getSession timeout')), 2000)
          )
          const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout])
          userData = session?.user
        } catch (e) {
          return null
        }
      }
      
      if (!userData) return null

      // Add timeout for insert
      const insertPromise = supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: userData.email,
          full_name: userData.user_metadata?.full_name || null,
          role: 'member'
        }])
        .select()
        .single()
      
      const insertTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Insert timeout')), 3000)
      )

      const { data, error } = await Promise.race([insertPromise, insertTimeout])

      if (error) {
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  // Sign up function
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true)
      
      // Validate email is provided and not empty
      if (!email || !email.trim()) {
        throw new Error('E-Mail-Adresse ist erforderlich')
      }
      
      // Trim and validate email format
      const userEmail = email.trim().toLowerCase()
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userEmail)) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      }
      
      // Use production site URL + /login as redirect URL (redirects to login page after activation)
      const { getSiteUrl } = await import('../utils/secureConfig')
      const siteUrl = getSiteUrl()
      const redirectTo = `${siteUrl}/login?activated=true`

      secureLog('log', '[signUp] Sending confirmation email', { email: userEmail.substring(0, 3) + '***', redirectTo })

      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            original_email: userEmail
          },
          emailRedirectTo: redirectTo // Redirect to login page with activation notification
        }
      })

      if (error) {
        secureLog('error', '[signUp] Error during signup', { error: sanitizeError(error) })
        
        // If user already exists, try to handle it gracefully
        if (error.message && error.message.includes('already registered')) {
          throw new Error('Diese E-Mail-Adresse ist bereits registriert')
        }
        
        // Check for email sending errors
        if (error.message && (
          error.message.includes('email') || 
          error.message.includes('Email') ||
          error.message.includes('confirmation')
        )) {
          throw new Error(`Fehler beim Senden der Bestätigungs-E-Mail: ${error.message}`)
        }
        
        throw error
      }

      // Verify that user was created and email will be sent
      if (data?.user) {
        secureLog('log', '[signUp] User created successfully', { 
          email: data.user.email ? data.user.email.substring(0, 3) + '***' : 'unknown',
          userId: data.user.id,
          emailConfirmed: !!data.user.email_confirmed_at
        })
      } else {
        secureLog('warn', '[signUp] No user data returned from signup')
      }

      // Profile will be created automatically by the database trigger
      return { data, error: null }
    } catch (error) {
      secureLog('error', '[signUp] Signup failed', { error: sanitizeError(error) })
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)
      
      // Add timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout after 3 seconds')), 3000)
      )
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise])
      
      if (error) {
        throw error
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
    } catch (error) {
      
      // Even if signOut fails, clear local state
      if (error.message.includes('SignOut timeout')) {
        setUser(null)
        setProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check if user is superadmin
  const isSuperAdmin = () => {
    const isSuperAdminByEmail = user?.email === 'admin@admin.com'
    const isSuperAdminByRole = profile?.role === USER_ROLES.SUPERADMIN
    
    return isSuperAdminByRole || isSuperAdminByEmail
  }

  // Check if user is admin (includes superadmin)
  const isAdmin = () => {
    // Check if user email is admin@admin.com as fallback
    const isAdminByEmail = user?.email === 'admin@admin.com'
    const isAdminByRole = profile?.role === USER_ROLES.ADMIN || profile?.role === USER_ROLES.SUPERADMIN
    
    const isAdminUser = isAdminByRole || isAdminByEmail
    return isAdminUser
  }

  // Check if user is member or admin
  const isMember = () => {
    return profile?.role === USER_ROLES.MEMBER || profile?.role === USER_ROLES.ADMIN || profile?.role === USER_ROLES.SUPERADMIN
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if URL has email confirmation tokens
        const urlParams = new URLSearchParams(window.location.search)
        const hasConfirmation = urlParams.has('token') || 
                               urlParams.has('type') || 
                               window.location.hash.includes('access_token')
        
        if (hasConfirmation) {
          // User is coming back from email confirmation - let Supabase handle it
          
          // Get the current session (Supabase will auto-exchange the token)
          // Add timeout to prevent hanging
          const sessionPromise = supabase.auth.getSession()
          const sessionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getSession timeout')), 3000)
          )
          
          try {
            const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout])
            
            if (session?.user) {
              setUser(session.user)
              const userProfile = await getProfile(session.user.id)
              setProfile(userProfile)
              
              // Clean up URL parameters
              window.history.replaceState({}, document.title, window.location.pathname)
            }
          } catch (sessionError) {
            // Session check failed or timed out
            setUser(null)
            setProfile(null)
          }
        } else {
          // Normal page load - check for existing session
          // Add timeout to prevent hanging
          const sessionPromise = supabase.auth.getSession()
          const sessionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getSession timeout')), 3000)
          )
          
          try {
            const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout])
            
            if (session?.user) {
              setUser(session.user)
              const userProfile = await getProfile(session.user.id)
              setProfile(userProfile)
            } else {
              setUser(null)
              setProfile(null)
            }
          } catch (sessionError) {
            // Session check failed or timed out
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    // Initialize auth state
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Handle sign in events (including email confirmation)
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          setUser(session.user)
          const userProfile = await getProfile(session.user.id)
          setProfile(userProfile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isSuperAdmin,
    isAdmin,
    isMember
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
