'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Lock, Mail, ArrowLeft, Loader2, Camera, Aperture, Focus, Layers } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { useTheme } from 'next-themes'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BackgroundElements = () => {
  const reduce = useReducedMotion()

  const elements = [
    { icon: Camera, delay: 0, duration: 20, xStart: -20, xEnd: 20 },
    { icon: Aperture, delay: 5, duration: 25, xStart: 20, xEnd: -20 },
    { icon: Focus, delay: 10, duration: 22, xStart: -15, xEnd: 15 },
    { icon: Layers, delay: 15, duration: 28, xStart: 15, xEnd: -15 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map(({ icon: Icon, delay, duration, xStart, xEnd }, i) => (
        <motion.div
          key={i}
          className="absolute text-muted-foreground/5"
          style={{
            top: `${15 + i * 20}%`,
            left: `${10 + i * 20}%`,
          }}
          animate={reduce ? {} : {
            x: [xStart, xEnd, xStart],
            y: [0, 10, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        >
          <Icon size={80 + i * 20} />
        </motion.div>
      ))}

      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-40" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/8 blur-3xl opacity-30" />
    </div>
  )
}

export const UserFrom = () => {
  const router = useRouter()
  const t = useTranslations()
  const { theme } = useTheme()
  const reduce = useReducedMotion()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email: username }),
      })

      if (!res.ok) {
        let data: { message?: string } = {}
        try { data = await res.json() } catch {}
        setError(resolveLoginApiErrorMessage(data.message, t))
        setLoading(false)
        return
      }

      toast.success(t('Login.loginSuccess'))
      router.refresh()
      router.push('/admin')
    } catch (err) {
      console.error(err)
      setError(t('Login.unknownError'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans relative bg-background overflow-hidden">
      <BackgroundElements />

      <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03]" 
           style={{
             backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
           }} />

      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:-translate-x-1 z-30"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium tracking-wide">{t('Login.goHome')}</span>
      </Link>

      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-20"
      >
        <div className="glass-card dark:glass-card backdrop-blur-2xl bg-card/70 dark:bg-card/60 border border-border/50 dark:border-border/40 rounded-3xl shadow-xl dark:shadow-2xl p-8 md:p-10">
          <div className="relative mb-8 flex flex-col items-center">
            <motion.div
              initial={reduce ? {} : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted shadow-lg dark:shadow-primary/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent opacity-60" />
                {logoError ? (
                  <span className="text-xl font-bold text-foreground relative z-10">XP</span>
                ) : (
                  <Image
                    src="/favicon.svg"
                    alt="XPhotos"
                    width={48}
                    height={48}
                    className="object-contain relative z-10"
                    onError={() => setLogoError(true)}
                    priority
                  />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-6 text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight">
                XPhotos
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-3 leading-relaxed">
                专业摄影作品集管理系统
              </p>
            </motion.div>
          </div>

          <motion.form
            initial={reduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-5"
          >
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground/90">
                {t('Login.usernameOrEmail')}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-300">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-muted/60 focus:bg-background focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                  placeholder="请输入用户名或邮箱"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground/90">
                {t('Login.password')}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-300">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-muted/60 focus:bg-background focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={reduce ? {} : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-500 dark:text-red-400 pl-1 pt-1"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={reduce ? {} : { scale: 1.01 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full font-medium py-4 rounded-xl transition-all duration-300 mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/95 hover:to-primary text-primary-foreground shadow-lg hover:shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('Login.loggingIn')}</span>
                </>
              ) : (
                <span className="font-medium tracking-wide">{t('Login.signIn')}</span>
              )}
            </motion.button>
          </motion.form>
        </div>

        <div className="text-center mt-8 text-muted-foreground/50 text-xs">
          <p>© 2024 XPhotos. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  )
}

function resolveLoginApiErrorMessage(message: string | undefined, t: (key: string) => string) {
  if (!message) return t('Login.unknownError')
  return message
}
