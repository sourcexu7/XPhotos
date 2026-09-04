'use client'

import React from 'react'
import {
  Card,
  Typography,
  Tag,
  Badge,
  Empty,
  Timeline,
  Rate,
  Checkbox,
  Progress,
  Image as AntImage,
  theme,
} from 'antd'
import {
  EnvironmentOutlined,
  CameraOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons'
import { formatMoney } from './module-base'

const { Text, Paragraph } = Typography

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

interface RailwayItem {
  id: string
  trainNo?: string
  route?: string
  departureStation?: string
  arrivalStation?: string
  departureDate?: string
  departureTime?: string
  arrivalTime?: string
  duration?: string
  seatType?: string
  seatNo?: string
  carriage?: string
  platform?: string
  price?: number
  trainType?: string
  notes?: string
}

interface TimelineItem {
  id: string
  date?: string
  time?: string
  type?: string
  title?: string
  description?: string
  location?: string
  duration?: string
  notes?: string
}

interface NoteItem {
  id: string
  priority?: string
  category?: string
  title?: string
  content?: string
}

interface ReviewItem {
  id: string
  attractionName?: string
  rating?: number
  author?: string
  date?: string
  content?: string
  pros?: string
  cons?: string
  visitType?: string
}

interface SeatItem {
  id: string
  spotName?: string
  location?: string
  bestTime?: string
  season?: string
  direction?: string
  focalLength?: string
  aperture?: string
  shutterSpeed?: string
  iso?: string
  equipment?: string
  tips?: string
  sampleImage?: string
  notes?: string
}

interface ModulePreviewProps {
  type: string
  data: any
}

/** 空状态（与编辑列表保持一致的 AntD 范式） */
function PreviewEmpty({ description }: { description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
}

export default function ModulePreview({ type, data }: ModulePreviewProps) {
  const { token } = theme.useToken()

  /** 统一卡片容器样式（代替 tailwind p-3 border rounded-lg） */
  const itemBoxStyle: React.CSSProperties = {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
  }

  const renderItinerary = (items: ItineraryItem[] | null) => {
    const safeItems = items || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无行程项" />
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM, margin: 0, padding: 0, listStyle: 'none' }}>
            {safeItems.map((item) => (
              <li key={item.id} style={itemBoxStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{item.title || item.location || '未设置地点'}</Text>
                    <Text type="secondary">{item.date}</Text>
                  </div>
                  {item.location && (
                    <Text type="secondary" style={{ display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                      <EnvironmentOutlined /> {item.location}
                    </Text>
                  )}
                  <Paragraph style={{ marginBottom: 0 }}>{item.description || '无描述'}</Paragraph>
                  {item.highlights && item.highlights.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: token.marginXXS }}>
                      {item.highlights.map((h, i) => (
                        <Tag key={i} color="blue" style={{ margin: 0 }}>{h}</Tag>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginMD }}>
        <Text strong style={{ fontSize: token.fontSizeLG }}>总费用: ¥{formatMoney(total)}</Text>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无费用项" />
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM, margin: 0, padding: 0, listStyle: 'none' }}>
            {safeItems.map((item) => (
              <li key={item.id} style={itemBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <Text strong>{item.name || '未命名'}</Text>
                    <Tag color="blue" style={{ marginLeft: token.marginXS }}>
                      {categories.find(c => c.value === item.category)?.label || item.category}
                    </Tag>
                  </div>
                  <Text strong type="danger">¥{formatMoney(item.subtotal)}</Text>
                </div>
                {item.detail && (
                  <Text type="secondary" style={{ display: 'block', marginTop: token.marginXXS }}>
                    {item.detail}
                  </Text>
                )}
                {item.notes && (
                  <Text type="secondary" style={{ display: 'block', marginTop: token.marginXXS }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginMD }}>
        {safeCategories.length === 0 ? (
          <PreviewEmpty description="暂无检查项" />
        ) : (
          safeCategories.map((category) => {
            const total = category.items?.length || 0
            const checked = category.items?.filter((item) => item.checked).length || 0
            const progress = total > 0 ? Math.round((checked / total) * 100) : 0

            return (
              <Card key={category.id} size="small" title={category.name}>
                <Progress
                  percent={progress}
                  size="small"
                  showInfo={false}
                  strokeColor={progress === 100 ? token.colorSuccess : token.colorWarning}
                  style={{ marginBottom: token.marginSM }}
                />
                <ul style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS, margin: 0, padding: 0, listStyle: 'none' }}>
                  {(category.items || []).map((item) => (
                    <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
                      <Checkbox checked={item.checked} disabled />
                      <div style={{ color: item.checked ? token.colorTextTertiary : undefined, textDecoration: item.checked ? 'line-through' : undefined }}>
                        {item.name}
                        {item.required && <Tag color="orange" style={{ marginLeft: token.marginXS }}>必带</Tag>}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无交通项" />
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM, margin: 0, padding: 0, listStyle: 'none' }}>
            {safeItems.map((item) => (
              <li key={item.id}>
                <Card size="small">
                  {item.type === 'flight' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXXS }}>
                      <Text strong>{item.route || '未设置航线'}</Text>
                      <Text type="secondary">{item.flightNo} · {item.date} {item.time}</Text>
                      {item.baggage && (
                        <Text>行李: {item.baggage}</Text>
                      )}
                      {item.price && (
                        <Text type="danger">¥{formatMoney(item.price)}</Text>
                      )}
                    </div>
                  )}
                  {item.type === 'train' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXXS }}>
                      <Text strong>{item.route || '未设置路线'}</Text>
                      <Text type="secondary">{item.trainNo} · {item.date} {item.time}</Text>
                      {item.seat && (
                        <Text>座位: {item.seat}</Text>
                      )}
                      {item.price && (
                        <Text type="danger">¥{formatMoney(item.price)}</Text>
                      )}
                    </div>
                  )}
                  {item.type === 'car' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXXS }}>
                      <Text strong>{item.company} - {item.model}</Text>
                      <Text type="secondary">{item.days}天 · {item.pickup} → {item.dropoff}</Text>
                      {item.price && (
                        <Text type="danger">¥{formatMoney(item.price)}</Text>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeSpots.length === 0 ? (
          <PreviewEmpty description="暂无摄影机位" />
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM, margin: 0, padding: 0, listStyle: 'none' }}>
            {safeSpots.map((spot) => (
              <li key={spot.id}>
                <Card size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: token.marginXS }}>
                    <Text strong>{spot.name}</Text>
                    <Tag color={dronePolicies.find(p => p.value === spot.dronePolicy)?.color}>
                      {dronePolicies.find(p => p.value === spot.dronePolicy)?.label}
                    </Tag>
                  </div>
                  <Text type="secondary">{spot.focalLength} · {spot.bestTime}</Text>
                  {spot.notes && (
                    <Paragraph style={{ marginTop: token.marginXS, marginBottom: 0 }}>{spot.notes}</Paragraph>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeTips.length === 0 ? (
          <PreviewEmpty description="暂无提示" />
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM, margin: 0, padding: 0, listStyle: 'none' }}>
            {safeTips.map((tip) => (
              <li key={tip.id}>
                <Card size="small" variant="outlined">
                  <div style={{ display: 'flex', gap: token.marginXS, alignItems: 'flex-start' }}>
                    <Tag color={tipTypes.find(t => t.value === tip.type)?.color}>
                      {tipTypes.find(t => t.value === tip.type)?.label}
                    </Tag>
                    <div>
                      <Text strong>{tip.title}</Text>
                      <Paragraph style={{ marginBottom: 0 }}>{tip.content}</Paragraph>
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

  const renderRailway = (items: RailwayItem[] | null) => {
    const safeItems = items || []
    const seatTypeLabels: Record<string, string> = { business: '商务座', first: '一等座', second: '二等座', soft_sleeper: '软卧', hard_sleeper: '硬卧', hard_seat: '硬座', standing: '无座' }
    const trainTypeLabels: Record<string, string> = { high_speed: '高铁', emu: '动车', direct: '直达', express: '特快', fast: '快速', ordinary: '普通' }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无铁路信息" />
        ) : (
          <Timeline items={safeItems.map((item) => ({
            key: item.id,
            content: (
              <Card size="small">
                <div style={{ display: 'flex', gap: token.marginXS, alignItems: 'center', marginBottom: token.marginXXS }}>
                  <Text strong>{item.trainNo || '未设置车次'}</Text>
                  {item.trainType && <Tag color="blue" style={{ margin: 0 }}>{trainTypeLabels[item.trainType] || item.trainType}</Tag>}
                  {item.seatType && <Tag style={{ margin: 0 }}>{seatTypeLabels[item.seatType] || item.seatType}</Tag>}
                </div>
                {item.route && <Text type="secondary">{item.route}</Text>}
                <div style={{ display: 'flex', gap: token.marginMD, flexWrap: 'wrap', fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginTop: token.marginXXS }}>
                  {item.departureStation && <span>{item.departureStation} → {item.arrivalStation || ''}</span>}
                  {item.departureDate && <span>{item.departureDate} {item.departureTime || ''} - {item.arrivalTime || ''}</span>}
                  {item.duration && <span>历时 {item.duration}</span>}
                  {item.price !== undefined && <span style={{ color: token.colorError }}>¥{formatMoney(item.price)}</span>}
                </div>
                {item.notes && <Paragraph style={{ marginTop: token.marginXXS, marginBottom: 0 }}>{item.notes}</Paragraph>}
              </Card>
            ),
          }))} />
        )}
      </div>
    )
  }

  const renderTimelineModule = (items: TimelineItem[] | null) => {
    const safeItems = items || []
    const typeLabels: Record<string, { label: string; color: string }> = {
      flight: { label: '航班', color: 'blue' },
      train: { label: '火车', color: 'green' },
      car: { label: '汽车', color: 'orange' },
      walk: { label: '步行', color: 'default' },
      other: { label: '其他', color: 'default' },
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无时间线节点" />
        ) : (
          <Timeline mode="start" items={safeItems.map((item) => {
            const config = typeLabels[item.type || 'other'] || typeLabels.other
            return {
              key: item.id,
              title: (
                <div style={{ display: 'flex', gap: token.marginXXS, alignItems: 'center' }}>
                  {item.date && <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>{item.date}</Text>}
                  {item.time && <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>{item.time}</Text>}
                  <Tag color={config.color} style={{ margin: 0 }}>{config.label}</Tag>
                </div>
              ),
              content: (
                <Card size="small">
                  <Text strong>{item.title || '未命名节点'}</Text>
                  {item.location && (
                    <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                      <EnvironmentOutlined /> {item.location}
                    </div>
                  )}
                  {item.description && <div style={{ fontSize: token.fontSizeSM }}>{item.description}</div>}
                  {item.duration && <div style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }}>时长：{item.duration}</div>}
                  {item.notes && <Paragraph style={{ marginTop: token.marginXXS, marginBottom: 0, fontSize: token.fontSizeSM }}>{item.notes}</Paragraph>}
                </Card>
              ),
            }
          })} />
        )}
      </div>
    )
  }

  const renderNotes = (items: NoteItem[] | null) => {
    const safeItems = items || []
    const priorityLabels: Record<string, { label: string; color: string }> = {
      high: { label: '重要', color: 'red' },
      medium: { label: '注意', color: 'orange' },
      low: { label: '提示', color: 'blue' },
      success: { label: '确认', color: 'green' },
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无注意事项" />
        ) : (
          safeItems.map((item) => {
            const config = priorityLabels[item.priority || 'medium'] || priorityLabels.medium
            return (
              <Card key={item.id} size="small">
                <div style={{ display: 'flex', gap: token.marginXS, alignItems: 'center', marginBottom: token.marginXXS }}>
                  <Text strong>{item.title || '未命名要点'}</Text>
                  <Tag color={config.color} style={{ margin: 0 }}>{config.label}</Tag>
                  {item.category && <Tag style={{ margin: 0 }}>{item.category}</Tag>}
                </div>
                {item.content && <Text type="secondary">{item.content}</Text>}
              </Card>
            )
          })
        )}
      </div>
    )
  }

  const renderReview = (items: ReviewItem[] | null) => {
    const safeItems = items || []
    const visitTypeLabels: Record<string, string> = { solo: '独自出行', couple: '情侣出行', family: '家庭出行', group: '团队出行', business: '商务出行' }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无点评" />
        ) : (
          safeItems.map((item) => (
            <Card key={item.id} size="small">
              <div style={{ display: 'flex', gap: token.marginXS, alignItems: 'center', marginBottom: token.marginXS }}>
                <Text strong style={{ fontSize: token.fontSizeLG }}>{item.attractionName || '未命名景点'}</Text>
                <Rate disabled value={item.rating || 0} style={{ fontSize: 14 }} />
              </div>
              {item.content && <Paragraph>{item.content}</Paragraph>}
              <div style={{ display: 'flex', gap: token.marginMD, fontSize: token.fontSizeSM }}>
                {item.pros && (
                  <span style={{ color: token.colorSuccess, display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                    <LikeOutlined /> {item.pros}
                  </span>
                )}
                {item.cons && (
                  <span style={{ color: token.colorError, display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                    <DislikeOutlined /> {item.cons}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: token.marginMD, marginTop: token.marginXXS, fontSize: token.fontSizeSM, color: token.colorTextTertiary, alignItems: 'center' }}>
                {item.author && <span>{item.author}</span>}
                {item.date && <span>{item.date}</span>}
                {item.visitType && <Tag style={{ margin: 0 }}>{visitTypeLabels[item.visitType] || item.visitType}</Tag>}
              </div>
            </Card>
          ))
        )}
      </div>
    )
  }

  const renderSeat = (items: SeatItem[] | null) => {
    const safeItems = items || []
    const bestTimeLabels: Record<string, string> = { sunrise: '日出', sunset: '日落', blue_hour: '蓝调时刻', golden_hour: '黄金时刻', midday: '正午', night: '夜间', anytime: '随时' }
    const seasonLabels: Record<string, string> = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季', all_season: '四季皆宜' }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
        {safeItems.length === 0 ? (
          <PreviewEmpty description="暂无摄影机位" />
        ) : (
          safeItems.map((item) => (
            <Card key={item.id} size="small">
              {item.sampleImage && (
                <div style={{ marginBottom: token.marginXS }}>
                  <AntImage
                    src={item.sampleImage}
                    alt={item.spotName || '样图'}
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: token.borderRadius, objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: token.marginXS, alignItems: 'center', marginBottom: token.marginXXS, flexWrap: 'wrap' }}>
                <Text strong style={{ fontSize: token.fontSizeLG }}>{item.spotName || '未命名机位'}</Text>
                {item.bestTime && <Tag color="orange" style={{ margin: 0 }}>{bestTimeLabels[item.bestTime] || item.bestTime}</Tag>}
                {item.season && <Tag color="green" style={{ margin: 0 }}>{seasonLabels[item.season] || item.season}</Tag>}
              </div>
              {item.location && (
                <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                  <EnvironmentOutlined /> {item.location}
                </div>
              )}
              <div style={{ display: 'flex', gap: token.marginMD, flexWrap: 'wrap', fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                {item.focalLength && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                    <CameraOutlined /> {item.focalLength}
                  </span>
                )}
                {item.aperture && <span>光圈 {item.aperture}</span>}
                {item.shutterSpeed && <span>快门 {item.shutterSpeed}</span>}
                {item.iso && <span>ISO {item.iso}</span>}
              </div>
              {item.equipment && <div style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary, marginTop: token.marginXXS }}>器材：{item.equipment}</div>}
              {item.tips && <Paragraph style={{ marginTop: token.marginXXS, marginBottom: 0 }}>{item.tips}</Paragraph>}
              {item.notes && <div style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary, marginTop: token.marginXXS }}>{item.notes}</div>}
            </Card>
          ))
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
    case 'railway':
      return renderRailway(data)
    case 'timeline':
      return renderTimelineModule(data)
    case 'notes':
      return renderNotes(data)
    case 'review':
      return renderReview(data)
    case 'seat':
      return renderSeat(data)
    default:
      // 自定义模块或普通文本模块
      if (data && Array.isArray(data) && data.length > 0) {
        // 如果有数据，尝试渲染为简单列表
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginXS }}>
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
        <div style={{ padding: `${token.paddingXL}px 0` }}>
          <Empty description="该模块类型暂不支持预览" />
        </div>
      )
  }
}
