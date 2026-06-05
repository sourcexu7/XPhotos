'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface EasterEggProps {
  triggerCount?: number
}

export function EasterEgg({ triggerCount = 3 }: EasterEggProps) {
  const [showEaster, setShowEaster] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const lastClickTime = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (clickCount === triggerCount) {
      setShowEaster(true)
      setClickCount(0)
      setTimeout(() => setShowEaster(false), 3000)
    }
  }, [clickCount, triggerCount])

  const handleClick = () => {
    const now = Date.now()
    if (now - lastClickTime.current < 500) {
      setClickCount(prev => prev + 1)
    } else {
      setClickCount(1)
    }
    lastClickTime.current = now
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="fixed bottom-4 right-4 w-12 h-12 cursor-pointer"
    >
      {showEaster && (
        <motion.div
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{ scale: 1, rotate: 360, opacity: 1 }}
          exit={{ scale: 0, rotate: -360, opacity: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-4xl animate-bounce">✨</div>
        </motion.div>
      )}
    </div>
  )
}

export function MagicCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    const interactiveElements = document.querySelectorAll('button, a, [role="button"]')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
      animate={{
        x: mousePosition.x - 16,
        y: mousePosition.y - 16,
        scale: isHovering ? 1.5 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.5,
      }}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 border-white ${isHovering ? 'bg-white/20' : 'bg-white/10'} backdrop-blur-sm`}
      />
    </motion.div>
  )
}

export function ParticleEffect({
  active = true,
  count = 12,
  duration = 1.5,
}: {
  active?: boolean
  count?: number
  duration?: number
}) {
  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{
            x: '50%',
            y: '50%',
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 200}%`,
            y: `${50 + (Math.random() - 0.5) * 200}%`,
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: duration + Math.random() * 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
