'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { motion, useReducedMotion } from 'motion/react'
import { Camera, Aperture } from 'lucide-react'

export type HorizontalBarChartProps = {
  data: Array<{ name: string; count: number }>
  title: string
  color: string
  maxCount?: number
  variant?: 'camera' | 'lens'
}

export function HorizontalBarChart({ 
  data, 
  title, 
  color,
  maxCount,
  variant = 'camera'
}: HorizontalBarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const reduce = useReducedMotion()
  
  const actualMaxCount = maxCount || Math.max(...data.map(d => d.count), 1)
  
  const lightColor = color.replace('#', '')
  const r = parseInt(lightColor.substring(0, 2), 16)
  const g = parseInt(lightColor.substring(2, 4), 16)
  const b = parseInt(lightColor.substring(4, 6), 16)
  const bgColor = `rgba(${r}, ${g}, ${b}, 0.12)`
  
  const Icon = variant === 'camera' ? Camera : Aperture

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, delay: variant === 'camera' ? 0.35 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-white/70 via-white/50 to-white/40 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
          style={{
            background: `linear-gradient(to bottom right, ${color}33, ${color}0d)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {variant === 'camera' ? '热门设备' : '镜头配置'}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.count / actualMaxCount) * 100
          
          return (
            <motion.div 
              key={index}
              initial={reduce ? {} : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, delay: 0.4 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2.5"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium truncate flex-1 mr-4">
                  {item.name}
                </span>
                <span className="text-foreground font-semibold tabular-nums">
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div 
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                <motion.div
                  initial={reduce ? {} : { width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ 
                    duration: 1, delay: 0.5 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
