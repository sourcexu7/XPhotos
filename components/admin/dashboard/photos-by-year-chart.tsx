'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { motion, useReducedMotion } from 'motion/react'
import { Calendar } from 'lucide-react'

export type PhotosByYearChartProps = {
  data: Array<{ year: number; count: number }>
}

export function PhotosByYearChart({ data }: PhotosByYearChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const reduce = useReducedMotion()
  
  const sortedData = [...data].sort((a, b) => a.year - b.year)

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-white/70 via-white/50 to-white/40 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 shadow-md">
          <Calendar className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            照片分布
          </h3>
          <p className="text-sm text-muted-foreground">
            按年份
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sortedData}>
          <defs>
            <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? '#334155' : '#E2E8F0'}
            vertical={false}
          />
          <XAxis 
            dataKey="year" 
            stroke={isDark ? '#94A3B8' : '#64748B'}
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={isDark ? '#94A3B8' : '#64748B'}
            style={{ fontSize: '12px' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
              borderRadius: '12px',
              color: isDark ? '#F1F5F9' : '#0F172A',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: isDark ? '0 10px 25px -5px rgba(0, 0, 0, 0.4)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            itemStyle={{
              color: '#10B981',
              fontWeight: 600,
            }}
            labelStyle={{
              color: isDark ? '#F1F5F9' : '#0F172A',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          />
          <Bar 
            dataKey="count" 
            fill="url(#colorPhotos)" 
            radius={[8, 8, 0, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
