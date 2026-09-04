'use client'

import React from 'react'
import {
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  CarOutlined,
  RocketOutlined,
  AimOutlined,
} from '@ant-design/icons'
import ModuleBase, { ModuleRecord } from './module-base'

const { TextArea } = Input
const { Text } = Typography

interface TimelineItem extends ModuleRecord {
  date?: string
  time?: string
  type?: string
  title?: string
  description?: string
  location?: string
  duration?: string
  notes?: string
}

interface TimelineModuleProps {
  value: TimelineItem[]
  onChange: (data: TimelineItem[]) => void
}

const transportTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  flight: { label: '航班', color: 'blue', icon: <RocketOutlined /> },
  train: { label: '火车', color: 'green', icon: <AimOutlined /> },
  car: { label: '汽车', color: 'orange', icon: <CarOutlined /> },
  walk: { label: '步行', color: 'default', icon: <EnvironmentOutlined /> },
  other: { label: '其他', color: 'default', icon: <ClockCircleOutlined /> },
}

const transportTypeOptions = Object.entries(transportTypeConfig).map(([k, v]) => ({
  value: k,
  label: v.label,
}))

const getTypeConfig = (type?: string) =>
  transportTypeConfig[type || 'other'] || transportTypeConfig.other

export default function TimelineModule({ value, onChange }: TimelineModuleProps) {
  const { token } = theme.useToken()

  const renderItem = (record: ModuleRecord) => {
    const item = record as TimelineItem
    const config = getTypeConfig(item.type)
    return (
      <div>
        <Space size={token.paddingXS} align="center" wrap>
          <span style={{ color: token.colorPrimary }}>{config.icon}</span>
          <Text strong>{item.title || '未命名节点'}</Text>
          <Tag color={config.color}>{config.label}</Tag>
        </Space>
        {item.location && (
          <div
            style={{
              marginTop: token.marginXXS,
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
            }}
          >
            <EnvironmentOutlined /> {item.location}
          </div>
        )}
        {item.description && (
          <div style={{ marginTop: token.marginXXS, fontSize: token.fontSizeSM }}>
            {item.description}
          </div>
        )}
        <Space
          size={token.paddingLG}
          wrap
          style={{
            marginTop: token.marginXXS,
            fontSize: token.fontSizeSM,
            color: token.colorTextTertiary,
          }}
        >
          {item.date && <span>{item.date}</span>}
          {item.time && <span>{item.time}</span>}
          {item.duration && <span>时长：{item.duration}</span>}
        </Space>
        {item.notes && (
          <div
            style={{
              marginTop: token.marginXXS,
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
            }}
          >
            {item.notes}
          </div>
        )}
      </div>
    )
  }

  const renderEditForm = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.paddingMD }}>
        <Form.Item label="日期" name="date">
          <Input placeholder="例如：2024-01-15" />
        </Form.Item>
        <Form.Item label="时间" name="time">
          <Input placeholder="例如：08:00" />
        </Form.Item>
        <Form.Item label="交通类型" name="type">
          <Select placeholder="选择交通类型" options={transportTypeOptions} />
        </Form.Item>
        <Form.Item label="时长" name="duration">
          <Input placeholder="例如：2小时" />
        </Form.Item>
        <Form.Item label="标题" name="title">
          <Input placeholder="例如：北京-上海" />
        </Form.Item>
        <Form.Item label="地点" name="location">
          <Input placeholder="例如：北京首都机场" />
        </Form.Item>
      </div>
      <Form.Item label="描述" name="description">
        <TextArea rows={3} placeholder="请输入描述" />
      </Form.Item>
      <Form.Item label="备注" name="notes">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>
    </>
  )

  return (
    <ModuleBase
      title="交通时间线"
      icon={<ClockCircleOutlined />}
      records={(value || []) as ModuleRecord[]}
      onChange={(records) => onChange(records as TimelineItem[])}
      modalWidth={640}
      addButtonText="添加行程节点"
      getDefaultRecord={() => ({ id: Date.now().toString() } as TimelineItem)}
      renderItem={renderItem}
      renderEditForm={renderEditForm}
    />
  )
}
