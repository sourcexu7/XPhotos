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
  Row,
  Col,
  Empty,
  App,
  DatePicker,
  Tooltip,
  Dropdown,
  theme,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PictureOutlined,
  FormOutlined,
  SortAscendingOutlined,
  RobotOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { useRouter } from 'next/navigation'
import GuideSortPanel from '~/components/admin/guide-editor/guide-sort-panel'
import AIImportDrawer from '~/components/admin/guide-editor/ai-import-drawer'
import { useTranslations } from 'next-intl'

const { Title, Text } = Typography

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
  albums: GuideAlbumsRelation[]
}

export default function GuidesAdminPage() {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const router = useRouter()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const [form] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<GuideWithRelations | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [localAlbumIds, setLocalAlbumIds] = useState<string[]>([])
  const [sortPanelOpen, setSortPanelOpen] = useState(false)
  const [aiImportOpen, setAiImportOpen] = useState(false)
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
      // 加载完整数据（包括关联的相册和组件），使用本地状态管理相册关联
      try {
        const res = await fetch(`/api/v1/guides/${guide.id}`)
        const result = await res.json()
        if (result.data) {
          setSelectedGuide(result.data)
          setLocalAlbumIds(
            result.data.albums?.map((a: GuideAlbumsRelation) => a.album_id) || []
          )
        }
      } catch (error) {
        console.error(error)
      }
    } else {
      form.resetFields()
      setSelectedGuide(null)
      setLocalAlbumIds([])
    }
    setModalVisible(true)
  }

  // 保存攻略
  const handleSave = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        show: values.show ? 1 : 0,
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : null,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
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
        // 保存相册关联（全量覆盖）
        if (editingGuide) {
          try {
            await fetch(`/api/v1/guides/${editingGuide.id}/albums`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ album_ids: localAlbumIds }),
            })
          } catch (albumError) {
            console.error(albumError)
          }
        }
        message.success(editingGuide ? t('updateSuccess') : t('createSuccess'))
        setModalVisible(false)
        fetchGuides()
      } else {
        message.error(editingGuide ? t('updateFailed') : t('createFailed'))
      }
    } catch (error) {
      message.error(t('updateFailed'))
      console.error(error)
    } finally {
      setSaving(false)
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
          <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: token.fontSizeSM }}>
            {record.country} · {record.city}
          </Text>
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
        <Tag color={show === 1 ? 'green' : 'orange'}>
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
      render: (_: any, record: Guide) => {
        const moreMenuItems: MenuProps['items'] = [
          {
            key: 'viewDetail',
            icon: <EyeOutlined />,
            label: t('viewDetail'),
          },
          {
            key: 'editInfo',
            icon: <EditOutlined />,
            label: t('editInfo'),
          },
        ]
        return (
          <Space>
            <Button
              type="primary"
              icon={<FormOutlined />}
              onClick={() => router.push(`/admin/guides/${record.id}/edit`)}
            >
              {t('editContent')}
            </Button>
            <Dropdown
              menu={{
                items: moreMenuItems,
                onClick: ({ key }) => {
                  if (key === 'viewDetail') {
                    handleViewDetail(record.id)
                  } else if (key === 'editInfo') {
                    openModal(record)
                  }
                },
              }}
              trigger={['click']}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>
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
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
        toolbar={
          <>
            <Tooltip title={t('manageSort')}>
              <Button
                icon={<SortAscendingOutlined />}
                onClick={() => setSortPanelOpen(true)}
              />
            </Tooltip>
            <Tooltip title={t('aiImport.buttonTitle')}>
              <Button
                icon={<RobotOutlined />}
                onClick={() => setAiImportOpen(true)}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              {t('addGuide')}
            </Button>
          </>
        }
      />

      <Table
        columns={columns}
        dataSource={guides}
        rowKey="id"
        loading={loading}
      />

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingGuide ? t('editGuide') : t('newGuide')}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            {t('cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={saving}
            onClick={handleSave}
          >
            {t('save')}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('title')}
            name="title"
            rules={[{ required: true, message: t('titlePlaceholder') }]}
          >
            <Input placeholder={t('titlePlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('country')}
                name="country"
                rules={[{ required: true, message: t('countryPlaceholder') }]}
              >
                <Input placeholder={t('countryPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('city')}
                name="city"
                rules={[{ required: true, message: t('cityPlaceholder') }]}
              >
                <Input placeholder={t('cityPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('days')}
            name="days"
            rules={[{ required: true, message: t('daysPlaceholder') }]}
          >
            <InputNumber min={1} placeholder={t('daysPlaceholder')} style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('startDate')}
                name="start_date"
                getValueProps={(val) => ({ value: val ? dayjs(val) : undefined })}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('endDate')}
                name="end_date"
                getValueProps={(val) => ({ value: val ? dayjs(val) : undefined })}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('coverImage')} name="cover_image">
            <Input placeholder={t('coverImagePlaceholder')} prefix={<PictureOutlined />} />
          </Form.Item>

          <Form.Item label={t('sortOrder')} name="sort">
            <InputNumber min={0} placeholder={t('sortPlaceholder')} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label={t('public')} name="show" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>

        {editingGuide && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm font-medium mb-3">{t('relatedAlbums')}</div>
            <div className="space-y-3">
              <Select
                placeholder={t('selectAlbum')}
                style={{ width: '100%' }}
                onChange={(albumId) => {
                  if (albumId && !localAlbumIds.includes(albumId)) {
                    setLocalAlbumIds([...localAlbumIds, albumId])
                  }
                }}
              >
                {albums.map((album) => (
                  <Select.Option key={album.id} value={album.id}>
                    {album.name}
                  </Select.Option>
                ))}
              </Select>
              {localAlbumIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {localAlbumIds.map((albumId) => {
                    const album = albums.find((a) => a.id === albumId)
                    return (
                      <Tag
                        key={albumId}
                        color="blue"
                        closable
                        onClose={() => {
                          setLocalAlbumIds(localAlbumIds.filter((id) => id !== albumId))
                        }}
                      >
                        {album?.name || albumId}
                      </Tag>
                    )
                  })}
                </div>
              ) : (
                <Empty description={t('noAssociatedAlbums')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={t('guideDetail')}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={720}
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
          </div>
        )}
      </Modal>

      {/* 排序管理面板 */}
      <GuideSortPanel
        open={sortPanelOpen}
        onClose={() => setSortPanelOpen(false)}
        onSuccess={fetchGuides}
      />

      {/* AI 导入抽屉 */}
      <AIImportDrawer
        open={aiImportOpen}
        onClose={() => setAiImportOpen(false)}
      />
    </div>
  )
}
