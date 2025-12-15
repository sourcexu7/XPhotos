'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { fetcher } from '~/lib/utils/fetcher'
import { Input, Button, Tag, Popconfirm, App, Spin, Row, Col, Card, Space, Typography, theme, Empty, Badge, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'

type TagItem = { id: string; name: string }
type TagTreeNode = { id?: string | null; category: string | null; children: TagItem[] }

export default function TagManager() {
  const { message } = App.useApp()
  const { token } = theme.useToken()
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

  const loadTree = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetcher('/api/v1/settings/tags/get?tree=true')
      if (res?.data) setTree(res.data)
    } catch (_err) {
      message.error('加载标签失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => { loadTree() }, [loadTree])

  // derive selected primary node name from id for display
  const selectedPrimaryNode = tree.find(n => n.id === selectedPrimary)
  const selectedPrimaryName = selectedPrimaryNode?.category ?? ''

  // 当前未提供搜索，直接使用完整树列表
  const filteredTree = useMemo(() => tree, [tree])

  const addPrimary = async () => {
    if (!primaryName?.trim()) return message.warning('请输入一级标签名')
    setAddingPrimary(true)
    try {
      const res = await fetch('/api/v1/settings/tags/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: primaryName.trim() })
      }).then(r => r.json())
      if (res?.code === 200) {
        message.success('添加一级标签成功')
        const newId = res?.data?.id
        setPrimaryName('')
        await loadTree()
        // auto-select the newly created parent so user can immediately add children
        if (newId) setSelectedPrimary(newId)
      } else message.error(res?.message || '添加失败')
    } catch (_e) { message.error('添加失败') } finally { setAddingPrimary(false) }
  }

  const addSecondary = async () => {
    if (!selectedPrimary) return message.warning('请先选择一级分类')
    if (!secondaryName?.trim()) return message.warning('请输入二级标签名')
    setAddingSecondary(true)
    try {
      const res = await fetch('/api/v1/settings/tags/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: secondaryName.trim(), parentId: selectedPrimary })
      }).then(r => r.json())
      if (res?.code === 200) {
        message.success('添加二级标签成功')
        setSecondaryName('')
        await loadTree()
      } else message.error(res?.message || '添加失败')
    } catch (_e) { message.error('添加失败') } finally { setAddingSecondary(false) }
  }

  const removeTag = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/settings/tags/delete/${id}`, { method: 'DELETE' }).then(r => r.json())
      if (res?.code === 200) {
        message.success('已删除')
        await loadTree()
        setSelectedPrimary(null)
      } else message.error(res?.message || '删除失败')
    } catch (_err) {
      message.error('删除失败')
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success('已复制')
    } catch (_err) {
      message.error('复制失败')
    }
  }

  const startEditPrimary = (node: TagTreeNode) => {
    if (!node.id) return message.warning('无法编辑：无对应父标签记录')
    setEditingPrimaryKey(node.id)
    setEditingPrimaryValue(node.category ?? '')
  }

  const savePrimaryEdit = async () => {
    if (!editingPrimaryKey) return
    const name = editingPrimaryValue?.trim()
    if (!name) return message.warning('请输入标签名')
    try {
      // update both name and category for primary tags so tree display stays in sync
      const res = await fetch(`/api/v1/settings/tags/update/${editingPrimaryKey}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category: name }) }).then(r => r.json())
      if (res?.code === 200) {
        message.success('修改成功')
        setEditingPrimaryKey(null)
        setEditingPrimaryValue('')
        await loadTree()
      } else message.error(res?.message || '修改失败')
    } catch (_e) { message.error('修改失败') }
  }

  const cancelPrimaryEdit = () => { setEditingPrimaryKey(null); setEditingPrimaryValue('') }

  const startEditSecondary = (t: TagItem) => {
    setEditingSecondaryId(t.id)
    setEditingSecondaryValue(t.name)
  }

  const saveSecondaryEdit = async () => {
    if (!editingSecondaryId) return
    const name = editingSecondaryValue?.trim()
    if (!name) return message.warning('请输入标签名')
    try {
      const res = await fetch(`/api/v1/settings/tags/update/${editingSecondaryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then(r => r.json())
      if (res?.code === 200) {
        message.success('修改成功')
        setEditingSecondaryId(null)
        setEditingSecondaryValue('')
        await loadTree()
      } else message.error(res?.message || '修改失败')
    } catch (_e) { message.error('修改失败') }
  }

  const cancelSecondaryEdit = () => { setEditingSecondaryId(null); setEditingSecondaryValue('') }

  return (
    <div style={{ padding: token.paddingMD }}>
      <Space orientation="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>标签管理</Typography.Title>
        <Row gutter={token.margin}>
          <Col xs={24} md={8} lg={7} xl={6}>
            <Card
              size="small"
              styles={{ body: { padding: token.paddingSM } }}
              title={<Typography.Text strong>一级标签</Typography.Text>}
              extra={
                <Space.Compact style={{ width: 220 }}>
                  <Input
                    size="small"
                    placeholder="新一级标签"
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
                  >添加</Button>
                </Space.Compact>
              }
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={token.margin}>
                <Spin spinning={loading}>
                  {filteredTree.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无一级标签" style={{ margin: token.marginLG }} />
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
                                <Button size="small" type="primary" onClick={savePrimaryEdit}>保存</Button>
                                <Button size="small" onClick={cancelPrimaryEdit}>取消</Button>
                              </Space>
                            </div>
                          ) : (
                            <>
                              <Space size={6} style={{ marginInlineEnd: 'auto' }}>
                                <Typography.Text strong ellipsis>{node.category ?? '未分类'}</Typography.Text>
                                <Tooltip title="子标签数量">
                                  <Badge count={node.children.length} size="small" style={{ backgroundColor: token.colorPrimary }} />
                                </Tooltip>
                              </Space>
                              <Space size={6}>
                                <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); startEditPrimary(node) }}>编辑</Button>
                                <Popconfirm
                                  title={node.children && node.children.length > 0 ? '删除该一级标签会同时删除其所有二级标签，确定吗？' : '确认删除该一级标签吗？'}
                                  onConfirm={async (e: React.MouseEvent) => {
                                    e?.stopPropagation?.()
                                    try {
                                      if (node.id) {
                                        if (node.children && node.children.length > 0) {
                                          await fetch(`/api/v1/settings/tags/delete-with-children/${node.id}`, { method: 'DELETE' }).then(r => r.json())
                                        } else {
                                          await fetch(`/api/v1/settings/tags/delete/${node.id}`, { method: 'DELETE' }).then(r => r.json())
                                        }
                                      }
                                      message.success('已删除一级标签及其子标签')
                                      await loadTree()
                                      setSelectedPrimary(null)
                                    } catch (err) {
                                      message.error('删除失败')
                                    }
                                  }}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <Button danger type="link" size="small">删除</Button>
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
            <Card size="small" styles={{ body: { padding: token.paddingSM } }} title={<Typography.Text strong>二级标签 {selectedPrimary ? `— ${selectedPrimaryName}` : ''}</Typography.Text>}>
              {!selectedPrimary ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择左侧一级标签" style={{ margin: token.marginXL }} />
              ) : (
                <Space orientation="vertical" style={{ width: '100%' }} size={token.margin}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input placeholder={`在 ${selectedPrimaryName} 下添加`} value={secondaryName} onChange={e => setSecondaryName(e.target.value)} onPressEnter={addSecondary} />
                    <Button type="primary" icon={<PlusOutlined />} onClick={addSecondary} loading={addingSecondary}>添加</Button>
                  </Space.Compact>
                  <Spin spinning={loading}>
                    {(() => {
                      const children = selectedPrimary ? (tree.find(n => n.id === selectedPrimary)?.children || []) : []
                      if (children.length === 0) {
                        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无二级标签" style={{ margin: token.marginLG }} />
                      }
                      return (
                        <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, overflow: 'hidden' }}>
                          {children.map((t: TagItem, i: number) => (
                            <div
                              key={t.id}
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
                              {editingSecondaryId === t.id ? (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                  <Input size="small" value={editingSecondaryValue} onChange={e => setEditingSecondaryValue(e.target.value)} onPressEnter={saveSecondaryEdit} />
                                  <Space size={4}>
                                    <Button size="small" type="primary" onClick={saveSecondaryEdit}>保存</Button>
                                    <Button size="small" onClick={cancelSecondaryEdit}>取消</Button>
                                  </Space>
                                </div>
                              ) : (
                                <Tag color="blue" style={{ marginInlineEnd: 'auto' }}>{t.name}</Tag>
                              )}
                              {editingSecondaryId !== t.id && (
                                <Space size={6}>
                                  <Button type="link" size="small" onClick={() => copy(t.name)}>复制</Button>
                                  <Button type="link" size="small" onClick={() => startEditSecondary(t)}>编辑</Button>
                                  <Popconfirm title="确认删除该标签吗？" onConfirm={() => removeTag(t.id)} okText="确定" cancelText="取消">
                                    <Button danger type="link" size="small">删除</Button>
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
    </div>
  )
}