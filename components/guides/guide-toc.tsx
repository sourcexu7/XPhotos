'use client'

import React, { useState, useEffect, useMemo } from 'react'

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

const moduleColors: Record<string, { bg: string; border: string; text: string }> = {
  expense: { bg: 'bg-blue-50/80 dark:bg-blue-900/30', border: 'border-l-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  checklist: { bg: 'bg-emerald-50/80 dark:bg-emerald-900/30', border: 'border-l-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  itinerary: { bg: 'bg-orange-50/80 dark:bg-orange-900/30', border: 'border-l-orange-400', text: 'text-orange-700 dark:text-orange-300' },
  transport: { bg: 'bg-purple-50/80 dark:bg-purple-900/30', border: 'border-l-purple-400', text: 'text-purple-700 dark:text-purple-300' },
  photo: { bg: 'bg-pink-50/80 dark:bg-pink-900/30', border: 'border-l-pink-400', text: 'text-pink-700 dark:text-pink-300' },
  tips: { bg: 'bg-amber-50/80 dark:bg-amber-900/30', border: 'border-l-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  attraction: { bg: 'bg-cyan-50/80 dark:bg-cyan-900/30', border: 'border-l-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' },
  food: { bg: 'bg-rose-50/80 dark:bg-rose-900/30', border: 'border-l-rose-400', text: 'text-rose-700 dark:text-rose-300' },
}

export default function GuideGuideTOC({ modules, activeModuleId, onModuleClick }: GuideGuideTOCProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div 
      className={`sticky top-20 h-fit transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-52'}`}
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div 
          className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed && (
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">目录导航</span>
          )}
          <svg 
            className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        {!isCollapsed && (
          <nav className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <ul className="space-y-1">
              {modules.map((module) => {
                const colors = moduleColors[module.template || ''] || moduleColors.tips
                const isActive = activeModuleId === module.id
                
                return (
                  <li key={module.id}>
                    <button
                      onClick={() => onModuleClick(module.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2.5 group backdrop-blur-sm ${
                        isActive 
                          ? `${colors.bg} ${colors.text} font-medium shadow-sm` 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">
                        {moduleIcons[module.template || ''] || '📄'}
                      </span>
                      <span className="text-sm truncate">{module.name}</span>
                      {isActive && (
                        <div className={`ml-auto w-1 h-4 rounded-full ${colors.border.replace('border-l-', 'bg-')}`} />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}

export { moduleColors, moduleIcons }
