// FILE OVERVIEW
// - Purpose: Supabase client initialization and configuration; exports supabase client, table names, and user roles.
// - Used by: Entire app for database access; imported by AuthContext, databaseApi, specialEventsApi, and many components.
// - Notes: Production library file. Core dependency; uses secureConfig for safe key access.

import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey, getSiteUrl } from '../utils/secureConfig'

// SECURITY: Use secure getters to prevent key exposure
const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo: getSiteUrl()
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  realtime: {
    enabled: true
  },
  storage: {
    // Add storage-specific configuration
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['application/pdf', 'text/plain']
  }
})

// Database table names
export const TABLES = {
  EVENTS: 'events',
  EVENT_REQUESTS: 'event_requests',
  PROFILES: 'profiles',
  CLUB_STATUS: 'club_status'
}

// User roles - hierarchical permission system
export const USER_ROLES = {
  SUPERADMIN: 'superadmin', // Can do everything, including create/manage users
  ADMIN: 'admin',           // Can accept events, manage requests
  MEMBER: 'member',         // Logged in user
  GUEST: 'guest'            // Not logged in
}

// Event status
export const EVENT_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected'
}
