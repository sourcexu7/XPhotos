'use client'

import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
     if (res.status === 401) return null
     throw new Error('Failed to fetch')
  }
  return res.json()
}

export const authClient = {
  useSession: () => {
    const { data, error, isLoading } = useSWR('/api/v1/auth/me', fetcher, {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    })
    return {
      data: data?.user ? { user: data.user, session: {} } : null,
      isPending: isLoading,
      error
    }
  },
  signIn: {
    email: async ({ email, password, callbackURL }: any) => {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        if (!res.ok) {
            const data = await res.json()
            return { error: { message: data.message || 'Login failed' } }
        }
        if (callbackURL) {
            window.location.href = callbackURL
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    },
    passkey: async () => {
        return { error: { message: 'Passkey login not implemented yet' } }
    }
  },
  signOut: async ({ fetchOptions }: any = {}) => {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      if (fetchOptions?.onSuccess) fetchOptions.onSuccess()
      window.location.href = '/login'
  },
  twoFactor: {
      verifyTotp: async () => {
          return { error: { message: '2FA not implemented yet' } }
      }
  }
}
