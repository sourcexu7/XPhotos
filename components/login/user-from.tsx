'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { resolveLoginApiErrorMessage } from '~/lib/i18n/login-api-error'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export const UserFrom = () => {
  const router = useRouter()
  const t = useTranslations()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    // 自动聚焦用户名/邮箱字段
    const usernameField = document.querySelector('input[type="text"]') as HTMLInputElement | null
    usernameField?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError(t('Login.invalidFormat'))
      return
    }
    
    setError('')
    setLoading(true)

    try {
      await handleLogin()
    } catch (err) {
      console.error(err)
      setError(t('Login.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email: username }) // 同时发送username和email，后端会处理
      })

      if (!res.ok) {
        let data: { message?: string } = {}
        try {
          data = await res.json()
        } catch {
          /* ignore */
        }
        setError(resolveLoginApiErrorMessage(data.message, t))
        return
      }

      toast.success(t('Login.loginSuccess'))
      router.refresh()
      router.push('/admin')
    } catch (e) {
      console.error(e)
      setError(t('Login.unknownError'))
    }
  }


  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans relative bg-background">
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('Login.goHome')}</span>
      </Link>

      <div className="w-full max-w-sm bg-background backdrop-blur-sm rounded-3xl shadow-lg p-10 flex flex-col items-center border border-border text-foreground relative z-10">
        
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-8 shadow-inner">
          {logoError ? (
            <span className="text-sm font-semibold text-foreground">PI</span>
          ) : (
            <Image
              src="/favicon.svg"
              alt="XPhotos"
              width={32}
              height={32}
              className="object-contain"
              onError={() => setLogoError(true)}
              priority
            />
          )}
        </div>
        
        <h2 className="text-2xl font-semibold mb-3 text-center text-foreground font-serif">
          XPhotos
        </h2>
        <p className="text-muted-foreground text-sm mb-10 text-center">
          专业风光摄影作品集管理系统
        </p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mb-6">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder={t('Login.usernameOrEmail')}
              type="text"
              value={username}
              className="w-full pl-10 pr-3 py-4 rounded-xl border border-border bg-muted focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all text-foreground placeholder:text-muted-foreground"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder={t('Login.password')}
              type="password"
              value={password}
              className="w-full pl-10 pr-3 py-4 rounded-xl border border-border bg-muted focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all text-foreground placeholder:text-muted-foreground"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="text-xs text-red-500 text-left pl-1">{error}</div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('Login.loggingIn') : t('Login.signIn')}
          </Button>
        </form>
      </div>
    </div>
  )
}