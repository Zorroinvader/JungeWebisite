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
        console.error('Error fetching profile:', error)
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          return await createProfile(userId)
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProfile:', error)
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
        console.error('Error creating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createProfile:', error)
      return null
    }
  }

  // Sign up function
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true)
      
      // Generate a unique email if none provided
      const userEmail = email || `user_${Date.now()}@temp.local`
      
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            original_email: email || null // Store original email if provided
          }
        }
      })

      if (error) throw error

      // Profile will be created automatically by the database trigger
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
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
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      console.log('🔴 AuthContext signOut called - starting sign out...')
      setLoading(true)
      
      // Add timeout to prevent hanging
      console.log('🔴 Calling supabase.auth.signOut() with timeout...')
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout after 3 seconds')), 3000)
      )
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise])
      
      if (error) {
        console.error('🔴 Supabase signOut error:', error)
        throw error
      }
      
      console.log('🔴 Supabase sign out successful, clearing local state...')
      // Clear local state
      setUser(null)
      setProfile(null)
      console.log('🔴 Sign out completed successfully - user and profile cleared')
    } catch (error) {
      console.error('🔴 Sign out error:', error)
      
      // Even if signOut fails, clear local state
      if (error.message.includes('SignOut timeout')) {
        console.log('🔴 SignOut timed out, clearing local state anyway...')
        setUser(null)
        setProfile(null)
        console.log('🔴 Local state cleared despite timeout')
      }
    } finally {
      console.log('🔴 Setting loading to false')
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
      console.error('Update profile error:', error)
      return { data: null, error }
    }
  }

  // Check if user is admin
  const isAdmin = () => {
    // Check if user email is admin@admin.com as fallback
    const isAdminByEmail = user?.email === 'admin@admin.com'
    const isAdminByRole = profile?.role === USER_ROLES.ADMIN
    
    const isAdminUser = isAdminByRole || isAdminByEmail
    return isAdminUser
  }

  // Check if user is member or admin
  const isMember = () => {
    return profile?.role === USER_ROLES.MEMBER || profile?.role === USER_ROLES.ADMIN
  }

  // Initialize auth state
  useEffect(() => {
    // Always start with no user - force explicit login
    const initializeAuth = async () => {
      try {
        // Clear any Supabase auth data from localStorage
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
        supabaseKeys.forEach(key => {
          localStorage.removeItem(key)
          console.log('Cleared localStorage key:', key)
        })
        
        // Always clear any existing session immediately
        console.log('Forcing logout on page load - clearing any existing session')
        await supabase.auth.signOut()
        
        // Ensure local state is cleared
        setUser(null)
        setProfile(null)
        
        console.log('Page load: User is logged out')
      } catch (error) {
        console.error('Error during auth initialization:', error)
        // Even if there's an error, ensure we start logged out
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    // Initialize auth state
    initializeAuth()

    // Listen for auth changes only for explicit login/logout actions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[${new Date().toLocaleTimeString()}] Auth state change:`, event, session?.user?.email)
        
        // Only process SIGNED_IN events for explicit logins
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const userProfile = await getProfile(session.user.id)
          setProfile(userProfile)
          console.log(`[${new Date().toLocaleTimeString()}] User signed in - Profile loaded:`, userProfile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          console.log(`[${new Date().toLocaleTimeString()}] User signed out`)
        }
        // Ignore TOKEN_REFRESHED and other events
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
    isAdmin,
    isMember
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
