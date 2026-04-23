'use client'

import React from 'react'

export type HorizontalBarChartProps = {
  data: Array<{ name: string; count: number }>
  title: string
  color: string
}

export function HorizontalBarChart({ 
  data, 
  title, 
  color 
}: HorizontalBarChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  
  const lightColor = color.replace('#', '')
  const r = parseInt(lightColor.substring(0, 2), 16)
  const g = parseInt(lightColor.substring(2, 4), 16)
  const b = parseInt(lightColor.substring(4, 6), 16)
  const bgColor = `rgba(${r}, ${g}, ${b}, 0.1)`

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-6">
        {title}
      </h3>
      {data.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p className="text-sm">暂无数据</p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100
            
            return (
              <div key={index} className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium truncate flex-1 mr-4">
                    {item.name}
                  </span>
                  <span className="text-slate-900 dark:text-slate-50 font-semibold tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div 
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: bgColor }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
