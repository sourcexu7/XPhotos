'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Spin, App, Typography, Tag, theme } from 'antd'
import { ArrowLeftOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons'
import GuideEditor from '~/components/admin/guide-editor'
import { useTranslations } from 'next-intl'

const { Title, Text } = Typography

interface Guide {
  id: string
  title: string
  country: string
  city: string
  days: number
  start_date?: string
  end_date?: string
  cover_image?: string
  show: number
  sort: number
  createdAt: string
}

export default function GuideEditPage() {
  const params = useParams()
  const router = useRouter()
  const { message: msg } = App.useApp()
  const t = useTranslations('GuideEditor')
  const { token } = theme.useToken()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)

  const guideId = params.id as string

  const fetchGuide = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/guides/${guideId}`)
      const result = await res.json()
      if (result.data) {
        setGuide(result.data)
      } else {
        msg.error(t('guideNotFound') || '攻略不存在')
        router.push('/admin/guides')
      }
    } catch (error) {
      msg.error(t('loadFailed') || '加载失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [guideId, msg, router, t])

  useEffect(() => {
    fetchGuide()
  }, [fetchGuide])

  const handleBack = () => {
    router.push('/admin/guides')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!guide) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Text>{t('guideNotFound') || '攻略不存在'}</Text>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', minHeight: 400 }}>
      {/* 页面头部（主栏） */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: token.marginLG,
          padding: `${token.paddingMD}px ${token.paddingLG}px`,
          background: token.colorBgContainer,
          borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {t('back') || '返回'}
        </Button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
            <Title level={4} style={{ margin: 0 }}>{guide.title}</Title>
            {guide.show === 1 ? (
              <Tag color="green" icon={<GlobalOutlined />}>已公开</Tag>
            ) : (
              <Tag color="orange" icon={<LockOutlined />}>未公开</Tag>
            )}
          </div>
          <Text type="secondary">
            {guide.country} · {guide.city} · {guide.days} {t('days') || '天'}
          </Text>
        </div>
      </div>

      {/* 编辑器（填满剩余空间） */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <GuideEditor
          guideId={guideId}
          guideShow={guide.show}
        />
      </div>
    </div>
  )
}
