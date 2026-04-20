'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Input,
  Form,
  Popconfirm,
  message,
  Tag,
  Timeline,
  Badge,
  Divider,
  Empty,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  HourglassOutlined,
  BulbOutlined,
  CalendarOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons'

const { TextArea } = Input

interface ItineraryItem {
  id: string
  day: number
  time: string
  location: string
  duration: string
  description: string
  tips: string
  type: string
}

interface ItineraryModuleProps {
  value: ItineraryItem[]
  onChange: (data: ItineraryItem[]) => void
}

const getActivityTypeColor = (type: string) => {
  const typeColors: Record<string, string> = {
    交通: '#1890ff',
    景点: '#52c41a',
    餐饮: '#fa8c16',
    住宿: '#722ed1',
    购物: '#eb2f96',
    娱乐: '#13c2c2',
    其他: '#8c8c8c',
  }
  return typeColors[type] || '#8c8c8c'
}

const getActivityTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    交通: '🚗',
    景点: '🏔️',
    餐饮: '🍽️',
    住宿: '🏨',
    购物: '🛒',
    娱乐: '🎭',
    其他: '📌',
  }
  return icons[type] || '📍'
}

export default function ItineraryModule({ value, onChange }: ItineraryModuleProps) {
  const [items, setItems] = useState<ItineraryItem[]>(value || [])
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (value && value.length > 0) {
      setItems(value)
    }
  }, [value])

  const handleAddItem = () => {
    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      day: 1,
      time: '',
      location: '',
      duration: '',
      description: '',
      tips: '',
      type: '景点',
    }
    setItems([...items, newItem])
    setEditingItem(newItem)
    form.setFieldsValue(newItem)
    setIsModalVisible(true)
  }

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setIsModalVisible(true)
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
      setIsModalVisible(false)
      onChange(updatedItems)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
    onChange(updatedItems)
    message.success('删除成功')
  }

  const handleSaveAll = () => {
    onChange(items)
    message.success('全部保存成功')
  }

  const groupByDay = (items: ItineraryItem[]) => {
    const groups: Record<number, ItineraryItem[]> = {}
    items.forEach(item => {
      const day = item.day || 1
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(item)
    })
    return Object.keys(groups).map(key => ({
      day: parseInt(key),
      items: groups[parseInt(key)].sort((a, b) => a.time.localeCompare(b.time))
    })).sort((a, b) => a.day - b.day)
  }

  const dayGroups = groupByDay(items)

  return (
    <div 
      className="space-y-4 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 50%, #ffd591 100%)',
        padding: '20px',
      }}
    >
      <div 
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ff7a45 0%, #ff9c6e 100%)',
          padding: '16px 20px',
          marginBottom: '16px',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              <CalendarOutlined style={{ fontSize: '20px', color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>
                行程安排
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                共 {items.length} 个行程项 · {dayGroups.length} 天
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddItem}
            style={{ 
              background: 'rgba(255,255,255,0.25)', 
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
            }}
          >
            添加行程
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card 
          className="text-center"
          style={{ 
            borderRadius: '12px',
            border: '2px dashed #ffbb96',
            background: 'rgba(255,255,255,0.7)',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: '#d4380d' }}>暂无行程安排</span>
            }
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              style={{ background: '#ff7a45', borderColor: '#ff7a45' }}
            >
              添加第一个行程
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="space-y-4">
          {dayGroups.map((group) => (
            <Card 
              key={group.day}
              className="overflow-hidden"
              style={{ 
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(255,122,69,0.15)',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div 
                style={{
                  background: 'linear-gradient(90deg, #ff7a45 0%, #ff9c6e 100%)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Badge 
                  count={group.day} 
                  style={{ 
                    backgroundColor: '#fff', 
                    color: '#ff7a45',
                    fontWeight: 'bold',
                    minWidth: '28px',
                  }} 
                />
                <span style={{ color: '#fff', fontWeight: 500, fontSize: '15px' }}>
                  第 {group.day} 天
                </span>
                <Tag 
                  style={{ 
                    background: 'rgba(255,255,255,0.25)', 
                    border: 'none',
                    color: '#fff',
                  }}
                >
                  {group.items.length} 个行程
                </Tag>
              </div>
              
              <div style={{ padding: '16px 20px', background: '#fff' }}>
                <Timeline
                  items={group.items.map((item) => ({
                    color: getActivityTypeColor(item.type),
                    icon: (
                      <div 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: getActivityTypeColor(item.type),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                        }}
                      >
                        {getActivityTypeIcon(item.type)}
                      </div>
                    ),
                    content: (
                      <div 
                        style={{
                          background: '#fafafa',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          marginLeft: '8px',
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Tag 
                              color={getActivityTypeColor(item.type)}
                              style={{ margin: 0 }}
                            >
                              {item.type}
                            </Tag>
                            <span style={{ fontWeight: 500, color: '#262626' }}>
                              {item.location || '未设置地点'}
                            </span>
                          </div>
                          <Space size="small">
                            <Button
                              size="small"
                              type="text"
                              icon={<EditOutlined style={{ color: '#ff7a45' }} />}
                              onClick={() => handleEditItem(item)}
                            />
                            <Popconfirm
                              title="确定删除这个行程项吗？"
                              onConfirm={() => handleDeleteItem(item.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>
                          </Space>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm" style={{ color: '#8c8c8c' }}>
                          {item.time && (
                            <span className="flex items-center gap-1">
                              <ClockCircleOutlined />
                              {item.time}
                            </span>
                          )}
                          {item.duration && (
                            <span className="flex items-center gap-1">
                              <HourglassOutlined />
                              {item.duration}
                            </span>
                          )}
                        </div>
                        
                        {item.description && (
                          <div 
                            style={{ 
                              marginTop: '8px', 
                              color: '#595959',
                              fontSize: '13px',
                              lineHeight: '1.6',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                        
                        {item.tips && (
                          <div 
                            style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              background: '#fffbe6',
                              borderRadius: '6px',
                              border: '1px solid #ffe58f',
                              fontSize: '12px',
                              color: '#d48806',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                            }}
                          >
                            <BulbOutlined style={{ marginTop: '2px' }} />
                            <span>{item.tips}</span>
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div 
          className="flex justify-end"
          style={{ 
            padding: '12px 0',
            borderTop: '1px solid rgba(255,122,69,0.2)',
          }}
        >
          <Button 
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAll}
            style={{ 
              background: 'linear-gradient(135deg, #ff7a45 0%, #ff9c6e 100%)',
              borderColor: '#ff7a45',
              boxShadow: '0 2px 8px rgba(255,122,69,0.3)',
            }}
          >
            保存全部行程
          </Button>
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined style={{ color: '#ff7a45' }} />
            <span>{editingItem?.id && items.find(i => i.id === editingItem.id) ? '编辑行程' : '添加行程'}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          setEditingItem(null)
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="第几天"
              name="day"
              rules={[{ required: true, message: '请选择天数' }]}
            >
              <Input type="number" min={1} placeholder="例如：1" />
            </Form.Item>

            <Form.Item
              label="活动类型"
              name="type"
              rules={[{ required: true, message: '请选择活动类型' }]}
            >
              <Input placeholder="例如：景点、餐饮、交通" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="时间"
              name="time"
            >
              <Input placeholder="例如：09:00" />
            </Form.Item>

            <Form.Item
              label="时长"
              name="duration"
            >
              <Input placeholder="例如：2小时" />
            </Form.Item>
          </div>

          <Form.Item
            label="地点"
            name="location"
            rules={[{ required: true, message: '请输入地点' }]}
          >
            <Input 
              prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入地点" 
            />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入行程描述，包括活动内容、路线等" 
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="提示"
            name="tips"
          >
            <TextArea 
              rows={2} 
              placeholder="请输入注意事项、小贴士等" 
              showCount
              maxLength={200}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => {
                setIsModalVisible(false)
                setEditingItem(null)
              }}
            >
              取消
            </Button>
            <Button 
              type="primary"
              onClick={handleSaveItem}
              style={{ 
                background: '#ff7a45',
                borderColor: '#ff7a45',
              }}
            >
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
