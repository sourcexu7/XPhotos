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
import { useRouter } from 'next/navigation'
import type { UploadFile } from 'antd'
import GuideSortPanel from '~/components/admin/guide-editor/guide-sort-panel'
import { useTranslations } from 'next-intl'

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
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<UploadFile[]>([])
  const t = useTranslations('Guides')

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
        message.success(t('componentAdded'))
        setComponentType('text')
        setComponentData({})
        setImageFiles([])
        onUpdate()
      } else {
        message.error(t('componentAddFailed'))
      }
    } catch (error) {
      message.error(t('componentAddFailed'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 删除组件
  const deleteComponent = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/guides/${guideId}/components/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        message.success(t('componentDeleted'))
        onUpdate()
      } else {
        message.error(t('componentDeleteFailed'))
      }
    } catch (error) {
      message.error(t('componentDeleteFailed'))
      console.error(error)
    }
  }

  const renderComponentForm = () => {
    switch (componentType) {
      case 'image':
        return (
          <div className="space-y-4">
            <Form.Item label={t('imageUrl')}>
              <Input
                placeholder={t('imageUrlPlaceholder')}
                value={componentData.url}
                onChange={(e) => setComponentData({ ...componentData, url: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('orUploadImage')}>
              <Upload
                fileList={imageFiles}
                onChange={({ fileList }) => setImageFiles(fileList)}
                beforeUpload={() => false}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>{t('selectImage')}</Button>
              </Upload>
            </Form.Item>
            <Form.Item label={t('imageCaption')}>
              <Input
                placeholder={t('imageCaptionPlaceholder')}
                value={componentData.caption}
                onChange={(e) => setComponentData({ ...componentData, caption: e.target.value })}
              />
            </Form.Item>
          </div>
        )
      case 'text':
        return (
          <div className="space-y-4">
            <Form.Item label={t('textContent')}>
              <TextArea
                rows={6}
                placeholder={t('textContentPlaceholder')}
                value={componentData.text}
                onChange={(e) => setComponentData({ ...componentData, text: e.target.value })}
              />
            </Form.Item>
          </div>
        )
      case 'table':
        return (
          <div className="space-y-4">
            <Form.Item label={t('tableTitle')}>
              <Input
                placeholder={t('tableTitlePlaceholder')}
                value={componentData.title}
                onChange={(e) => setComponentData({ ...componentData, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('tableHeaders')}>
              <Input
                placeholder={t('tableHeadersPlaceholder')}
                value={componentData.headers?.join(',')}
                onChange={(e) => setComponentData({ 
                  ...componentData, 
                  headers: e.target.value.split(',') 
                })}
              />
            </Form.Item>
            <Form.Item label={t('tableData')}>
              <TextArea
                rows={6}
                placeholder={t('tableDataPlaceholder')}
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
            <Form.Item label={t('listTitle')}>
              <Input
                placeholder={t('listTitlePlaceholder')}
                value={componentData.title}
                onChange={(e) => setComponentData({ ...componentData, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('listItems')}>
              <TextArea
                rows={6}
                placeholder={t('listItemsPlaceholder')}
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
            <Form.Item label={t('mapTitle')}>
              <Input
                placeholder={t('mapTitlePlaceholder')}
                value={componentData.title}
                onChange={(e) => setComponentData({ ...componentData, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label={t('mapUrl')}>
              <Input
                placeholder={t('mapUrlPlaceholder')}
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
      <Card title={t('addComponent')}>
        <div className="mb-4">
          <Select
            value={componentType}
            onChange={setComponentType}
            style={{ width: 200 }}
            size="large"
          >
            <Select.Option value="text">
              <FileTextOutlined /> {t('text')}
            </Select.Option>
            <Select.Option value="image">
              <PictureOutlined /> {t('image')}
            </Select.Option>
            <Select.Option value="table">
              <TableOutlined /> {t('table')}
            </Select.Option>
            <Select.Option value="list">
              <UnorderedListOutlined /> {t('list')}
            </Select.Option>
            <Select.Option value="map">
              <GlobalOutlined /> {t('map')}
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
            {t('addComponent')}
          </Button>
        </div>
      </Card>

      <Card title={t('componentList')}>
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
                        title={t('confirmDeleteComponent')}
                        onConfirm={() => deleteComponent(component.id)}
                        okText={t('confirm')}
                        cancelText={t('cancel')}
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          {t('delete')}
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
                      {component.type === 'text' ? t('text') : 
                       component.type === 'image' ? t('image') :
                       component.type === 'table' ? t('table') :
                       component.type === 'list' ? t('list') :
                       component.type === 'map' ? t('map') : component.type}
                    </Text>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <Empty description={t('noComponents')} />
        )}
      </Card>
    </div>
  )
}

export default function GuidesAdminPage() {
  const { message } = App.useApp()
  const router = useRouter()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const [form] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<GuideWithRelations | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeTab, setActiveTab] = useState<string>('info')
  const [sortPanelOpen, setSortPanelOpen] = useState(false)
  const t = useTranslations('Guides')

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
      message.error(t('fetchFailed'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [message, t])

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
        message.success(editingGuide ? t('updateSuccess') : t('createSuccess'))
        setModalVisible(false)
        fetchGuides()
      } else {
        message.error(editingGuide ? t('updateFailed') : t('createFailed'))
      }
    } catch (error) {
      message.error(t('updateFailed'))
      console.error(error)
    }
  }

  // 删除攻略
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/guides/${id}`, { method: 'DELETE' })
      if (res.ok) {
        message.success(t('deleteSuccess'))
        fetchGuides()
      } else {
        message.error(t('deleteFailed'))
      }
    } catch (error) {
      message.error(t('deleteFailed'))
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
      message.error(t('getDetailFailed'))
      console.error(error)
    }
  }

  const columns = [
    {
      title: t('sort'),
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      render: (sort: number) => <Text strong>{sort}</Text>,
    },
    {
      title: t('title'),
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
      title: t('days'),
      dataIndex: 'days',
      key: 'days',
      render: (days: number) => (
        <Tag color="blue">{days} {t('days')}</Tag>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'show',
      key: 'show',
      render: (show: number) => (
        <Tag color={show === 1 ? 'green' : 'red'}>
          {show === 1 ? t('public') : t('hidden')}
        </Tag>
      ),
    },
    {
      title: t('createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t('actions'),
      key: 'action',
      render: (_: any, record: Guide) => (
        <Space>
          <Button
            type="primary"
            icon={<FormOutlined />}
            onClick={() => router.push(`/admin/guides/${record.id}/edit`)}
          >
            {t('editContent')}
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            {t('viewDetail')}
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            {t('editInfo')}
          </Button>
          <Popconfirm
            title={t('confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('confirm')}
            cancelText={t('cancel')}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t('delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="bg-gray-50 p-6 space-y-6">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex justify-end mb-4 gap-2">
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSortPanelOpen(true)}
          >
            {t('manageSort')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            {t('addGuide')}
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
        title={editingGuide ? t('editGuide') : t('newGuide')}
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
              label: t('basicInfo'),
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item
                    label={t('title')}
                    name="title"
                    rules={[{ required: true, message: t('titlePlaceholder') }]}
                  >
                    <Input placeholder={t('titlePlaceholder')} size="large" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={t('country')}
                        name="country"
                        rules={[{ required: true, message: t('countryPlaceholder') }]}
                      >
                        <Input placeholder={t('countryPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('city')}
                        name="city"
                        rules={[{ required: true, message: t('cityPlaceholder') }]}
                      >
                        <Input placeholder={t('cityPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={t('days')}
                    name="days"
                    rules={[{ required: true, message: t('daysPlaceholder') }]}
                  >
                    <InputNumber min={1} placeholder={t('daysPlaceholder')} size="large" style={{ width: '100%' }} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label={t('startDate')} name="start_date">
                        <Input type="date" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('endDate')} name="end_date">
                        <Input type="date" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label={t('coverImage')} name="cover_image">
                    <Input placeholder={t('coverImagePlaceholder')} prefix={<PictureOutlined />} size="large" />
                  </Form.Item>

                  <Form.Item label={t('sortOrder')} name="sort">
                    <InputNumber min={0} placeholder={t('sortPlaceholder')} size="large" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item label={t('public')} name="show" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Form>
              ),
            },
            ...(editingGuide
              ? [
                  {
                    key: 'components',
                    label: t('componentEditor'),
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
                    label: t('relatedAlbums'),
                    children: (
                      <div className="space-y-4">
                        <div>
                          <Select
                            placeholder={t('selectAlbum')}
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
                                  message.success(t('albumAssociated'))
                                  await handleViewDetail(editingGuide.id)
                                } else {
                                  message.error(t('albumAssociateFailed'))
                                }
                              } catch (error) {
                                message.error(t('albumAssociateFailed'))
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
                        <Card title={t('associatedAlbums')} size="small">
                          {selectedGuide?.albums && selectedGuide.albums.length > 0 ? (
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
                                        message.success(t('albumDisassociated'))
                                        await handleViewDetail(editingGuide.id)
                                      } else {
                                        message.error(t('albumDisassociateFailed'))
                                      }
                                    } catch (error) {
                                      message.error(t('albumDisassociateFailed'))
                                      console.error(error)
                                    }
                                  }}
                                >
                                  {relation.album.name}
                                </Tag>
                              ))}
                            </div>
                          ) : (
                            <Empty description={t('noAssociatedAlbums')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
            {t('cancel')}
          </Button>
          <Button type="primary" onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={t('guideDetail')}
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
                <Tag color="orange">{selectedGuide.days} {t('days')}</Tag>
              </Space>
            </div>

            {selectedGuide.cover_image && (
              <div>
                <img
                  src={selectedGuide.cover_image}
                  alt={t('coverImage')}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}

            <Card title={t('relatedAlbums')} size="small">
              {selectedGuide.albums?.length > 0 ? (
                <Space wrap>
                  {selectedGuide.albums.map((relation) => (
                    <Tag key={relation.id}>{relation.album.name}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">{t('noAlbums')}</Text>
              )}
            </Card>

            <Card title={t('componentList')} size="small">
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
                <Text type="secondary">{t('noComponents')}</Text>
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