'use client'

import React from 'react'
import { Spin, Empty, Row, Col, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { StatCardsGrid, type StatCardProps } from './stat-card'
import { HorizontalBarChart } from './horizontal-bar-chart'
import { PhotosByYearChart } from './photos-by-year-chart'

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
  error,
}: {
  data?: PublicDashboardStats
  isLoading: boolean
  error?: Error
}) {
  const { token } = theme.useToken()
  const t = useTranslations()

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <Empty
        description={t('ImageComponent.loadFailed')}
        style={{ padding: `${token.marginXL}px 0` }}
      />
    )
  }

  if (!data) {
    return (
      <Empty
        description={t('ImageComponent.noData')}
        style={{ padding: `${token.marginXL}px 0` }}
      />
    )
  }

  const stats: StatCardProps[] = [
    {
      id: 'images',
      label: t('Dashboard.totalPhotos'),
      value: data.images.total,
      icon: 'images',
      color: 'emerald',
    },
    {
      id: 'albums',
      label: t('Dashboard.totalAlbums'),
      value: data.albums.total,
      icon: 'albums',
      color: 'blue',
    },
    {
      id: 'guides',
      label: t('Dashboard.totalGuides'),
      value: data.guides.total,
      icon: 'guides',
      color: 'violet',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginLG }}>
      <StatCardsGrid stats={stats} />

      <Row gutter={[token.margin, token.margin]}>
        <Col xs={24} lg={12}>
          <HorizontalBarChart
            data={data.cameras.top.map((item) => ({
              name: item.camera,
              count: item.count,
            }))}
            title={t('Dashboard.cameraTop5')}
            color={token.colorSuccess}
          />
        </Col>
        <Col xs={24} lg={12}>
          <HorizontalBarChart
            data={data.lenses.top.map((item) => ({
              name: item.lens,
              count: item.count,
            }))}
            title={t('Dashboard.lensTop5')}
            color={token.colorPrimary}
          />
        </Col>
      </Row>

      <PhotosByYearChart data={data.photosByYear} />
    </div>
  )
}