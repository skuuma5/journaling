import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // We removed the mock user to ensure real authentication flow works correctly
  // especially for local account management.

  return client
}
