'use client'

import { useState, useEffect } from 'react'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-xs text-gray-500">
            {t('subtitle')}
          </p>
        </div>
        <Button
          type="default"
          size="small"
          loading={loading}
          onClick={fetchData}
          className="rounded-full transition-transform hover:scale-[1.02]"
        >
          {t('refresh')}
        </Button>
      </div>

      {!hasChartData && (
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Empty description={t('empty')} />
        </Card>
      )}

      {/* Today's Visits Chart */}
      <Card size="small" styles={{ body: { padding: 16 } }} title={t('todayHourly')}>
        {loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {!loading && (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={todayData}>
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name={t('visits')}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card size="small" className="text-center">
            <Statistic
              title={t('todayVisits')}
              value={data.todayVisits}
              styles={{ content: { fontSize: '24px', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="text-center">
            <Statistic
              title={t('yesterdayVisits')}
              value={data.yesterdayVisits}
              styles={{ content: { fontSize: '24px', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="text-center">
            <Statistic
              title={t('last7DaysTotal')}
              value={data.totalVisits}
              styles={{ content: { fontSize: '24px', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="text-center">
            <Statistic
              title={t('uniqueIpCount')}
              value={data.uniqueIpCount}
              styles={{ content: { fontSize: '24px', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Last 7 Days Chart */}
      <Card size="small" styles={{ body: { padding: 16 } }} title={t('last7DaysTrend')}>
        {loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {!loading && (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name={t('visits')}
                  dot={{ r: 3 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Page and Source Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title={t('pageDistribution')}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('home')}</span>
                <span className="font-medium">{data.pages.home}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('gallery')}</span>
                <span className="font-medium">{data.pages.gallery}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('albumDetail')}</span>
                <span className="font-medium">{data.pages.album}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('admin')}</span>
                <span className="font-medium">{data.pages.admin}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('other')}</span>
                <span className="font-medium">{data.pages.other}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title={t('sourceDistribution')}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('direct')}</span>
                <span className="font-medium">{data.sources.direct}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('referer')}</span>
                <span className="font-medium">{data.sources.referer}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('search')}</span>
                <span className="font-medium">{data.sources.search}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('other')}</span>
                <span className="font-medium">{data.sources.other}</span>
              </div>
            </div>
          </Card>
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
          <Line type="monotone" dataKey={dataKey} stroke="#1890ff" name={name} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
