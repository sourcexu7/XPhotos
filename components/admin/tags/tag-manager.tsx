'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { fetcher } from '~/lib/utils/fetcher'
import { Input, Button, Tag, Popconfirm, App, Spin, Row, Col, Card, Space, Typography, theme, Empty, Badge, Tooltip, Modal, Select } from 'antd'
import { PlusOutlined, EditOutlined, SwapOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

type TagItem = { id: string; name: string }
type TagTreeNode = { id?: string | null; category: string | null; children: TagItem[] }

export default function TagManager() {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const t = useTranslations('TagManager')
  const [tree, setTree] = useState<TagTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [addingPrimary, setAddingPrimary] = useState(false)
  const [addingSecondary, setAddingSecondary] = useState(false)
  // 交互状态
  const [hoverPrimaryIdx, setHoverPrimaryIdx] = useState<number | null>(null)
  const [hoverSecondaryIdx, setHoverSecondaryIdx] = useState<number | null>(null)

  const [primaryName, setPrimaryName] = useState('')
  const [secondaryName, setSecondaryName] = useState('')
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null)

  // inline edit states
  const [editingPrimaryKey, setEditingPrimaryKey] = useState<string | null>(null)
  const [editingPrimaryValue, setEditingPrimaryValue] = useState<string>('')
  const [editingSecondaryId, setEditingSecondaryId] = useState<string | null>(null)
  const [editingSecondaryValue, setEditingSecondaryValue] = useState<string>('')

  // move tag states
  const [movingTagId, setMovingTagId] = useState<string | null>(null)
  const [movingTagName, setMovingTagName] = useState<string>('')
  const [targetParentId, setTargetParentId] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)

  const loadTree = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetcher('/api/v1/settings/tags/get?tree=true')
      if (res?.data) setTree(res.data)
    } catch (_err) {
      message.error(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [message, t])

  useEffect(() => { loadTree() }, [loadTree])

  // derive selected primary node name from id for display
  const selectedPrimaryNode = tree.find(n => n.id === selectedPrimary)
  const selectedPrimaryName = selectedPrimaryNode?.category ?? ''

  // 当前未提供搜索，直接使用完整树列表
  const filteredTree = useMemo(() => tree, [tree])

  const addPrimary = async () => {
    if (!primaryName?.trim()) return message.warning(t('inputPrimaryTagName'))
    setAddingPrimary(true)
    try {
      const res = await fetch('/api/v1/settings/tags/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: primaryName.trim() })
      }).then(r => r.json())
      if (res?.code === 200) {
        message.success(t('addPrimarySuccess'))
        const newId = res?.data?.id
        setPrimaryName('')
        await loadTree()
        // auto-select the newly created parent so user can immediately add children
        if (newId) setSelectedPrimary(newId)
      } else message.error(res?.message || t('addFailed'))
    } catch (_e) { message.error(t('addFailed')) } finally { setAddingPrimary(false) }
  }

  const addSecondary = async () => {
    if (!selectedPrimary) return message.warning(t('selectPrimaryCategoryFirst'))
    if (!secondaryName?.trim()) return message.warning(t('inputSecondaryTagName'))
    setAddingSecondary(true)
    try {
      const res = await fetch('/api/v1/settings/tags/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: secondaryName.trim(), parentId: selectedPrimary })
      }).then(r => r.json())
      if (res?.code === 200) {
        message.success(t('addSecondarySuccess'))
        setSecondaryName('')
        await loadTree()
      } else message.error(res?.message || t('addFailed'))
    } catch (_e) { message.error(t('addFailed')) } finally { setAddingSecondary(false) }
  }

  const removeTag = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/settings/tags/delete/${id}`, { method: 'DELETE' }).then(r => r.json())
      if (res?.code === 200) {
        message.success(t('deleteSuccess'))
        await loadTree()
        setSelectedPrimary(null)
      } else message.error(res?.message || t('deleteFailed'))
    } catch (_err) {
      message.error(t('deleteFailed'))
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(t('copySuccess'))
    } catch (_err) {
      message.error(t('copyFailed'))
    }
  }

  const startEditPrimary = (node: TagTreeNode) => {
    if (!node.id) return message.warning(t('cannotEditNoRecord'))
    setEditingPrimaryKey(node.id)
    setEditingPrimaryValue(node.category ?? '')
  }

  const savePrimaryEdit = async () => {
    if (!editingPrimaryKey) return
    const name = editingPrimaryValue?.trim()
    if (!name) return message.warning(t('inputTagName'))
    try {
      const res = await fetch(`/api/v1/settings/tags/update/${editingPrimaryKey}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category: name }) }).then(r => r.json())
      if (res?.code === 200) {
        message.success(t('updateSuccess'))
        setEditingPrimaryKey(null)
        setEditingPrimaryValue('')
        await loadTree()
      } else message.error(res?.message || t('updateFailed'))
    } catch (_e) { message.error(t('updateFailed')) }
  }

  const cancelPrimaryEdit = () => { setEditingPrimaryKey(null); setEditingPrimaryValue('') }

  const startEditSecondary = (tagItem: TagItem) => {
    setEditingSecondaryId(tagItem.id)
    setEditingSecondaryValue(tagItem.name)
  }

  const saveSecondaryEdit = async () => {
    if (!editingSecondaryId) return
    const name = editingSecondaryValue?.trim()
    if (!name) return message.warning(t('inputTagName'))
    try {
      const res = await fetch(`/api/v1/settings/tags/update/${editingSecondaryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then(r => r.json())
      if (res?.code === 200) {
        message.success(t('updateSuccess'))
        setEditingSecondaryId(null)
        setEditingSecondaryValue('')
        await loadTree()
      } else message.error(res?.message || t('updateFailed'))
    } catch (_e) { message.error(t('updateFailed')) }
  }

  const cancelSecondaryEdit = () => { setEditingSecondaryId(null); setEditingSecondaryValue('') }

  // 打开移动对话框（支持一级标签和二级标签）
  const openMoveModal = (node: TagTreeNode, secondaryTagId?: string, secondaryTagName?: string) => {
    if (secondaryTagId && secondaryTagName) {
      // 二级标签移动
      setMovingTagId(secondaryTagId)
      setMovingTagName(secondaryTagName)
      setTargetParentId(null)
    } else if (node.id) {
      // 一级标签移动
      setMovingTagId(node.id)
      setMovingTagName(node.category ?? '')
      setTargetParentId(null)
    } else {
      message.warning(t('cannotMoveNoRecord'))
    }
  }

  // 确认移动（使用新的API接口，包含验证和图片标签同步）
  const confirmMove = async () => {
    if (!movingTagId) return

    setMoving(true)
    try {
      const res = await fetch('/api/v1/settings/tags/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: movingTagId,
          targetParentId: targetParentId || null
        })
      }).then(r => r.json())

      if (res?.code === 200) {
        message.success(t('moveSuccess'))
        setMovingTagId(null)
        setMovingTagName('')
        setTargetParentId(null)
        await loadTree()
        // 如果移动后标签变成了二级标签，自动选中其父标签
        if (targetParentId) {
          setSelectedPrimary(targetParentId)
        } else {
          setSelectedPrimary(null)
        }
      } else {
        message.error(res?.message || t('moveFailed'))
      }
    } catch (_e) {
      message.error(t('moveFailed'))
    } finally {
      setMoving(false)
    }
  }

  // 取消移动
  const cancelMove = () => {
    setMovingTagId(null)
    setMovingTagName('')
    setTargetParentId(null)
  }

  // 历史图片标签补全检查
  const [checkingCompleteness, setCheckingCompleteness] = useState(false)
  const checkTagCompleteness = async () => {
    setCheckingCompleteness(true)
    try {
      const res = await fetch('/api/v1/settings/tags/check-completeness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 100 })
      }).then(r => r.json())

      if (res?.code === 200) {
        const data = res.data
        let msg = t('checkComplete', {
          total: data.totalImages,
          fixed: data.fixedImages,
          invalid: data.invalidRelations
        })
        if (data.totalCreatedTags && data.totalCreatedTags > 0) {
          msg += ' ' + t('createdTags', { count: data.totalCreatedTags })
        }
        message.success(msg)
        if (data.errors && data.errors.length > 0) {
          console.warn('部分图片处理失败:', data.errors)
        }
      } else {
        message.error(res?.message || t('checkFailed'))
      }
    } catch (_e) {
      message.error(t('checkFailed'))
    } finally {
      setCheckingCompleteness(false)
    }
  }

  // 清理孤立标签
  const [cleaningOrphan, setCleaningOrphan] = useState(false)
  const [orphanTags, setOrphanTags] = useState<{ id: string; name: string; category: string | null; parentId: string | null }[]>([])
  const [showOrphanModal, setShowOrphanModal] = useState(false)

  const loadOrphanTags = async () => {
    try {
      const res = await fetch('/api/v1/settings/tags/orphan').then(r => r.json())
      if (res?.code === 200) {
        setOrphanTags(res.data)
      }
    } catch (_e) {
      message.error(t('loadOrphanFailed'))
    }
  }

  const cleanupOrphanTags = async () => {
    setCleaningOrphan(true)
    try {
      const res = await fetch('/api/v1/settings/tags/cleanup-orphan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json())

      if (res?.code === 200) {
        const data = res.data
        message.success(
          t('cleanupOrphanSuccess', {
            count: data.cleanedCount,
            tags: data.cleanedTags.join(', ')
          })
        )
        setOrphanTags([])
        setShowOrphanModal(false)
        await loadTree()
      } else {
        message.error(res?.message || t('cleanupOrphanFailed'))
      }
    } catch (_e) {
      message.error(t('cleanupOrphanFailed'))
    } finally {
      setCleaningOrphan(false)
    }
  }

  

  return (
    <div style={{ padding: token.paddingMD }}>
      <Space orientation="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>{t('title')}</Typography.Title>
          <Space size={8}>
            <Button
              type="default"
              onClick={() => { loadOrphanTags(); setShowOrphanModal(true) }}
              icon={<DeleteOutlined />}
            >
              {t('cleanupOrphan')}
            </Button>
            <Button
              type="default"
              onClick={checkTagCompleteness}
              loading={checkingCompleteness}
              icon={<SyncOutlined />}
            >
              {t('completenessCheck')}
            </Button>
          </Space>
        </div>
        <Row gutter={token.margin}>
          <Col xs={24} md={8} lg={7} xl={6}>
            <Card
              size="small"
              styles={{ body: { padding: token.paddingSM } }}
              title={<Typography.Text strong>{t('primaryTags')}</Typography.Text>}
              extra={
                <Space.Compact style={{ width: 220 }}>
                  <Input
                    size="small"
                    placeholder={t('newPrimaryTag')}
                    value={primaryName}
                    onChange={e => setPrimaryName(e.target.value)}
                    onPressEnter={addPrimary}
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addPrimary}
                    loading={addingPrimary}
                  >{t('add')}</Button>
                </Space.Compact>
              }
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={token.margin}>
                <Spin spinning={loading}>
                  {filteredTree.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noPrimaryTags')} style={{ margin: token.marginLG }} />
                  ) : (
                    <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, overflow: 'hidden' }}>
                      {filteredTree.map((node, i) => (
                        <div
                          key={String(node.id ?? node.category ?? 'uncat')}
                          onMouseEnter={() => setHoverPrimaryIdx(i)}
                          onMouseLeave={() => setHoverPrimaryIdx(null)}
                          onClick={editingPrimaryKey ? undefined : () => setSelectedPrimary(node.id ?? null)}
                          style={{
                            cursor: editingPrimaryKey ? 'default' : 'pointer',
                            background: selectedPrimary === node.id ? token.colorFillAlter : (hoverPrimaryIdx === i ? token.colorFillSecondary : undefined),
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            borderBottom: i === filteredTree.length - 1 ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                            transition: 'background-color .2s'
                          }}
                        >
                          {editingPrimaryKey === node.id ? (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                              <Input size="small" value={editingPrimaryValue} onChange={e => { e.stopPropagation?.(); setEditingPrimaryValue(e.target.value) }} onPressEnter={savePrimaryEdit} />
                              <Space size={4}>
                                <Button size="small" type="primary" onClick={savePrimaryEdit}>{t('save')}</Button>
                                <Button size="small" onClick={cancelPrimaryEdit}>{t('cancel')}</Button>
                              </Space>
                            </div>
                          ) : (
                            <>
                              <Space size={6} style={{ marginInlineEnd: 'auto' }}>
                                <Typography.Text strong ellipsis>{node.category ?? t('uncategorized')}</Typography.Text>
                                <Tooltip title={t('childTagCount')}>
                                  <Badge count={node.children.length} size="small" style={{ backgroundColor: token.colorPrimary }} />
                                </Tooltip>
                              </Space>
                              <Space size={6}>
                                <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); startEditPrimary(node) }}>{t('edit')}</Button>
                                <Button type="link" size="small" icon={<SwapOutlined />} onClick={(e) => { e.stopPropagation(); openMoveModal(node) }}>{t('move')}</Button>
                                <Popconfirm
                                  title={node.id ? (node.children && node.children.length > 0 ? t('confirmDeletePrimaryWithChildren') : t('confirmDeletePrimary')) : t('confirmDeleteUncategorized')}
                                  onConfirm={async (e?: React.MouseEvent) => {
                                    e?.stopPropagation?.()
                                    try {
                                      if (node.id) {
                                        if (node.children && node.children.length > 0) {
                                          await fetch(`/api/v1/settings/tags/delete-with-children/${node.id}`, { method: 'DELETE' }).then(r => r.json())
                                        } else {
                                          await fetch(`/api/v1/settings/tags/delete/${node.id}`, { method: 'DELETE' }).then(r => r.json())
                                        }
                                      } else {
                                        const childIds = node.children?.map(child => child.id) || []
                                        if (childIds.length > 0) {
                                          await fetch('/api/v1/settings/tags/batch-delete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ ids: childIds })
                                          }).then(r => r.json())
                                        }
                                      }
                                      message.success(t('deleteSuccess'))
                                      await loadTree()
                                      setSelectedPrimary(null)
                                    } catch (err) {
                                      message.error(t('deleteFailed'))
                                    }
                                  }}
                                  okText={t('confirm')}
                                  cancelText={t('cancel')}
                                >
                                  <Button danger type="link" size="small">{t('delete')}</Button>
                                </Popconfirm>
                              </Space>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Spin>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={16} lg={17} xl={18}>
            <Card size="small" styles={{ body: { padding: token.paddingSM } }} title={<Typography.Text strong>{t('secondaryTags')}{selectedPrimary ? ` — ${selectedPrimaryName}` : ''}</Typography.Text>}>
              {!selectedPrimary ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('selectPrimaryTag')} style={{ margin: token.marginXL }} />
              ) : (
                <Space orientation="vertical" style={{ width: '100%' }} size={token.margin}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input placeholder={t('addUnderCategory', { name: selectedPrimaryName })} value={secondaryName} onChange={e => setSecondaryName(e.target.value)} onPressEnter={addSecondary} />
                    <Button type="primary" icon={<PlusOutlined />} onClick={addSecondary} loading={addingSecondary}>{t('add')}</Button>
                  </Space.Compact>
                  <Spin spinning={loading}>
                    {(() => {
                      const children = selectedPrimary ? (tree.find(n => n.id === selectedPrimary)?.children || []) : []
                      if (children.length === 0) {
                        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noSecondaryTags')} style={{ margin: token.marginLG }} />
                      }
                      return (
                        <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, overflow: 'hidden' }}>
                          {children.map((tagItem: TagItem, i: number) => (
                            <div
                              key={tagItem.id}
                              onMouseEnter={() => setHoverSecondaryIdx(i)}
                              onMouseLeave={() => setHoverSecondaryIdx(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: hoverSecondaryIdx === i ? token.colorFillSecondary : undefined,
                                borderBottom: i === children.length - 1 ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                                transition: 'background-color .2s'
                              }}
                            >
                              {editingSecondaryId === tagItem.id ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                  <Input size="small" value={editingSecondaryValue} onChange={e => setEditingSecondaryValue(e.target.value)} onPressEnter={saveSecondaryEdit} />
                                  <Space size={4}>
                                    <Button size="small" type="primary" onClick={saveSecondaryEdit}>{t('save')}</Button>
                                    <Button size="small" onClick={cancelSecondaryEdit}>{t('cancel')}</Button>
                                  </Space>
                                </div>
                              ) : (
                                <Tag color="blue" style={{ marginInlineEnd: 'auto' }}>{tagItem.name}</Tag>
                              )}
                              {editingSecondaryId !== tagItem.id && (
                                <Space size={6}>
                                  <Button type="link" size="small" onClick={() => copy(tagItem.name)}>{t('copy')}</Button>
                                  <Button type="link" size="small" onClick={() => startEditSecondary(tagItem)}>{t('edit')}</Button>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<SwapOutlined />}
                                    onClick={() => openMoveModal({ id: null, category: null, children: [] }, tagItem.id, tagItem.name)}
                                  >
                                    {t('move')}
                                  </Button>
                                  <Popconfirm title={t('confirmDeleteTag')} onConfirm={() => removeTag(tagItem.id)} okText={t('confirm')} cancelText={t('cancel')}>
                                    <Button danger type="link" size="small">{t('delete')}</Button>
                                  </Popconfirm>
                                </Space>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </Spin>
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Space>

      {/* 移动标签对话框 */}
      <Modal
        title={t('moveTag')}
        open={!!movingTagId}
        onOk={confirmMove}
        onCancel={cancelMove}
        confirmLoading={moving}
        okText={t('confirm')}
        cancelText={t('cancel')}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text>
              {t('moveTagPrefix')} <Typography.Text strong>"{movingTagName}"</Typography.Text> {t('moveTagSuffix')}
            </Typography.Text>
            {(() => {
              const movingNode = tree.find(n => n.id === movingTagId)
              const childCount = movingNode?.children.length ?? 0
              const isSecondaryTag = movingNode ? false : tree.some(n => n.children.some(c => c.id === movingTagId))

              if (childCount > 0) {
                return (
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text type="warning" style={{ fontSize: 12 }}>
                      {t('hasChildTagsWarning', { count: childCount })}
                    </Typography.Text>
                  </div>
                )
              }

              if (isSecondaryTag) {
                return (
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text style={{ fontSize: 12 }}>
                      {t('isSecondaryTagHint')}
                    </Typography.Text>
                  </div>
                )
              }

              return null
            })()}
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder={t('targetPrimaryPlaceholder')}
            value={targetParentId}
            onChange={setTargetParentId}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={filteredTree
              .filter(node => node.id && node.id !== movingTagId)
              .map(node => ({
                label: `${node.category ?? t('uncategorized')} (${node.children.length})`,
                value: node.id!,
              }))}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('moveHint')}
          </Typography.Text>
        </Space>
      </Modal>

      {/* 孤立标签清理对话框 */}
      <Modal
        title={t('cleanupOrphan')}
        open={showOrphanModal}
        onOk={cleanupOrphanTags}
        onCancel={() => setShowOrphanModal(false)}
        confirmLoading={cleaningOrphan}
        okText={t('confirm')}
        cancelText={t('cancel')}
        destroyOnClose
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Typography.Text>{t('cleanupOrphanDescription')}</Typography.Text>
          {orphanTags.length === 0 ? (
            <Empty description={t('noOrphanTags')} />
          ) : (
            <div>
              <Typography.Text type="warning">{t('orphanTagsCount', { count: orphanTags.length })}</Typography.Text>
              <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 12 }}>
                {orphanTags.map(tag => (
                  <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #f0f0f0' }}>
                    <span>{tag.name}</span>
                    {tag.category && tag.category !== tag.name && (
                      <Tag color="default" style={{ fontSize: 12 }}>{tag.category}</Tag>
                    )}
                  </div>
                ))}
              </div>
              <Typography.Text type="danger" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
                {t('cleanupOrphanWarning')}
              </Typography.Text>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  )
}
