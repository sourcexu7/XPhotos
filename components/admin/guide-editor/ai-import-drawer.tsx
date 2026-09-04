'use client'

import React, { useState } from 'react'
import { Drawer, Input, Button, Space, App, Card, Tag, Alert, Typography, Collapse, InputNumber, Progress } from 'antd'
import { RobotOutlined, ImportOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const { TextArea } = Input
const { Text } = Typography

const TEMPLATE_LABELS: Record<string, string> = {
  itinerary: '行程',
  expense: '费用',
  checklist: '清单',
  transport: '交通',
  photo: '摄影',
  tips: '贴士',
  railway: '铁路',
  timeline: '时间线',
  notes: '注意事项',
  review: '点评',
  seat: '摄影机位',
  text: '文本',
  image: '图片',
}

const TEMPLATE_COLORS: Record<string, string> = {
  itinerary: 'blue',
  expense: 'gold',
  checklist: 'green',
  transport: 'cyan',
  photo: 'purple',
  tips: 'orange',
  railway: 'cyan',
  timeline: 'blue',
  notes: 'orange',
  review: 'green',
  seat: 'cyan',
  text: 'default',
  image: 'magenta',
}

const SPECIAL_TEMPLATES = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips', 'railway', 'timeline', 'notes', 'review', 'seat']

interface ParsedModule {
  name: string
  template: string
  moduleData: any[] | null
  contents: any[] | null
  /** 校验结果 */
  _valid?: boolean
  _warnings?: string[]
}

interface ParsedGuideInfo {
  title: string
  country: string
  city: string
  days: number
  start_date: string | null
  end_date: string | null
}

interface ParsedResult {
  guide_info: ParsedGuideInfo
  modules: ParsedModule[]
}

interface AIImportDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * 校验单个模块数据
 */
function validateModule(mod: ParsedModule): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  if (!mod.name || mod.name.trim() === '') {
    warnings.push('模块名称为空')
  }

  if (!mod.template) {
    warnings.push('模块类型为空')
    return { valid: false, warnings }
  }

  // 通用模块不需要 moduleData，但可能有 contents
  if (!SPECIAL_TEMPLATES.includes(mod.template)) {
    if (!mod.contents || !Array.isArray(mod.contents) || mod.contents.length === 0) {
      warnings.push(`${TEMPLATE_LABELS[mod.template] || mod.template} 模块内容为空，导入后可在编辑器中手动添加`)
    }
    return { valid: true, warnings }
  }

  // 专用模块必须有 moduleData 数组
  if (!mod.moduleData || !Array.isArray(mod.moduleData) || mod.moduleData.length === 0) {
    warnings.push(`${TEMPLATE_LABELS[mod.template] || mod.template} 模块数据为空，导入后可在编辑器中手动添加`)
    return { valid: true, warnings } // 允许导入空模块，用户可后续编辑
  }

  // 检查数据项的必需字段
  const data = mod.moduleData
  switch (mod.template) {
    case 'itinerary':
      data.forEach((item, i) => {
        if (!item.title) warnings.push(`行程 #${i + 1}: 缺少标题`)
        if (!item.date) warnings.push(`行程 #${i + 1}: 缺少日期`)
      })
      break
    case 'expense':
      data.forEach((item, i) => {
        if (!item.name) warnings.push(`费用 #${i + 1}: 缺少名称`)
        if (item.unitPrice != null && typeof item.unitPrice !== 'number') {
          warnings.push(`费用 #${i + 1}: unitPrice 不是数字类型`)
        }
        if (item.subtotal != null && typeof item.subtotal !== 'number') {
          warnings.push(`费用 #${i + 1}: subtotal 不是数字类型`)
        }
        if (item.category && !['transport', 'accommodation', 'food', 'ticket', 'equipment', 'shopping', 'other'].includes(item.category)) {
          warnings.push(`费用 #${i + 1}: category "${item.category}" 不是有效英文枚举值`)
        }
      })
      break
    case 'transport':
      data.forEach((item, i) => {
        if (!item.type || !['flight', 'train', 'car'].includes(item.type)) {
          warnings.push(`交通 #${i + 1}: type 必须是 flight/train/car`)
        }
        if (item.price != null && typeof item.price !== 'number') {
          warnings.push(`交通 #${i + 1}: price 不是数字类型`)
        }
      })
      break
  }

  return { valid: true, warnings }
}

