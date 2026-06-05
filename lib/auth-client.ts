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
      try {
        const res = await fetch('/api/v1/auth/login/passkey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Passkey login failed' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    }
  },
  signOut: async ({ fetchOptions }: any = {}) => {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      if (fetchOptions?.onSuccess) fetchOptions.onSuccess()
      window.location.href = '/login'
  },
  changePassword: async ({ currentPassword, newPassword, revokeOtherSessions }: any) => {
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, revokeOtherSessions })
      })
      if (!res.ok) {
        const data = await res.json()
        return { error: { message: data.message || 'Password change failed' } }
      }
      return { data: await res.json() }
    } catch (e) {
      return { error: { message: 'Network error' } }
    }
  },
  updateUser: async ({ image }: any) => {
    try {
      const res = await fetch('/api/v1/auth/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      })
      if (!res.ok) {
        const data = await res.json()
        return { error: { message: data.message || 'Update failed' } }
      }
      return { data: await res.json() }
    } catch (e) {
      return { error: { message: 'Network error' } }
    }
  },
  passkey: {
    listUserPasskeys: async () => {
      try {
        const res = await fetch('/api/v1/auth/passkeys', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Failed to load passkeys' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    },
    addPasskey: async ({ name }: { name: string }) => {
      try {
        const res = await fetch('/api/v1/auth/passkeys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Failed to add passkey' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    },
    deletePasskey: async ({ id }: { id: string }) => {
      try {
        const res = await fetch(`/api/v1/auth/passkeys/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Failed to delete passkey' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    }
  },
  twoFactor: {
    enable: async ({ password, issuer }: { password: string; issuer?: string }) => {
      try {
        const res = await fetch('/api/v1/auth/2fa/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, issuer })
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Failed to enable 2FA' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    },
    verifyTotp: async ({ code }: { code: string }) => {
      try {
        const res = await fetch('/api/v1/auth/2fa/verify-totp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Failed to verify TOTP' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    },
    disable: async ({ password }: { password: string }) => {
      try {
        const res = await fetch('/api/v1/auth/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        })
        if (!res.ok) {
          const data = await res.json()
          return { error: { message: data.message || 'Failed to disable 2FA' } }
        }
        return { data: await res.json() }
      } catch (e) {
        return { error: { message: 'Network error' } }
      }
    }
  }
}
