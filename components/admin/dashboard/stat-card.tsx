'use client'

import React from 'react'
import { useRouter } from 'next-nprogress-bar'
import { useTranslations } from 'next-intl'
import { Row, Col, Typography, theme } from 'antd'
import {
  PictureOutlined,
  BookOutlined,
  FolderOutlined,
  CameraOutlined,
  ExperimentOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { cn, withAlpha } from '~/lib/utils'
import { motion, useReducedMotion } from 'motion/react'

export type StatCardProps = {
  id: string
  label: string
  value: number | string
  icon: 'images' | 'guides' | 'albums' | 'cameras' | 'lenses' | 'visits'
  color: 'emerald' | 'violet' | 'blue' | 'amber' | 'rose' | 'cyan'
  route?: string
}

type AntdToken = ReturnType<typeof theme.useToken>['token']

const iconMap = {
  images: PictureOutlined,
  guides: BookOutlined,
  albums: FolderOutlined,
  cameras: CameraOutlined,
  lenses: ExperimentOutlined,
  visits: EyeOutlined,
}

/**
 * 强调色统一从 antd token 读取：
 * 有语义别名的（success/warning/error/info）直接用别名；
 * violet/cyan 使用 antd 预设色板（色板 token 会随暗色算法自动适配）。
 */
function getAccent(token: AntdToken, color: StatCardProps['color']) {
  switch (color) {
    case 'emerald':
      return {
        main: token.colorSuccess,
        border: token.colorSuccessBorder,
        borderHover: token.colorSuccessBorderHover,
      }
    case 'violet':
      return {
        main: token['purple-6'],
        border: token['purple-3'],
        borderHover: token['purple-4'],
      }
    case 'blue':
      return {
        main: token.colorInfo,
        border: token.colorInfoBorder,
        borderHover: token.colorInfoBorderHover,
      }
    case 'amber':
      return {
        main: token.colorWarning,
        border: token.colorWarningBorder,
        borderHover: token.colorWarningBorderHover,
      }
    case 'rose':
      return {
        main: token.colorError,
        border: token.colorErrorBorder,
        borderHover: token.colorErrorBorderHover,
      }
    case 'cyan':
    default:
      return {
        main: token['cyan-6'],
        border: token['cyan-3'],
        borderHover: token['cyan-4'],
      }
  }
}

export function StatCard({ label, value, icon, color, route }: StatCardProps) {
  const router = useRouter()
  const { token } = theme.useToken()
  const t = useTranslations('Dashboard')
  const Icon = iconMap[icon]
  const accent = getAccent(token, color)
  const reduce = useReducedMotion()

  const interactive = Boolean(route)

  const handleClick = () => {
    if (route) router.push(route)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!route) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(route)
    }
  }

  return (
    <motion.div
      role={interactive ? 'link' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? t('viewDetail', { label }) : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      whileHover={
        interactive && !reduce ? { y: -4, scale: 1.02, borderColor: accent.borderHover } : undefined
      }
      whileTap={interactive && !reduce ? { scale: 0.98 } : undefined}
      className={cn(
        'border backdrop-blur-xl transition-shadow duration-300',
        interactive &&
          'cursor-pointer hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      )}
      style={{
        borderRadius: token.borderRadiusLG,
        padding: token.marginLG,
        background: `linear-gradient(135deg, ${withAlpha(token.colorBgContainer, 0.6)} 0%, ${withAlpha(token.colorBgContainer, 0.4)} 100%)`,
        borderColor: withAlpha(token.colorBorder, 0.5),
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Typography.Text type="secondary">{label}</Typography.Text>
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Typography.Title
              level={3}
              className="tabular-nums"
              style={{ margin: 0, marginTop: token.marginXS }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography.Title>
          </motion.div>
        </div>
        <motion.div
          initial={reduce ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex-shrink-0 flex items-center justify-center ml-4"
          style={{
            width: 40,
            height: 40,
            borderRadius: token.borderRadius,
            background: `linear-gradient(to bottom right, ${withAlpha(accent.main, 0.18)}, ${withAlpha(accent.main, 0.05)})`,
            border: `1px solid ${withAlpha(accent.main, 0.2)}`,
          }}
        >
          <Icon style={{ fontSize: token.fontSizeXL, color: accent.main }} />
        </motion.div>
      </div>
    </motion.div>
  )
}

export function StatCardsGrid({ stats }: { stats: StatCardProps[] }) {
  const { token } = theme.useToken()
  const reduce = useReducedMotion()

  return (
    <Row gutter={[token.margin, token.margin]}>
      {stats.map((stat, index) => (
        <Col key={stat.id} xs={24} sm={12} xl={8}>
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <StatCard {...stat} />
          </motion.div>
        </Col>
      ))}
    </Row>
  )
}
