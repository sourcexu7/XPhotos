'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface MagicLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MagicLoader({ size = 'md', className }: MagicLoaderProps) {
  const reduce = useReducedMotion()
  const sizeMap = {
    sm: {
      container: 'w-6 h-6',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      container: 'w-10 h-10',
      dot: 'w-2.5 h-2.5',
    },
    lg: {
      container: 'w-16 h-16',
      dot: 'w-4 h-4',
    },
  }

  const sizes = sizeMap[size]
  const dots = reduce ? 0 : 8 // reduce-motion：不渲染动态节点

  return (
    <div className={`relative ${sizes.container} ${className}`}>
      {/* reduce-motion 降级为简单的脉冲 */}
      {reduce ? (
        <motion.div
          className={`absolute inset-0 m-auto ${sizes.dot} rounded-full bg-primary`}
          style={{ margin: 'auto' }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        Array.from({ length: dots }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${sizes.dot} rounded-full bg-primary`}
            style={{ transformOrigin: 'center' }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 1, 0.3],
              rotate: i * (360 / dots),
              x: `calc(-50% + ${size === 'sm' ? 10 : size === 'md' ? 18 : 28}px)`,
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * (1.6 / dots),
              ease: 'easeInOut',
            }}
          />
        ))
      )}
    </div>
  )
}

export function PulseLoader({ size = 'md', className }: MagicLoaderProps) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <div className={`relative ${sizeMap[size]} ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full bg-primary"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-2 rounded-full bg-primary"
        animate={{
          scale: [0.7, 1.1, 0.7],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.3,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-4 rounded-full bg-primary"
        animate={{
          scale: [0.6, 1, 0.6],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.6,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

export function BounceLoader({ size = 'md', className }: MagicLoaderProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const dots = 3

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: dots }).map((_, i) => (
        <motion.div
          key={i}
          className={`${sizeMap[size]} rounded-full bg-primary`}
          animate={{
            y: ['0%', '-80%', '0%'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
