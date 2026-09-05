'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, Empty, Typography, theme } from 'antd'
import { useTranslations } from 'next-intl'

export type PhotosByYearChartProps = {
  data: Array<{ year: number; count: number }>
}

export function PhotosByYearChart({ data }: PhotosByYearChartProps) {
  const { token } = theme.useToken()
  const t = useTranslations()

  const sortedData = [...data].sort((a, b) => a.year - b.year)

  return (
    <Card styles={{ body: { padding: token.marginLG } }}>
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: token.margin }}>
        {t('Dashboard.photosByYear')}
      </Typography.Title>
      {data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('ImageComponent.noData')}
        />
      ) : (
        <div role="img" aria-label={t('Dashboard.photosByYear')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sortedData}>
              <defs>
                <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={token.colorPrimary} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={token.colorPrimary} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={token.colorBorder}
                vertical={false}
              />
              <XAxis
                dataKey="year"
                stroke={token.colorTextSecondary}
                style={{ fontSize: token.fontSizeSM }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={token.colorTextSecondary}
                style={{ fontSize: token.fontSizeSM }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: token.borderRadiusLG,
                  color: token.colorText,
                  boxShadow: token.boxShadowSecondary,
                }}
                itemStyle={{
                  color: token.colorPrimary,
                  fontWeight: 600,
                }}
                labelStyle={{
                  color: token.colorText,
                  fontWeight: 600,
                  marginBottom: token.marginXXS,
                }}
              />
              <Bar
                dataKey="count"
                fill="url(#colorPhotos)"
                radius={[token.borderRadiusLG, token.borderRadiusLG, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
