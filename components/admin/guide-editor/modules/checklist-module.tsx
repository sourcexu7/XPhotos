'use client'

import React, { useState } from 'react'
import {
  Form,
  Input,
  Modal,
  Button,
  Popconfirm,
  Typography,
  Tag,
  Space,
  Checkbox,
  App,
  theme,
} from 'antd'
import {
  CheckCircleOutlined,
  CheckCircleFilled,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import ModuleBase from './module-base'

const { Text } = Typography

interface ChecklistItem {
  id: string
  name: string
  checked: boolean
}

interface ChecklistCategory {
  id: string
  name: string
  icon: string
  items: ChecklistItem[]
}

interface ChecklistModuleProps {
  value: ChecklistCategory[]
  onChange: (data: ChecklistCategory[]) => void
}

export default function ChecklistModule({ value, onChange }: ChecklistModuleProps) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: ChecklistItem } | null>(null)
  const [itemForm] = Form.useForm()

  const records = value || []

  const updateCategoryItems = (categoryId: string, items: ChecklistItem[]) => {
    const updated = records.map((c) => (c.id === categoryId ? { ...c, items } : c))
    onChange(updated)
  }

  const handleAddItem = (categoryId: string) => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      name: '',
      checked: false,
    }
    setEditingItem({ categoryId, item: newItem })
    itemForm.setFieldsValue(newItem)
    setItemModalOpen(true)
  }

  const handleEditItem = (categoryId: string, item: ChecklistItem) => {
    setEditingItem({ categoryId, item })
    itemForm.setFieldsValue(item)
    setItemModalOpen(true)
  }

  const handleSaveItem = async () => {
    if (!editingItem) return
    try {
      const values = await itemForm.validateFields()
      const { categoryId, item } = editingItem
      const category = records.find((c) => c.id === categoryId)
      if (!category) return
      const exists = category.items.find((i) => i.id === item.id)
      const updatedItems = exists
        ? category.items.map((i) => (i.id === item.id ? { ...i, ...values } : i))
        : [...category.items, { ...item, ...values }]
      updateCategoryItems(categoryId, updatedItems)
      setItemModalOpen(false)
      setEditingItem(null)
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    }
  }

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const category = records.find((c) => c.id === categoryId)
    if (!category) return
    updateCategoryItems(categoryId, category.items.filter((i) => i.id !== itemId))
  }

  const handleToggleItem = (categoryId: string, itemId: string) => {
    const category = records.find((c) => c.id === categoryId)
    if (!category) return
    updateCategoryItems(
      categoryId,
      category.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i))
    )
  }

  const renderItem = (record: ChecklistCategory) => {
    const total = record.items.length
    const checked = record.items.filter((i) => i.checked).length
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UnorderedListOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{record.name}</Text>
            <Tag color="green" style={{ margin: 0 }}>{`${checked}/${total}`}</Tag>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            height: 4,
            background: token.colorFillSecondary,
            borderRadius: token.borderRadiusSM,
            overflow: 'hidden',
            marginBottom: token.marginSM,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: progress === 100 ? token.colorSuccess : token.colorWarning,
              transition: `width ${token.motionDurationMid}`,
            }}
          />
        </div>

        <div>
          {record.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between"
              style={{
                padding: `${token.paddingXS}px 0`,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div
                className="flex items-center gap-2 flex-1"
                style={{ cursor: 'pointer', minWidth: 0 }}
                onClick={() => handleToggleItem(record.id, item.id)}
              >
                {item.checked ? (
                  <CheckCircleFilled style={{ color: token.colorSuccess, flexShrink: 0 }} />
                ) : (
                  <CheckCircleOutlined style={{ color: token.colorTextQuaternary, flexShrink: 0 }} />
                )}
                <Text
                  delete={item.checked}
                  type={item.checked ? 'secondary' : undefined}
                  style={{ wordBreak: 'break-word' }}
                >
                  {item.name}
                </Text>
              </div>
              <Space size="small" style={{ flexShrink: 0, marginLeft: token.marginXS }}>
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditItem(record.id, item)}
                />
                <Popconfirm
                  title="确定删除吗？"
                  onConfirm={() => handleDeleteItem(record.id, item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
          ))}
          {record.items.length === 0 && (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              暂无项
            </Text>
          )}
        </div>

        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => handleAddItem(record.id)}
          style={{ marginTop: token.marginSM }}
        >
          添加项
        </Button>
      </div>
    )
  }

  const renderEditForm = () => (
    <>
      <Form.Item
        label="分类名称"
        name="name"
        rules={[{ required: true, message: '请输入分类名称' }]}
      >
        <Input placeholder="请输入分类名称" />
      </Form.Item>
      <Form.Item label="图标" name="icon">
        <Input placeholder="可选，输入图标符号" />
      </Form.Item>
    </>
  )

  return (
    <>
      <ModuleBase
        title="准备工作"
        icon={<CheckCircleOutlined />}
        records={records as any}
        onChange={onChange as any}
        modalWidth={480}
        addButtonText="添加分类"
        getDefaultRecord={() => ({
          id: Date.now().toString(),
          name: '新分类',
          icon: '',
          items: [],
        })}
        renderItem={renderItem as any}
        renderEditForm={renderEditForm}
      />
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined style={{ color: token.colorPrimary }} />
            <span>{editingItem?.item && records.some((c) => c.items.some((i) => i.id === editingItem.item.id)) ? '编辑项' : '添加项'}</span>
          </div>
        }
        open={itemModalOpen}
        onOk={handleSaveItem}
        onCancel={() => {
          setItemModalOpen(false)
          setEditingItem(null)
        }}
        okText="保存"
        cancelText="取消"
        width={400}
        destroyOnHidden
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item
            label="项名称"
            name="name"
            rules={[{ required: true, message: '请输入项名称' }]}
          >
            <Input placeholder="请输入项名称" />
          </Form.Item>
          <Form.Item label="是否已准备" name="checked" valuePropName="checked">
            <Checkbox>已准备</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
