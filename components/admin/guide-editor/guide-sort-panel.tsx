'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Table,
  Button,
  Space,
  message,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface Guide {
  id: string
  title: string
  country: string
  city: string
  days: number
  show: number
  sort: number
  createdAt: string
}

interface GuideSortPanelProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function GuideSortPanel({ open, onClose, onSuccess }: GuideSortPanelProps) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSorts, setOriginalSorts] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    if (open) {
      fetchGuides()
    }
  }, [open])

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/guides/list')
      const result = await res.json()
      if (result.data) {
        const sortedGuides = result.data.sort((a: Guide, b: Guide) => a.sort - b.sort)
        setGuides(sortedGuides)
        // 保存原始排序值用于检测变更
        const sorts = new Map<string, number>()
        sortedGuides.forEach((guide: Guide) => sorts.set(guide.id, guide.sort))
        setOriginalSorts(sorts)
        setHasChanges(false)
      }
    } catch (error) {
      message.error('获取攻略列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const newGuides = [...guides]
    ;[newGuides[index - 1], newGuides[index]] = [newGuides[index], newGuides[index - 1]]
    // 更新排序值
    newGuides.forEach((guide, i) => {
      guide.sort = i
    })
    setGuides(newGuides)
    checkChanges(newGuides)
  }

  const moveDown = (index: number) => {
    if (index >= guides.length - 1) return
    const newGuides = [...guides]
    ;[newGuides[index], newGuides[index + 1]] = [newGuides[index + 1], newGuides[index]]
    // 更新排序值
    newGuides.forEach((guide, i) => {
      guide.sort = i
    })
    setGuides(newGuides)
    checkChanges(newGuides)
  }

  const moveToTop = (index: number) => {
    if (index <= 0) return
    const newGuides = [...guides]
    const [item] = newGuides.splice(index, 1)
    newGuides.unshift(item)
    // 更新排序值
    newGuides.forEach((guide, i) => {
      guide.sort = i
    })
    setGuides(newGuides)
    checkChanges(newGuides)
  }

  const moveToBottom = (index: number) => {
    if (index >= guides.length - 1) return
    const newGuides = [...guides]
    const [item] = newGuides.splice(index, 1)
    newGuides.push(item)
    // 更新排序值
    newGuides.forEach((guide, i) => {
      guide.sort = i
    })
    setGuides(newGuides)
    checkChanges(newGuides)
  }

  const checkChanges = (newGuides: Guide[]) => {
    let changed = false
    newGuides.forEach((guide) => {
      if (originalSorts.get(guide.id) !== guide.sort) {
        changed = true
      }
    })
    setHasChanges(changed)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const sorts = guides.map((guide) => ({
        id: guide.id,
        sort: guide.sort,
      }))

      const res = await fetch('/api/v1/guides/batch-sort', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sorts }),
      })

      if (res.ok) {
        message.success('排序保存成功')
        setHasChanges(false)
        // 更新原始排序值
        const sorts = new Map<string, number>()
        guides.forEach((guide) => sorts.set(guide.id, guide.sort))
        setOriginalSorts(sorts)
        onSuccess?.()
      } else {
        message.error('排序保存失败')
      }
    } catch (error) {
      message.error('排序保存失败')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      const res = await fetch('/api/v1/guides/reset-sort', {
        method: 'POST',
      })

      if (res.ok) {
        message.success('排序已重置')
        fetchGuides()
        onSuccess?.()
      } else {
        message.error('重置失败')
      }
    } catch (error) {
      message.error('重置失败')
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
          <div className="text-gray-500 text-xs mt-1">
            {record.country} · {record.city}
          </div>
        </div>
      ),
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 80,
      render: (days: number) => <Tag color="blue">{days}天</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'show',
      key: 'show',
      width: 80,
      render: (show: number) => (
        <Tag color={show === 1 ? 'green' : 'red'}>{show === 1 ? '公开' : '隐藏'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, __: Guide, index: number) => (
        <Space size="small">
          <Tooltip title="置顶">
            <Button
              type="text"
              size="small"
              icon={<VerticalAlignTopOutlined />}
              disabled={index === 0}
              onClick={() => moveToTop(index)}
            />
          </Tooltip>
          <Tooltip title="上移">
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              onClick={() => moveUp(index)}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={index === guides.length - 1}
              onClick={() => moveDown(index)}
            />
          </Tooltip>
          <Tooltip title="置底">
            <Button
              type="text"
              size="small"
              icon={<VerticalAlignBottomOutlined />}
              disabled={index === guides.length - 1}
              onClick={() => moveToBottom(index)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <span>管理攻略排序</span>
          {hasChanges && (
            <Tag color="orange">有未保存的更改</Tag>
          )}
        </div>
      }
      open={open}
      onCancel={() => {
        if (hasChanges) {
          Modal.confirm({
            title: '确认关闭？',
            content: '您有未保存的排序更改，确定要关闭吗？',
            okText: '确定',
            cancelText: '取消',
            onOk: onClose,
          })
        } else {
          onClose()
        }
      }}
      width={900}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchGuides}>
          刷新
        </Button>,
        <Popconfirm
          key="reset"
          title="确定重置排序吗？"
          description="将按创建时间降序重新排列所有攻略"
          onConfirm={handleReset}
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<ReloadOutlined />}>重置排序</Button>
        </Popconfirm>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          disabled={!hasChanges}
          onClick={handleSave}
        >
          保存排序
        </Button>,
      ]}
    >
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <Text type="secondary" className="text-sm">
          💡 提示：使用操作按钮调整攻略显示顺序，数值越小越靠前。调整完成后点击"保存排序"生效。
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={guides}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        scroll={{ y: 500 }}
      />

      <div className="mt-4 text-gray-500 text-sm">
        共 {guides.length} 个攻略
      </div>
    </Modal>
  )
}
