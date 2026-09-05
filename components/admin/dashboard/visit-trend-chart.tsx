'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useLocale, useTranslations } from 'next-intl'
import { Typography, theme } from 'antd'
import { motion, useReducedMotion } from 'motion/react'
import { RiseOutlined } from '@ant-design/icons'
import { withAlpha } from '~/lib/utils'

export type VisitTrendChartProps = {
  data: Array<{ date: string; count: number }>
}

export function VisitTrendChart({ data }: VisitTrendChartProps) {
  const { token } = theme.useToken()
  const locale = useLocale()
  const reduce = useReducedMotion()
  const t = useTranslations('Dashboard')

  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
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
            background: `linear-gradient(to bottom right, ${withAlpha(token.colorInfo, 0.18)}, ${withAlpha(token.colorInfo, 0.05)})`,
            border: `1px solid ${withAlpha(token.colorInfo, 0.2)}`,
          }}
        >
          <RiseOutlined style={{ fontSize: token.fontSizeXL, color: token.colorInfo }} />
        </div>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('visitTrend')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {t('last7Days')}
          </Typography.Text>
        </div>
      </div>
      <div role="img" aria-label={t('visitTrend')}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={token.colorInfo} stopOpacity={0.3} />
                <stop offset="95%" stopColor={token.colorInfo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={token.colorBorder}
              vertical={false}
            />
            <XAxis
              dataKey="date"
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
                color: token.colorInfo,
                fontWeight: 600,
              }}
              labelStyle={{
                color: token.colorText,
                fontWeight: 600,
                marginBottom: token.marginXXS,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={token.colorInfo}
              strokeWidth={3}
              fill="url(#colorVisits)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