export default function AIImportDrawer({ open, onClose }: AIImportDrawerProps) {
  const { message } = App.useApp()
  const t = useTranslations('Guides')
  const router = useRouter()
  const [rawContent, setRawContent] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 可编辑的 guide_info
  const [editInfo, setEditInfo] = useState<ParsedGuideInfo | null>(null)
  // 模块勾选状态
  const [selectedModules, setSelectedModules] = useState<Set<number>>(new Set())

  const handleParse = async () => {
    if (!rawContent.trim()) {
      message.warning(t('aiImport.contentRequired'))
      return
    }
    setParsing(true)
    setError(null)
    setParsed(null)
    try {
      const res = await fetch('/api/v1/ai-guide/parse-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: rawContent }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || t('aiImport.parseFailed'))
        return
      }
      const data: ParsedResult = json.data
      // 校验每个模块
      const validatedModules = data.modules.map(mod => {
        const { valid, warnings } = validateModule(mod)
        return { ...mod, _valid: valid, _warnings: warnings }
      })
      const validated: ParsedResult = { ...data, modules: validatedModules }
      setParsed(validated)
      setEditInfo(data.guide_info)
      // 默认全选有效模块
      setSelectedModules(new Set(validatedModules.map((_, i) => i)))

      // 如果有警告，提示用户
      const totalWarnings = validatedModules.flatMap(m => m._warnings || [])
      if (totalWarnings.length > 0) {
        message.warning(t('aiImport.parseSuccessWithWarnings'))
      } else {
        message.success(t('aiImport.parseSuccess'))
      }
    } catch (err: any) {
      setError(err.message || t('aiImport.parseFailed'))
    } finally {
      setParsing(false)
    }
  }

  const handleToggleModule = (index: number) => {
    const next = new Set(selectedModules)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setSelectedModules(next)
  }

  const handleImport = async () => {
    if (!parsed || !editInfo) return

    // 基础校验
    if (!editInfo.title?.trim()) {
      message.error(t('aiImport.titleRequired'))
      return
    }
    if (!editInfo.country?.trim() || !editInfo.city?.trim()) {
      message.error(t('aiImport.locationRequired'))
      return
    }

    setImporting(true)
    setImportProgress(0)

    try {
      // 1. 创建攻略
      setImportProgress(10)
      const createRes = await fetch('/api/v1/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editInfo.title,
          country: editInfo.country,
          city: editInfo.city,
          days: editInfo.days || 1,
          start_date: editInfo.start_date || null,
          end_date: editInfo.end_date || null,
          show: 1,
          sort: 0,
        }),
      })
      const createJson = await createRes.json()
      if (!createRes.ok) {
        message.error(createJson.error || t('aiImport.createGuideFailed'))
        setImporting(false)
        return
      }
      const guideId = createJson.data.id

      // 2. 创建模块 + 写入 moduleData
      const modulesToCreate = parsed.modules.filter((_, i) => selectedModules.has(i))
      const total = modulesToCreate.length
      let successCount = 0
      let failCount = 0
      const errors: string[] = []

      for (let i = 0; i < modulesToCreate.length; i++) {
        const mod = modulesToCreate[i]
        setImportProgress(10 + Math.round((i / total) * 80))

        try {
          // 创建模块
          const modRes = await fetch('/api/v1/guide-modules/module', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              guide_id: guideId,
              name: mod.name,
              template: mod.template,
              is_hidden: false,
            }),
          })
          const modJson = await modRes.json()
          if (!modRes.ok) {
            console.error('Failed to create module:', mod.name, modJson)
            failCount++
            errors.push(`模块"${mod.name}"创建失败: ${modJson.error || '未知错误'}`)
            continue
          }
          const moduleId = modJson.data.id

          // 如果是专用模板且有 moduleData，保存
          if (
            SPECIAL_TEMPLATES.includes(mod.template) &&
            mod.moduleData &&
            Array.isArray(mod.moduleData) &&
            mod.moduleData.length > 0
          ) {
            const dataRes = await fetch(`/api/v1/guide-modules/module-data/${moduleId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ data: mod.moduleData }),
            })
            if (!dataRes.ok) {
              const dataErr = await dataRes.json().catch(() => ({}))
              console.error('Failed to save module data:', mod.name, dataErr)
              errors.push(`模块"${mod.name}"数据保存失败: ${dataErr.error || '未知错误'}`)
              failCount++
            } else {
              successCount++
            }
          } else if (
            !SPECIAL_TEMPLATES.includes(mod.template) &&
            mod.contents &&
            Array.isArray(mod.contents) &&
            mod.contents.length > 0
          ) {
            // 通用模块：创建 content 行
            for (const contentItem of mod.contents) {
              const contentRes = await fetch('/api/v1/guide-modules/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  module_id: moduleId,
                  type: contentItem.type || 'text',
                  content: contentItem.content || {},
                }),
              })
              if (!contentRes.ok) {
                const contentErr = await contentRes.json().catch(() => ({}))
                console.error('Failed to save content:', mod.name, contentErr)
                errors.push(`模块"${mod.name}"内容保存失败: ${contentErr.error || '未知错误'}`)
              }
            }
            successCount++
          } else {
            // 无数据的模块，只创建模块壳即可
            successCount++
          }
        } catch (err: any) {
          console.error('Module import error:', mod.name, err)
          failCount++
          errors.push(`模块"${mod.name}": ${err.message}`)
        }
      }

      // 3. 自动生成目录
      setImportProgress(95)
      try {
        await fetch('/api/v1/guide-modules/toc/auto-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ guide_id: guideId }),
        })
      } catch {
        // 目录生成失败不阻塞
      }

      setImportProgress(100)

      if (failCount === 0) {
        message.success(t('aiImport.importSuccess'))
      } else {
        message.warning(`${t('aiImport.importPartialSuccess')} (${successCount}/${total})`)
        // 显示详细错误
        if (errors.length > 0) {
          console.log('Import errors:', errors)
        }
      }

      // 跳转到编辑器
      router.push(`/admin/guides/${guideId}/edit`)
    } catch (err: any) {
      message.error(err.message || t('aiImport.importFailed'))
    } finally {
      setImporting(false)
      setImportProgress(0)
    }
  }

  const handleReset = () => {
    setRawContent('')
    setParsed(null)
    setEditInfo(null)
    setError(null)
    setSelectedModules(new Set())
    setImportProgress(0)
  }

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined />
          {t('aiImport.title')}
        </Space>
      }
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 720 } }}
      footer={parsed ? (
        <div className="flex justify-end gap-2">
          {importing && (
            <Progress percent={importProgress} size="small" style={{ width: 200, marginRight: 'auto' }} />
          )}
          <Button onClick={handleReset} disabled={importing}>{t('aiImport.reset')}</Button>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            onClick={handleImport}
            loading={importing}
            disabled={selectedModules.size === 0}
          >
            {t('aiImport.import')} ({selectedModules.size}/{parsed.modules.length})
          </Button>
        </div>
      ) : null}
    >
      {!parsed ? (
        <div className="space-y-4">
          <Alert
            type="info"
            showIcon
            message={t('aiImport.tipTitle')}
            description={t('aiImport.tipDescription')}
          />
          <div>
            <Text strong>{t('aiImport.contentLabel')}</Text>
            <TextArea
              rows={16}
              value={rawContent}
              onChange={e => setRawContent(e.target.value)}
              placeholder={t('aiImport.contentPlaceholder')}
              className="mt-2"
            />
          </div>
          {error && (
            <Alert
              type="error"
              showIcon
              message={t('aiImport.parseFailed')}
              description={error}
              closable
              onClose={() => setError(null)}
            />
          )}
          <Button
            type="primary"
            size="large"
            icon={<RobotOutlined />}
            onClick={handleParse}
            loading={parsing}
            block
          >
            {parsing ? t('aiImport.parsing') : t('aiImport.parse')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 攻略基础信息 */}
          <Card title={t('aiImport.guideInfo')} size="small">
            <div className="space-y-3">
              <div>
                <Text type="secondary" className="text-xs">{t('aiImport.guideTitle')}</Text>
                <Input
                  value={editInfo?.title || ''}
                  onChange={e => setEditInfo({ ...editInfo!, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Text type="secondary" className="text-xs">{t('aiImport.country')}</Text>
                  <Input
                    value={editInfo?.country || ''}
                    onChange={e => setEditInfo({ ...editInfo!, country: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">{t('aiImport.city')}</Text>
                  <Input
                    value={editInfo?.city || ''}
                    onChange={e => setEditInfo({ ...editInfo!, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Text type="secondary" className="text-xs">{t('aiImport.days')}</Text>
                  <InputNumber
                    min={1}
                    value={editInfo?.days || 1}
                    onChange={v => setEditInfo({ ...editInfo!, days: v || 1 })}
                    className="mt-1 w-full"
                  />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">{t('aiImport.startDate')}</Text>
                  <Input
                    value={editInfo?.start_date || ''}
                    onChange={e => setEditInfo({ ...editInfo!, start_date: e.target.value })}
                    placeholder="YYYY-MM-DD"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">{t('aiImport.endDate')}</Text>
                  <Input
                    value={editInfo?.end_date || ''}
                    onChange={e => setEditInfo({ ...editInfo!, end_date: e.target.value })}
                    placeholder="YYYY-MM-DD"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 模块列表 */}
          <Card title={`${t('aiImport.modules')} (${parsed.modules.length})`} size="small">
            <Collapse
              items={parsed.modules.map((mod, index) => ({
                key: String(index),
                label: (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedModules.has(index)}
                      onChange={() => handleToggleModule(index)}
                      className="cursor-pointer"
                    />
                    <Tag color={TEMPLATE_COLORS[mod.template] || 'default'}>
                      {TEMPLATE_LABELS[mod.template] || mod.template}
                    </Tag>
                    <Text strong>{mod.name}</Text>
                    {mod.moduleData && Array.isArray(mod.moduleData) && mod.moduleData.length > 0 && (
                      <Text type="secondary" className="text-xs">
                        ({mod.moduleData.length} 条数据)
                      </Text>
                    )}
                    {mod.contents && Array.isArray(mod.contents) && mod.contents.length > 0 && (
                      <Text type="secondary" className="text-xs">
                        ({mod.contents.length} 条内容)
                      </Text>
                    )}
                    {mod._warnings && mod._warnings.length > 0 && (
                      <Tag color="warning" className="text-xs">
                        {mod._warnings.length} 警告
                      </Tag>
                    )}
                  </div>
                ),
                children: (
                  <div className="space-y-2">
                    {mod._warnings && mod._warnings.length > 0 && (
                      <Alert
                        type="warning"
                        showIcon
                        message="数据校验警告"
                        description={
                          <ul className="list-disc pl-4 text-xs">
                            {mod._warnings.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        }
                        className="mb-2"
                      />
                    )}
                    {mod.moduleData && Array.isArray(mod.moduleData) && mod.moduleData.length > 0 && (
                      <div>
                        <Text type="secondary" className="text-xs">moduleData ({mod.moduleData.length} 条):</Text>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60 mt-1">
                          <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(mod.moduleData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {mod.contents && Array.isArray(mod.contents) && mod.contents.length > 0 && (
                      <div>
                        <Text type="secondary" className="text-xs">contents ({mod.contents.length} 条):</Text>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60 mt-1">
                          <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(mod.contents, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </div>
      )}
    </Drawer>
  )
}
