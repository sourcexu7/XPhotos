'use client'

import React from 'react'
import { Image as ImageIcon, BookOpen, Folder } from 'lucide-react'
import { cn } from '~/lib/utils'

export type StatCardProps = {
  id: string
  label: string
  value: number
  icon: 'images' | 'guides' | 'albums'
  color: 'emerald' | 'violet' | 'blue'
}

const iconMap = {
  images: ImageIcon,
  guides: BookOpen,
  albums: Folder,
}

const colorMap = {
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    value: 'text-slate-900 dark:text-slate-50',
    label: 'text-slate-600 dark:text-slate-400',
  },
  violet: {
    icon: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    value: 'text-slate-900 dark:text-slate-50',
    label: 'text-slate-600 dark:text-slate-400',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    value: 'text-slate-900 dark:text-slate-50',
    label: 'text-slate-600 dark:text-slate-400',
  },
}

export function StatCard({ id, label, value, icon, color }: StatCardProps) {
  const Icon = iconMap[icon]
  const colors = colorMap[color]

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-lg', colors.iconBg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-medium', colors.label)}>{label}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.value)}>
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export function StatCardsGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>
  )
}
