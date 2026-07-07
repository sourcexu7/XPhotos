'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, BookOpen, Circle } from 'lucide-react'

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
  text: '📝',
  markdown: '📝',
}

// SamAlive 风格的配色
const moduleColors: Record<string, { bg: string; border: string; text: string; gradient: string; accent: string }> = {
  expense: {
    bg: 'bg-amber-50/80 dark:bg-amber-900/20',
    border: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-amber-600',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  checklist: {
    bg: 'bg-cyan-50/80 dark:bg-cyan-900/20',
    border: 'border-l-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-400 to-cyan-600',
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  itinerary: {
    bg: 'bg-amber-50/80 dark:bg-amber-900/20',
    border: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-amber-600',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  transport: {
    bg: 'bg-cyan-50/80 dark:bg-cyan-900/20',
    border: 'border-l-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-400 to-cyan-600',
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  photo: {
    bg: 'bg-amber-50/80 dark:bg-amber-900/20',
    border: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-amber-600',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  tips: {
    bg: 'bg-cyan-50/80 dark:bg-cyan-900/20',
    border: 'border-l-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-400 to-cyan-600',
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  attraction: {
    bg: 'bg-amber-50/80 dark:bg-amber-900/20',
    border: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    gradient: 'from-amber-400 to-amber-600',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  food: {
    bg: 'bg-cyan-50/80 dark:bg-cyan-900/20',
    border: 'border-l-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    gradient: 'from-cyan-400 to-cyan-600',
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  text: {
    bg: 'bg-indigo-50/80 dark:bg-indigo-900/20',
    border: 'border-l-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    gradient: 'from-indigo-400 to-indigo-600',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  markdown: {
    bg: 'bg-indigo-50/80 dark:bg-indigo-900/20',
    border: 'border-l-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    gradient: 'from-indigo-400 to-indigo-600',
    accent: 'text-indigo-600 dark:text-indigo-400',
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
      className={`sticky top-20 h-fit transition-all duration-500 ${isCollapsed ? 'w-16' : 'w-72'}`}
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-foreground">目录导航</span>
            </div>
          )}
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Reading Progress Bar */}
        {!isCollapsed && (
          <div className="w-full h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-cyan-500"
              style={{ width: `${readingProgress}%` }}
              transition={{ duration: 0.3 }}
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
              transition={{ duration: 0.3 }}
              className="p-3 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              <ul className="space-y-1.5">
                {modules.map((module, index) => {
                  const colors = moduleColors[module.template || ''] || moduleColors.tips
                  const isActive = activeModuleId === module.id

                  return (
                    <motion.li
                      key={module.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                    >
                      <button
                        onClick={() => onModuleClick(module.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 group relative overflow-hidden ${
                          isActive
                            ? `${colors.bg} ${colors.text} font-medium shadow-sm`
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${colors.gradient}`}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}

                        <span className="text-lg flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110">
                          {moduleIcons[module.template || ''] || '📄'}
                        </span>
                        <span className="text-sm truncate flex-1">{module.name}</span>

                        {isActive && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className={colors.accent}
                          >
                            <Circle className="w-2 h-2 fill-current" />
                          </motion.div>
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
