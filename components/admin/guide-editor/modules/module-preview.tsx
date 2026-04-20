'use client'

import React from 'react'
import {
  Card,
  Space,
  Typography,
  Tag,
  Divider,
  Badge,
  Empty,
} from 'antd'

const { Title, Text, Paragraph } = Typography

interface ItineraryItem {
  id: string
  date: string
  title: string
  location: string
  description: string
  tips: string
  highlights: string[]
}

interface ExpenseItem {
  id: string
  name: string
  detail?: string
  type?: string
  channel?: string
  unitPrice: number
  subtotal: number
  category: string
  notes: string
}

interface ChecklistItem {
  id: string
  name: string
  checked: boolean
  required: boolean
}

interface ChecklistCategory {
  id: string
  name: string
  items: ChecklistItem[]
}

interface TransportItem {
  id: string
  type: 'flight' | 'train' | 'car'
  route?: string
  flightNo?: string
  trainNo?: string
  company?: string
  model?: string
  date: string
  time: string
  baggage?: string
  seat?: string
  price?: number
  pickup?: string
  dropoff?: string
  days?: number
  notes?: string
}

interface PhotoSpot {
  id: string
  name: string
  focalLength: string
  bestTime: string
  dronePolicy: 'allowed' | 'forbidden' | 'register'
  notes: string
}

interface Tip {
  id: string
  title: string
  content: string
  type: 'warning' | 'info' | 'success' | 'weather' | 'emergency' | 'safety'
}

interface ModulePreviewProps {
  type: string
  data: any
}

