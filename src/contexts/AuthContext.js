// FILE OVERVIEW
// - Purpose: Global authentication and authorization context (user session, profile, roles, sign-in/out, admin checks).
// - Used by: Entire app via useAuth() hook and AuthProvider in App.js.
// - Notes: Production file. Changes affect login flow, email confirmation handling, and admin/member permissions.

/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, USER_ROLES } from '../lib/supabase'

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
  const getProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          return await createProfile(userId)
        }
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  // Create profile if it doesn't exist
  const createProfile = async (userId) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) return null

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: user.user.email,
          full_name: user.user.user_metadata?.full_name || null,
          role: 'member'
        }])
        .select()
        .single()

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
      
      // Generate a unique email if none provided
      const userEmail = email || `user_${Date.now()}@temp.local`
      
      // Use site origin as redirect URL (avoids path mismatches in allow list)
      const redirectTo = typeof window !== 'undefined' 
        ? window.location.origin 
        : undefined

      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            original_email: email || null // Store original email if provided
          },
          emailRedirectTo: redirectTo // Explicitly set redirect URL for email confirmation
        }
      })

      if (error) {
        // If user already exists, try to handle it gracefully
        if (error.message && error.message.includes('already registered')) {
        }
        throw error
      }

      // Profile will be created automatically by the database trigger
      return { data, error: null }
    } catch (error) {
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
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (session?.user) {
            setUser(session.user)
            const userProfile = await getProfile(session.user.id)
            setProfile(userProfile)
            
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } else {
          // Normal page load - check for existing session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (session?.user) {
            setUser(session.user)
            const userProfile = await getProfile(session.user.id)
            setProfile(userProfile)
          } else {
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
