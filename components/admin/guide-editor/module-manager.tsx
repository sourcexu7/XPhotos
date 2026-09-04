'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input, Modal, Dropdown, Spin, Empty, App, theme, Tag, Typography } from 'antd'
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  EnvironmentOutlined,
  CoffeeOutlined,
  BulbOutlined,
  NodeIndexOutlined,
  FieldTimeOutlined,
  WarningOutlined,
  StarOutlined,
  CameraOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useSWR, { mutate } from 'swr'

const { Text } = Typography

const API_BASE = '/api/v1/guide-modules'

interface Module {
  id: string
  guide_id: string
  name: string
  template: string | null
  sort: number
  is_hidden: boolean
  createdAt: string
  updatedAt: string | null
  contents?: Content[]
  moduleData?: any
}

interface Content {
  id: string
  module_id: string
  type: string
  content: any
  sort: number
}

const templateIcons: Record<string, React.ReactNode> = {
  itinerary: <CalendarOutlined />,
  expense: <DollarOutlined />,
  checklist: <CheckSquareOutlined />,
  transport: <CalendarOutlined />,
  photo: <EnvironmentOutlined />,
  tips: <BulbOutlined />,
  attraction: <EnvironmentOutlined />,
  food: <CoffeeOutlined />,
  railway: <NodeIndexOutlined />,
  timeline: <FieldTimeOutlined />,
  notes: <WarningOutlined />,
  review: <StarOutlined />,
  seat: <CameraOutlined />,
}

const templateNames: Record<string, string> = {
  itinerary: '行程安排',
  expense: '费用预算',
  checklist: '准备清单',
  transport: '交通信息',
  photo: '摄影攻略',
  tips: '特别提示',
  attraction: '景点介绍',
  food: '美食推荐',
  railway: '铁路信息',
  timeline: '交通时间线',
  notes: '注意事项',
  review: '景点点评',
  seat: '摄影机位推荐',
}

const getTemplateColor = (template: string | null, token: any) => {
  const colorMap: Record<string, string> = {
    itinerary: token.colorPrimary,
    expense: token.colorSuccess,
    checklist: token.colorWarning,
    transport: token.colorInfo,
    photo: token.colorError,
    tips: token.colorWarning,
    attraction: token.colorTextSecondary,
    food: token.colorError,
    railway: token.colorInfo,
    timeline: token.colorPrimary,
    notes: token.colorWarning,
    review: token.colorSuccess,
    seat: token.colorInfo,
  }
  return { color: colorMap[template || ''] || token.colorTextTertiary }
}

interface SortableModuleItemProps {
  module: Module
  onEdit: (module: Module) => void
  onDelete: (id: string) => void
  onSelect: (module: Module) => void
  isSelected: boolean
}

function SortableModuleItem({ module, onEdit, onDelete, onSelect, isSelected }: SortableModuleItemProps) {
  const t = useTranslations('GuideEditor')
  const { token } = theme.useToken()
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('edit') || '编辑',
      onClick: () => onEdit(module),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('delete') || '删除',
      danger: true,
      onClick: () => onDelete(module.id),
    },
  ]

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="flex items-stretch mb-3 rounded-lg border overflow-hidden transition-all duration-200"
        style={{
          borderColor: isSelected ? token.colorPrimary : token.colorBorderSecondary,
          background: isSelected ? token.colorPrimaryBg : (hovered ? token.colorFillQuaternary : 'transparent'),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 拖拽手柄 */}
        <div
          {...listeners}
          className="flex items-center justify-center cursor-grab active:cursor-grabbing px-2"
          style={{
            background: hovered || isSelected ? token.colorFillSecondary : 'transparent',
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
          role="button"
          aria-label={t('dragToSort') || '拖拽调整顺序'}
          tabIndex={0}
        >
          <HolderOutlined style={{ color: token.colorTextTertiary }} />
        </div>
        {/* 可点击的内容区 */}
        <div
          className="flex items-center gap-3 flex-1 min-w-0 p-4 cursor-pointer"
          onClick={() => onSelect(module)}
          aria-selected={isSelected}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(module) } }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span style={getTemplateColor(module.template, token)} className="shrink-0">
              {(module.template && templateIcons[module.template]) || <FileTextOutlined />}
            </span>
            <span className="font-medium whitespace-nowrap" style={{ fontSize: token.fontSize, color: token.colorText }}>{module.name}</span>
            {module.template && module.name !== templateNames[module.template] && (
              <Tag style={{ margin: 0, fontSize: token.fontSizeSM, lineHeight: '18px', padding: '0 8px', borderRadius: 999 }} className="shrink-0 whitespace-nowrap">
                {templateNames[module.template] || module.template}
              </Tag>
            )}
          </div>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} style={{ color: token.colorTextTertiary }} className="shrink-0" />
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

