'use client'

import React from 'react'
import { Card, Empty, Typography, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { withAlpha } from '~/lib/utils'

export type HorizontalBarChartProps = {
  data: Array<{ name: string; count: number }>
  title: string
  color: string
}

export function HorizontalBarChart({
  data,
  title,
  color,
}: HorizontalBarChartProps) {
  const { token } = theme.useToken()
  const t = useTranslations()

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card styles={{ body: { padding: token.marginLG } }}>
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: token.margin }}>
        {title}
      </Typography.Title>
      {data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('ImageComponent.noData')}
        />
      ) : (
        <div className="flex flex-col" style={{ gap: token.margin }}>
          {data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100

            return (
              <div key={index}>
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
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
