'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { StatCardsGrid, type StatCardProps } from './stat-card'
import { VisitTrendChart } from './visit-trend-chart'
import { PhotosByYearChart } from './photos-by-year-chart'
import { HorizontalBarChart } from './horizontal-bar-chart'
import type { DashboardStats } from '~/lib/db/query/dashboard'

export type DashboardViewProps = {
  stats: DashboardStats
}

export function DashboardView({ stats }: DashboardViewProps) {
  const t = useTranslations('Dashboard')
  
  const statCards: StatCardProps[] = [
    {
      id: 'images',
      label: t('totalPhotos'),
      value: stats.images.total,
      icon: 'images',
      color: 'emerald',
      route: '/admin/list',
    },
    {
      id: 'guides',
      label: t('totalGuides'),
      value: stats.guides.total,
      icon: 'guides',
      color: 'violet',
      route: '/admin/guides',
    },
    {
      id: 'albums',
      label: t('totalAlbums'),
      value: stats.albums.total,
      icon: 'albums',
      color: 'blue',
      route: '/admin/album',
    },
    {
      id: 'cameras',
      label: t('camerasUsed'),
      value: stats.cameras.total,
      icon: 'cameras',
      color: 'amber',
    },
    {
      id: 'lenses',
      label: t('totalLenses'),
      value: stats.lenses.total,
      icon: 'lenses',
      color: 'rose',
    },
    {
      id: 'visits',
      label: t('todayVisits'),
      value: stats.visits.today,
      icon: 'visits',
      color: 'cyan',
      route: '/admin/analytics',
    },
  ]

  const cameraData = stats.cameras.top.map((item) => ({
    name: item.camera,
    count: item.count,
  }))

  const lensData = stats.lenses.top.map((item) => ({
    name: item.lens,
    count: item.count,
  }))

  return (
    <div className="space-y-8">
      <StatCardsGrid stats={statCards} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisitTrendChart data={stats.visits.last7Days} />
        <PhotosByYearChart data={stats.photosByYear} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorizontalBarChart
          data={cameraData}
          title={t('topCameras')}
          color="#F59E0B"
        />
        <HorizontalBarChart
          data={lensData}
          title={t('topLenses')}
          color="#F43F5E"
        />
      </div>
    </div>
  )
}
