'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Col, Row, Space, theme } from 'antd'
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
  const { token } = theme.useToken()

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
      color: 'amber',
      route: '/admin/album',
    },
    {
      id: 'cameras',
      label: t('camerasUsed'),
      value: stats.cameras.total,
      icon: 'cameras',
      color: 'blue',
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
    <Space orientation="vertical" size={token.marginLG} style={{ width: '100%' }}>
      <StatCardsGrid stats={statCards} />

      <Row gutter={[token.marginLG, token.marginLG]}>
        <Col xs={24} lg={12}>
          <VisitTrendChart data={stats.visits.last7Days} />
        </Col>
        <Col xs={24} lg={12}>
          <PhotosByYearChart data={stats.photosByYear} />
        </Col>
      </Row>

      <Row gutter={[token.marginLG, token.marginLG]}>
        <Col xs={24} lg={12}>
          <HorizontalBarChart
            data={cameraData}
            title={t('topCameras')}
            color={token.colorWarning}
            variant="camera"
          />
        </Col>
        <Col xs={24} lg={12}>
          <HorizontalBarChart
            data={lensData}
            title={t('topLenses')}
            color={token.colorError}
            variant="lens"
          />
        </Col>
      </Row>
    </Space>
  )
}
