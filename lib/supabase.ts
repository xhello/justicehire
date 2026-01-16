import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null
let supabaseAdminClient: SupabaseClient | null = null

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey }
}

// Client for client-side operations (uses anon key)
export function getSupabase() {
  if (!supabaseClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

// Admin client for server-side operations (uses service role key)
export function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = getSupabaseEnv()
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdminClient
}
