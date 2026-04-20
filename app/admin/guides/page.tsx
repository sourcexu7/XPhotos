'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  Tag,
  Typography,
  Tabs,
  Row,
  Col,
  Upload,
  Divider,
  Empty,
  App,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PictureOutlined,
  FileTextOutlined,
  TableOutlined,
  UnorderedListOutlined,
  GlobalOutlined,
  UploadOutlined,
  SaveOutlined,
  FormOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { UploadFile, UploadProps } from 'antd'
import GuideSortPanel from '~/components/admin/guide-editor/guide-sort-panel'

const { Title, Text } = Typography
const { TextArea } = Input

interface Guide {
  id: string
  title: string
  country: string
  city: string
  days: number
  start_date?: string
  end_date?: string
  cover_image?: string
  content?: any
  show: number
  sort: number
  createdAt: string
}

interface GuideComponent {
  id: string
  guide_id: string
  type: string
  content?: any
  sort: number
}

interface Album {
  id: string
  name: string
  album_value: string
}

interface GuideAlbumsRelation {
  id: string
  guide_id: string
  album_id: string
  album: Album
}

interface GuideWithRelations extends Guide {
  components: GuideComponent[]
  albums: GuideAlbumsRelation[]
}

const ComponentEditor = ({
  guideId,
  components,
  onUpdate,
  message,
}: {
  guideId: string
  components: GuideComponent[]
  onUpdate: () => void
  message: any
}) => {
  const [componentType, setComponentType] = useState<string>('text')
  const [componentData, setComponentData] = useState<any>({})
  const [editingComponent, setEditingComponent] = useState<GuideComponent | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<UploadFile[]>([])

  // 添加组件
  const addComponent = async () => {
    setLoading(true)
    try {
      const data: any = {
        type: componentType,
        content: componentData,
        sort: components.length,
      }

      const res = await fetch(`/api/v1/guides/${guideId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        message.success('组件添加成功')
        setComponentType('text')
        setComponentData({})
        setImageFiles([])
        onUpdate()
      } else {
        message.error('组件添加失败')
      }
    } catch (error) {
      message.error('组件添加失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 更新组件
  const updateComponent = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/v1/guides/${guideId}/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        message.success('组件更新成功')
        setEditingComponent(null)
        onUpdate()
      } else {
        message.error('组件更新失败')
      }
    } catch (error) {
      message.error('组件更新失败')
      console.error(error)
    }
  }

  // 删除组件
  const deleteComponent = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/guides/${guideId}/components/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        message.success('组件删除成功')
        onUpdate()
      } else {
        message.error('组件删除失败')
      }
    } catch (error) {
      message.error('组件删除失败')
      console.error(error)
    }
  }

  const renderComponentForm = () => {
    switch (componentType) {
      case 'image':
        return (
          <div className="space-y-4">
            <Form.Item label="图片URL">
              <Input
                placeholder="请输入图片URL"
                value={componentData.url}
                onChange={(e) => setComponentData({ ...componentData, url: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="或上传图片">
              <Upload
                fileList={imageFiles}
                onChange={({ fileList }) => setImageFiles(fileList)}
                beforeUpload={() => false}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>选择图片</Button>
              </Upload>
            </Form.Item>
            <Form.Item label="图片说明">
              <Input
                placeholder="请输入图片说明"
                value={componentData.caption}
                onChange={(e) => setComponentData({ ...componentData, caption: e.target.value })}
              />
            </Form.Item>
          </div>
        )
      case 'text':
        return (
          <div className="space-y-4">
            <Form.Item label="文本内容">
              <TextArea
                rows={6}
                placeholder="请输入文本内容（支持HTML）"
                value={componentData.text}
                onChange={(e) => setComponentData({ ...componentData, text: e.target.value })}
              />
            </Form.Item>
          </div>
        )
      case 'table':
        return (
          <div className="space-y-4">
            <Form.Item label="表格标题">
              <Input
                placeholder="请输入表格标题"
                value={componentData.title}
                onChange={(e) => setComponentData({ ...componentData, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="表头（逗号分隔）">
              <Input
                placeholder="例如：日期,事项,费用,备注"
                value={componentData.headers?.join(',')}
                onChange={(e) => setComponentData({ 
                  ...componentData, 
                  headers: e.target.value.split(',') 
                })}
              />
            </Form.Item>
            <Form.Item label="表格数据（JSON格式）">
              <TextArea
                rows={6}
                placeholder='例如：[["2024-01-01","吃饭","100","午餐"],["2024-01-02","住宿","500","酒店"]]'
                value={JSON.stringify(componentData.rows || [], null, 2)}
                onChange={(e) => {
                  try {
                    setComponentData({ ...componentData, rows: JSON.parse(e.target.value) })
                  } catch {
                    // ignore
                  }
                }}
              />
            </Form.Item>
          </div>
        )
      case 'list':
        return (
          <div className="space-y-4">
            <Form.Item label="清单标题">
              <Input
                placeholder="请输入清单标题"
                value={componentData.title}
                onChange={(e) => setComponentData({ ...componentData, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="清单项（每行一个）">
              <TextArea
                rows={6}
                placeholder="请输入清单项，每行一个"
                value={componentData.items?.join('\n')}
                onChange={(e) => setComponentData({ 
                  ...componentData, 
                  items: e.target.value.split('\n').filter(item => item.trim()) 
                })}
              />
            </Form.Item>
          </div>
        )
      case 'map':
        return (
          <div className="space-y-4">
            <Form.Item label="地图标题">
              <Input
                placeholder="请输入地图标题"
                value={componentData.title}
                onChange={(e) => setComponentData({ ...componentData, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="地图链接">
              <Input
                placeholder="请输入Google Maps或其他地图链接"
                value={componentData.url}
                onChange={(e) => setComponentData({ ...componentData, url: e.target.value })}
                prefix={<GlobalOutlined />}
              />
            </Form.Item>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card title="添加组件">
        <div className="mb-4">
          <Select
            value={componentType}
            onChange={setComponentType}
            style={{ width: 200 }}
            size="large"
          >
            <Select.Option value="text">
              <FileTextOutlined /> 文本
            </Select.Option>
            <Select.Option value="image">
              <PictureOutlined /> 图片
            </Select.Option>
            <Select.Option value="table">
              <TableOutlined /> 表格
            </Select.Option>
            <Select.Option value="list">
              <UnorderedListOutlined /> 清单
            </Select.Option>
            <Select.Option value="map">
              <GlobalOutlined /> 地图
            </Select.Option>
          </Select>
        </div>

        {renderComponentForm()}

        <div className="mt-4">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={addComponent}
            loading={loading}
            size="large"
          >
            添加组件
          </Button>
        </div>
      </Card>

      <Card title="组件列表">
        {components.length > 0 ? (
          <div className="space-y-4">
            {components
              .sort((a, b) => a.sort - b.sort)
              .map((component, index) => (
                <Card
                  key={component.id}
                  size="small"
                  extra={
                    <Space>
                      <Popconfirm
                        title="确定删除这个组件吗？"
                        onConfirm={() => deleteComponent(component.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  }
                >
                  <div className="flex items-center gap-2">
                    <Tag color="blue">{index + 1}</Tag>
                    <Text strong>
                      {component.type === 'text' && <FileTextOutlined />}
                      {component.type === 'image' && <PictureOutlined />}
                      {component.type === 'table' && <TableOutlined />}
                      {component.type === 'list' && <UnorderedListOutlined />}
                      {component.type === 'map' && <GlobalOutlined />}
                      {' '}
                      {component.type === 'text' ? '文本' : 
                       component.type === 'image' ? '图片' :
                       component.type === 'table' ? '表格' :
                       component.type === 'list' ? '清单' :
                       component.type === 'map' ? '地图' : component.type}
                    </Text>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <Empty description="暂无组件" />
        )}
      </Card>
    </div>
  )
}

export default function GuidesAdminPage() {
  const { message } = App.useApp()
  const tAdminHeader = useTranslations('AdminHeader')
  const router = useRouter()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const [form] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<GuideWithRelations | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeTab, setActiveTab] = useState<string>('list')
  const [sortPanelOpen, setSortPanelOpen] = useState(false)

  // 获取攻略列表
  const fetchGuides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/guides/list')
      const result = await res.json()
      if (result.data) {
        setGuides(result.data)
      }
    } catch (error) {
      message.error('获取攻略列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [message])

  // 获取相册列表
  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/albums/get')
      const result = await res.json()
      if (result.data) {
        setAlbums(result.data)
      }
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchGuides()
    fetchAlbums()
  }, [fetchGuides, fetchAlbums])

  // 打开编辑/新增弹窗
  const openModal = async (guide?: Guide) => {
    setEditingGuide(guide || null)
    if (guide) {
      form.setFieldsValue({
        title: guide.title,
        country: guide.country,
        city: guide.city,
        days: guide.days,
        start_date: guide.start_date,
        end_date: guide.end_date,
        cover_image: guide.cover_image,
        show: guide.show === 1,
        sort: guide.sort,
      })
      // 加载完整数据（包括关联的相册和组件）
      await handleViewDetail(guide.id)
    } else {
      form.resetFields()
      setSelectedGuide(null)
    }
    setModalVisible(true)
    setActiveTab('info')
  }

  // 保存攻略
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        show: values.show ? 1 : 0,
      }

      let res
      if (editingGuide) {
        res = await fetch(`/api/v1/guides/${editingGuide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        res = await fetch('/api/v1/guides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }

      if (res.ok) {
        message.success(editingGuide ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchGuides()
      } else {
        message.error(editingGuide ? '更新失败' : '创建失败')
      }
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  // 删除攻略
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/guides/${id}`, { method: 'DELETE' })
      if (res.ok) {
        message.success('删除成功')
        fetchGuides()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  // 查看详情
  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/guides/${id}`)
      const result = await res.json()
      if (result.data) {
        setSelectedGuide(result.data)
        setDetailModalVisible(true)
      }
    } catch (error) {
      message.error('获取详情失败')
      console.error(error)
    }
  }

  const columns = [
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      render: (sort: number) => <Text strong>{sort}</Text>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Guide) => (
        <div>
          <Text strong>{text}</Text>
          <div className="text-gray-500 text-sm mt-1">
            {record.country} · {record.city}
          </div>
        </div>
      ),
    },
    {
      title: '行程天数',
      dataIndex: 'days',
      key: 'days',
      render: (days: number) => (
        <Tag color="blue">{days} 天</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'show',
      key: 'show',
      render: (show: number) => (
        <Tag color={show === 1 ? 'green' : 'red'}>
          {show === 1 ? '公开' : '隐藏'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Guide) => (
        <Space>
          <Button
            type="primary"
            icon={<FormOutlined />}
            onClick={() => router.push(`/admin/guides/${record.id}/edit`)}
          >
            编辑内容
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑信息
          </Button>
          <Popconfirm
            title="确定删除这个攻略吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="bg-gray-50 p-6 space-y-6">
      <AdminPageHeader
        title="攻略管理"
        description="管理您的旅行攻略"
      />

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex justify-end mb-4 gap-2">
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSortPanelOpen(true)}
          >
            管理排序
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新增攻略
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={guides}
          rowKey="id"
          loading={loading}
        />
      </div>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingGuide ? '编辑攻略' : '新增攻略'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'info',
              label: '基本信息',
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item
                    label="标题"
                    name="title"
                    rules={[{ required: true, message: '请输入标题' }]}
                  >
                    <Input placeholder="请输入标题" size="large" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="国家"
                        name="country"
                        rules={[{ required: true, message: '请输入国家' }]}
                      >
                        <Input placeholder="请输入国家" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="城市"
                        name="city"
                        rules={[{ required: true, message: '请输入城市' }]}
                      >
                        <Input placeholder="请输入城市" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="行程天数"
                    name="days"
                    rules={[{ required: true, message: '请输入行程天数' }]}
                  >
                    <InputNumber min={1} placeholder="请输入天数" size="large" style={{ width: '100%' }} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="出发日期" name="start_date">
                        <Input type="date" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="返回日期" name="end_date">
                        <Input type="date" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="封面图片" name="cover_image">
                    <Input placeholder="请输入封面图片URL" prefix={<PictureOutlined />} size="large" />
                  </Form.Item>

                  <Form.Item label="排序" name="sort">
                    <InputNumber min={0} placeholder="请输入排序值" size="large" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item label="公开" name="show" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Form>
              ),
            },
            ...(editingGuide
              ? [
                  {
                    key: 'components',
                    label: '组件编辑',
                    children: (
                      <ComponentEditor
                        guideId={editingGuide.id}
                        components={selectedGuide?.components || []}
                        onUpdate={() => handleViewDetail(editingGuide.id)}
                        message={message}
                      />
                    ),
                  },
                  {
                    key: 'albums',
                    label: '关联相册',
                    children: (
                      <div className="space-y-4">
                        <div>
                          <Select
                            placeholder="选择要关联的相册"
                            style={{ width: '100%' }}
                            size="large"
                            onChange={async (albumId) => {
                              try {
                                const res = await fetch(`/api/v1/guides/${editingGuide.id}/albums`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ album_id: albumId }),
                                })
                                if (res.ok) {
                                  message.success('相册关联成功')
                                  await handleViewDetail(editingGuide.id)
                                } else {
                                  message.error('相册关联失败')
                                }
                              } catch (error) {
                                message.error('相册关联失败')
                                console.error(error)
                              }
                            }}
                          >
                            {albums.map((album) => (
                              <Select.Option key={album.id} value={album.id}>
                                {album.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </div>
                        <Card title="已关联相册" size="small">
                          {selectedGuide?.albums?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedGuide.albums.map((relation) => (
                                <Tag
                                  key={relation.id}
                                  color="blue"
                                  closable
                                  onClose={async () => {
                                    try {
                                      const res = await fetch(`/api/v1/guides/${editingGuide.id}/albums/${relation.album_id}`, {
                                        method: 'DELETE',
                                      })
                                      if (res.ok) {
                                        message.success('相册关联已取消')
                                        await handleViewDetail(editingGuide.id)
                                      } else {
                                        message.error('取消关联失败')
                                      }
                                    } catch (error) {
                                      message.error('取消关联失败')
                                      console.error(error)
                                    }
                                  }}
                                >
                                  {relation.album.name}
                                </Tag>
                              ))}
                            </div>
                          ) : (
                            <Empty description="暂无关联相册" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}
                        </Card>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setModalVisible(false)}>
            取消
          </Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </div>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="攻略详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedGuide && (
          <div className="space-y-4">
            <div>
              <Title level={4}>{selectedGuide.title}</Title>
              <Space wrap>
                <Tag color="blue">{selectedGuide.country}</Tag>
                <Tag color="green">{selectedGuide.city}</Tag>
                <Tag color="orange">{selectedGuide.days} 天</Tag>
              </Space>
            </div>

            {selectedGuide.cover_image && (
              <div>
                <img
                  src={selectedGuide.cover_image}
                  alt="封面"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}

            <Card title="关联相册" size="small">
              {selectedGuide.albums?.length > 0 ? (
                <Space wrap>
                  {selectedGuide.albums.map((relation) => (
                    <Tag key={relation.id}>{relation.album.name}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">暂无关联相册</Text>
              )}
            </Card>

            <Card title="组件列表" size="small">
              {selectedGuide.components?.length > 0 ? (
                <div className="space-y-2">
                  {selectedGuide.components
                    .sort((a, b) => a.sort - b.sort)
                    .map((component, index) => (
                      <Tag key={component.id} color="blue">
                        {index + 1}. {component.type}
                      </Tag>
                    ))}
                </div>
              ) : (
                <Text type="secondary">暂无组件</Text>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* 排序管理面板 */}
      <GuideSortPanel
        open={sortPanelOpen}
        onClose={() => setSortPanelOpen(false)}
        onSuccess={fetchGuides}
      />
    </div>
  )
}