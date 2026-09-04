'use client'

import React from 'react'
import {
  Input,
  Form,
  Select,
  Typography,
  Rate,
  Tag,
  Space,
  theme,
} from 'antd'
import {
  LikeOutlined,
  DislikeOutlined,
  CommentOutlined,
} from '@ant-design/icons'
import ModuleBase from './module-base'

const { TextArea } = Input
const { Text, Paragraph } = Typography

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

interface ReviewModuleProps {
  value: ReviewItem[]
  onChange: (data: ReviewItem[]) => void
}

const visitTypeOptions = [
  { value: 'solo', label: '独自出行' },
  { value: 'couple', label: '情侣出行' },
  { value: 'family', label: '家庭出行' },
  { value: 'group', label: '团队出行' },
  { value: 'business', label: '商务出行' },
]

export default function ReviewModule({ value, onChange }: ReviewModuleProps) {
  const { token } = theme.useToken()

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return token.colorSuccess
    if (rating >= 3.5) return token.colorWarning
    return token.colorError
  }

  const getVisitTypeLabel = (type?: string) =>
    visitTypeOptions.find((o) => o.value === type)?.label || type || ''

  return (
    <ModuleBase
      title="景点点评"
      icon={<CommentOutlined />}
      records={value || []}
      onChange={onChange}
      modalWidth={640}
      getDefaultRecord={() => ({
        id: Date.now().toString(),
        rating: 5,
      })}
      renderItem={(item: ReviewItem) => (
        <div>
          <Space size={token.paddingSM} align="center" wrap>
            <Text strong style={{ fontSize: token.fontSizeLG }}>
              {item.attractionName || '未命名景点'}
            </Text>
            <Rate disabled value={item.rating || 0} style={{ fontSize: 14 }} />
            <Text style={{ color: getRatingColor(item.rating || 0), fontWeight: 600 }}>
              {item.rating ? `${item.rating}.0` : '未评分'}
            </Text>
          </Space>
          {item.content && (
            <Paragraph
              style={{
                color: token.colorTextSecondary,
                marginBottom: token.paddingXS,
                marginTop: token.paddingXS,
              }}
            >
              {item.content}
            </Paragraph>
          )}
          <Space size={token.paddingLG} wrap style={{ fontSize: token.fontSizeSM }}>
            {item.pros && (
              <Text style={{ color: token.colorSuccess }}>
                <LikeOutlined /> {item.pros}
              </Text>
            )}
            {item.cons && (
              <Text style={{ color: token.colorError }}>
                <DislikeOutlined /> {item.cons}
              </Text>
            )}
          </Space>
          <Space
            size={token.paddingLG}
            wrap
            style={{
              marginTop: token.paddingXS,
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
            }}
          >
            {item.author && <span>{item.author}</span>}
            {item.date && <span>{item.date}</span>}
            {item.visitType && <Tag>{getVisitTypeLabel(item.visitType)}</Tag>}
          </Space>
        </div>
      )}
      renderEditForm={() => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: token.paddingMD }}>
            <Form.Item label="景点名称" name="attractionName">
              <Input placeholder="例如：故宫" />
            </Form.Item>
            <Form.Item label="评分" name="rating">
              <Rate />
            </Form.Item>
            <Form.Item label="出行类型" name="visitType">
              <Select options={visitTypeOptions} placeholder="选择出行类型" />
            </Form.Item>
            <Form.Item label="作者" name="author">
              <Input placeholder="点评人昵称" />
            </Form.Item>
            <Form.Item label="日期" name="date">
              <Input placeholder="例如：2024-01-15" />
            </Form.Item>
          </div>
          <Form.Item label="点评内容" name="content">
            <TextArea rows={4} placeholder="请输入点评内容" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.paddingMD }}>
            <Form.Item label="优点" name="pros">
              <TextArea rows={2} placeholder="景点优点" />
            </Form.Item>
            <Form.Item label="缺点" name="cons">
              <TextArea rows={2} placeholder="景点不足之处" />
            </Form.Item>
          </div>
        </>
      )}
    />
  )
}
