'use client'

import React from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  Tag,
  theme,
} from 'antd'
import { CarOutlined } from '@ant-design/icons'
import ModuleBase, { FormGrid, FormDatePicker, FormTimePicker, MODAL_WIDTH, createRecordId, formatMoney } from './module-base'

const { TextArea } = Input
const { Text } = Typography

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

interface TransportModuleProps {
  value: TransportItem[]
  onChange: (data: TransportItem[]) => void
}

const transportTypes: { value: TransportItem['type']; label: string; color: string }[] = [
  { value: 'flight', label: '飞机', color: 'blue' },
  { value: 'train', label: '火车', color: 'green' },
  { value: 'car', label: '汽车', color: 'orange' },
]

const getTransportType = (type: string) =>
  transportTypes.find((t) => t.value === type) || transportTypes[0]

export default function TransportModule({ value, onChange }: TransportModuleProps) {
  const { token } = theme.useToken()

  return (
    <ModuleBase
      title="交通信息"
      icon={<CarOutlined />}
      records={(value || []) as any}
      onChange={(records) => onChange(records as TransportItem[])}
      modalWidth={MODAL_WIDTH.M}
      getDefaultRecord={() =>
        ({
          id: createRecordId(),
          type: 'flight' as const,
          date: '',
          time: '',
        }) as TransportItem
      }
      renderItem={(record) => {
        const item = record as TransportItem
        const typeMeta = getTransportType(item.type)
        return (
          <div>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: token.marginXXS }}
            >
              <Space size={token.marginXS}>
                <Tag color={typeMeta.color}>{typeMeta.label}</Tag>
                {item.route && <Text strong>{item.route}</Text>}
              </Space>
              {item.price !== undefined && item.price !== null && (
                <Text type="danger" strong>
                  ¥{formatMoney(item.price)}
                </Text>
              )}
            </div>
            {item.date && (
              <div style={{ marginBottom: token.marginXXS }}>
                <Text type="secondary">
                  {item.date} {item.time}
                </Text>
              </div>
            )}
            <Space orientation="vertical" size={token.marginXXS}>
              {item.flightNo && <Text type="secondary">航班: {item.flightNo}</Text>}
              {item.trainNo && <Text type="secondary">车次: {item.trainNo}</Text>}
              {item.company && item.model && (
                <Text type="secondary">
                  {item.company} - {item.model}
                </Text>
              )}
              {item.baggage && <Text type="secondary">行李: {item.baggage}</Text>}
              {item.seat && <Text type="secondary">座位: {item.seat}</Text>}
              {item.pickup && item.dropoff && (
                <Text type="secondary">
                  {item.pickup} → {item.dropoff}
                </Text>
              )}
              {item.days !== undefined && item.days !== null && (
                <Text type="secondary">天数: {item.days}天</Text>
              )}
              {item.notes && <Text type="secondary">{item.notes}</Text>}
            </Space>
          </div>
        )
      }}
      renderEditForm={() => (
        <>
          <FormGrid>
            <Form.Item
              label="交通类型"
              name="type"
              rules={[{ required: true, message: '请选择交通类型' }]}
            >
              <Select
                options={transportTypes.map((t) => ({ value: t.value, label: t.label }))}
                placeholder="请选择交通类型"
              />
            </Form.Item>
            <Form.Item
              label="日期"
              name="date"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <FormDatePicker placeholder="选择日期" />
            </Form.Item>
            <Form.Item
              label="时间"
              name="time"
              rules={[{ required: true, message: '请选择时间' }]}
            >
              <FormTimePicker placeholder="选择时间" />
            </Form.Item>
            <Form.Item label="价格" name="price">
              <InputNumber
                placeholder="请输入价格"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>
          </FormGrid>

          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.type !== next.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type') as TransportItem['type']
              return (
                <FormGrid>
                  {type === 'flight' && (
                    <>
                      <Form.Item label="航线" name="route">
                        <Input placeholder="例如：北京-上海" />
                      </Form.Item>
                      <Form.Item label="航班号" name="flightNo">
                        <Input placeholder="例如：CA1234" />
                      </Form.Item>
                      <Form.Item label="行李额" name="baggage">
                        <Input placeholder="例如：20kg" />
                      </Form.Item>
                      <Form.Item label="座位" name="seat">
                        <Input placeholder="例如：12A" />
                      </Form.Item>
                    </>
                  )}
                  {type === 'train' && (
                    <>
                      <Form.Item label="路线" name="route">
                        <Input placeholder="例如：北京-上海" />
                      </Form.Item>
                      <Form.Item label="车次" name="trainNo">
                        <Input placeholder="例如：G1234" />
                      </Form.Item>
                      <Form.Item label="座位" name="seat">
                        <Input placeholder="例如：12A" />
                      </Form.Item>
                    </>
                  )}
                  {type === 'car' && (
                    <>
                      <Form.Item label="公司" name="company">
                        <Input placeholder="例如：神州租车" />
                      </Form.Item>
                      <Form.Item label="车型" name="model">
                        <Input placeholder="例如：大众朗逸" />
                      </Form.Item>
                      <Form.Item label="取车地点" name="pickup">
                        <Input placeholder="例如：机场" />
                      </Form.Item>
                      <Form.Item label="还车地点" name="dropoff">
                        <Input placeholder="例如：市区" />
                      </Form.Item>
                      <Form.Item label="天数" name="days">
                        <InputNumber
                          placeholder="请输入天数"
                          style={{ width: '100%' }}
                          min={0}
                        />
                      </Form.Item>
                    </>
                  )}
                </FormGrid>
              )
            }}
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="请输入备注" showCount maxLength={200} />
          </Form.Item>
        </>
      )}
    />
  )
}
