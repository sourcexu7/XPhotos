'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Button, Skeleton, Empty, theme } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { VisitSummary } from '~/lib/db/query/analytics'
import { useTranslations } from 'next-intl'
import { DownloadIcon } from '~/components/icons/download'

interface AdminAnalyticsClientProps {
  initialData: VisitSummary
}

export function AdminAnalyticsClient({ initialData }: AdminAnalyticsClientProps) {
  const t = useTranslations('AdminAnalytics')
  const [data, setData] = useState<VisitSummary>(initialData)
  const [loading, setLoading] = useState(false)
  const { token } = theme.useToken()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/analytics/api')
      if (res.ok) {
        const newData = await res.json()
        setData(newData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Export data as CSV
  const exportData = () => {
    const csvContent = [
      ['Date', 'Visits'],
      ...data.last7Days.map(item => [item.date, item.count]),
      ['', ''],
      ['Hour', 'Visits'],
      ...data.todayByHour.map(item => [`${item.hour}:00`, item.count]),
      ['', ''],
      ['Page', 'Visits'],
      ['Home', data.pages.home],
      ['Gallery', data.pages.gallery],
      ['Album Detail', data.pages.album],
      ['Admin', data.pages.admin],
      ['Other', data.pages.other],
      ['', ''],
      ['Source', 'Visits'],
      ['Direct', data.sources.direct],
      ['Referer', data.sources.referer],
      ['Search', data.sources.search],
      ['Other', data.sources.other],
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const trendData = data.last7Days.map((item) => {
    // 将 "YYYY-MM-DD" 转换为 "MM/DD" 格式
    const [year, month, day] = item.date.split('-')
    return {
      name: `${month}/${day}`,
      value: item.count,
    }
  })

  const todayData = data.todayByHour.map((item) => ({
    name: `${item.hour}:00`,
    value: item.count,
  }))
  const hasChartData = todayData.length > 0 || trendData.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t('title')}</h1>
          <p className="text-sm text-text-secondary">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="default"
            size="middle"
            onClick={exportData}
            className="rounded-lg border border-border bg-background hover:bg-background/80 text-text-secondary transition-all duration-200 flex items-center gap-2"
          >
            <DownloadIcon size={16} />
            {t('export')}
          </Button>
          <Button
            type="primary"
            size="middle"
            loading={loading}
            onClick={fetchData}
            className="rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-200"
          >
            {t('refresh')}
          </Button>
        </div>
      </div>

      {!hasChartData && (
        <div className="rounded-lg border border-border bg-background p-8 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <div className="w-8 h-8 text-primary">📊</div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{t('empty')}</h3>
          <p className="text-text-secondary text-sm text-center">
            {t('emptyDescription')}
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <div className="rounded-lg border border-border bg-background p-4">
            <Statistic
              title={t('todayVisits')}
              value={data.todayVisits}
              styles={{ 
                title: { color: 'var(--text-secondary)', fontSize: '14px' },
                content: { fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }
              }}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="rounded-lg border border-border bg-background p-4">
            <Statistic
              title={t('yesterdayVisits')}
              value={data.yesterdayVisits}
              styles={{ 
                title: { color: 'var(--text-secondary)', fontSize: '14px' },
                content: { fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }
              }}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="rounded-lg border border-border bg-background p-4">
            <Statistic
              title={t('last7DaysTotal')}
              value={data.totalVisits}
              styles={{ 
                title: { color: 'var(--text-secondary)', fontSize: '14px' },
                content: { fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }
              }}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="rounded-lg border border-border bg-background p-4">
            <Statistic
              title={t('uniqueIpCount')}
              value={data.uniqueIpCount}
              styles={{ 
                title: { color: 'var(--text-secondary)', fontSize: '14px' },
                content: { fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }
              }}
            />
          </div>
        </Col>
      </Row>

      {/* Today's Visits Chart */}
      <div className="rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('todayHourly')}</h3>
        {loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {!loading && (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={todayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background-alt)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }} 
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  name={t('visits')}
                  dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background-alt)' }}
                  activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background-alt)' }}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Last 7 Days Chart */}
      <div className="rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('last7DaysTrend')}</h3>
        {loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {!loading && (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background-alt)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }} 
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  name={t('visits')}
                  dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background-alt)' }}
                  activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background-alt)' }}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Page and Source Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className="rounded-lg border border-border bg-background p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('pageDistribution')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('home')}</span>
                <span className="font-semibold text-text-primary">{data.pages.home}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('gallery')}</span>
                <span className="font-semibold text-text-primary">{data.pages.gallery}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('albumDetail')}</span>
                <span className="font-semibold text-text-primary">{data.pages.album}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('admin')}</span>
                <span className="font-semibold text-text-primary">{data.pages.admin}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('other')}</span>
                <span className="font-semibold text-text-primary">{data.pages.other}</span>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="rounded-lg border border-border bg-background p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('sourceDistribution')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('direct')}</span>
                <span className="font-semibold text-text-primary">{data.sources.direct}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('referer')}</span>
                <span className="font-semibold text-text-primary">{data.sources.referer}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('search')}</span>
                <span className="font-semibold text-text-primary">{data.sources.search}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-background/80 transition-colors duration-200">
                <span className="text-text-secondary">{t('other')}</span>
                <span className="font-semibold text-text-primary">{data.sources.other}</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

// Keep the old default export for backward compatibility
export default function AntdChart({
  data,
  dataKey = 'value',
  name = '数值',
}: {
  data: any[]
  dataKey?: string
  name?: string
}) {
  return (
    <Card>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="var(--primary)" name={name} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
