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

export type VisitTrendChartProps = {
  data: Array<{ date: string; count: number }>
}

export function VisitTrendChart({ data }: VisitTrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-6">
        访问趋势（近7天）
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? '#334155' : '#E2E8F0'} 
          />
          <XAxis 
            dataKey="date" 
            stroke={isDark ? '#94A3B8' : '#64748B'}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={isDark ? '#94A3B8' : '#64748B'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              border: `2px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              borderRadius: '8px',
              color: isDark ? '#F1F5F9' : '#0F172A',
            }}
            labelStyle={{
              color: isDark ? '#F1F5F9' : '#0F172A',
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#06B6D4"
            strokeWidth={2}
            fill="url(#colorVisits)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
