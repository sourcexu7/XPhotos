'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Button,
  List,
  Input,
  Select,
  Form,
  Modal,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

const { Option } = Select

interface TocItem {
  id: string
  guide_id: string
  title: string
  level: number
  target_id: string | null
  target_type: string | null
  sort: number
  is_hidden: boolean
}

interface Module {
  id: string
  name: string
  template: string | null
  sort: number
  is_hidden: boolean
}

interface TocManagerProps {
  guideId: string
  modules: Module[]
  activeModule: string | null
  onModuleSelect: (moduleId: string) => void
}

export default function TocManager({ guideId, modules, activeModule, onModuleSelect }: TocManagerProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingItem, setEditingItem] = useState<TocItem | null>(null)

  // 获取目录列表
  const fetchToc = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/guide-modules/toc/${guideId}`)
      const result = await res.json()
      if (result.data) {
        setTocItems(result.data)
      }
    } catch (error) {
      console.error('获取目录失败:', error)
    }
  }, [guideId])

  useEffect(() => {
    fetchToc()
  }, [fetchToc])

  const handleCreateToc = async () => {
    try {
      const values = await form.validateFields()
      
      const res = await fetch('/api/v1/guide-modules/toc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: guideId,
          title: values.title,
          level: values.level,
          target_id: values.targetId,
          target_type: 'module',
          is_hidden: values.isHidden,
        }),
      })
      
      if (res.ok) {
        message.success('目录项创建成功')
        setModalVisible(false)
        form.resetFields()
        setEditingItem(null)
        fetchToc()
      } else {
        message.error('目录项创建失败')
      }
    } catch (error) {
      message.error('目录项创建失败')
      console.error(error)
    }
  }

  const handleUpdateToc = async () => {
    if (!editingItem) return
    
    try {
      const values = await form.validateFields()
      
      const res = await fetch(`/api/v1/guide-modules/toc/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          level: values.level,
          target_id: values.targetId,
          target_type: 'module',
          is_hidden: values.isHidden,
        }),
      })
      
      if (res.ok) {
        message.success('目录项更新成功')
        setModalVisible(false)
        form.resetFields()
        setEditingItem(null)
        fetchToc()
      } else {
        message.error('目录项更新失败')
      }
    } catch (error) {
      message.error('目录项更新失败')
      console.error(error)
    }
  }

  const handleDeleteToc = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/guide-modules/toc/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        message.success('目录项删除成功')
        fetchToc()
      } else {
        message.error('目录项删除失败')
      }
    } catch (error) {
      message.error('目录项删除失败')
      console.error(error)
    }
  }

  const handleAutoGenerate = async () => {
    try {
      const res = await fetch('/api/v1/guide-modules/toc/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guide_id: guideId }),
      })
      if (res.ok) {
        message.success('目录自动生成成功')
        fetchToc()
      } else {
        message.error('目录自动生成失败')
      }
    } catch (error) {
      message.error('目录自动生成失败')
      console.error(error)
    }
  }

  const openModal = (item?: TocItem) => {
    if (item) {
      setEditingItem(item)
      form.setFieldsValue({
        title: item.title,
        level: item.level,
        targetId: item.target_id,
        isHidden: item.is_hidden,
      })
    } else {
      setEditingItem(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-4 space-y-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          className="w-full"
        >
          添加目录项
        </Button>
        <Button
          onClick={handleAutoGenerate}
          className="w-full"
        >
          自动生成目录
        </Button>
      </div>

      <Card title="目录结构">
        <List
          dataSource={tocItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openModal(item)}
                />,
                <Popconfirm
                  key="delete"
                  title="确定删除这个目录项吗？"
                  onConfirm={() => handleDeleteToc(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>,
              ]}
            >
              <div
                className={`pl-${(item.level - 1) * 4} cursor-pointer hover:text-blue-500`}
                onClick={() => item.target_id && onModuleSelect(item.target_id)}
              >
                {item.title}
              </div>
            </List.Item>
          )}
          locale={{ emptyText: '暂无目录项' }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑目录项' : '添加目录项'}
        open={modalVisible}
        onOk={editingItem ? handleUpdateToc : handleCreateToc}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="目录标题"
            name="title"
            rules={[{ required: true, message: '请输入目录标题' }]}
          >
            <Input placeholder="请输入目录标题" />
          </Form.Item>

          <Form.Item
            label="级别"
            name="level"
          >
            <Select defaultValue={1}>
              <Option value={1}>一级目录</Option>
              <Option value={2}>二级目录</Option>
              <Option value={3}>三级目录</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="关联模块"
            name="targetId"
          >
            <Select placeholder="选择关联模块">
              {modules.map((module) => (
                <Option key={module.id} value={module.id}>
                  {module.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="是否隐藏"
            name="isHidden"
            valuePropName="checked"
          >
            <input type="checkbox" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" onClick={editingItem ? handleUpdateToc : handleCreateToc}>
              {editingItem ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}