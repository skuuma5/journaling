import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getLocalSession } from './auth-local'

export const createClient = () => {
  const cookieStore = cookies()
  const localUserId = getLocalSession()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {}
        },
      },
    }
  )

  // Use Local Session if it exists
  if (localUserId) {
    return {
      ...client,
      auth: {
        ...client.auth,
        getUser: async () => ({
          data: { user: { id: localUserId, email: null } },
          error: null,
        }),
        getSession: async () => ({
          data: { session: { user: { id: localUserId, email: null } } },
          error: null,
        }),
      },
    } as any
  }

  // Removed general development mock to allow real login flow testing
  return client
}