interface ModuleManagerProps {
  guideId: string
  onModuleSelect: (module: Module | null) => void
  selectedModule: Module | null
}

export default function ModuleManager({ guideId, onModuleSelect, selectedModule }: ModuleManagerProps) {
  const t = useTranslations('GuideEditor')
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleName, setModuleName] = useState('')
  const [moduleTemplate, setModuleTemplate] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data: modules, isLoading, error } = useSWR<Module[]>(`${API_BASE}/module/${guideId}`, async (url: string) => {
    const res = await fetch(url, { credentials: 'include' })
    const json = await res.json()
    return json.data || []
  })

  const handleAddModule = async () => {
    if (!moduleName.trim()) {
      message.warning(t('pleaseInputModuleName') || '请输入模块名称')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/module`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: guideId,
          name: moduleName.trim(),
          template: moduleTemplate,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('handleAddModule failed:', res.status, errText)
        throw new Error('Failed to create module')
      }

      message.success(t('createSuccess') || '创建成功')
      setIsAddModalOpen(false)
      setModuleName('')
      setModuleTemplate(null)
      mutate(`${API_BASE}/module/${guideId}`)
    } catch (error) {
      console.error('handleAddModule error:', error)
      message.error(t('createFailed') || '创建失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditModule = async () => {
    if (!editingModule || !moduleName.trim()) {
      message.warning(t('pleaseInputModuleName') || '请输入模块名称')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/module/${editingModule.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: moduleName.trim(),
          template: moduleTemplate,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('handleEditModule failed:', res.status, errText)
        throw new Error('Failed to update module')
      }

      message.success(t('updateSuccess') || '更新成功')
      setIsEditModalOpen(false)
      setEditingModule(null)
      setModuleName('')
      setModuleTemplate(null)
      mutate(`${API_BASE}/module/${guideId}`)
      
      if (selectedModule?.id === editingModule.id) {
        onModuleSelect({ ...editingModule, name: moduleName.trim(), template: moduleTemplate })
      }
    } catch (error) {
      console.error('handleEditModule error:', error)
      message.error(t('updateFailed') || '更新失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    Modal.confirm({
      title: t('confirmDelete') || '确认删除',
      content: t('confirmDeleteModule') || '确定要删除这个模块吗？模块内的所有内容都将被删除。',
      okText: t('confirm') || '确认',
      cancelText: t('cancel') || '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await fetch(`${API_BASE}/module/${moduleId}`, {
            method: 'DELETE',
            credentials: 'include',
          })

          if (!res.ok) throw new Error('Failed to delete module')

          message.success(t('deleteSuccess') || '删除成功')
          mutate(`${API_BASE}/module/${guideId}`)
          
          if (selectedModule?.id === moduleId) {
            onModuleSelect(null)
          }
        } catch (error) {
          console.error('handleDeleteModule error:', error)
          message.error(t('deleteFailed') || '删除失败')
        }
      },
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && modules) {
      const oldIndex = modules.findIndex(m => m.id === active.id)
      const newIndex = modules.findIndex(m => m.id === over.id)
      const newModules = arrayMove(modules, oldIndex, newIndex)

      mutate(`${API_BASE}/module/${guideId}`, newModules, false)

      try {
        await fetch(`${API_BASE}/module/sort`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_ids: newModules.map(m => m.id),
          }),
        })
      } catch (error) {
        console.error('handleDragEnd error:', error)
        mutate(`${API_BASE}/module/${guideId}`)
      }
    }
  }

  const openEditModal = (module: Module) => {
    setEditingModule(module)
    setModuleName(module.name)
    setModuleTemplate(module.template)
    setIsEditModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="加载中...">
          <div className="text-center p-8" />
        </Spin>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <Empty 
            description={
              <span style={{ color: token.colorTextSecondary }}>{t('loadFailed') || '加载失败'}</span>
            } 
          />
          <Button 
            type="primary" 
            className="mt-4 rounded-lg"
            onClick={() => mutate(`${API_BASE}/module/${guideId}`)}
          >
            刷新
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-3" style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <h3 className="m-0" style={{ fontSize: token.fontSizeLG, fontWeight: 600, color: token.colorText }}>{t('moduleManager') || '模块管理'}</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalOpen(true)}
        >
          {t('addModule') || '添加模块'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {!modules || modules.length === 0 ? (
          <div className="text-center py-12">
            <Empty 
              description={
                <span style={{ color: token.colorTextSecondary }}>{t('noModules') || '暂无模块，点击上方按钮添加'}</span>
              } 
            />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {modules.map(module => (
                <SortableModuleItem
                  key={module.id}
                  module={module}
                  onEdit={openEditModal}
                  onDelete={handleDeleteModule}
                  onSelect={onModuleSelect}
                  isSelected={selectedModule?.id === module.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Modal
        title={t('addModule') || '添加模块'}
        open={isAddModalOpen}
        onOk={handleAddModule}
        onCancel={() => {
          setIsAddModalOpen(false)
          setModuleName('')
          setModuleTemplate(null)
        }}
        confirmLoading={isSubmitting}
        okText={t('confirm') || '确认'}
        cancelText={t('cancel') || '取消'}
        width={600}
      >
        <div className="py-4">
          <div className="mb-6">
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('moduleName') || '模块名称'}</Text>
            <Input
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              placeholder={t('inputModuleName') || '请输入模块名称'}
              className="rounded-lg"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>{t('moduleTemplate') || '模块模板'}</Text>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(templateNames).map(([key, name]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-3 rounded-lg cursor-pointer"
                  style={{
                    border: `1px solid ${moduleTemplate === key ? token.colorPrimary : token.colorBorderSecondary}`,
                    background: moduleTemplate === key ? token.colorPrimaryBg : token.colorBgContainer,
                    transition: `all ${token.motionDurationMid}`,
                  }}
                  onClick={() => setModuleTemplate(key)}
                >
                  <span style={getTemplateColor(key, token)}>
                    {templateIcons[key]}
                  </span>
                  <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{name}</span>
                </div>
              ))}
              <div
                className="flex items-center gap-2 p-3 rounded-lg cursor-pointer"
                style={{
                  border: `1px solid ${moduleTemplate === null ? token.colorPrimary : token.colorBorderSecondary}`,
                  background: moduleTemplate === null ? token.colorPrimaryBg : token.colorBgContainer,
                  transition: `all ${token.motionDurationMid}`,
                }}
                onClick={() => setModuleTemplate(null)}
              >
                <FileTextOutlined style={{ color: token.colorTextSecondary }} />
                <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{t('custom') || '自定义'}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={t('editModule') || '编辑模块'}
        open={isEditModalOpen}
        onOk={handleEditModule}
        onCancel={() => {
          setIsEditModalOpen(false)
          setEditingModule(null)
          setModuleName('')
          setModuleTemplate(null)
        }}
        confirmLoading={isSubmitting}
        okText={t('confirm') || '确认'}
        cancelText={t('cancel') || '取消'}
        width={600}
      >
        <div className="py-4">
          <div className="mb-6">
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('moduleName') || '模块名称'}</Text>
            <Input
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              placeholder={t('inputModuleName') || '请输入模块名称'}
              className="rounded-lg"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>{t('moduleTemplate') || '模块模板'}</Text>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(templateNames).map(([key, name]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 p-3 rounded-lg cursor-pointer"
                  style={{
                    border: `1px solid ${moduleTemplate === key ? token.colorPrimary : token.colorBorderSecondary}`,
                    background: moduleTemplate === key ? token.colorPrimaryBg : token.colorBgContainer,
                    transition: `all ${token.motionDurationMid}`,
                  }}
                  onClick={() => setModuleTemplate(key)}
                >
                  <span style={getTemplateColor(key, token)}>
                    {templateIcons[key]}
                  </span>
                  <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{name}</span>
                </div>
              ))}
              <div
                className="flex items-center gap-2 p-3 rounded-lg cursor-pointer"
                style={{
                  border: `1px solid ${moduleTemplate === null ? token.colorPrimary : token.colorBorderSecondary}`,
                  background: moduleTemplate === null ? token.colorPrimaryBg : token.colorBgContainer,
                  transition: `all ${token.motionDurationMid}`,
                }}
                onClick={() => setModuleTemplate(null)}
              >
                <FileTextOutlined style={{ color: token.colorTextSecondary }} />
                <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{t('custom') || '自定义'}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}