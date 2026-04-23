'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, BookOpen } from 'lucide-react'

interface Module {
  id: string
  name: string
  template: string | null
}

interface GuideGuideTOCProps {
  modules: Module[]
  activeModuleId: string | null
  onModuleClick: (moduleId: string) => void
}

const moduleIcons: Record<string, string> = {
  expense: '💸',
  checklist: '📋',
  itinerary: '🗓️',
  transport: '🚗',
  photo: '📷',
  tips: '💡',
  attraction: '📍',
  food: '🍜',
}

const moduleColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  expense: {
    bg: 'bg-blue-50/80 dark:bg-blue-900/30',
    border: 'border-l-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
    gradient: 'from-blue-400 to-blue-500'
  },
  checklist: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-900/30',
    border: 'border-l-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
    gradient: 'from-emerald-400 to-emerald-500'
  },
  itinerary: {
    bg: 'bg-orange-50/80 dark:bg-orange-900/30',
    border: 'border-l-orange-400',
    text: 'text-orange-700 dark:text-orange-300',
    gradient: 'from-orange-400 to-orange-500'
  },
  transport: {
    bg: 'bg-purple-50/80 dark:bg-purple-900/30',
    border: 'border-l-purple-400',
    text: 'text-purple-700 dark:text-purple-300',
    gradient: 'from-purple-400 to-purple-500'
  },
  photo: {
    bg: 'bg-pink-50/80 dark:bg-pink-900/30',
    border: 'border-l-pink-400',
    text: 'text-pink-700 dark:text-pink-300',
    gradient: 'from-pink-400 to-pink-500'
  },
  tips: {
    bg: 'bg-amber-50/80 dark:bg-amber-900/30',
    border: 'border-l-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-amber-500'
  },
  attraction: {
    bg: 'bg-cyan-50/80 dark:bg-cyan-900/30',
    border: 'border-l-cyan-400',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-400 to-cyan-500'
  },
  food: {
    bg: 'bg-rose-50/80 dark:bg-rose-900/30',
    border: 'border-l-rose-400',
    text: 'text-rose-700 dark:text-rose-300',
    gradient: 'from-rose-400 to-rose-500'
  },
}

export default function GuideGuideTOC({ modules, activeModuleId, onModuleClick }: GuideGuideTOCProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setReadingProgress(Math.min(progress, 100))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={`sticky top-20 h-fit transition-all duration-300 ${isCollapsed ? 'w-14' : 'w-64'}`}
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">目录导航</span>
            </div>
          )}
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </motion.div>
        </div>

        {/* Reading Progress Bar */}
        {!isCollapsed && (
          <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500"
              style={{ width: `${readingProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        {/* Module List */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-2.5 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              <ul className="space-y-1">
                {modules.map((module, index) => {
                  const colors = moduleColors[module.template || ''] || moduleColors.tips
                  const isActive = activeModuleId === module.id

                  return (
                    <motion.li
                      key={module.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => onModuleClick(module.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 group backdrop-blur-sm relative overflow-hidden ${
                          isActive
                            ? `${colors.bg} ${colors.text} font-medium shadow-sm`
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b ${colors.gradient}`}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}

                        <span className="text-base flex-shrink-0">
                          {moduleIcons[module.template || ''] || '📄'}
                        </span>
                        <span className="text-sm truncate flex-1">{module.name}</span>

                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-2 h-2 rounded-full bg-gradient-to-br ${colors.gradient}`}
                          />
                        )}
                      </button>
                    </motion.li>
                  )
                })}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export { moduleColors, moduleIcons }
