'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { CameraOutlined, ExperimentOutlined } from '@ant-design/icons'
import { Empty, Typography, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { withAlpha } from '~/lib/utils'

export type HorizontalBarChartProps = {
  data: Array<{ name: string; count: number }>
  title: string
  color: string
  maxCount?: number
  variant?: 'camera' | 'lens'
}

export function HorizontalBarChart({
  data,
  title,
  color,
  maxCount,
  variant = 'camera',
}: HorizontalBarChartProps) {
  const { token } = theme.useToken()
  const reduce = useReducedMotion()
  const t = useTranslations('Dashboard')

  const actualMaxCount = maxCount || Math.max(...data.map((d) => d.count), 1)
  const Icon = variant === 'camera' ? CameraOutlined : ExperimentOutlined

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: variant === 'camera' ? 0.35 : 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
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
            background: `linear-gradient(to bottom right, ${withAlpha(color, 0.18)}, ${withAlpha(color, 0.05)})`,
            border: `1px solid ${withAlpha(color, 0.2)}`,
          }}
        >
          <Icon style={{ fontSize: token.fontSizeXL, color }} />
        </div>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {variant === 'camera' ? t('popularDevices') : t('lensConfig')}
          </Typography.Text>
        </div>
      </div>
      {data.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noData')} />
      ) : (
        <div className="flex flex-col" style={{ gap: token.margin }}>
          {data.map((item, index) => {
            const percentage = (item.count / actualMaxCount) * 100

            return (
              <motion.div
                key={index}
                initial={reduce ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.4 + index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: token.marginXS }}
                >
                  <Typography.Text
                    type="secondary"
                    className="truncate flex-1 mr-4"
                    style={{ fontWeight: 500 }}
                  >
                    {item.name}
                  </Typography.Text>
                  <Typography.Text strong className="tabular-nums">
                    {item.count.toLocaleString()}
                  </Typography.Text>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: withAlpha(color, 0.12) }}
                >
                  <motion.div
                    initial={reduce ? {} : { width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                      duration: 1,
                      delay: 0.5 + index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
