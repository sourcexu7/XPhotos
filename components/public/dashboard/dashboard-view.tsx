'use client'

import React from 'react'
import { StatCardsGrid, type StatCardProps } from './stat-card'
import { HorizontalBarChart } from './horizontal-bar-chart'
import { PhotosByYearChart } from './photos-by-year-chart'
import { Loader2 } from 'lucide-react'

export type PublicDashboardStats = {
  images: {
    total: number
    public: number
  }
  guides: {
    total: number
    public: number
  }
  albums: {
    total: number
  }
  cameras: {
    top: Array<{ camera: string; count: number }>
  }
  lenses: {
    top: Array<{ lens: string; count: number }>
  }
  photosByYear: Array<{ year: number; count: number }>
}

export function DashboardView({ 
  data, 
  isLoading, 
  error 
}: { 
  data?: PublicDashboardStats
  isLoading: boolean
  error?: Error 
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">加载失败，请稍后重试</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">暂无数据</p>
      </div>
    )
  }

  const stats: StatCardProps[] = [
    {
      id: 'images',
      label: '照片总数',
      value: data.images.total,
      icon: 'images',
      color: 'emerald',
    },
    {
      id: 'albums',
      label: '相册数量',
      value: data.albums.total,
      icon: 'albums',
      color: 'blue',
    },
    {
      id: 'guides',
      label: '攻略数量',
      value: data.guides.total,
      icon: 'guides',
      color: 'violet',
    },
  ]

  return (
    <div className="space-y-8">
      <StatCardsGrid stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorizontalBarChart
          data={data.cameras.top.map(item => ({ name: item.camera, count: item.count }))}
          title="相机使用 TOP5"
          color="#10B981"
        />
        <HorizontalBarChart
          data={data.lenses.top.map(item => ({ name: item.lens, count: item.count }))}
          title="镜头使用 TOP5"
          color="#8B5CF6"
        />
      </div>

      <PhotosByYearChart data={data.photosByYear} />
    </div>
  )
}
