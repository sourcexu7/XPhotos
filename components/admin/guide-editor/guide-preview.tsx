'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Spin, Typography, Checkbox, theme } from 'antd'
import {
  CalendarOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  CarOutlined,
  CameraOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  CoffeeOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { formatMoney } from './modules/module-base'

const { Title } = Typography

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
  modules?: any[]
  albums?: any[]
}

const templateIcons: Record<string, React.ReactNode> = {
  itinerary: <CalendarOutlined />,
  expense: <DollarOutlined />,
  checklist: <CheckSquareOutlined />,
  transport: <CarOutlined />,
  photo: <CameraOutlined />,
  tips: <BulbOutlined />,
  attraction: <EnvironmentOutlined />,
  food: <CoffeeOutlined />,
}

export default function GuidePreview({ guideId }: { guideId: string }) {
  const { token } = theme.useToken()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchGuide = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/public/guides/${guideId}`)
      const result = await res.json()
      if (result.data) {
        setGuide(result.data)
      }
    } catch (error) {
      console.error('获取攻略详情失败:', error)
    } finally {
      setLoading(false)
    }
  }, [guideId])

  useEffect(() => {
    fetchGuide()
  }, [fetchGuide])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: token.colorTextTertiary }}>
        攻略不存在
      </div>
    )
  }

  const renderModule = (module: any) => {
    return (
      <div key={module.id} className="mb-6">
        <div
          className="flex items-center gap-2 mb-3 pb-2"
          style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          <span style={{ color: token.colorPrimary, fontSize: token.fontSizeLG }}>
            {templateIcons[module.template || ''] || <FileTextOutlined />}
          </span>
          <Title level={4} className="m-0">{module.name}</Title>
        </div>
        <div className="pl-2">
          {module.moduleData && module.moduleData.length > 0 ? (
            <div style={{ color: token.colorTextSecondary }}>
              {module.template === 'itinerary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  {module.moduleData.map((item: any) => (
                    <div key={item.id} style={{ background: token.colorFillQuaternary, padding: token.paddingXS, borderRadius: token.borderRadius }}>
                      <div style={{ fontWeight: 500 }}>{item.location}</div>
                      <div style={{ fontSize: token.fontSizeSM }}>{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'expense' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  {module.moduleData.map((item: any) => (
                    <div key={item.id} className="flex justify-between" style={{ padding: token.paddingXS, background: token.colorFillQuaternary, borderRadius: token.borderRadius }}>
                      <div>{item.name}</div>
                      <div style={{ fontWeight: 500 }}>¥{formatMoney(item.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'checklist' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  {module.moduleData.map((cat: any) => (
                    <div key={cat.id} style={{ background: token.colorFillQuaternary, padding: token.paddingXS, borderRadius: token.borderRadius }}>
                      <div style={{ fontWeight: 500, marginBottom: token.marginXXS }}>{cat.name}</div>
                      {cat.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox checked={item.checked} disabled />
                          <div>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'transport' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  {module.moduleData.map((item: any) => (
                    <div key={item.id} style={{ background: token.colorFillQuaternary, padding: token.paddingXS, borderRadius: token.borderRadius }}>
                      <div style={{ fontWeight: 500 }}>{item.route || item.company}</div>
                      <div style={{ fontSize: token.fontSizeSM }}>{item.date} {item.time}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'photo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  {module.moduleData.map((spot: any) => (
                    <div key={spot.id} style={{ background: token.colorFillQuaternary, padding: token.paddingXS, borderRadius: token.borderRadius }}>
                      <div style={{ fontWeight: 500 }}>{spot.name}</div>
                      <div style={{ fontSize: token.fontSizeSM }}>{spot.focalLength} · {spot.bestTime}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'tips' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  {module.moduleData.map((tip: any) => (
                    <div key={tip.id} style={{ background: token.colorPrimaryBg, padding: token.paddingXS, borderRadius: token.borderRadius }}>
                      <div style={{ fontWeight: 500 }}>{tip.title}</div>
                      <div style={{ fontSize: token.fontSizeSM }}>{tip.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: token.colorTextTertiary }}>暂无内容</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Title level={1}>{guide.title}</Title>
        <div className="mb-4" style={{ color: token.colorTextSecondary }}>
          {guide.country} · {guide.city} · {guide.days} 天
        </div>
        {guide.cover_image && (
          <div className="mb-4">
            <img
              src={guide.cover_image}
              alt={guide.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {guide.modules && guide.modules.length > 0 ? (
          guide.modules.map(renderModule)
        ) : (
          <div style={{ color: token.colorTextTertiary }}>暂无模块</div>
        )}
      </div>
    </div>
  )
}
