import { createClient } from '@supabase/supabase-js'

/**
 * Anonymous Supabase client without cookies.
 * Use this for cached public data queries (categories, products).
 * Cannot be used for auth-dependent queries.
 */
export const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
