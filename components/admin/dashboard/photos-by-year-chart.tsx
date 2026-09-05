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
import { motion, useReducedMotion } from 'motion/react'
import { CalendarOutlined } from '@ant-design/icons'
import { Typography, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { withAlpha } from '~/lib/utils'

export type PhotosByYearChartProps = {
  data: Array<{ year: number; count: number }>
}

export function PhotosByYearChart({ data }: PhotosByYearChartProps) {
  const { token } = theme.useToken()
  const reduce = useReducedMotion()
  const t = useTranslations('Dashboard')

  const sortedData = [...data].sort((a, b) => a.year - b.year)

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="border backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl"
      style={{
        borderRadius: token.borderRadiusLG,
        padding: token.marginLG,
        background: `linear-gradient(135deg, ${withAlpha(token.colorBgContainer, 0.7)} 0%, ${withAlpha(token.colorBgContainer, 0.5)} 100%)`,
        borderColor: withAlpha(token.colorBorder, 0.4),
      }}
    >
      <div className="flex items-center gap-3" style={{ marginBottom: token.margin }}>
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            borderRadius: token.borderRadius,
            background: `linear-gradient(to bottom right, ${withAlpha(token.colorSuccess, 0.18)}, ${withAlpha(token.colorSuccess, 0.05)})`,
            border: `1px solid ${withAlpha(token.colorSuccess, 0.2)}`,
          }}
        >
          <CalendarOutlined style={{ fontSize: token.fontSizeXL, color: token.colorSuccess }} />
        </div>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('photosByYear')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {t('byYear')}
          </Typography.Text>
        </div>
      </div>
      {data.length === 0 ? (
        <Typography.Text type="secondary">{t('noData')}</Typography.Text>
      ) : (
        <div role="img" aria-label={t('photosByYear')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sortedData}>
              <defs>
                <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={token.colorSuccess} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={token.colorSuccess} stopOpacity={0.3} />
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
                  color: token.colorSuccess,
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
    </motion.div>
  )
}
