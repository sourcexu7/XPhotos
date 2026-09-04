'use client'

import React from 'react'
import {
  Form,
  Input,
  Select,
  Typography,
  Tag,
  Space,
  theme,
} from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import ModuleBase from './module-base'

const { TextArea } = Input
const { Text } = Typography

interface Tip {
  id: string
  title: string
  content: string
  type: 'warning' | 'info' | 'success' | 'weather' | 'emergency' | 'safety'
}

interface TipsModuleProps {
  value: Tip[]
  onChange: (data: Tip[]) => void
}

const tipTypes: {
  value: Tip['type']
  label: string
  color: string
}[] = [
  { value: 'info', label: '信息', color: 'blue' },
  { value: 'warning', label: '警告', color: 'gold' },
  { value: 'success', label: '成功', color: 'green' },
  { value: 'weather', label: '天气', color: 'cyan' },
  { value: 'emergency', label: '紧急', color: 'red' },
  { value: 'safety', label: '安全', color: 'volcano' },
]

const getTipType = (value: string) =>
  tipTypes.find((t) => t.value === value) || tipTypes[0]

export default function TipsModule({ value, onChange }: TipsModuleProps) {
  const { token } = theme.useToken()

  return (
    <ModuleBase
      title="特别提示"
      icon={<BulbOutlined />}
      records={(value || []) as any}
      onChange={(records) => onChange(records as Tip[])}
      modalWidth={600}
      getDefaultRecord={() =>
        ({
          id: Date.now().toString(),
          title: '',
          content: '',
          type: 'info' as const,
        }) as Tip
      }
      renderItem={(record) => {
        const item = record as Tip
        const typeMeta = getTipType(item.type)
        return (
          <div>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: token.marginXXS }}
            >
              <Space size={token.marginXS}>
                <Tag color={typeMeta.color}>{typeMeta.label}</Tag>
                <Text strong>{item.title}</Text>
              </Space>
            </div>
            {item.content && (
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  fontSize: token.fontSizeSM,
                  lineHeight: token.lineHeightSM,
                }}
              >
                {item.content}
              </Text>
            )}
          </div>
        )
      }}
      renderEditForm={() => (
        <>
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={4} placeholder="请输入内容" />
          </Form.Item>

          <Form.Item label="类型" name="type">
            <Select
              options={tipTypes.map((t) => ({ value: t.value, label: t.label }))}
              placeholder="请选择类型"
            />
          </Form.Item>
        </>
      )}
    />
  )
}
