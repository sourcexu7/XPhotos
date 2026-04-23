'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Input,
  InputNumber,
  Form,
  Popconfirm,
  Table,
  Tag,
  Divider,
  Statistic,
  Row,
  Col,
  App,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  TagOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  MoreOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const { TextArea } = Input

interface ExpenseItem {
  id: string
  name: string
  detail: string
  type: string
  channel: string
  unitPrice: number
  subtotal: number
  category: string
  notes: string
}

interface ExpenseModuleProps {
  value: ExpenseItem[]
  onChange: (data: ExpenseItem[]) => void
}

const categories = [
  { value: 'transport', label: '交通', icon: <CarOutlined />, color: 'blue' },
  { value: 'accommodation', label: '住宿', icon: <HomeOutlined />, color: 'green' },
  { value: 'food', label: '餐饮', icon: <CoffeeOutlined />, color: 'orange' },
  { value: 'ticket', label: '门票', icon: <TagOutlined />, color: 'purple' },
  { value: 'equipment', label: '设备', icon: <ToolOutlined />, color: 'cyan' },
  { value: 'shopping', label: '购物', icon: <ShoppingCartOutlined />, color: 'pink' },
  { value: 'other', label: '其他', icon: <MoreOutlined />, color: 'gray' },
]

const typeIcons: Record<string, string> = {
  '高铁': '🚅',
  '飞机': '✈️',
  '租车': '🚗',
  '门票': '🎫',
  '马场': '🐎',
  '卡丁车': '🏎️',
  '三蹦子': '🛺',
  '双床房': '🛏️',
  '榻榻米': '🛋️',
  '标准间': '🏠',
  '标准木屋': '🏡',
  '蒙古包': '⛺',
  '午饭': '🍱',
  '晚饭': '🍽️',
  '早饭': '🥐',
}

export default function ExpenseModule({ value, onChange }: ExpenseModuleProps) {
  const [items, setItems] = useState<ExpenseItem[]>(value || [])
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setItems(value)
    }
  }, [value])

  const handleAddItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      name: '',
      detail: '',
      type: '',
      channel: '',
      unitPrice: 0,
      subtotal: 0,
      category: 'other',
      notes: '',
    }
    setItems([...items, newItem])
    setEditingItem(newItem)
    form.setFieldsValue(newItem)
  }

  const handleEditItem = (item: ExpenseItem) => {
    setEditingItem(item)
    form.setFieldsValue(item)
  }

  const handleSaveItem = async () => {
    if (!editingItem) return
    
    try {
      const values = await form.validateFields()
      const subtotal = values.unitPrice
      const updatedItems = items.map((item) =>
        item.id === editingItem.id ? { ...item, ...values, subtotal } : item
      )
      setItems(updatedItems)
      setEditingItem(null)
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
  }

  const handleSaveAll = () => {
    onChange(items)
    message.success('保存成功')
  }

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category) || categories[6]
  }

  const totalExpense = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  }, [items])

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    items.forEach(item => {
      if (!stats[item.category]) stats[item.category] = 0
      stats[item.category] += item.subtotal || 0
    })
    return stats
  }, [items])

  const columns = [
    {
      title: '事项',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string, record: ExpenseItem) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcons[record.type] || '📌'}</span>
          <span className="font-medium">{text || '-'}</span>
        </div>
      ),
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      width: 180,
      render: (text: string) => <span className="text-gray-600">{text || '-'}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 80,
      render: (text: string) => <span className="text-gray-500">{text || '-'}</span>,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 80,
      align: 'right' as const,
      render: (value: number) => value ? `¥${value}` : '-',
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 80,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-bold text-red-500">¥{value || 0}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: ExpenseItem) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
          />
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDeleteItem(record.id)}
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
      ),
    },
  ]

  return (
    <div 
      className="expense-module-wrapper"
      style={{
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="flex items-center justify-center"
          style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          <DollarOutlined style={{ fontSize: '24px', color: '#fff' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold m-0" style={{ color: '#1e40af' }}>时间与花费</h2>
          <p className="text-sm m-0" style={{ color: '#64748b' }}>行程费用明细记录</p>
        </div>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card 
            size="small" 
            style={{ 
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#64748b' }}>总花费</span>}
              value={totalExpense}
              precision={2}
              prefix={<span style={{ color: '#ef4444' }}>¥</span>}
              styles={{ content: { color: '#ef4444', fontWeight: 'bold', fontSize: '24px' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            size="small" 
            style={{ 
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#64748b' }}>费用项数</span>}
              value={items.length}
              suffix="项"
              styles={{ content: { color: '#3b82f6', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            size="small" 
            style={{ 
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              border: 'none',
            }}
          >
            <Statistic
              title={<span style={{ color: '#64748b' }}>日均花费</span>}
              value={items.length > 0 ? (totalExpense / 8).toFixed(2) : 0}
              prefix="¥"
              styles={{ content: { color: '#10b981', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
      </Row>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Tag 
              key={cat.value}
              color={cat.color}
              style={{ 
                margin: 0,
                padding: '4px 12px',
                borderRadius: '16px',
              }}
            >
              {cat.icon} {cat.label}: ¥{categoryStats[cat.value]?.toFixed(2) || '0.00'}
            </Tag>
          ))}
        </div>
      </div>

      <Card 
        style={{ 
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div className="mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddItem}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            添加费用项
          </Button>
        </div>

        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无费用明细' }}
          style={{ borderRadius: '8px', overflow: 'hidden' }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  <span className="font-bold text-lg">合计</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span className="font-bold text-xl text-red-500">¥{totalExpense.toFixed(2)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <div className="mt-4 flex justify-end">
          <Button 
            type="primary" 
            onClick={handleSaveAll}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            保存所有费用
          </Button>
        </div>
      </Card>

      {editingItem && (
        <Card 
          title="编辑费用项"
          className="mt-4"
          style={{ 
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="事项名称"
                  name="name"
                  rules={[{ required: true, message: '请输入事项名称' }]}
                >
                  <Input placeholder="例如：南京-杭州高铁" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="详情" name="detail">
                  <Input placeholder="例如：G189 19:45-21:01" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="类型" name="type">
                  <Input placeholder="例如：高铁、飞机" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="渠道" name="channel">
                  <Input placeholder="例如：12306、携程" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="分类"
                  name="category"
                >
                  <select className="w-full p-2 border rounded-lg">
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="单价"
                  name="unitPrice"
                  rules={[{ required: true, message: '请输入单价' }]}
                >
                  <InputNumber 
                    placeholder="请输入单价" 
                    style={{ width: '100%' }} 
                    prefix="¥"
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="备注" name="notes">
                  <Input placeholder="备注信息" />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditingItem(null)}>
                取消
              </Button>
              <Button 
                type="primary" 
                onClick={handleSaveItem}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                }}
              >
                保存
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  )
}
