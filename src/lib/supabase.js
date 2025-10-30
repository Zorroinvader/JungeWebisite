import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
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
    enabled: false
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
  PROFILES: 'profiles'
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
