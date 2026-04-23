'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Input,
  Form,
  Popconfirm,
  Select,
  InputNumber,
  App,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

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

export default function TransportModule({ value, onChange }: TransportModuleProps) {
  const [items, setItems] = useState<TransportItem[]>(value || [])
  const [editingItem, setEditingItem] = useState<TransportItem | null>(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setItems(value)
    }
  }, [value])

  const handleAddItem = (type: 'flight' | 'train' | 'car') => {
    const newItem: TransportItem = {
      id: Date.now().toString(),
      type,
      date: '',
      time: '',
    }
    setItems([...items, newItem])
  }

  const handleEditItem = (item: TransportItem) => {
    setEditingItem(item)
    form.setFieldsValue(item)
  }

  const handleSaveItem = async () => {
    if (!editingItem) return
    
    try {
      const values = await form.validateFields()
      const updatedItems = items.map((item) =>
        item.id === editingItem.id ? { ...item, ...values } : item
      )
      setItems(updatedItems)
      setEditingItem(null)
      onChange(updatedItems)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
    onChange(updatedItems)
  }

  const handleSaveAll = () => {
    onChange(items)
    message.success('保存成功')
  }

  const getTransportTypeLabel = (type: string) => {
    switch (type) {
      case 'flight':
        return '飞机'
      case 'train':
        return '火车'
      case 'car':
        return '汽车'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <Card title="交通信息" className="mb-4">
        <div className="mb-4 flex gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddItem('flight')}
          >
            添加飞机
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddItem('train')}
          >
            添加火车
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddItem('car')}
          >
            添加汽车
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-4">
            暂无交通项
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium mb-2">
                      {getTransportTypeLabel(item.type)}
                      {item.route && ` · ${item.route}`}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">
                      {item.date} {item.time}
                    </div>
                    {item.flightNo && (
                      <div className="text-sm mb-1">航班: {item.flightNo}</div>
                    )}
                    {item.trainNo && (
                      <div className="text-sm mb-1">车次: {item.trainNo}</div>
                    )}
                    {item.company && item.model && (
                      <div className="text-sm mb-1">{item.company} - {item.model}</div>
                    )}
                    {item.baggage && (
                      <div className="text-sm mb-1">行李: {item.baggage}</div>
                    )}
                    {item.seat && (
                      <div className="text-sm mb-1">座位: {item.seat}</div>
                    )}
                    {item.price && (
                      <div className="text-sm text-red-600 mb-1">价格: ¥{item.price}</div>
                    )}
                    {item.pickup && item.dropoff && (
                      <div className="text-sm mb-1">{item.pickup} → {item.dropoff}</div>
                    )}
                    {item.days && (
                      <div className="text-sm mb-1">天数: {item.days}天</div>
                    )}
                    {item.notes && (
                      <div className="text-sm">{item.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditItem(item)}
                    />
                    <Popconfirm
                      title="确定删除这个交通项吗？"
                      onConfirm={() => handleDeleteItem(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <Button type="primary" onClick={handleSaveAll}>
            保存所有交通项
          </Button>
        </div>
      </Card>

      {editingItem && (
        <Card title={`编辑${getTransportTypeLabel(editingItem.type)}`}>
          <Form form={form} layout="vertical">
            <Form.Item
              label="日期"
              name="date"
              rules={[{ required: true, message: '请输入日期' }]}
            >
              <Input placeholder="例如：2023-12-01" />
            </Form.Item>

            <Form.Item
              label="时间"
              name="time"
              rules={[{ required: true, message: '请输入时间' }]}
            >
              <Input placeholder="例如：10:00" />
            </Form.Item>

            {editingItem.type === 'flight' && (
              <>
                <Form.Item
                  label="航线"
                  name="route"
                >
                  <Input placeholder="例如：北京-上海" />
                </Form.Item>
                <Form.Item
                  label="航班号"
                  name="flightNo"
                >
                  <Input placeholder="例如：CA1234" />
                </Form.Item>
                <Form.Item
                  label="行李额"
                  name="baggage"
                >
                  <Input placeholder="例如：20kg" />
                </Form.Item>
                <Form.Item
                  label="座位"
                  name="seat"
                >
                  <Input placeholder="例如：12A" />
                </Form.Item>
              </>
            )}

            {editingItem.type === 'train' && (
              <>
                <Form.Item
                  label="路线"
                  name="route"
                >
                  <Input placeholder="例如：北京-上海" />
                </Form.Item>
                <Form.Item
                  label="车次"
                  name="trainNo"
                >
                  <Input placeholder="例如：G1234" />
                </Form.Item>
                <Form.Item
                  label="座位"
                  name="seat"
                >
                  <Input placeholder="例如：12A" />
                </Form.Item>
              </>
            )}

            {editingItem.type === 'car' && (
              <>
                <Form.Item
                  label="公司"
                  name="company"
                >
                  <Input placeholder="例如：神州租车" />
                </Form.Item>
                <Form.Item
                  label="车型"
                  name="model"
                >
                  <Input placeholder="例如：大众朗逸" />
                </Form.Item>
                <Form.Item
                  label="取车地点"
                  name="pickup"
                >
                  <Input placeholder="例如：机场" />
                </Form.Item>
                <Form.Item
                  label="还车地点"
                  name="dropoff"
                >
                  <Input placeholder="例如：市区" />
                </Form.Item>
                <Form.Item
                  label="天数"
                  name="days"
                >
                  <InputNumber placeholder="请输入天数" style={{ width: '100%' }} />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="价格"
              name="price"
            >
              <InputNumber placeholder="请输入价格" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="备注"
              name="notes"
            >
              <TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditingItem(null)}>
                取消
              </Button>
              <Button type="primary" onClick={handleSaveItem}>
                保存
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  )
}
