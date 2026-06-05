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
import { motion, useReducedMotion } from 'motion/react'

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
    bg: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
    border: 'border-slate-200/50 dark:border-slate-800/50',
    hover: 'hover:border-emerald-300/70 dark:hover:border-emerald-700/70 hover:shadow-lg hover:shadow-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/70 dark:to-emerald-900/40',
    iconShadow: 'shadow-emerald-200/50 dark:shadow-emerald-900/30',
  },
  violet: {
    bg: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
    border: 'border-slate-200/50 dark:border-slate-800/50',
    hover: 'hover:border-violet-300/70 dark:hover:border-violet-700/70 hover:shadow-lg hover:shadow-violet-500/10',
    icon: 'text-violet-600 dark:text-violet-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/70 dark:to-violet-900/40',
    iconShadow: 'shadow-violet-200/50 dark:shadow-violet-900/30',
  },
  blue: {
    bg: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
    border: 'border-slate-200/50 dark:border-slate-800/50',
    hover: 'hover:border-blue-300/70 dark:hover:border-blue-700/70 hover:shadow-lg hover:shadow-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/70 dark:to-blue-900/40',
    iconShadow: 'shadow-blue-200/50 dark:shadow-blue-900/30',
  },
  amber: {
    bg: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
    border: 'border-slate-200/50 dark:border-slate-800/50',
    hover: 'hover:border-amber-300/70 dark:hover:border-amber-700/70 hover:shadow-lg hover:shadow-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/70 dark:to-amber-900/40',
    iconShadow: 'shadow-amber-200/50 dark:shadow-amber-900/30',
  },
  rose: {
    bg: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
    border: 'border-slate-200/50 dark:border-slate-800/50',
    hover: 'hover:border-rose-300/70 dark:hover:border-rose-700/70 hover:shadow-lg hover:shadow-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/70 dark:to-rose-900/40',
    iconShadow: 'shadow-rose-200/50 dark:shadow-rose-900/30',
  },
  cyan: {
    bg: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
    border: 'border-slate-200/50 dark:border-slate-800/50',
    hover: 'hover:border-cyan-300/70 dark:hover:border-cyan-700/70 hover:shadow-lg hover:shadow-cyan-500/10',
    icon: 'text-cyan-600 dark:text-cyan-400',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-50',
    iconBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/70 dark:to-cyan-900/40',
    iconShadow: 'shadow-cyan-200/50 dark:shadow-cyan-900/30',
  },
}

export function StatCard({ label, value, icon, color, route }: StatCardProps) {
  const router = useRouter()
  const Icon = iconMap[icon]
  const colors = colorMap[color]
  const reduce = useReducedMotion()
  
  const cardContent = (
    <motion.div 
      whileHover={reduce ? {} : { y: -4, scale: 1.02 }}
      whileTap={reduce ? {} : { scale: 0.98 }}
      className={cn(
        'p-6 rounded-2xl border transition-all duration-300 ease-out shadow-sm',
        'bg-gradient-to-br from-white/60 via-white/50 to-white/40 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/30',
        colors.bg,
        colors.border,
        route && 'cursor-pointer',
        route && colors.hover
      )}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium mb-2 leading-relaxed', colors.label)}>
            {label}
          </p>
          <motion.p 
            initial={reduce ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={cn('text-3xl font-bold tracking-tight', colors.value)}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.p>
        </div>
        <motion.div 
          initial={reduce ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cn(
            'flex-shrink-0 p-4 rounded-xl ml-4 shadow-lg',
            colors.iconBg,
            colors.iconShadow
          )}
        >
          <Icon className={cn('w-7 h-7', colors.icon)} />
        </motion.div>
      </div>
    </motion.div>
  )

  if (route) {
    return (
      <button
        onClick={() => router.push(route)}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-2xl"
        aria-label={`查看${label}详情`}
      >
        {cardContent}
      </button>
    )
  }

  return cardContent
}

export function StatCardsGrid({ stats }: { stats: StatCardProps[] }) {
  const reduce = useReducedMotion()
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: index * 0.1,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  )
}
