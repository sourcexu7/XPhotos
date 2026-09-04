'use client'

import React from 'react'
import {
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  theme,
} from 'antd'
import { CameraOutlined } from '@ant-design/icons'
import ModuleBase from './module-base'

const { TextArea } = Input
const { Text } = Typography

interface PhotoSpot {
  id: string
  name: string
  focalLength: string
  bestTime: string
  dronePolicy: 'allowed' | 'forbidden' | 'register'
  notes: string
}

interface PhotoModuleProps {
  value: PhotoSpot[]
  onChange: (data: PhotoSpot[]) => void
}

const dronePolicies: {
  value: PhotoSpot['dronePolicy']
  label: string
  color: string
}[] = [
  { value: 'allowed', label: '可飞', color: 'green' },
  { value: 'forbidden', label: '禁飞', color: 'red' },
  { value: 'register', label: '需登记', color: 'orange' },
]

const getDronePolicy = (value: string) =>
  dronePolicies.find((p) => p.value === value) || dronePolicies[0]

export default function PhotoModule({ value, onChange }: PhotoModuleProps) {
  const { token } = theme.useToken()

  return (
    <ModuleBase
      title="摄影攻略"
      icon={<CameraOutlined />}
      records={(value || []) as any}
      onChange={(records) => onChange(records as PhotoSpot[])}
      modalWidth={600}
      getDefaultRecord={() =>
        ({
          id: Date.now().toString(),
          name: '',
          focalLength: '',
          bestTime: '',
          dronePolicy: 'allowed' as const,
          notes: '',
        }) as PhotoSpot
      }
      renderItem={(record) => {
        const item = record as PhotoSpot
        const policy = getDronePolicy(item.dronePolicy)
        return (
          <div>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: token.marginXXS }}
            >
              <Text strong>{item.name || '未命名机位'}</Text>
              <Tag color={policy.color}>{policy.label}</Tag>
            </div>
            {(item.focalLength || item.bestTime) && (
              <Space size={token.marginXS} wrap style={{ marginBottom: token.marginXXS }}>
                {item.focalLength && <Tag>{item.focalLength}</Tag>}
                {item.bestTime && <Tag color="orange">{item.bestTime}</Tag>}
              </Space>
            )}
            {item.notes && (
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  fontSize: token.fontSizeSM,
                  lineHeight: token.lineHeightSM,
                }}
              >
                {item.notes}
              </Text>
            )}
          </div>
        )
      }}
      renderEditForm={() => (
        <>
          <Form.Item
            label="机位名称"
            name="name"
            rules={[{ required: true, message: '请输入机位名称' }]}
          >
            <Input placeholder="请输入机位名称" />
          </Form.Item>

          <Form.Item label="焦距" name="focalLength">
            <Input placeholder="例如：16-35mm" />
          </Form.Item>

          <Form.Item label="最佳时间" name="bestTime">
            <Input placeholder="例如：日出、黄昏" />
          </Form.Item>

          <Form.Item label="无人机政策" name="dronePolicy">
            <Select
              options={dronePolicies.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="请选择无人机政策"
            />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </>
      )}
    />
  )
}
