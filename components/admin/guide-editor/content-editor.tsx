'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Dropdown, Spin, Empty, Modal, Input, Select, App, Alert, theme, Checkbox, Typography, Tag } from 'antd'
import { createRecordId } from '~/components/admin/guide-editor/modules/module-base'
import { 
  PlusOutlined,
  HolderOutlined,
  FontSizeOutlined,
  PictureOutlined,
  TableOutlined,
  VideoCameraOutlined,
  CodeOutlined,
  FunctionOutlined,
  LinkOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  WarningOutlined,
  MinusOutlined,
  HighlightOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useSWR, { mutate } from 'swr'
import ItineraryModule from './modules/itinerary-module'
import ExpenseModule from './modules/expense-module'
import ChecklistModule from './modules/checklist-module'
import TransportModule from './modules/transport-module'
import PhotoModule from './modules/photo-module'
import TipsModule from './modules/tips-module'
import RailwayModule from './modules/railway-module'
import TimelineModule from './modules/timeline-module'
import NotesModule from './modules/notes-module'
import ReviewModule from './modules/review-module'
import SeatModule from './modules/seat-module'

const { Text } = Typography

const API_BASE = '/api/v1/guide-modules'

interface Content {
  id: string
  module_id: string
  type: string
  content: any
  sort: number
  createdAt: string
  updatedAt: string | null
}

interface Module {
  id: string
  guide_id: string
  name: string
  template: string | null
  sort: number
  is_hidden: boolean
  moduleData?: any
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  text: <FontSizeOutlined />,
  markdown: <FontSizeOutlined />,
  image: <PictureOutlined />,
  table: <TableOutlined />,
  video: <VideoCameraOutlined />,
  code: <CodeOutlined />,
  latex: <FunctionOutlined />,
  link: <LinkOutlined />,
  task: <CheckSquareOutlined />,
  quote: <MessageOutlined />,
  warning: <WarningOutlined />,
  divider: <MinusOutlined />,
  highlight: <HighlightOutlined />,
}

const contentTypeNames: Record<string, string> = {
  text: '文本',
  markdown: 'Markdown',
  image: '图片',
  table: '表格',
  video: '视频',
  code: '代码块',
  latex: 'LaTeX公式',
  link: '链接卡片',
  task: '任务列表',
  quote: '引用卡片',
  warning: '警告卡片',
  divider: '分割线',
  highlight: '高亮卡片',
}

interface SortableContentItemProps {
  content: Content
  onEdit: (content: Content) => void
  onDelete: (id: string) => void
}

function SortableContentItem({ content, onEdit, onDelete }: SortableContentItemProps) {
  const t = useTranslations('GuideEditor')
  const { token } = theme.useToken()
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: content.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getContentTypeColor = (type: string): React.CSSProperties => {
    const colorMap: Record<string, string> = {
      text: token.colorTextSecondary,
      image: token.colorSuccess,
      table: token.colorPrimary,
      video: token.colorInfo,
      code: token.colorPrimary,
      latex: token.colorError,
      link: token.colorInfo,
      task: token.colorWarning,
      quote: token.colorTextSecondary,
      warning: token.colorWarning,
      divider: token.colorTextTertiary,
      highlight: token.colorPrimary,
    }
    return { color: colorMap[type] || token.colorTextTertiary }
  }

  const renderContentPreview = () => {
    switch (content.type) {
      case 'text':
      case 'markdown':
        return (
          <div className="line-clamp-3" style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
            {content.content?.text?.slice(0, 100) || content.content?.content?.slice(0, 100) || '空文本'}
          </div>
        )
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <PictureOutlined style={{ color: token.colorSuccess }} />
            <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              {content.content?.caption || '图片'}
            </span>
          </div>
        )
      case 'video':
        return (
          <div className="flex items-center gap-2">
            <VideoCameraOutlined style={{ color: token['purple-5'] }} />
            <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              {content.content?.caption || '视频'}
            </span>
          </div>
        )
      case 'code':
        return (
          <div className="flex items-center gap-2">
            <CodeOutlined style={{ color: token.colorPrimary }} />
            <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              {content.content?.language || '代码块'}
            </span>
          </div>
        )
      case 'link':
        return (
          <div className="flex items-center gap-2">
            <LinkOutlined style={{ color: token['cyan-5'] }} />
            <span className="truncate" style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              {content.content?.title || content.content?.url || '链接'}
            </span>
          </div>
        )
      case 'task':
        const tasks = content.content?.tasks || []
        const completed = tasks.filter((t: any) => t.completed).length
        return (
          <div className="flex items-center gap-2">
            <CheckSquareOutlined style={{ color: token.colorWarning }} />
            <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              任务列表 ({completed}/{tasks.length})
            </span>
          </div>
        )
      case 'quote':
        return (
          <div
            className="italic"
            style={{
              borderLeft: `4px solid ${token.colorBorder}`,
              paddingLeft: token.paddingSM,
              color: token.colorTextSecondary,
              fontSize: token.fontSizeSM,
            }}
          >
            {content.content?.text?.slice(0, 50) || '引用'}
          </div>
        )
      case 'warning':
        return (
          <Alert
            type="warning"
            showIcon
            title={content.content?.title || '警告'}
          />
        )
      case 'divider':
        return <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, margin: `${token.marginXS}px 0` }} />
      case 'highlight':
        return (
          <Alert
            type="info"
            showIcon={false}
            title={content.content?.text?.slice(0, 50) || '高亮内容'}
          />
        )
      case 'table':
        return (
          <div className="flex items-center gap-2">
            <TableOutlined style={{ color: token['geekblue-5'] }} />
            <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>表格</span>
          </div>
        )
      case 'latex':
        return (
          <div className="flex items-center gap-2">
            <FunctionOutlined style={{ color: token['magenta-5'] }} />
            <span className="font-mono" style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              {content.content?.formula?.slice(0, 30) || 'LaTeX'}
            </span>
          </div>
        )
      default:
        return <span style={{ color: token.colorTextSecondary }}>未知类型</span>
    }
  }

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('edit') || '编辑',
      onClick: () => onEdit(content),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('delete') || '删除',
      danger: true,
      onClick: () => onDelete(content.id),
    },
  ]

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="mb-3 p-4 rounded-lg"
        style={{
          border: `1px solid ${hovered ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
          background: hovered ? token.colorFillQuaternary : token.colorBgContainer,
          transition: `all ${token.motionDurationMid}`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-start gap-3">
          <div
            {...listeners}
            role="button"
            aria-label={t('dragToSort') || '拖拽调整顺序'}
            tabIndex={0}
            className="cursor-grab active:cursor-grabbing mt-1"
            style={{ color: token.colorTextTertiary }}
          >
            <HolderOutlined />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span style={getContentTypeColor(content.type)}>
                {contentTypeIcons[content.type]}
              </span>
              <Tag style={{ margin: 0, fontSize: token.fontSizeSM, lineHeight: '18px', padding: '0 8px', borderRadius: 999 }}>
                {contentTypeNames[content.type] || content.type}
              </Tag>
            </div>
            {renderContentPreview()}
          </div>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: token.colorTextTertiary }} />
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

interface ContentEditorProps {
  module: Module | null
  onContentDataChange?: (data: any) => void
}

export default function ContentEditor({ module, onContentDataChange }: ContentEditorProps) {
  const t = useTranslations('GuideEditor')
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newContentType, setNewContentType] = useState<string>('text')
  const [contentData, setContentData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [specialModuleData, setSpecialModuleData] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { data: contents, isLoading, error } = useSWR<Content[]>(
    module ? `${API_BASE}/content/${module.id}` : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: 'include' })
      const json = await res.json()
      return json.data || []
    }
  )

  const isSpecialModule = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips', 'railway', 'timeline', 'notes', 'review', 'seat'].includes(module?.template || '')

  useEffect(() => {
    if (module && isSpecialModule) {
      // 优先使用模块上已有的 moduleData（后台已加载）
      if (module.moduleData !== undefined) {
        const data = module.moduleData || []
        setSpecialModuleData(data)
        onContentDataChange?.(data)
      } else {
        // 兼容旧逻辑：单独加载 moduleData
        fetch(`${API_BASE}/module-data/${module.id}`, { credentials: 'include' })
          .then(res => res.json())
          .then(json => {
            const data = json.data || []
            setSpecialModuleData(data)
            onContentDataChange?.(data)
          })
          .catch(console.error)
      }
    } else {
      setSpecialModuleData(null)
      onContentDataChange?.(null)
    }
  }, [module, isSpecialModule, onContentDataChange])

  const saveSpecialModuleData = useCallback(async (data: any) => {
    if (!module || !isSpecialModule) return
    
    try {
      await fetch(`${API_BASE}/module-data/${module.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
    } catch (error) {
      console.error('Failed to save module data:', error)
    }
  }, [module, isSpecialModule])

  const handleAddContent = async () => {
    if (!module) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/content`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: module.id,
          type: newContentType,
          content: contentData,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('handleAddContent failed:', res.status, errText)
        throw new Error('Failed to create content')
      }

      message.success(t('addContent') || '创建成功')
      setIsAddModalOpen(false)
      setContentData({})
      setNewContentType('text')
      mutate(`${API_BASE}/content/${module.id}`)
    } catch (error) {
      console.error('handleAddContent error:', error)
      message.error(t('createFailed') || '创建失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditContent = async () => {
    if (!editingContent || !module) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/content/${editingContent.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentData,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('handleEditContent failed:', res.status, errText)
        throw new Error('Failed to update content')
      }

      message.success(t('updateSuccess') || '更新成功')
      setIsEditModalOpen(false)
      setEditingContent(null)
      setContentData({})
      mutate(`${API_BASE}/content/${module.id}`)
    } catch (error) {
      console.error('handleEditContent error:', error)
      message.error(t('updateFailed') || '更新失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!module) return

    Modal.confirm({
      title: t('confirmDelete') || '确认删除',
      content: t('confirmDeleteContent') || '确定要删除这个内容吗？',
      okText: t('confirm') || '确认',
      cancelText: t('cancel') || '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`${API_BASE}/content/${contentId}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!res.ok) throw new Error('Failed to delete content')
          message.success(t('deleteSuccess') || '删除成功')
          mutate(`${API_BASE}/content/${module.id}`)
        } catch (error) {
          console.error('handleDeleteContent error:', error)
          message.error(t('deleteFailed') || '删除失败')
        }
      },
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && contents && module) {
      const oldIndex = contents.findIndex(c => c.id === active.id)
      const newIndex = contents.findIndex(c => c.id === over.id)
      const newContents = arrayMove(contents, oldIndex, newIndex)

      mutate(`${API_BASE}/content/${module.id}`, newContents, false)

      try {
        await fetch(`${API_BASE}/content/sort`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_ids: newContents.map(c => c.id) }),
        })
      } catch (error) {
        console.error('handleDragEnd error:', error)
        mutate(`${API_BASE}/content/${module.id}`)
      }
    }
  }

  const openEditModal = (content: Content) => {
    setEditingContent(content)
    setNewContentType(content.type || 'text')
    setContentData(content.content || {})
    setIsEditModalOpen(true)
  }

  const openAddModal = (type: string) => {
    setNewContentType(type)
    setContentData(getDefaultContentData(type))
    setIsAddModalOpen(true)
  }

  const getDefaultContentData = (type: string): any => {
    switch (type) {
      case 'text':
      case 'markdown':
        return { text: '' }
      case 'image':
        return { url: '', caption: '', alt: '' }
      case 'video':
        return { url: '', caption: '', platform: 'youtube' }
      case 'code':
        return { code: '', language: 'javascript' }
      case 'latex':
        return { formula: '' }
      case 'link':
        return { url: '', title: '', description: '', image: '' }
      case 'task':
        return { tasks: [{ id: '1', text: '', completed: false }] }
      case 'quote':
        return { text: '', author: '' }
      case 'warning':
        return { title: '', text: '', type: 'warning' }
      case 'divider':
        return { style: 'solid' }
      case 'highlight':
        return { text: '', color: 'blue' }
      case 'table':
        return { 
          headers: ['列1', '列2', '列3'],
          rows: [['', '', '']]
        }
      default:
        return {}
    }
  }

  const renderContentEditor = () => {
    switch (newContentType) {
      case 'text':
      case 'markdown':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {newContentType === 'markdown' ? 'Markdown 内容' : '文本内容'}
              </Text>
              <Input.TextArea
                rows={14}
                placeholder={
                  newContentType === 'markdown'
                    ? '支持 Markdown 语法：# 标题、**加粗**、- 列表、> 引用、`代码`、[链接](...)等'
                    : '请输入文本内容'
                }
                value={contentData.text || contentData.content || ''}
                onChange={e => setContentData({ text: e.target.value })}
                className="font-mono text-sm w-full"
              />
            </div>
          </div>
        )
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>图片URL</Text>
              <Input
                value={contentData.url || ''}
                onChange={e => setContentData({ ...contentData, url: e.target.value })}
                placeholder="请输入图片URL"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>图片说明</Text>
              <Input
                value={contentData.caption || ''}
                onChange={e => setContentData({ ...contentData, caption: e.target.value })}
                placeholder="请输入图片说明"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Alt文本</Text>
              <Input
                value={contentData.alt || ''}
                onChange={e => setContentData({ ...contentData, alt: e.target.value })}
                placeholder="请输入Alt文本"
              />
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>视频平台</Text>
              <Select
                value={contentData.platform || 'youtube'}
                onChange={v => setContentData({ ...contentData, platform: v })}
                options={[
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'bilibili', label: 'Bilibili' },
                  { value: 'vimeo', label: 'Vimeo' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>视频URL/ID</Text>
              <Input
                value={contentData.url || ''}
                onChange={e => setContentData({ ...contentData, url: e.target.value })}
                placeholder="请输入视频URL或ID"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>视频说明</Text>
              <Input
                value={contentData.caption || ''}
                onChange={e => setContentData({ ...contentData, caption: e.target.value })}
                placeholder="请输入视频说明"
              />
            </div>
          </div>
        )
      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>编程语言</Text>
              <Select
                value={contentData.language || 'javascript'}
                onChange={v => setContentData({ ...contentData, language: v })}
                options={[
                  { value: 'javascript', label: 'JavaScript' },
                  { value: 'typescript', label: 'TypeScript' },
                  { value: 'python', label: 'Python' },
                  { value: 'java', label: 'Java' },
                  { value: 'cpp', label: 'C++' },
                  { value: 'css', label: 'CSS' },
                  { value: 'html', label: 'HTML' },
                  { value: 'sql', label: 'SQL' },
                  { value: 'bash', label: 'Bash' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>代码内容</Text>
              <Input.TextArea
                value={contentData.code || ''}
                onChange={e => setContentData({ ...contentData, code: e.target.value })}
                placeholder="请输入代码"
                rows={10}
                className="font-mono"
              />
            </div>
          </div>
        )
      case 'latex':
        return (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>LaTeX公式</Text>
            <Input.TextArea
              value={contentData.formula || ''}
              onChange={e => setContentData({ ...contentData, formula: e.target.value })}
              placeholder="请输入LaTeX公式，例如：E = mc^2"
              rows={4}
              className="font-mono"
            />
          </div>
        )
      case 'link':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>链接URL</Text>
              <Input
                value={contentData.url || ''}
                onChange={e => setContentData({ ...contentData, url: e.target.value })}
                placeholder="请输入链接URL"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>标题</Text>
              <Input
                value={contentData.title || ''}
                onChange={e => setContentData({ ...contentData, title: e.target.value })}
                placeholder="请输入标题"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>描述</Text>
              <Input.TextArea
                value={contentData.description || ''}
                onChange={e => setContentData({ ...contentData, description: e.target.value })}
                placeholder="请输入描述"
                rows={3}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>封面图片URL</Text>
              <Input
                value={contentData.image || ''}
                onChange={e => setContentData({ ...contentData, image: e.target.value })}
                placeholder="请输入封面图片URL"
              />
            </div>
          </div>
        )
      case 'task':
        return (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>任务列表</Text>
            <div className="space-y-2">
              {(contentData.tasks || []).map((task: any, index: number) => (
                <div key={task.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={task.completed}
                    onChange={e => {
                      const newTasks = [...contentData.tasks]
                      newTasks[index].completed = e.target.checked
                      setContentData({ ...contentData, tasks: newTasks })
                    }}
                  />
                  <Input
                    value={task.text}
                    onChange={e => {
                      const newTasks = [...contentData.tasks]
                      newTasks[index].text = e.target.value
                      setContentData({ ...contentData, tasks: newTasks })
                    }}
                    placeholder={`任务 ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    danger
                    size="small"
                    onClick={() => {
                      const newTasks = contentData.tasks.filter((_: any, i: number) => i !== index)
                      setContentData({ ...contentData, tasks: newTasks })
                    }}
                  >
                    删除
                  </Button>
                </div>
              ))}
              <Button
                type="dashed"
                block
                onClick={() => {
                  const newTask = { id: createRecordId(), text: '', completed: false }
                  setContentData({ ...contentData, tasks: [...(contentData.tasks || []), newTask] })
                }}
              >
                + 添加任务
              </Button>
            </div>
          </div>
        )
      case 'quote':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>引用内容</Text>
              <Input.TextArea
                value={contentData.text || ''}
                onChange={e => setContentData({ ...contentData, text: e.target.value })}
                placeholder="请输入引用内容"
                rows={4}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>作者/来源</Text>
              <Input
                value={contentData.author || ''}
                onChange={e => setContentData({ ...contentData, author: e.target.value })}
                placeholder="请输入作者或来源"
              />
            </div>
          </div>
        )
      case 'warning':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>警告类型</Text>
              <Select
                value={contentData.type || 'warning'}
                onChange={v => setContentData({ ...contentData, type: v })}
                options={[
                  { value: 'warning', label: '警告' },
                  { value: 'danger', label: '危险' },
                  { value: 'info', label: '提示' },
                  { value: 'success', label: '成功' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>标题</Text>
              <Input
                value={contentData.title || ''}
                onChange={e => setContentData({ ...contentData, title: e.target.value })}
                placeholder="请输入标题"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>内容</Text>
              <Input.TextArea
                value={contentData.text || ''}
                onChange={e => setContentData({ ...contentData, text: e.target.value })}
                placeholder="请输入内容"
                rows={4}
              />
            </div>
          </div>
        )
      case 'divider':
        return (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>分割线样式</Text>
            <Select
              value={contentData.style || 'solid'}
              onChange={v => setContentData({ ...contentData, style: v })}
              options={[
                { value: 'solid', label: '实线' },
                { value: 'dashed', label: '虚线' },
                { value: 'dotted', label: '点线' },
              ]}
              className="w-full"
            />
          </div>
        )
      case 'highlight':
        return (
          <div className="space-y-4">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>高亮颜色</Text>
              <Select
                value={contentData.color || 'blue'}
                onChange={v => setContentData({ ...contentData, color: v })}
                options={[
                  { value: 'blue', label: '蓝色' },
                  { value: 'green', label: '绿色' },
                  { value: 'yellow', label: '黄色' },
                  { value: 'red', label: '红色' },
                  { value: 'purple', label: '紫色' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>高亮内容</Text>
              <Input.TextArea
                value={contentData.text || ''}
                onChange={e => setContentData({ ...contentData, text: e.target.value })}
                placeholder="请输入高亮内容"
                rows={4}
              />
            </div>
          </div>
        )
      case 'table':
        return (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>表格内容</Text>
            <div className="overflow-auto">
              <table className="w-full border-collapse" style={{ border: `1px solid ${token.colorBorder}` }}>
                <thead>
                  <tr>
                    {(contentData.headers || []).map((header: string, index: number) => (
                      <th key={index} style={{ border: `1px solid ${token.colorBorder}`, padding: 8 }}>
                        <Input
                          value={header}
                          onChange={e => {
                            const newHeaders = [...contentData.headers]
                            newHeaders[index] = e.target.value
                            setContentData({ ...contentData, headers: newHeaders })
                          }}
                          className="border-0 p-0"
                        />
                      </th>
                    ))}
                    <th className="w-10" style={{ border: `1px solid ${token.colorBorder}`, padding: 8 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          setContentData({
                            ...contentData,
                            headers: [...contentData.headers, ''],
                            rows: contentData.rows.map((row: string[]) => [...row, '']),
                          })
                        }}
                      >
                        +
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(contentData.rows || []).map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ border: `1px solid ${token.colorBorder}`, padding: 8 }}>
                          <Input
                            value={cell}
                            onChange={e => {
                              const newRows = [...contentData.rows]
                              newRows[rowIndex][cellIndex] = e.target.value
                              setContentData({ ...contentData, rows: newRows })
                            }}
                            className="border-0 p-0"
                          />
                        </td>
                      ))}
                      <td style={{ border: `1px solid ${token.colorBorder}`, padding: 8 }}>
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            const newRows = contentData.rows.filter((_: any, i: number) => i !== rowIndex)
                            setContentData({ ...contentData, rows: newRows })
                          }}
                        >
                          -
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="dashed"
              block
              className="mt-2"
              onClick={() => {
                const newRow = contentData.headers.map(() => '')
                setContentData({ ...contentData, rows: [...contentData.rows, newRow] })
              }}
            >
              + 添加行
            </Button>
          </div>
        )
      default:
        return <div>未知内容类型</div>
    }
  }

  const contentTypeMenuItems = Object.entries(contentTypeNames).map(([key, name]) => ({
    key,
    icon: contentTypeIcons[key],
    label: name,
    onClick: () => openAddModal(key),
  }))

  const handleSpecialModuleDataChange = useCallback((data: any) => {
    setSpecialModuleData(data)
    onContentDataChange?.(data)
    saveSpecialModuleData(data)
  }, [onContentDataChange, saveSpecialModuleData])

  const renderSpecialModuleEditor = () => {
    switch (module?.template) {
      case 'itinerary':
        return (
          <ItineraryModule 
            value={specialModuleData || []} 
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'expense':
        return (
          <ExpenseModule 
            value={specialModuleData || []} 
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'checklist':
        return (
          <ChecklistModule 
            value={specialModuleData || []} 
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'transport':
        return (
          <TransportModule 
            value={specialModuleData || []} 
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'photo':
        return (
          <PhotoModule 
            value={specialModuleData || []} 
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'tips':
        return (
          <TipsModule
            value={specialModuleData || []}
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'railway':
        return (
          <RailwayModule
            value={specialModuleData || []}
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'timeline':
        return (
          <TimelineModule
            value={specialModuleData || []}
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'notes':
        return (
          <NotesModule
            value={specialModuleData || []}
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'review':
        return (
          <ReviewModule
            value={specialModuleData || []}
            onChange={handleSpecialModuleDataChange}
          />
        )
      case 'seat':
        return (
          <SeatModule
            value={specialModuleData || []}
            onChange={handleSpecialModuleDataChange}
          />
        )
      default:
        return null
    }
  }

  if (!module) {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ background: token.colorBgLayout }}>
        <div className="text-center p-8">
          <Empty 
            description={
              <span style={{ color: token.colorTextSecondary }}>{t('selectModuleFirst') || '请先选择一个模块'}</span>
            } 
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ background: token.colorBgLayout }}>
        <Spin size="large" tip="加载中...">
          <div className="text-center p-8" />
        </Spin>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center rounded-lg" style={{ background: token.colorBgLayout }}>
        <div className="text-center p-8">
          <Empty 
            description={
              <span style={{ color: token.colorTextSecondary }}>{t('loadFailed') || '加载失败'}</span>
            } 
          />
          <Button 
            type="primary" 
            className="mt-4 rounded-lg"
            onClick={() => mutate(module ? `${API_BASE}/content/${module.id}` : null)}
          >
            刷新
          </Button>
        </div>
      </div>
    )
  }

  if (isSpecialModule) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-3" style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <h3 className="m-0" style={{ fontSize: token.fontSizeLG, fontWeight: 600, color: token.colorText }}>
            {module.name}
          </h3>
        </div>
        <div className="flex-1 overflow-auto">
          {renderSpecialModuleEditor()}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3" style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <h3 className="m-0" style={{ fontSize: token.fontSizeLG, fontWeight: 600, color: token.colorText }}>
          {module.name} - {t('contentEditor') || '内容编辑'}
        </h3>
        <Dropdown menu={{ items: contentTypeMenuItems }} trigger={['click']}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
          >
            {t('addContent') || '添加内容'}
          </Button>
        </Dropdown>
      </div>

      <div className="flex-1 overflow-auto">
        {!contents || contents.length === 0 ? (
          <div className="text-center rounded-lg" style={{ padding: `${token.paddingXL}px 0`, background: token.colorBgLayout }}>
            <Empty 
              description={
                <span style={{ color: token.colorTextSecondary }}>{t('noContent') || '暂无内容，点击上方按钮添加'}</span>
              } 
            />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={contents.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {contents.map(content => (
                <SortableContentItem
                  key={content.id}
                  content={content}
                  onEdit={openEditModal}
                  onDelete={handleDeleteContent}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Modal
        title={`${t('add') || '添加'}${contentTypeNames[newContentType] || ''}`}
        open={isAddModalOpen}
        onOk={handleAddContent}
        onCancel={() => {
          setIsAddModalOpen(false)
          setContentData({})
        }}
        confirmLoading={isSubmitting}
        okText={t('confirm') || '确认'}
        cancelText={t('cancel') || '取消'}
        width={700}
      >
        <div className="py-4">{renderContentEditor()}</div>
      </Modal>

      <Modal
        title={`${t('edit') || '编辑'}${contentTypeNames[editingContent?.type || ''] || ''}`}
        open={isEditModalOpen}
        onOk={handleEditContent}
        onCancel={() => {
          setIsEditModalOpen(false)
          setEditingContent(null)
          setContentData({})
        }}
        confirmLoading={isSubmitting}
        okText={t('confirm') || '确认'}
        cancelText={t('cancel') || '取消'}
        width={700}
      >
        <div className="py-4">{renderContentEditor()}</div>
      </Modal>
    </div>
  )
}