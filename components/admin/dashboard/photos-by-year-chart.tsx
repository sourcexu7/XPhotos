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

export type PhotosByYearChartProps = {
  data: Array<{ year: number; count: number }>
}

export function PhotosByYearChart({ data }: PhotosByYearChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const sortedData = [...data].sort((a, b) => a.year - b.year)

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-6">
        年份照片分布
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sortedData}>
          <defs>
            <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? '#334155' : '#E2E8F0'} 
          />
          <XAxis 
            dataKey="year" 
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
          <Bar 
            dataKey="count" 
            fill="url(#colorPhotos)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
