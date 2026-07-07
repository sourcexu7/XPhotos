'use client'

import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Button, Skeleton, theme } from 'antd'
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
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'

interface AdminAnalyticsClientProps {
  initialData: VisitSummary
}

export function AdminAnalyticsClient({ initialData }: AdminAnalyticsClientProps) {
  const t = useTranslations('AdminAnalytics')
  const { token } = theme.useToken()
  const [data, setData] = useState<VisitSummary>(initialData)
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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
    const [, month, day] = item.date.split('-')
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

  const statStyles = {
    title: { color: token.colorTextSecondary, fontSize: 14 },
    content: { fontSize: 28, fontWeight: 700, color: token.colorText },
  }

  const chartContainerStyle = {
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    backgroundColor: token.colorBgContainer,
    padding: 24,
  }

  const listItemStyle = (
    padding = 12,
    borderRadius = token.borderRadius,
    bgHover = token.colorFillTertiary,
    transition = 'background-color 0.2s',
  ) => ({
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding,
    borderRadius,
    backgroundColor: 'transparent',
    ':hover': { backgroundColor: bgHover },
    transition,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: token.colorText, margin: 0 }}>{t('title')}</h1>
          <p style={{ fontSize: 14, color: token.colorTextSecondary, margin: '4px 0 0' }}>
            {t('subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            size="middle"
            icon={<DownloadOutlined />}
            onClick={exportData}
          >
            {t('export')}
          </Button>
          <Button
            type="primary"
            size="middle"
            loading={loading}
            onClick={fetchData}
            icon={<ReloadOutlined />}
          >
            {t('refresh')}
          </Button>
        </div>
      </div>

      {!hasChartData && (
        <div style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: token.colorBgContainer,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: token.colorPrimaryBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 32,
            color: token.colorPrimary,
          }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, marginBottom: 8 }}>{t('empty')}</h3>
          <p style={{ color: token.colorTextSecondary, fontSize: 14, textAlign: 'center' }}>
            {t('emptyDescription')}
          </p>
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <div style={{ borderRadius: token.borderRadiusLG, border: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorBgContainer, padding: 16 }}>
            <Statistic title={t('todayVisits')} value={data.todayVisits} styles={statStyles} />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div style={{ borderRadius: token.borderRadiusLG, border: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorBgContainer, padding: 16 }}>
            <Statistic title={t('yesterdayVisits')} value={data.yesterdayVisits} styles={statStyles} />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div style={{ borderRadius: token.borderRadiusLG, border: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorBgContainer, padding: 16 }}>
            <Statistic title={t('last7DaysTotal')} value={data.totalVisits} styles={statStyles} />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div style={{ borderRadius: token.borderRadiusLG, border: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorBgContainer, padding: 16 }}>
            <Statistic title={t('uniqueIpCount')} value={data.uniqueIpCount} styles={statStyles} />
          </div>
        </Col>
      </Row>

      <div style={chartContainerStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, marginBottom: 16 }}>{t('todayHourly')}</h3>
        {loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {!loading && (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={todayData}>
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                <XAxis dataKey="name" tick={{ fill: token.colorTextSecondary }} />
                <YAxis allowDecimals={false} tick={{ fill: token.colorTextSecondary }} />
                <Tooltip contentStyle={{ backgroundColor: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name={t('visits')}
                  dot={{ r: 4, fill: token.colorPrimary, strokeWidth: 2, stroke: token.colorBgElevated }}
                  activeDot={{ r: 6, fill: token.colorPrimary, strokeWidth: 2, stroke: token.colorBgElevated }}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={chartContainerStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, marginBottom: 16 }}>{t('last7DaysTrend')}</h3>
        {loading && <Skeleton active paragraph={{ rows: 4 }} />}
        {!loading && (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                <XAxis dataKey="name" tick={{ fill: token.colorTextSecondary }} />
                <YAxis allowDecimals={false} tick={{ fill: token.colorTextSecondary }} />
                <Tooltip contentStyle={{ backgroundColor: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name={t('visits')}
                  dot={{ r: 4, fill: token.colorPrimary, strokeWidth: 2, stroke: token.colorBgElevated }}
                  activeDot={{ r: 6, fill: token.colorPrimary, strokeWidth: 2, stroke: token.colorBgElevated }}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div style={chartContainerStyle}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, marginBottom: 16 }}>{t('pageDistribution')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('home')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.pages.home}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('gallery')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.pages.gallery}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('albumDetail')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.pages.album}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('admin')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.pages.admin}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('other')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.pages.other}</span>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={chartContainerStyle}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, marginBottom: 16 }}>{t('sourceDistribution')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('direct')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.sources.direct}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('referer')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.sources.referer}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('search')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.sources.search}</span>
              </div>
              <div style={listItemStyle()}>
                <span style={{ color: token.colorTextSecondary }}>{t('other')}</span>
                <span style={{ fontWeight: 600, color: token.colorText }}>{data.sources.other}</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default function AntdChart({
  data,
  dataKey = 'value',
  name = '数值',
}: {
  data: any[]
  dataKey?: string
  name?: string
}) {
  const { token } = theme.useToken()
  return (
    <Card>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={token.colorPrimary} name={name} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
