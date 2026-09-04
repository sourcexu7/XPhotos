'use client'

import React from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd'
import { EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons'
import ModuleBase, { ModuleRecord } from './module-base'

const { TextArea } = Input
const { Text } = Typography

interface RailwayItem extends ModuleRecord {
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

interface RailwayModuleProps {
  value: RailwayItem[]
  onChange: (data: RailwayItem[]) => void
}

const seatTypeOptions = [
  { value: 'business', label: '商务座' },
  { value: 'first', label: '一等座' },
  { value: 'second', label: '二等座' },
  { value: 'soft_sleeper', label: '软卧' },
  { value: 'hard_sleeper', label: '硬卧' },
  { value: 'hard_seat', label: '硬座' },
  { value: 'standing', label: '无座' },
]

const trainTypeOptions = [
  { value: 'high_speed', label: '高铁' },
  { value: 'emu', label: '动车' },
  { value: 'direct', label: '直达' },
  { value: 'express', label: '特快' },
  { value: 'fast', label: '快速' },
  { value: 'ordinary', label: '普通' },
]

const getSeatTypeLabel = (type?: string) =>
  seatTypeOptions.find((o) => o.value === type)?.label || type || ''

const getTrainTypeLabel = (type?: string) =>
  trainTypeOptions.find((o) => o.value === type)?.label || type || ''

export default function RailwayModule({ value, onChange }: RailwayModuleProps) {
  const { token } = theme.useToken()

  const renderItem = (record: ModuleRecord) => {
    const item = record as RailwayItem
    return (
      <div>
        <Space size={token.paddingXS} align="center" wrap>
          <Text strong>{item.trainNo || '未设置车次'}</Text>
          {item.trainType && <Tag color="blue">{getTrainTypeLabel(item.trainType)}</Tag>}
          {item.seatType && <Tag>{getSeatTypeLabel(item.seatType)}</Tag>}
        </Space>
        {item.route && (
          <div style={{ marginTop: token.marginXXS }}>
            <Text type="secondary">{item.route}</Text>
          </div>
        )}
        <Space
          size={token.paddingLG}
          wrap
          style={{
            marginTop: token.marginXXS,
            fontSize: token.fontSizeSM,
            color: token.colorTextSecondary,
          }}
        >
          {item.departureStation && (
            <span>
              {item.departureStation} → {item.arrivalStation || ''}
            </span>
          )}
          {item.departureDate && (
            <span>
              <ClockCircleOutlined /> {item.departureDate} {item.departureTime || ''} -{' '}
              {item.arrivalTime || ''}
            </span>
          )}
          {item.duration && <span>历时 {item.duration}</span>}
          {item.carriage && (
            <span>
              {item.carriage}车 {item.seatNo || ''}
            </span>
          )}
          {item.platform && <span>{item.platform}站台</span>}
          {item.price !== undefined && item.price !== null && (
            <span style={{ color: token.colorError }}>¥{item.price}</span>
          )}
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
        <Form.Item label="车次号" name="trainNo">
          <Input placeholder="例如：G1234" />
        </Form.Item>
        <Form.Item label="列车类型" name="trainType">
          <Select options={trainTypeOptions} placeholder="选择类型" />
        </Form.Item>
        <Form.Item label="出发站" name="departureStation">
          <Input placeholder="例如：北京南" />
        </Form.Item>
        <Form.Item label="到达站" name="arrivalStation">
          <Input placeholder="例如：上海虹桥" />
        </Form.Item>
        <Form.Item label="出发日期" name="departureDate">
          <Input placeholder="例如：2024-01-15" />
        </Form.Item>
        <Form.Item label="出发时间" name="departureTime">
          <Input placeholder="例如：08:00" />
        </Form.Item>
        <Form.Item label="到达时间" name="arrivalTime">
          <Input placeholder="例如：13:00" />
        </Form.Item>
        <Form.Item label="历时" name="duration">
          <Input placeholder="例如：5小时" />
        </Form.Item>
        <Form.Item label="座位类型" name="seatType">
          <Select options={seatTypeOptions} placeholder="选择座位类型" />
        </Form.Item>
        <Form.Item label="车厢号" name="carriage">
          <Input placeholder="例如：5" />
        </Form.Item>
        <Form.Item label="座位号" name="seatNo">
          <Input placeholder="例如：12A" />
        </Form.Item>
        <Form.Item label="站台" name="platform">
          <Input placeholder="例如：3" />
        </Form.Item>
        <Form.Item
          label="价格"
          name="price"
          rules={[{ type: 'number', message: '价格必须为数字' }]}
        >
          <InputNumber placeholder="请输入价格" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Form.Item label="备注" name="notes">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>
    </>
  )

  return (
    <ModuleBase
      title="铁路信息"
      icon={<EnvironmentOutlined />}
      records={(value || []) as ModuleRecord[]}
      onChange={(records) => onChange(records as RailwayItem[])}
      modalWidth={640}
      addButtonText="添加车次"
      getDefaultRecord={() => ({ id: Date.now().toString() } as RailwayItem)}
      renderItem={renderItem}
      renderEditForm={renderEditForm}
    />
  )
}
