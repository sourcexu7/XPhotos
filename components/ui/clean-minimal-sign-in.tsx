'use client'

import * as React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth-client'
import { useTranslations } from 'next-intl'

const CleanMinimalSignIn = () => {
  const router = useRouter()
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
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
    const { data, error } = await authClient.signIn.email({ 
      email, 
      password, 
      // 不依赖 callbackURL 自动跳转，手动控制以确保刷新
      callbackURL: '/admin' 
    })

    if (error) {
      setError(t('Login.credentialsError'))
      return
    }

    toast.success(t('Login.loginSuccess'))
    // 关键：刷新路由缓存，确保中间件能读取到新写入的 Cookie
    router.refresh()
    router.push('/admin')
  }


  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 font-sans relative">
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-gray-500 hover:text-[#2A4365] transition-colors text-sm font-medium z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('Login.goHome')}</span>
      </Link>

      <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 flex flex-col items-center border border-white/50 text-gray-800 relative z-10">
        
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F7FAFC] mb-8 shadow-inner">
          {logoError ? (
            <span className="text-sm font-semibold text-[#2A4365]">PI</span>
          ) : (
            <Image
              src="/favicon.svg"
              alt="PicImpact"
              width={32}
              height={32}
              className="object-contain"
              onError={() => setLogoError(true)}
              priority
            />
          )}
        </div>
        
        <h2 className="text-2xl font-semibold mb-3 text-center text-[#2A4365]">
          XPhotos
        </h2>
        <p className="text-gray-500 text-sm mb-10 text-center">
          专业风光摄影作品集管理系统
        </p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mb-6">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2A4365] transition-colors">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder={t('Login.email')}
              type="email"
              value={email}
              className="w-full pl-10 pr-3 py-4 rounded-xl border border-transparent bg-[#F7FAFC] focus:bg-white focus:border-[#2A4365]/30 focus:outline-none focus:ring-4 focus:ring-[#2A4365]/5 text-sm transition-all text-gray-900 placeholder:text-gray-400"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2A4365] transition-colors">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder={t('Login.password')}
              type="password"
              value={password}
              className="w-full pl-10 pr-3 py-4 rounded-xl border border-transparent bg-[#F7FAFC] focus:bg-white focus:border-[#2A4365]/30 focus:outline-none focus:ring-4 focus:ring-[#2A4365]/5 text-sm transition-all text-gray-900 placeholder:text-gray-400"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="text-xs text-red-500 text-left pl-1">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2A4365] hover:bg-[#1A2E4B] !text-white font-medium py-3.5 rounded-xl shadow-lg shadow-[#2A4365]/10 hover:shadow-[#2A4365]/20 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
            style={{ color: '#ffffff' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('Login.loggingIn') : t('Login.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}

export { CleanMinimalSignIn }
