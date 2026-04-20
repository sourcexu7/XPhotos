'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, Button, Input, Modal, Dropdown, Spin, Empty, App } from 'antd'
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  HolderOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  EnvironmentOutlined,
  CoffeeOutlined,
  BulbOutlined
} from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useSWR, { mutate } from 'swr'

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
}

const getTemplateColor = (template: string | null) => {
  const colorMap: Record<string, string> = {
    itinerary: 'text-blue-500',
    expense: 'text-green-500',
    checklist: 'text-orange-500',
    transport: 'text-purple-500',
    photo: 'text-pink-500',
    tips: 'text-yellow-500',
    attraction: 'text-teal-500',
    food: 'text-red-500',
  }
  return colorMap[template || ''] || 'text-gray-500'
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
        className={`cursor-pointer transition-all duration-200 mb-3 p-4 rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        onClick={() => onSelect(module)}
      >
        <div className="flex items-center gap-3">
          <div {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <HolderOutlined />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={getTemplateColor(module.template)}>
              {module.template && templateIcons[module.template]}
              {!module.template && <FileTextOutlined />}
            </span>
            <span className="truncate font-medium text-gray-800">{module.name}</span>
            {module.template && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                {templateNames[module.template] || module.template}
              </span>
            )}
          </div>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-gray-600" />
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
    const res = await fetch(url)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide_id: guideId,
          name: moduleName.trim(),
          template: moduleTemplate,
        }),
      })

      if (!res.ok) throw new Error('Failed to create module')

      message.success(t('createSuccess') || '创建成功')
      setIsAddModalOpen(false)
      setModuleName('')
      setModuleTemplate(null)
      mutate(`${API_BASE}/module/${guideId}`)
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: moduleName.trim(),
          template: moduleTemplate,
        }),
      })

      if (!res.ok) throw new Error('Failed to update module')

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
          })

          if (!res.ok) throw new Error('Failed to delete module')

          message.success(t('deleteSuccess') || '删除成功')
          mutate(`${API_BASE}/module/${guideId}`)
          
          if (selectedModule?.id === moduleId) {
            onModuleSelect(null)
          }
        } catch (error) {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module_ids: newModules.map(m => m.id),
          }),
        })
      } catch (error) {
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
              <span className="text-gray-600">{t('loadFailed') || '加载失败'}</span>
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
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 m-0">{t('moduleManager') || '模块管理'}</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          {t('addModule') || '添加模块'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {!modules || modules.length === 0 ? (
          <div className="text-center py-12">
            <Empty 
              description={
                <span className="text-gray-600">{t('noModules') || '暂无模块，点击上方按钮添加'}</span>
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
        className="rounded-xl"
        width={600}
      >
        <div className="py-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('moduleName') || '模块名称'}</label>
            <Input
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              placeholder={t('inputModuleName') || '请输入模块名称'}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('moduleTemplate') || '模块模板'}</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(templateNames).map(([key, name]) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${moduleTemplate === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => setModuleTemplate(key)}
                >
                  <span className={getTemplateColor(key)}>
                    {templateIcons[key]}
                  </span>
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              ))}
              <div
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${moduleTemplate === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setModuleTemplate(null)}
              >
                <FileTextOutlined className="text-gray-500" />
                <span className="text-sm text-gray-700">{t('custom') || '自定义'}</span>
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
        className="rounded-xl"
        width={600}
      >
        <div className="py-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('moduleName') || '模块名称'}</label>
            <Input
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              placeholder={t('inputModuleName') || '请输入模块名称'}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('moduleTemplate') || '模块模板'}</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(templateNames).map(([key, name]) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${moduleTemplate === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => setModuleTemplate(key)}
                >
                  <span className={getTemplateColor(key)}>
                    {templateIcons[key]}
                  </span>
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              ))}
              <div
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${moduleTemplate === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setModuleTemplate(null)}
              >
                <FileTextOutlined className="text-gray-500" />
                <span className="text-sm text-gray-700">{t('custom') || '自定义'}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}