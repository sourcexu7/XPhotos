'use client'

import React from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Tag,
  Space,
  theme,
} from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  HourglassOutlined,
  EnvironmentOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import ModuleBase from './module-base'

const { TextArea } = Input
const { Text } = Typography

interface ItineraryItem {
  id: string
  day: number
  title?: string
  date?: string
  time: string
  location: string
  duration: string
  description: string
  tips: string
  type: string
  highlights: string[]
}

interface ItineraryModuleProps {
  value: ItineraryItem[]
  onChange: (data: ItineraryItem[]) => void
}

const activityTypeOptions = [
  { value: '交通', label: '交通' },
  { value: '景点', label: '景点' },
  { value: '餐饮', label: '餐饮' },
  { value: '住宿', label: '住宿' },
  { value: '购物', label: '购物' },
  { value: '娱乐', label: '娱乐' },
  { value: '其他', label: '其他' },
]

const typeColorMap: Record<string, string> = {
  交通: 'blue',
  景点: 'green',
  餐饮: 'orange',
  住宿: 'purple',
  购物: 'magenta',
  娱乐: 'cyan',
  其他: 'default',
}

export default function ItineraryModule({ value, onChange }: ItineraryModuleProps) {
  const { token } = theme.useToken()

  const renderItem = (record: ItineraryItem) => {
    const typeColor = typeColorMap[record.type] || 'default'
    return (
      <div>
        <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
          <Tag color="blue" style={{ margin: 0 }}>{`第 ${record.day} 天`}</Tag>
          {record.type && <Tag color={typeColor} style={{ margin: 0 }}>{record.type}</Tag>}
          <Text strong>{record.location || '未设置地点'}</Text>
        </div>

        {record.title && (
          <div
            style={{
              marginBottom: token.marginXXS,
              color: token.colorTextSecondary,
              fontSize: token.fontSizeSM,
            }}
          >
            {record.title}
          </div>
        )}

        <Space
          size="middle"
          style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM, flexWrap: 'wrap' }}
        >
          {record.date && (
            <span className="flex items-center gap-1">
              <CalendarOutlined />
              {record.date}
            </span>
          )}
          {record.time && (
            <span className="flex items-center gap-1">
              <ClockCircleOutlined />
              {record.time}
            </span>
          )}
          {record.duration && (
            <span className="flex items-center gap-1">
              <HourglassOutlined />
              {record.duration}
            </span>
          )}
        </Space>

        {record.description && (
          <div
            style={{
              marginTop: token.marginXS,
              color: token.colorTextSecondary,
              fontSize: token.fontSizeSM,
              lineHeight: 1.6,
            }}
          >
            {record.description}
          </div>
        )}

        {record.highlights && record.highlights.length > 0 && (
          <div
            style={{
              marginTop: token.marginXS,
              display: 'flex',
              flexWrap: 'wrap',
              gap: token.marginXXS,
            }}
          >
            {record.highlights.map((h, idx) => (
              <Tag key={idx} color="blue" style={{ margin: 0 }}>{h}</Tag>
            ))}
          </div>
        )}

        {record.tips && (
          <div
            style={{
              marginTop: token.marginXS,
              padding: `${token.paddingXS}px ${token.paddingSM}px`,
              background: token.colorWarningBg,
              borderRadius: token.borderRadiusSM,
              border: `1px solid ${token.colorWarningBorder}`,
              fontSize: token.fontSizeSM,
              color: token.colorWarning,
              display: 'flex',
              alignItems: 'flex-start',
              gap: token.marginXS,
            }}
          >
            <BulbOutlined style={{ marginTop: 2 }} />
            <span>{record.tips}</span>
          </div>
        )}
      </div>
    )
  }

  const renderEditForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="第几天"
          name="day"
          rules={[{ required: true, message: '请输入天数' }]}
        >
          <InputNumber min={1} placeholder="例如：1" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="日期" name="date">
          <Input placeholder="例如：2024-01-01" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="活动类型"
          name="type"
          rules={[{ required: true, message: '请选择活动类型' }]}
        >
          <Select options={activityTypeOptions} placeholder="请选择活动类型" />
        </Form.Item>
        <Form.Item label="时间" name="time">
          <Input placeholder="例如：09:00" />
        </Form.Item>
      </div>

      <Form.Item label="当日标题" name="title">
        <Input placeholder="例如：第一天：落地科莫多" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="时长" name="duration">
          <Input placeholder="例如：2小时" />
        </Form.Item>
        <Form.Item
          label="地点"
          name="location"
          rules={[{ required: true, message: '请输入地点' }]}
        >
          <Input
            prefix={<EnvironmentOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder="请输入地点"
          />
        </Form.Item>
      </div>

      <Form.Item label="描述" name="description">
        <TextArea
          rows={3}
          placeholder="请输入行程描述，包括活动内容、路线等"
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item label="亮点标签" name="highlights">
        <Select
          mode="tags"
          placeholder="输入亮点标签后按回车添加，例如：卡隆岛日落"
          tokenSeparators={[',', '，']}
        />
      </Form.Item>

      <Form.Item label="提示" name="tips">
        <TextArea
          rows={2}
          placeholder="请输入注意事项、小贴士等"
          showCount
          maxLength={200}
        />
      </Form.Item>
    </>
  )

  return (
    <ModuleBase
      title="行程安排"
      icon={<CalendarOutlined />}
      records={(value || []) as any}
      onChange={onChange as any}
      modalWidth={640}
      getDefaultRecord={() => ({
        id: Date.now().toString(),
        day: 1,
        title: '',
        date: '',
        time: '',
        location: '',
        duration: '',
        description: '',
        tips: '',
        type: '景点',
        highlights: [],
      })}
      renderItem={renderItem as any}
      renderEditForm={renderEditForm}
    />
  )
}
