'use client'

import React from 'react'
import { useRouter } from 'next-nprogress-bar'
import { 
  Image as ImageIcon, 
  BookOpen, 
  Folder, 
  Camera, 
  Aperture,
  Eye 
} from 'lucide-react'
import { cn } from '~/lib/utils'

export type StatCardProps = {
  id: string
  label: string
  value: number | string
  icon: 'images' | 'guides' | 'albums' | 'cameras' | 'lenses' | 'visits'
  color: 'emerald' | 'violet' | 'blue' | 'amber' | 'rose' | 'cyan'
  route?: string
}

const iconMap = {
  images: ImageIcon,
  guides: BookOpen,
  albums: Folder,
  cameras: Camera,
  lenses: Aperture,
  visits: Eye,
}

const colorMap = {
  emerald: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm',
    icon: 'text-emerald-600 dark:text-emerald-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
  },
  violet: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    hover: 'hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm',
    icon: 'text-violet-600 dark:text-violet-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-violet-50 dark:bg-violet-950',
  },
  blue: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm',
    icon: 'text-blue-600 dark:text-blue-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
  },
  amber: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    hover: 'hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm',
    icon: 'text-amber-600 dark:text-amber-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-amber-50 dark:bg-amber-950',
  },
  rose: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    hover: 'hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm',
    icon: 'text-rose-600 dark:text-rose-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-rose-50 dark:bg-rose-950',
  },
  cyan: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    hover: 'hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm',
    icon: 'text-cyan-600 dark:text-cyan-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-cyan-50 dark:bg-cyan-950',
  },
}

export function StatCard({ id, label, value, icon, color, route }: StatCardProps) {
  const router = useRouter()
  const Icon = iconMap[icon]
  const colors = colorMap[color]
  
  const cardContent = (
    <div 
      className={cn(
        'p-6 rounded-xl border transition-all duration-200',
        colors.bg,
        colors.border,
        route && 'cursor-pointer',
        route && colors.hover
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium mb-3', colors.label)}>
            {label}
          </p>
          <p className={cn('text-3xl font-bold tracking-tight', colors.value)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={cn('flex-shrink-0 p-3 rounded-lg ml-4', colors.iconBg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </div>
  )

  if (route) {
    return (
      <button
        onClick={() => router.push(route)}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
        aria-label={`查看${label}详情`}
      >
        {cardContent}
      </button>
    )
  }

  return cardContent
}

export function StatCardsGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>
  )
}
