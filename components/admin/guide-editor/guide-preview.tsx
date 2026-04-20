'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, Spin, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

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

export default function GuidePreview({ guideId }: { guideId: string }) {
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
      <div className="flex items-center justify-center h-full text-gray-400">
        攻略不存在
      </div>
    )
  }

  const renderModule = (module: any) => {
    const templateIcons: Record<string, string> = {
      itinerary: '🗓️',
      expense: '💰',
      checklist: '📋',
      transport: '🚗',
      photo: '📷',
      tips: '💡',
      attraction: '📍',
      food: '🍜',
    }

    return (
      <div key={module.id} className="mb-6">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
          <span className="text-xl">{templateIcons[module.template || ''] || '📄'}</span>
          <Title level={4} className="m-0">{module.name}</Title>
        </div>
        <div className="pl-2">
          {module.moduleData && module.moduleData.length > 0 ? (
            <div className="text-gray-600">
              {module.template === 'itinerary' && (
                <div className="space-y-2">
                  {module.moduleData.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">{item.location}</div>
                      <div className="text-sm">{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'expense' && (
                <div className="space-y-2">
                  {module.moduleData.map((item: any) => (
                    <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <div>{item.name}</div>
                      <div className="font-medium">¥{item.amount}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'checklist' && (
                <div className="space-y-2">
                  {module.moduleData.map((cat: any) => (
                    <div key={cat.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium mb-1">{cat.name}</div>
                      {cat.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input type="checkbox" checked={item.checked} disabled />
                          <div>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'transport' && (
                <div className="space-y-2">
                  {module.moduleData.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">{item.route || item.company}</div>
                      <div className="text-sm">{item.date} {item.time}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'photo' && (
                <div className="space-y-2">
                  {module.moduleData.map((spot: any) => (
                    <div key={spot.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium">{spot.name}</div>
                      <div className="text-sm">{spot.focalLength} · {spot.bestTime}</div>
                    </div>
                  ))}
                </div>
              )}
              {module.template === 'tips' && (
                <div className="space-y-2">
                  {module.moduleData.map((tip: any) => (
                    <div key={tip.id} className="bg-blue-50 p-2 rounded">
                      <div className="font-medium">{tip.title}</div>
                      <div className="text-sm">{tip.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400">暂无内容</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Title level={1}>{guide.title}</Title>
        <div className="text-gray-600 mb-4">
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
          <div className="text-gray-400">暂无模块</div>
        )}
      </div>
    </div>
  )
}