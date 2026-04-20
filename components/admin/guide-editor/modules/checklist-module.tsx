'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Input,
  Form,
  List,
  Popconfirm,
  message,
  Tag,
  Row,
  Col,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  ShopOutlined,
  SkinOutlined,
  CameraOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'

const { TextArea } = Input

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

const categoryIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  '衣物准备': { icon: <SkinOutlined />, color: '#ec4899' },
  '日常用品': { icon: <ShopOutlined />, color: '#f59e0b' },
  '摄影设备': { icon: <CameraOutlined />, color: '#8b5cf6' },
  '导航': { icon: <EnvironmentOutlined />, color: '#10b981' },
}

export default function ChecklistModule({ value, onChange }: ChecklistModuleProps) {
  const [categories, setCategories] = useState<ChecklistCategory[]>(value || [])
  const [editingCategory, setEditingCategory] = useState<ChecklistCategory | null>(null)
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: ChecklistItem } | null>(null)
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false)
  const [isItemModalVisible, setIsItemModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (value && value.length > 0) {
      setCategories(value)
    }
  }, [value])

  const handleAddCategory = () => {
    const newCategory: ChecklistCategory = {
      id: Date.now().toString(),
      name: '新分类',
      icon: '📋',
      items: [],
    }
    setCategories([...categories, newCategory])
    setEditingCategory(newCategory)
    form.setFieldsValue({ name: newCategory.name, icon: newCategory.icon })
    setIsCategoryModalVisible(true)
  }

  const handleAddItem = (categoryId: string) => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      name: '新项',
      checked: false,
    }
    const updatedCategories = categories.map((category) =>
      category.id === categoryId
        ? { ...category, items: [...category.items, newItem] }
        : category
    )
    setCategories(updatedCategories)
    setEditingItem({ categoryId, item: newItem })
    form.setFieldsValue(newItem)
    setIsItemModalVisible(true)
  }

  const handleEditCategory = (category: ChecklistCategory) => {
    setEditingCategory(category)
    form.setFieldsValue({ name: category.name, icon: category.icon })
    setIsCategoryModalVisible(true)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory) return
    
    try {
      const values = await form.validateFields()
      const updatedCategories = categories.map((category) =>
        category.id === editingCategory.id
          ? { ...category, name: values.name, icon: values.icon }
          : category
      )
      setCategories(updatedCategories)
      setEditingCategory(null)
      setIsCategoryModalVisible(false)
      onChange(updatedCategories)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleEditItem = (categoryId: string, item: ChecklistItem) => {
    setEditingItem({ categoryId, item })
    form.setFieldsValue(item)
    setIsItemModalVisible(true)
  }

  const handleSaveItem = async () => {
    if (!editingItem) return
    
    try {
      const values = await form.validateFields()
      const updatedCategories = categories.map((category) =>
        category.id === editingItem.categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === editingItem.item.id ? { ...item, ...values } : item
              ),
            }
          : category
      )
      setCategories(updatedCategories)
      setEditingItem(null)
      setIsItemModalVisible(false)
      onChange(updatedCategories)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDeleteCategory = (id: string) => {
    const updatedCategories = categories.filter((category) => category.id !== id)
    setCategories(updatedCategories)
    onChange(updatedCategories)
    message.success('删除成功')
  }

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const updatedCategories = categories.map((category) =>
      category.id === categoryId
        ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
        : category
    )
    setCategories(updatedCategories)
    onChange(updatedCategories)
    message.success('删除成功')
  }

  const handleToggleItem = (categoryId: string, itemId: string) => {
    const updatedCategories = categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          }
        : category
    )
    setCategories(updatedCategories)
    onChange(updatedCategories)
  }

  const handleSaveAll = () => {
    onChange(categories)
    message.success('保存成功')
  }

  const totalStats = useMemo(() => {
    let total = 0
    let checked = 0
    categories.forEach(cat => {
      total += cat.items.length
      checked += cat.items.filter(item => item.checked).length
    })
    return { total, checked, progress: total > 0 ? Math.round((checked / total) * 100) : 0 }
  }, [categories])

  return (
    <div 
      className="checklist-module-wrapper"
      style={{
        background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <div 
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '16px 20px',
          marginBottom: '16px',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              <CheckCircleOutlined style={{ fontSize: '20px', color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>
                准备工作
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                出行前准备清单 · {totalStats.checked}/{totalStats.total} 已完成
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCategory}
            style={{ 
              background: 'rgba(255,255,255,0.25)', 
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
            }}
          >
            添加分类
          </Button>
        </div>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card 
            size="small" 
            style={{ 
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              border: 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: '#64748b' }}>分类数量</div>
                <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
                  {categories.length}
                </div>
              </div>
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '50%',
                }}
              >
                <span style={{ fontSize: '24px' }}>📋</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {categories.length === 0 ? (
        <Card 
          className="text-center"
          style={{ 
            borderRadius: '12px',
            border: '2px dashed #86efac',
            background: 'rgba(255,255,255,0.7)',
          }}
        >
          <div className="py-4">
            <span style={{ fontSize: '48px' }}>📝</span>
            <p style={{ color: '#166534', marginTop: '12px' }}>暂无准备清单</p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddCategory}
              style={{ background: '#10b981', borderColor: '#10b981', marginTop: '12px' }}
            >
              添加第一个分类
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const total = category.items.length
            const checked = category.items.filter((item) => item.checked).length
            const progress = total > 0 ? Math.round((checked / total) * 100) : 0

            return (
              <Card 
                key={category.id} 
                size="small"
                style={{ 
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon || '📋'}</span>
                    <span className="font-bold text-lg">{category.name}</span>
                    <Tag color="green">{checked}/{total}</Tag>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined style={{ color: '#10b981' }} />}
                      onClick={() => handleEditCategory(category)}
                    />
                    <Popconfirm
                      title="确定删除这个分类吗？"
                      onConfirm={() => handleDeleteCategory(category.id)}
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
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full transition-all duration-300" 
                    style={{ 
                      width: `${progress}%`,
                      background: progress === 100 
                        ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    }} 
                  />
                </div>

                <List
                  dataSource={category.items}
                  renderItem={(item) => (
                    <List.Item
                      style={{ 
                        padding: '8px 0',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                      actions={[
                        <Button
                          key="edit"
                          size="small"
                          type="text"
                          icon={<EditOutlined style={{ color: '#10b981' }} />}
                          onClick={() => handleEditItem(category.id, item)}
                        />,
                        <Popconfirm
                          key="delete"
                          title="确定删除吗？"
                          onConfirm={() => handleDeleteItem(category.id, item.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          onClick={() => handleToggleItem(category.id, item.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.checked ? (
                            <CheckCircleFilled style={{ fontSize: '20px', color: '#10b981' }} />
                          ) : (
                            <CheckCircleOutlined style={{ fontSize: '20px', color: '#d1d5db' }} />
                          )}
                        </div>
                        <div className={item.checked ? 'line-through text-gray-400' : ''}>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无项' }}
                />

                <div className="mt-3">
                  <Button
                    size="small"
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddItem(category.id)}
                    style={{ borderRadius: '8px', borderColor: '#10b981', color: '#10b981' }}
                  >
                    添加项
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {categories.length > 0 && (
        <div 
          className="mt-4 flex justify-end"
          style={{ 
            padding: '12px 0',
            borderTop: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <Button 
            type="primary" 
            onClick={handleSaveAll}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            }}
          >
            保存所有清单
          </Button>
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined style={{ color: '#10b981' }} />
            <span>{editingCategory?.id && categories.find(c => c.id === editingCategory.id) ? '编辑分类' : '添加分类'}</span>
          </div>
        }
        open={isCategoryModalVisible}
        onCancel={() => {
          setIsCategoryModalVisible(false)
          setEditingCategory(null)
        }}
        footer={null}
        width={400}
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            label="图标"
            name="icon"
          >
            <Input placeholder="例如：👚、🛂、📷" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setIsCategoryModalVisible(false)
              setEditingCategory(null)
            }}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSaveCategory}
              style={{
                background: '#10b981',
                borderColor: '#10b981',
              }}
            >
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined style={{ color: '#10b981' }} />
            <span>{editingItem?.item.id ? '编辑项' : '添加项'}</span>
          </div>
        }
        open={isItemModalVisible}
        onCancel={() => {
          setIsItemModalVisible(false)
          setEditingItem(null)
        }}
        footer={null}
        width={400}
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            label="项名称"
            name="name"
            rules={[{ required: true, message: '请输入项名称' }]}
          >
            <Input placeholder="请输入项名称" />
          </Form.Item>

          <Form.Item
            label="是否已准备"
            name="checked"
            valuePropName="checked"
          >
            <input type="checkbox" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setIsItemModalVisible(false)
              setEditingItem(null)
            }}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSaveItem}
              style={{
                background: '#10b981',
                borderColor: '#10b981',
              }}
            >
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
