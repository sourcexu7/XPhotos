'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { motion, useReducedMotion } from 'motion/react'
import { TrendingUp } from 'lucide-react'

export type VisitTrendChartProps = {
  data: Array<{ date: string; count: number }>
}

export function VisitTrendChart({ data }: VisitTrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const reduce = useReducedMotion()
  
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-white/70 via-white/50 to-white/40 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 shadow-md">
          <TrendingUp className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            访问趋势
          </h3>
          <p className="text-sm text-muted-foreground">
            近7天
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? '#334155' : '#E2E8F0'}
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
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
              color: '#06B6D4',
              fontWeight: 600,
            }}
            labelStyle={{
              color: isDark ? '#F1F5F9' : '#0F172A',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#06B6D4"
            strokeWidth={3}
            fill="url(#colorVisits)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
