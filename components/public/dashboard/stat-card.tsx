'use client'

import React from 'react'
import { Card, Row, Col, Typography, theme } from 'antd'
import {
  PictureOutlined,
  FolderOpenOutlined,
  BookOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

export type StatCardProps = {
  id: string
  label: string
  value: number
  icon: 'images' | 'guides' | 'albums'
  color: 'emerald' | 'violet' | 'blue'
}

const iconMap = {
  images: PictureOutlined,
  guides: BookOutlined,
  albums: FolderOpenOutlined,
}

const colorMap = {
  emerald: 'success',
  violet: 'purple',
  blue: 'info',
} as const

export function StatCard({ label, value, icon, color }: StatCardProps) {
  const { token } = theme.useToken()
  const Icon = iconMap[icon]
  const semanticColor = colorMap[color]

  const bgColorMap: Record<string, string> = {
    success: token.colorSuccessBg,
    purple: token.colorPrimaryBg,
    info: token.colorInfoBg,
  }
  const borderColorMap: Record<string, string> = {
    success: token.colorSuccessBorder,
    purple: token.colorPrimaryBorder,
    info: token.colorInfoBorder,
  }
  const textColorMap: Record<string, string> = {
    success: token.colorSuccess,
    purple: token.colorPrimary,
    info: token.colorInfo,
  }

  return (
    <Card
      styles={{
        body: {
          padding: token.marginLG,
        },
      }}
      style={{
        height: '100%',
      }}
    >
      <Row gutter={token.margin} align="middle" wrap={false}>
        <Col flex="none">
          <div
            style={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: token.borderRadius,
              backgroundColor: bgColorMap[semanticColor],
              border: `1px solid ${borderColorMap[semanticColor]}`,
            }}
          >
            <Icon style={{ fontSize: 22, color: textColorMap[semanticColor] }} />
          </div>
        </Col>
        <Col flex="auto">
          <Paragraph
            type="secondary"
            style={{
              margin: 0,
              fontSize: token.fontSizeSM,
            }}
          >
            {label}
          </Paragraph>
          <Title
            level={4}
            style={{
              marginTop: token.marginXS,
              marginBottom: 0,
              color: token.colorText,
            }}
          >
            {value.toLocaleString()}
          </Title>
        </Col>
      </Row>
    </Card>
  )
}

export function StatCardsGrid({ stats }: { stats: StatCardProps[] }) {
  const { token } = theme.useToken()

  return (
    <Row gutter={[token.margin, token.margin]}>
      {stats.map((stat) => (
        <Col xs={24} sm={12} lg={8} key={stat.id}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  )
}