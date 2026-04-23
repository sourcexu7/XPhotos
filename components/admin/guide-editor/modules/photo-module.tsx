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
  App,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

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

export default function PhotoModule({ value, onChange }: PhotoModuleProps) {
  const [spots, setSpots] = useState<PhotoSpot[]>(value || [])
  const [editingSpot, setEditingSpot] = useState<PhotoSpot | null>(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setSpots(value)
    }
  }, [value])

  const dronePolicies = [
    { value: 'allowed', label: '可飞' },
    { value: 'forbidden', label: '禁飞' },
    { value: 'register', label: '需登记' },
  ]

  const handleAddSpot = () => {
    const newSpot: PhotoSpot = {
      id: Date.now().toString(),
      name: '新机位',
      focalLength: '',
      bestTime: '',
      dronePolicy: 'allowed',
      notes: '',
    }
    setSpots([...spots, newSpot])
  }

  const handleEditSpot = (spot: PhotoSpot) => {
    setEditingSpot(spot)
    form.setFieldsValue(spot)
  }

  const handleSaveSpot = async () => {
    if (!editingSpot) return
    
    try {
      const values = await form.validateFields()
      const updatedSpots = spots.map((spot) =>
        spot.id === editingSpot.id ? { ...spot, ...values } : spot
      )
      setSpots(updatedSpots)
      setEditingSpot(null)
      onChange(updatedSpots)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDeleteSpot = (id: string) => {
    const updatedSpots = spots.filter((spot) => spot.id !== id)
    setSpots(updatedSpots)
    onChange(updatedSpots)
  }

  const handleSaveAll = () => {
    onChange(spots)
    message.success('保存成功')
  }

  const getTipColor = (type: string) => {
    switch (type) {
      case 'allowed':
        return 'green'
      case 'forbidden':
        return 'red'
      case 'register':
        return 'orange'
      default:
        return 'blue'
    }
  }

  return (
    <div className="space-y-4">
      <Card title="摄影攻略" className="mb-4">
        <div className="mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSpot}
          >
            添加摄影机位
          </Button>
        </div>

        {spots.length === 0 ? (
          <div className="text-center py-4">
            暂无摄影机位
          </div>
        ) : (
          <ul className="space-y-3">
            {spots.map((spot) => (
              <li key={spot.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1">
                    <div className="font-medium mb-2">{spot.name}</div>
                    <div className="text-sm text-gray-500 mb-2">
                      {spot.focalLength} · {spot.bestTime}
                    </div>
                    {spot.notes && (
                      <div className="text-sm">{spot.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium text-${getTipColor(spot.dronePolicy)}-600 bg-${getTipColor(spot.dronePolicy)}-100`}>
                      {dronePolicies.find(p => p.value === spot.dronePolicy)?.label}
                    </div>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditSpot(spot)}
                    />
                    <Popconfirm
                      title="确定删除这个机位吗？"
                      onConfirm={() => handleDeleteSpot(spot.id)}
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
            保存所有机位
          </Button>
        </div>
      </Card>

      {editingSpot && (
        <Card title="编辑摄影机位">
          <Form form={form} layout="vertical">
            <Form.Item
              label="机位名称"
              name="name"
              rules={[{ required: true, message: '请输入机位名称' }]}
            >
              <Input placeholder="请输入机位名称" />
            </Form.Item>

            <Form.Item
              label="焦距"
              name="focalLength"
            >
              <Input placeholder="例如：16-35mm" />
            </Form.Item>

            <Form.Item
              label="最佳时间"
              name="bestTime"
            >
              <Input placeholder="例如：日出、黄昏" />
            </Form.Item>

            <Form.Item
              label="无人机政策"
              name="dronePolicy"
            >
              <select className="w-full p-2 border rounded">
                {dronePolicies.map((policy) => (
                  <option key={policy.value} value={policy.value}>
                    {policy.label}
                  </option>
                ))}
              </select>
            </Form.Item>

            <Form.Item
              label="备注"
              name="notes"
            >
              <TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditingSpot(null)}>
                取消
              </Button>
              <Button type="primary" onClick={handleSaveSpot}>
                保存
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  )
}
