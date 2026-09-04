'use client'

import React, { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Button,
  Card,
  Empty,
  Form,
  Modal,
  Typography,
  theme,
  App,
  Dropdown,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const { Text } = Typography

export interface ModuleRecord {
  id: string
  [key: string]: any
}

interface SortableItemProps {
  record: ModuleRecord
  onEdit: (record: ModuleRecord) => void
  onDelete: (id: string) => void
  renderItem: (record: ModuleRecord) => React.ReactNode
}

function SortableItem({ record, onEdit, onDelete, renderItem }: SortableItemProps) {
  const t = useTranslations('GuideEditor')
  const { token } = theme.useToken()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: record.id,
  })
  const [hovered, setHovered] = useState(false)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('edit'),
      onClick: () => onEdit(record),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('delete'),
      danger: true,
      onClick: () => onDelete(record.id),
    },
  ]

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        size="small"
        style={{
          marginBottom: token.marginXS,
          borderColor: hovered ? token.colorPrimaryBorder : token.colorBorderSecondary,
          background: hovered ? token.colorFillQuaternary : token.colorBgContainer,
          transition: `all ${token.motionDurationMid}`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-start gap-3">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing pt-1"
            style={{ color: token.colorTextTertiary }}
            role="button"
            aria-label={t('dragToSort')}
            tabIndex={0}
          >
            <MoreOutlined rotate={90} />
          </div>
          <div className="flex-1 min-w-0">{renderItem(record)}</div>
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />
          </Dropdown>
        </div>
      </Card>
    </div>
  )
}

export interface ModuleBaseProps {
  title: string
  icon?: React.ReactNode
  records: ModuleRecord[]
  onChange: (records: ModuleRecord[]) => void
  renderItem: (record: ModuleRecord) => React.ReactNode
  renderEditForm: (form: any) => React.ReactNode
  getDefaultRecord: () => ModuleRecord
  addButtonText?: string
  modalWidth?: number
  loading?: boolean
}

export default function ModuleBase({
  title,
  icon,
  records,
  onChange,
  renderItem,
  renderEditForm,
  getDefaultRecord,
  addButtonText,
  modalWidth = 600,
  loading,
}: ModuleBaseProps) {
  const t = useTranslations('GuideEditor')
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [editingRecord, setEditingRecord] = useState<ModuleRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formInstance, setFormInstance] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAdd = useCallback(() => {
    const newRecord = getDefaultRecord()
    setEditingRecord(newRecord)
    setIsModalOpen(true)
  }, [getDefaultRecord])

  const handleEdit = useCallback((record: ModuleRecord) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      const updated = records.filter((r) => r.id !== id)
      onChange(updated)
      message.success(t('deleteSuccess'))
    },
    [records, onChange, message, t]
  )

  const handleSave = useCallback(async () => {
    if (!editingRecord) return

    setIsSubmitting(true)
    try {
      let formValues: any = {}
      if (formInstance) {
        try {
          formValues = await formInstance.validateFields()
        } catch {
          setIsSubmitting(false)
          return
        }
      }

      const processedRecord = { ...editingRecord, ...formValues }
      const exists = records.find((r) => r.id === editingRecord.id)
      let updated: ModuleRecord[]
      if (exists) {
        updated = records.map((r) => (r.id === editingRecord.id ? processedRecord : r))
      } else {
        updated = [...records, processedRecord]
      }
      onChange(updated)
      message.success(t('updateSuccess'))
      setIsModalOpen(false)
      setEditingRecord(null)
    } catch (error) {
      message.error(t('updateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }, [editingRecord, records, onChange, formInstance, message, t])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = records.findIndex((r) => r.id === active.id)
        const newIndex = records.findIndex((r) => r.id === over.id)
        onChange(arrayMove(records, oldIndex, newIndex))
      }
    },
    [records, onChange]
  )

  const handleFormReady = useCallback((form: any) => {
    setFormInstance(form)
  }, [])

  const isEditing = editingRecord
    ? records.find((r) => r.id === editingRecord.id)
    : false

  return (
    <div>
      {/* 统一头部 */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: `${token.paddingSM}px ${token.paddingLG}px`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          marginBottom: token.marginMD,
        }}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span style={{ color: token.colorPrimary, fontSize: token.fontSizeLG }}>
              {icon}
            </span>
          )}
          <Text strong style={{ fontSize: token.fontSizeLG }}>
            {title}
          </Text>
          {records.length > 0 && (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              ({records.length})
            </Text>
          )}
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          {addButtonText || t('addRecord') || '添加记录'}
        </Button>
      </div>

      {/* 列表内容 */}
      <div style={{ padding: `0 ${token.paddingLG}px`, minHeight: 200 }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: token.paddingXL }}>
            <Spin />
          </div>
        ) : records.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: token.colorTextSecondary }}>
                {t('noRecords') || '暂无记录，点击上方按钮添加'}
              </span>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {addButtonText || t('addFirst') || '添加第一条'}
            </Button>
          </Empty>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={records.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {records.map((record) => (
                <SortableItem
                  key={record.id}
                  record={record}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  renderItem={renderItem}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 统一编辑弹框 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {icon && <span style={{ color: token.colorPrimary }}>{icon}</span>}
            <span>{isEditing ? t('editRecord') || '编辑记录' : t('addRecord') || '添加记录'}</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingRecord(null)
        }}
        confirmLoading={isSubmitting}
        okText={t('save')}
        cancelText={t('cancel')}
        width={modalWidth}
        destroyOnHidden
      >
        {isModalOpen && (
          <FormWrapper
            initialRecord={editingRecord}
            onFormReady={handleFormReady}
            renderForm={renderEditForm}
          />
        )}
      </Modal>
    </div>
  )
}

// 内部表单包装器
function FormWrapper({
  initialRecord,
  onFormReady,
  renderForm,
}: {
  initialRecord: ModuleRecord | null
  onFormReady: (form: any) => void
  renderForm: (form: any) => React.ReactNode
}) {
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (initialRecord) {
      form.setFieldsValue(initialRecord)
    }
    onFormReady(form)
  }, [initialRecord, form, onFormReady])

  return <Form form={form} layout="vertical">{renderForm(form)}</Form>
}
