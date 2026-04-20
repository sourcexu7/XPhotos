'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Button, Space, Spin, message, App, Typography, Tag, Tooltip } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons'
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

  const handleSave = () => {
    msg.success(t('saveSuccess') || '保存成功')
  }

  const handlePreview = () => {
    if (guide?.show !== 1) {
      msg.warning('攻略未公开，前台无法预览。请先在攻略管理页面将攻略设为公开。')
      return
    }
    window.open(`/guides/${guideId}`, '_blank')
  }

  const handleBack = () => {
    router.push('/admin/guides')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Text>{t('guideNotFound') || '攻略不存在'}</Text>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('back') || '返回'}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Title level={4} className="m-0">{guide.title}</Title>
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
        <Space>
          <Tooltip title={guide.show !== 1 ? '攻略未公开，前台无法预览' : '在新窗口预览攻略'}>
            <Button 
              icon={<EyeOutlined />} 
              onClick={handlePreview}
              disabled={guide.show !== 1}
            >
              {t('preview') || '预览'}
            </Button>
          </Tooltip>
          <Button type="primary" icon={<SaveOutlined />}>
            {t('save') || '保存'}
          </Button>
        </Space>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <GuideEditor
          guideId={guideId}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}