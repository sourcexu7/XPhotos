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

export default function TipsModule({ value, onChange }: TipsModuleProps) {
  const [tips, setTips] = useState<Tip[]>(value || [])
  const [editingTip, setEditingTip] = useState<Tip | null>(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setTips(value)
    }
  }, [value])

  const tipTypes = [
    { value: 'info', label: '信息' },
    { value: 'warning', label: '警告' },
    { value: 'success', label: '成功' },
    { value: 'weather', label: '天气' },
    { value: 'emergency', label: '紧急' },
    { value: 'safety', label: '安全' },
  ]

  const handleAddTip = () => {
    const newTip: Tip = {
      id: Date.now().toString(),
      title: '新提示',
      content: '',
      type: 'info',
    }
    setTips([...tips, newTip])
  }

  const handleEditTip = (tip: Tip) => {
    setEditingTip(tip)
    form.setFieldsValue(tip)
  }

  const handleSaveTip = async () => {
    if (!editingTip) return
    
    try {
      const values = await form.validateFields()
      const updatedTips = tips.map((tip) =>
        tip.id === editingTip.id ? { ...tip, ...values } : tip
      )
      setTips(updatedTips)
      setEditingTip(null)
      onChange(updatedTips)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDeleteTip = (id: string) => {
    const updatedTips = tips.filter((tip) => tip.id !== id)
    setTips(updatedTips)
    onChange(updatedTips)
  }

  const handleSaveAll = () => {
    onChange(tips)
    message.success('保存成功')
  }

  const getTipColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'yellow'
      case 'info':
        return 'blue'
      case 'success':
        return 'green'
      case 'weather':
        return 'cyan'
      case 'emergency':
        return 'pink'
      case 'safety':
        return 'red'
      default:
        return 'blue'
    }
  }

  return (
    <div className="space-y-4">
      <Card title="特别提示" className="mb-4">
        <div className="mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTip}
          >
            添加提示
          </Button>
        </div>

        {tips.length === 0 ? (
          <div className="text-center py-4">
            暂无提示
          </div>
        ) : (
          <ul className="space-y-3">
            {tips.map((tip) => (
              <li key={tip.id} className={`p-3 border border-l-4 border-${getTipColor(tip.type)}-500 rounded-lg`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1">
                    <div className="font-medium mb-2">{tip.title}</div>
                    <div className="text-sm">{tip.content}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditTip(tip)}
                    />
                    <Popconfirm
                      title="确定删除这个提示吗？"
                      onConfirm={() => handleDeleteTip(tip.id)}
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
            保存所有提示
          </Button>
        </div>
      </Card>

      {editingTip && (
        <Card title="编辑提示">
          <Form form={form} layout="vertical">
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

            <Form.Item
              label="类型"
              name="type"
            >
              <select className="w-full p-2 border rounded">
                {tipTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditingTip(null)}>
                取消
              </Button>
              <Button type="primary" onClick={handleSaveTip}>
                保存
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  )
}
