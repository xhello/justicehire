import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Hardcoded Supabase credentials for deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hrynlmbegmdvmeeuhpdc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_zraNM9JhNH4V8poXwjfiUw_f8eyRzSa'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_r87zjoGJmDU5UFIVr853dQ_HGfQpAIY'

let supabaseClient: SupabaseClient | null = null
let supabaseAdminClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    } catch (err) {
      console.error('Error creating Supabase client:', err)
      // Return a dummy client that will fail gracefully
      supabaseClient = createClient('https://dummy.supabase.co', 'dummy-key')
    }
  }
  return supabaseClient
}

function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminClient) {
    try {
      supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } catch (err) {
      console.error('Error creating Supabase admin client:', err)
      // Return a dummy client that will fail gracefully
      supabaseAdminClient = createClient('https://dummy.supabase.co', 'dummy-key')
    }
  }
  return supabaseAdminClient
}

// Client for client-side operations (uses anon key)
export const supabase = getSupabaseClient()

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = getSupabaseAdminClient()
