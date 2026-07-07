'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * 动态背景组件
 * 性能优化：
 *  1. 组件离开视口（IntersectionObserver）后暂停所有 CSS 动画
 *  2. reduce-motion 用户：直接关闭所有动态斑点，仅保留静态背景
 *  3. 移动端（<768px）：降低动画节点数量，减少 GPU 开销
 */
export default function DynamicBackground() {
  const [mounted, setMounted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    // reduce-motion 检测（用户系统设置）
    if (typeof window !== 'undefined' && window.matchMedia) {
      const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
      const mobile = window.matchMedia('(max-width: 767px)')
      const onChangeRm = () => setReduceMotion(rm.matches)
      const onChangeMobile = () => setIsMobile(mobile.matches)
      onChangeRm()
      onChangeMobile()
      rm.addEventListener?.('change', onChangeRm)
      mobile.addEventListener?.('change', onChangeMobile)
      return () => {
        rm.removeEventListener?.('change', onChangeRm)
        mobile.removeEventListener?.('change', onChangeMobile)
      }
    }
    return undefined
  }, [])

  // IntersectionObserver：离开视口后暂停动画
  useEffect(() => {
    if (!rootRef.current || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        setIsPaused(!entry.isIntersecting)
      },
      { threshold: 0 }
    )
    io.observe(rootRef.current)
    return () => io.disconnect()
  }, [])

  // reduce-motion 模式：只渲染静态底色，不渲染动态斑点
  if (!mounted) return null
  if (reduceMotion) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px),linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)' }} />
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      data-animation-paused={isPaused || isMobile ? 'true' : 'false'}
      className="absolute inset-0 z-0 overflow-hidden"
    >
      {/* Base gradient - different for light/dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background"></div>

      {/* Subtle grid pattern for texture */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 移动端：简化动态斑点，只保留 2 个主要光晕 */}
      {isMobile ? (
        <>
          <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] opacity-35 dark:opacity-20"></div>
          <div className="absolute bottom-[-15%] right-[-15%] w-[65%] h-[65%] rounded-full bg-secondary/20 blur-[120px] opacity-30 dark:opacity-20"></div>
        </>
      ) : (
        <>
          {/* Main aurora effect - large flowing gradients */}
          <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary/30 blur-[120px] animate-float-slow opacity-40 dark:opacity-20"></div>
          <div className="absolute bottom-[-15%] right-[-15%] w-[65%] h-[65%] rounded-full bg-secondary/40 blur-[140px] animate-float-medium opacity-35 dark:opacity-25"></div>

          {/* Accent light spot */}
          <div className="absolute top-[50%] left-[30%] w-[45%] h-[45%] rounded-full bg-accent/50 blur-[100px] animate-float-fast opacity-30 dark:opacity-15"></div>

          {/* Additional depth layer - smaller spots */}
          <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-primary/20 blur-[80px] animate-pulse-slow opacity-40 dark:opacity-20"></div>
          <div className="absolute bottom-[25%] left-[15%] w-[30%] h-[30%] rounded-full bg-blue-400/20 blur-[90px] animate-pulse-medium opacity-35 dark:opacity-15"></div>

          {/* Light mode: warm highlight */}
          <div className="absolute top-[10%] left-[50%] w-[35%] h-[35%] rounded-full bg-amber-200/20 blur-[100px] animate-glow hidden dark:hidden opacity-50"></div>
          <div className="absolute bottom-[15%] left-[55%] w-[28%] h-[28%] rounded-full bg-cyan-200/15 blur-[90px] animate-glow-delayed hidden dark:hidden opacity-45"></div>

          {/* Dark mode: star-like particles / extra glow */}
          <div className="absolute top-[8%] right-[18%] w-[2px] h-[2px] rounded-full bg-white/80 blur-[0.5px] animate-twinkle hidden dark:block"></div>
          <div className="absolute top-[25%] left-[12%] w-[1.5px] h-[1.5px] rounded-full bg-white/70 blur-[0.5px] animate-twinkle-delayed hidden dark:block"></div>
          <div className="absolute bottom-[35%] right-[28%] w-[2px] h-[2px] rounded-full bg-white/60 blur-[0.5px] animate-twinkle-slow hidden dark:block"></div>
          <div className="absolute top-[55%] left-[68%] w-[1.5px] h-[1.5px] rounded-full bg-white/50 blur-[0.5px] animate-twinkle hidden dark:block"></div>
          <div className="absolute bottom-[12%] left-[42%] w-[1px] h-[1px] rounded-full bg-white/70 blur-[0.5px] animate-twinkle-delayed hidden dark:block"></div>
          <div className="absolute top-[72%] right-[42%] w-[1.5px] h-[1.5px] rounded-full bg-white/60 blur-[0.5px] animate-twinkle-slow hidden dark:block"></div>

          {/* Dark mode: subtle nebula glow */}
          <div className="absolute top-[-5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[130px] animate-nebula hidden dark:block opacity-40"></div>
          <div className="absolute bottom-[-8%] left-[-5%] w-[38%] h-[38%] rounded-full bg-violet-600/15 blur-[120px] animate-nebula-delayed hidden dark:block opacity-35"></div>
        </>
      )}

      {/* Radial vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)',
        }}
      />
    </div>
  )
}
