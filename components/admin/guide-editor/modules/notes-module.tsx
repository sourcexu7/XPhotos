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
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import ModuleBase, { ModuleRecord, FormGrid, MODAL_WIDTH, createRecordId } from './module-base'

const { TextArea } = Input
const { Text } = Typography

interface NoteItem extends ModuleRecord {
  priority?: string
  category?: string
  title?: string
  content?: string
}

interface NotesModuleProps {
  value: NoteItem[]
  onChange: (data: NoteItem[]) => void
}

const priorityConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  high: { label: '重要', color: 'red', icon: <ExclamationCircleOutlined /> },
  medium: { label: '注意', color: 'orange', icon: <WarningOutlined /> },
  low: { label: '提示', color: 'blue', icon: <InfoCircleOutlined /> },
  success: { label: '确认', color: 'green', icon: <CheckCircleOutlined /> },
}

const priorityOptions = Object.entries(priorityConfig).map(([k, v]) => ({
  value: k,
  label: v.label,
}))

const getPriorityConfig = (priority?: string) =>
  priorityConfig[priority || 'medium'] || priorityConfig.medium

export default function NotesModule({ value, onChange }: NotesModuleProps) {
  const { token } = theme.useToken()

  const renderItem = (record: ModuleRecord) => {
    const item = record as NoteItem
    const config = getPriorityConfig(item.priority)
    return (
      <div>
        <Space size={token.paddingXS} align="center" wrap>
          <span style={{ color: token.colorPrimary }}>{config.icon}</span>
          <Text strong>{item.title || '未命名要点'}</Text>
          <Tag color={config.color}>{config.label}</Tag>
          {item.category && <Tag>{item.category}</Tag>}
        </Space>
        {item.content && (
          <div
            style={{
              marginTop: token.marginXXS,
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
            }}
          >
            {item.content}
          </div>
        )}
      </div>
    )
  }

  const renderEditForm = () => (
    <>
      <FormGrid>
        <Form.Item
          label="标题"
          name="title"
          rules={[{ required: true, message: '请输入要点标题' }]}
        >
          <Input placeholder="请输入要点标题" />
        </Form.Item>
        <Form.Item label="优先级" name="priority">
          <Select options={priorityOptions} placeholder="选择优先级" />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Input placeholder="例如：签证/安全/交通" />
        </Form.Item>
      </FormGrid>
      <Form.Item label="内容" name="content">
        <TextArea rows={4} placeholder="请输入详细内容" showCount maxLength={500} />
      </Form.Item>
    </>
  )

  return (
    <ModuleBase
      title="注意事项"
      icon={<InfoCircleOutlined />}
      records={(value || []) as ModuleRecord[]}
      onChange={(records) => onChange(records as NoteItem[])}
      modalWidth={MODAL_WIDTH.M}
      addButtonText="添加要点"
      getDefaultRecord={() =>
        ({ id: createRecordId(), priority: 'medium' } as NoteItem)
      }
      renderItem={renderItem}
      renderEditForm={renderEditForm}
    />
  )
}