export default function ModulePreview({ type, data }: ModulePreviewProps) {
  const renderItinerary = (items: ItineraryItem[] | null) => {
    const safeItems = items || []
    return (
      <div className="space-y-3">
        {safeItems.length === 0 ? (
          <div className="text-center py-4">
            暂无行程项
          </div>
        ) : (
          <ul className="space-y-3">
            {safeItems.map((item) => (
              <li key={item.id} className="p-3 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Text strong>{item.title || item.location || '未设置地点'}</Text>
                    <Text type="secondary">{item.date}</Text>
                  </div>
                  {item.location && (
                    <Text type="secondary">📍 {item.location}</Text>
                  )}
                  <Paragraph>{item.description || '无描述'}</Paragraph>
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.highlights.map((h, i) => (
                        <Tag key={i} color="blue">{h}</Tag>
                      ))}
                    </div>
                  )}
                  {item.tips && (
                    <Badge status="warning" text={item.tips} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const renderExpense = (items: ExpenseItem[] | null) => {
    const safeItems = items || []
    const total = safeItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const categories = [
      { value: 'transport', label: '交通' },
      { value: 'accommodation', label: '住宿' },
      { value: 'food', label: '餐饮' },
      { value: 'ticket', label: '门票' },
      { value: 'equipment', label: '设备' },
      { value: 'shopping', label: '购物' },
      { value: 'other', label: '其他' },
    ]

    return (
      <div className="space-y-4">
        <div className="text-xl font-bold">总费用: ¥{total}</div>
        {safeItems.length === 0 ? (
          <div className="text-center py-4">
            暂无费用项
          </div>
        ) : (
          <ul className="space-y-3">
            {safeItems.map((item) => (
              <li key={item.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <Text strong>{item.name || '未命名'}</Text>
                    <Tag color="blue" className="ml-2">
                      {categories.find(c => c.value === item.category)?.label || item.category}
                    </Tag>
                  </div>
                  <Text strong type="danger">¥{item.subtotal || 0}</Text>
                </div>
                {item.detail && (
                  <Text type="secondary" className="mt-1 block">
                    {item.detail}
                  </Text>
                )}
                {item.notes && (
                  <Text type="secondary" className="mt-1 block">
                    {item.notes}
                  </Text>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const renderChecklist = (categories: ChecklistCategory[] | null) => {
    const safeCategories = categories || []
    return (
      <div className="space-y-4">
        {safeCategories.length === 0 ? (
          <div className="text-center py-4">
            暂无检查项
          </div>
        ) : (
          safeCategories.map((category) => {
            const total = category.items?.length || 0
            const checked = category.items?.filter((item) => item.checked).length || 0
            const progress = total > 0 ? Math.round((checked / total) * 100) : 0

            return (
              <Card key={category.id} size="small" title={category.name}>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <ul className="space-y-2">
                  {(category.items || []).map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        readOnly
                      />
                      <div className={item.checked ? 'line-through text-gray-400' : ''}>
                        {item.name}
                        {item.required && <Tag color="orange" className="ml-2">必带</Tag>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })
        )}
      </div>
    )
  }

  const renderTransport = (items: TransportItem[] | null) => {
    const safeItems = items || []
    return (
      <div className="space-y-3">
        {safeItems.length === 0 ? (
          <div className="text-center py-4">
            暂无交通项
          </div>
        ) : (
          <ul className="space-y-3">
            {safeItems.map((item) => (
              <li key={item.id} className="p-3 border rounded-lg">
                <Card size="small">
                  {item.type === 'flight' && (
                    <div className="space-y-1">
                      <Text strong>{item.route || '未设置航线'}</Text>
                      <Text type="secondary">{item.flightNo} · {item.date} {item.time}</Text>
                      {item.baggage && (
                        <Text>行李: {item.baggage}</Text>
                      )}
                      {item.price && (
                        <Text type="danger">¥{item.price}</Text>
                      )}
                    </div>
                  )}
                  {item.type === 'train' && (
                    <div className="space-y-1">
                      <Text strong>{item.route || '未设置路线'}</Text>
                      <Text type="secondary">{item.trainNo} · {item.date} {item.time}</Text>
                      {item.seat && (
                        <Text>座位: {item.seat}</Text>
                      )}
                      {item.price && (
                        <Text type="danger">¥{item.price}</Text>
                      )}
                    </div>
                  )}
                  {item.type === 'car' && (
                    <div className="space-y-1">
                      <Text strong>{item.company} - {item.model}</Text>
                      <Text type="secondary">{item.days}天 · {item.pickup} → {item.dropoff}</Text>
                      {item.price && (
                        <Text type="danger">¥{item.price}</Text>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const renderPhoto = (spots: PhotoSpot[] | null) => {
    const safeSpots = spots || []
    const dronePolicies = [
      { value: 'allowed', label: '可飞', color: 'green' },
      { value: 'forbidden', label: '禁飞', color: 'red' },
      { value: 'register', label: '需登记', color: 'orange' },
    ]

    return (
      <div className="space-y-3">
        {safeSpots.length === 0 ? (
          <div className="text-center py-4">
            暂无摄影机位
          </div>
        ) : (
          <ul className="space-y-3">
            {safeSpots.map((spot) => (
              <li key={spot.id} className="p-3 border rounded-lg">
                <Card size="small">
                  <div className="flex justify-between items-center mb-2">
                    <Text strong>{spot.name}</Text>
                    <Tag color={dronePolicies.find(p => p.value === spot.dronePolicy)?.color}>
                      {dronePolicies.find(p => p.value === spot.dronePolicy)?.label}
                    </Tag>
                  </div>
                  <Text type="secondary">{spot.focalLength} · {spot.bestTime}</Text>
                  {spot.notes && (
                    <Paragraph className="mt-2">{spot.notes}</Paragraph>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const renderTips = (tips: Tip[] | null) => {
    const safeTips = tips || []
    const tipTypes = [
      { value: 'info', label: '信息', color: 'blue' },
      { value: 'warning', label: '警告', color: 'yellow' },
      { value: 'success', label: '成功', color: 'green' },
      { value: 'weather', label: '天气', color: 'cyan' },
      { value: 'emergency', label: '紧急', color: 'pink' },
      { value: 'safety', label: '安全', color: 'red' },
    ]

    return (
      <div className="space-y-3">
        {safeTips.length === 0 ? (
          <div className="text-center py-4">
            暂无提示
          </div>
        ) : (
          <ul className="space-y-3">
            {safeTips.map((tip) => (
              <li key={tip.id} className="p-3 border rounded-lg">
                <Card size="small" bordered>
                  <div className="flex gap-2 items-start">
                    <Tag color={tipTypes.find(t => t.value === tip.type)?.color}>
                      {tipTypes.find(t => t.value === tip.type)?.label}
                    </Tag>
                    <div>
                      <Text strong>{tip.title}</Text>
                      <Paragraph>{tip.content}</Paragraph>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  switch (type) {
    case 'itinerary':
      return renderItinerary(data)
    case 'expense':
      return renderExpense(data)
    case 'checklist':
      return renderChecklist(data)
    case 'transport':
      return renderTransport(data)
    case 'photo':
      return renderPhoto(data)
    case 'tips':
      return renderTips(data)
    default:
      // 自定义模块或普通文本模块
      if (data && Array.isArray(data) && data.length > 0) {
        // 如果有数据，尝试渲染为简单列表
        return (
          <div className="space-y-2">
            {data.map((item: any, index: number) => (
              <Card key={index} size="small">
                {typeof item === 'string' ? (
                  <Text>{item}</Text>
                ) : (
                  <div>
                    {item.title && <Text strong>{item.title}</Text>}
                    {item.text && <Paragraph>{item.text}</Paragraph>}
                    {item.content && <Paragraph>{item.content}</Paragraph>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      }
      return (
        <div className="text-center py-8 text-gray-500">
          <Empty description="该模块类型暂不支持预览" />
        </div>
      )
  }
}
