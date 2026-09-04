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
  DollarOutlined,
  CarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  TagOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import ModuleBase from './module-base'

const { Text } = Typography

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
  { value: 'shopping', label: '购物', icon: <ShoppingCartOutlined />, color: 'magenta' },
  { value: 'other', label: '其他', icon: <MoreOutlined />, color: 'default' },
]

export default function ExpenseModule({ value, onChange }: ExpenseModuleProps) {
  const { token } = theme.useToken()

  const getCategory = (categoryValue: string) =>
    categories.find((c) => c.value === categoryValue) || categories[categories.length - 1]

  const renderItem = (record: ExpenseItem) => {
    const cat = getCategory(record.category)
    return (
      <div>
        <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
          <Text strong>{record.name || '未命名事项'}</Text>
          <Tag color={cat.color} style={{ margin: 0 }}>
            {cat.icon} {cat.label}
          </Tag>
          {record.type && <Tag style={{ margin: 0 }}>{record.type}</Tag>}
        </div>

        {record.detail && (
          <div
            style={{
              color: token.colorTextSecondary,
              fontSize: token.fontSizeSM,
              marginBottom: token.marginXXS,
            }}
          >
            {record.detail}
          </div>
        )}

        <Space
          size="middle"
          style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM, flexWrap: 'wrap' }}
        >
          {record.channel && <span>渠道：{record.channel}</span>}
          {record.unitPrice !== undefined && record.unitPrice !== null && (
            <span>单价：¥{record.unitPrice}</span>
          )}
        </Space>

        <div style={{ marginTop: token.marginXS }}>
          <Text strong style={{ color: token.colorError }}>
            {`小计：¥${record.subtotal || 0}`}
          </Text>
        </div>

        {record.notes && (
          <div
            style={{
              marginTop: token.marginXXS,
              color: token.colorTextTertiary,
              fontSize: token.fontSizeSM,
            }}
          >
            {`备注：${record.notes}`}
          </div>
        )}
      </div>
    )
  }

  const renderEditForm = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="事项名称"
          name="name"
          rules={[{ required: true, message: '请输入事项名称' }]}
        >
          <Input placeholder="例如：南京-杭州高铁" />
        </Form.Item>
        <Form.Item label="详情" name="detail">
          <Input placeholder="例如：G189 19:45-21:01" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Form.Item label="类型" name="type">
          <Input placeholder="例如：高铁、飞机" />
        </Form.Item>
        <Form.Item label="渠道" name="channel">
          <Input placeholder="例如：12306、携程" />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Select
            options={categories.map((c) => ({ value: c.value, label: c.label }))}
            placeholder="请选择分类"
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            min={0}
          />
        </Form.Item>
        <Form.Item label="小计" name="subtotal">
          <InputNumber
            placeholder="请输入小计"
            style={{ width: '100%' }}
            prefix="¥"
            precision={2}
            min={0}
          />
        </Form.Item>
      </div>

      <Form.Item label="备注" name="notes">
        <Input placeholder="备注信息" />
      </Form.Item>
    </>
  )

  return (
    <ModuleBase
      title="时间与花费"
      icon={<DollarOutlined />}
      records={(value || []) as any}
      onChange={onChange as any}
      modalWidth={640}
      getDefaultRecord={() => ({
        id: Date.now().toString(),
        name: '',
        detail: '',
        type: '',
        channel: '',
        unitPrice: 0,
        subtotal: 0,
        category: 'other',
        notes: '',
      })}
      renderItem={renderItem as any}
      renderEditForm={renderEditForm}
    />
  )
}
