'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { App, Alert, Button, Checkbox, Drawer, Select, Space, Spin, Tag, theme } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'

/**
 * 批量 AI 修正标签：
 * 阶段1 并发=2 逐张调用 /ai-tag/recommend 分析 → 阶段2 逐张审核（合并/覆盖策略 + 勾选调整）→ 统一应用。
 * 完全复用现有接口：/ai-tag/recommend、/settings/tags/add、/images/update，零新增后端。
 */

interface AiTagSuggestion {
  matches: { primary: string; secondaries: string[] }[]
  newTags: { name: string; parentName: string }[]
}

type ItemStatus = 'pending' | 'loading' | 'done' | 'empty' | 'error'
type Strategy = 'merge' | 'overwrite'

interface BatchItem {
  image: ImageType
  status: ItemStatus
  suggestion: AiTagSuggestion | null
  selected: Record<string, boolean>
  strategy: Strategy
  applyError?: boolean
  saving?: boolean
}

const CONCURRENCY = 2
/** 单张分析最大尝试次数（1 次原始 + 2 次自动重试，仅针对瞬态错误） */
const MAX_ANALYZE_ATTEMPTS = 3
/** 不可重试的错误码：配置缺失/参数问题，重试必然同样失败 */
const NO_RETRY_ERRORS = new Set(['AI_TAG_DISABLED', 'AI_TAG_NOT_CONFIGURED', 'INVALID_IMAGE_URL', 'IMAGE_TOO_LARGE'])

/** AI 推荐默认全选（人工可取消），与编辑抽屉行为一致 */
function buildSelection(suggestion: AiTagSuggestion): Record<string, boolean> {
  const sel: Record<string, boolean> = {}
  suggestion.matches.forEach(m => {
    sel[`p:${m.primary}`] = true
    m.secondaries.forEach(s => { sel[`s:${m.primary}:${s}`] = true })
  })
  suggestion.newTags.forEach(nt => { sel[`n:${nt.name}`] = true })
  return sel
}

export default function ImageBatchAiTagSheet({ images, onApplied }: {
  images: ImageType[]
  onApplied: () => void | Promise<void>
}) {
  const { message, modal } = App.useApp()
  const t = useTranslations('List')
  const { token } = theme.useToken()
  const { imageBatchAiTag, setImageBatchAiTag } = useButtonStore((state) => state)

  const [items, setItems] = useState<BatchItem[]>([])
  const [phase, setPhase] = useState<'analyzing' | 'reviewing'>('analyzing')
  const [applying, setApplying] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const itemsRef = useRef<BatchItem[]>([])
  const cancelRef = useRef(false)
  const sessionKeyRef = useRef('')
  const queueRef = useRef<{ running: number; queue: Array<() => void> }>({ running: 0, queue: [] })

  const setItem = useCallback((id: string, patch: Partial<BatchItem>) => {
    setItems(prev => {
      const next = prev.map(it => (it.image.id === id ? { ...it, ...patch } : it))
      itemsRef.current = next
      return next
    })
  }, [])

  /** 单张分析：瞬态错误（网络/超时/上游抖动）自动重试，退避 800ms×尝试序号 */
  const analyzeOne = useCallback(async (id: string, imageUrl?: string) => {
    if (!imageUrl) { setItem(id, { status: 'error' }); return }
    setItem(id, { status: 'loading' })
    for (let attempt = 1; attempt <= MAX_ANALYZE_ATTEMPTS; attempt++) {
      let retryable = true
      try {
        const res = await fetch('/api/v1/ai-tag/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        const json = await res.json().catch(() => null)
        const data = json?.data as AiTagSuggestion | undefined
        if (res.ok && json?.code === 200 && data && (data.matches?.length || data.newTags?.length)) {
          setItem(id, { status: 'done', suggestion: data, selected: buildSelection(data) })
          return
        }
        if (res.ok && json?.code === 200) {
          // AI 正常返回但无推荐内容
          setItem(id, { status: 'empty' })
          return
        }
        const errCode = typeof json?.error === 'string' ? json.error : ''
        retryable = !NO_RETRY_ERRORS.has(errCode)
      } catch {
        retryable = true
      }
      if (attempt < MAX_ANALYZE_ATTEMPTS && retryable) {
        if (cancelRef.current) { setItem(id, { status: 'pending' }); return }
        await new Promise(r => setTimeout(r, 800 * attempt))
        if (cancelRef.current) { setItem(id, { status: 'pending' }); return }
        continue
      }
      setItem(id, { status: 'error' })
      return
    }
  }, [setItem])

  /** 并发=2 跑完所有 pending/error/loading 的项；cancelRef 置位时跳过未开始的任务 */
  const runAnalysis = useCallback((list: BatchItem[]) => {
    cancelRef.current = false
    const q = queueRef.current
    const targets = list
      .filter(it => it.status === 'pending' || it.status === 'error' || it.status === 'loading')
      .map(it => ({ id: it.image.id, imageUrl: (it.image.preview_url || it.image.url) as string | undefined }))

    const tasks = targets.map(target => async () => {
      if (cancelRef.current) return
      await analyzeOne(target.id, target.imageUrl)
    })

    return Promise.all(tasks.map(task => new Promise<void>(resolve => {
      const run = async () => {
        q.running++
        try { await task() } finally {
          q.running--
          resolve()
          const next = q.queue.shift()
          if (next) next()
        }
      }
      if (q.running < CONCURRENCY) run()
      else q.queue.push(run)
    }))).then(() => {
      if (cancelRef.current) return
      // 全部成功（done/empty）才自动进入审核；存在失败时停留在分析阶段，
      // 由失败汇总条提供「重试失败项 / 跳过失败进入审核」入口，避免失败项被无声跳过
      const hasError = itemsRef.current.some(it => it.status === 'error')
      if (!hasError) setPhase('reviewing')
    })
  }, [analyzeOne])

  // 打开时：同一勾选集恢复未完成分析；新勾选集则重置并开始
  useEffect(() => {
    if (!imageBatchAiTag) return
    const key = images.map(i => i.id).sort().join(',')
    if (key !== sessionKeyRef.current) {
      sessionKeyRef.current = key
      const fresh: BatchItem[] = images.map(image => ({
        image, status: 'pending' as ItemStatus, suggestion: null, selected: {}, strategy: 'merge' as Strategy,
      }))
      setItems(fresh)
      itemsRef.current = fresh
      setPhase('analyzing')
      if (fresh.length > 0) runAnalysis(fresh)
      else setPhase('reviewing')
    } else if (itemsRef.current.some(it => it.status === 'pending' || it.status === 'error' || it.status === 'loading')) {
      // 恢复：继续分析未完成的项
      setPhase('analyzing')
      runAnalysis(itemsRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBatchAiTag])

  const requestClose = () => {
    if (phase === 'analyzing') {
      modal.confirm({
        title: t('batchAiTagConfirmCloseTitle'),
        content: t('batchAiTagConfirmCloseContent'),
        okText: t('batchAiTagStopAndClose'),
        cancelText: t('batchAiTagContinueAnalyzing'),
        onOk: () => {
          cancelRef.current = true
          setImageBatchAiTag(false)
        },
      })
      return
    }
    // 审核阶段：存在保存失败项时，提醒用户关闭将丢失未保存的更改
    const failCount = items.filter(it => it.applyError).length
    if (failCount > 0) {
      modal.confirm({
        title: t('batchAiTagConfirmCloseWithFailTitle'),
        content: t('batchAiTagConfirmCloseWithFailContent', { count: failCount }),
        okText: t('batchAiTagCloseAnyway'),
        okButtonProps: { danger: true },
        cancelText: t('batchAiTagStayAndRetry'),
        onOk: () => setImageBatchAiTag(false),
      })
      return
    }
    setImageBatchAiTag(false)
  }

  const toggleGroup = (id: string, primary: string, secondaries: string[], checked: boolean) => {
    setItems(prev => {
      const next = prev.map(it => {
        if (it.image.id !== id) return it
        const sel = { ...it.selected, [`p:${primary}`]: checked }
        secondaries.forEach(s => { sel[`s:${primary}:${s}`] = checked })
        return { ...it, selected: sel }
      })
      itemsRef.current = next
      return next
    })
  }

  const toggleOne = (id: string, key: string, checked: boolean) => {
    setItems(prev => {
      const next = prev.map(it => (it.image.id === id ? { ...it, selected: { ...it.selected, [key]: checked } } : it))
      itemsRef.current = next
      return next
    })
  }

  const setAllStrategy = (strategy: Strategy) => {
    setItems(prev => {
      const next = prev.map(it => ({ ...it, strategy }))
      itemsRef.current = next
      return next
    })
  }

  const setAllAiChecked = (checked: boolean) => {
    setItems(prev => {
      const next = prev.map(it => {
        if (!it.suggestion) return it
        const sel: Record<string, boolean> = {}
        it.suggestion.matches.forEach(m => {
          sel[`p:${m.primary}`] = checked
          m.secondaries.forEach(s => { sel[`s:${m.primary}:${s}`] = checked })
        })
        it.suggestion.newTags.forEach(nt => { sel[`n:${nt.name}`] = checked })
        return { ...it, selected: sel }
      })
      itemsRef.current = next
      return next
    })
  }

  const retryOne = (id: string) => {
    const it = itemsRef.current.find(x => x.image.id === id)
    if (!it) return
    setItem(id, { status: 'pending' })
    // 单张重试：直接分析，不重建队列
    analyzeOne(id, (it.image.preview_url || it.image.url) as string | undefined)
  }

  /** 重试全部分析失败项（runAnalysis 的目标过滤本身包含 error 项） */
  const retryFailedAnalysis = () => {
    if (analysisBusy) return
    runAnalysis(itemsRef.current)
  }

  /** 跳过失败项，直接进入人工审核阶段 */
  const skipToReview = () => setPhase('reviewing')

  /** 计算单张图最终 labels 与 tagCategoryMap */
  const computeSavePayload = (it: BatchItem) => {
    const suggestion = it.suggestion as AiTagSuggestion
    const currentLabels: string[] = Array.isArray(it.image.labels) ? [...it.image.labels] : []
    const labels = it.strategy === 'merge' ? currentLabels : []
    const categoryMap: Record<string, string> = it.strategy === 'merge'
      ? { ...(((it.image as any).tagCategoryMap as Record<string, string>) || {}) }
      : {}
    const push = (name: string) => {
      if (!labels.some(l => l.toLowerCase() === name.toLowerCase())) labels.push(name)
    }
    suggestion.matches.forEach(m => {
      if (it.selected[`p:${m.primary}`]) push(m.primary)
      m.secondaries.forEach(s => {
        if (it.selected[`s:${m.primary}:${s}`]) {
          push(s)
          categoryMap[s] = m.primary
        }
      })
    })
    suggestion.newTags.forEach(nt => {
      if (it.selected[`n:${nt.name}`]) {
        push(nt.name)
        categoryMap[nt.name] = nt.parentName
      }
    })
    return { labels, tagCategoryMap: categoryMap }
  }

  /** 单张保存（applyAll 与失败重试共用）；overwrite 且一张未选视为跳过 */
  const saveOne = async (it: BatchItem): Promise<'ok' | 'skip' | 'fail'> => {
    const { labels, tagCategoryMap } = computeSavePayload(it)
    if (it.strategy === 'overwrite' && labels.length === 0) return 'skip'
    setItem(it.image.id, { saving: true })
    try {
      const res = await fetch('/api/v1/images/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...it.image, labels, tagCategoryMap }),
      })
      if (res.ok) {
        setItem(it.image.id, { applyError: false, saving: false })
        return 'ok'
      }
      setItem(it.image.id, { applyError: true, saving: false })
      return 'fail'
    } catch {
      setItem(it.image.id, { applyError: true, saving: false })
      return 'fail'
    }
  }

  const applyAll = async () => {
    const targets = itemsRef.current.filter(it => it.status === 'done' && it.suggestion)
    if (targets.length === 0) { message.warning(t('batchAiTagNoSuggestion')); return }
    setApplying(true)
    try {
      // 清除上一轮的失败标记（用户可能已调整勾选/策略）
      for (const it of targets) {
        if (it.applyError) setItem(it.image.id, { applyError: false })
      }

      // 1. 现有标签名集合（createTag 非 upsert，重名会抛错，先去重）
      const existingNames = new Set<string>()
      try {
        const res = await fetch('/api/v1/settings/tags/get').then(r => r.json())
        const list = Array.isArray(res?.data) ? res.data : []
        for (const tg of list) {
          if (typeof tg?.name === 'string') existingNames.add(tg.name.toLowerCase())
        }
      } catch { /* 获取失败不阻断：保存图片时 syncImageTags 会兜底创建标签 */ }

      // 2. 创建所有勾选的新标签（去重后）
      const seen = new Set<string>()
      for (const it of targets) {
        for (const nt of it.suggestion!.newTags) {
          const key = nt.name.toLowerCase()
          if (!it.selected[`n:${nt.name}`] || existingNames.has(key) || seen.has(key)) continue
          seen.add(key)
          try {
            await fetch('/api/v1/settings/tags/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: nt.name, parentName: nt.parentName }),
            })
            existingNames.add(key)
          } catch { /* 创建失败不阻断 */ }
        }
      }

      // 3. 逐张保存（saveOne 内部处理跳过逻辑）
      let ok = 0
      let fail = 0
      for (const it of targets) {
        const r = await saveOne(it)
        if (r === 'ok') ok++
        else if (r === 'fail') fail++
      }

      if (fail > 0) {
        // 保留现场：不清空选择，顶部横幅会汇总失败项并支持重试/复制 ID
        message.warning(t('batchAiTagAppliedWithFail', { ok, fail }))
      } else {
        message.success(t('batchAiTagApplied', { ok }))
        await onApplied()
      }
    } finally {
      setApplying(false)
    }
  }

  /** 单张重试保存（仅 applyError 项）；成功且无剩余失败时收尾刷新 */
  const retrySaveOne = async (id: string) => {
    const it = itemsRef.current.find(x => x.image.id === id)
    if (!it || it.saving || retrying) return
    const r = await saveOne(it)
    if (r === 'ok') {
      message.success(t('batchAiTagApplied', { ok: 1 }))
      const remain = itemsRef.current.filter(x => x.applyError).length
      if (remain === 0) await onApplied()
    }
  }

  /** 一键重试全部保存失败项 */
  const retryAllFailed = async () => {
    const targets = itemsRef.current.filter(it => it.applyError && it.status === 'done' && it.suggestion)
    if (targets.length === 0 || retrying || applying) return
    setRetrying(true)
    try {
      let ok = 0
      let fail = 0
      for (const it of targets) {
        const r = await saveOne(it)
        if (r === 'ok') ok++
        else if (r === 'fail') fail++
      }
      if (fail > 0) {
        message.warning(t('batchAiTagRetryFinished', { ok, fail }))
      } else {
        message.success(t('batchAiTagRetryFinished', { ok, fail }))
        await onApplied()
      }
    } finally {
      setRetrying(false)
    }
  }

  /** 复制失败图片 ID，便于到编辑抽屉逐张手动处理 */
  const copyFailedIds = async () => {
    const ids = itemsRef.current.filter(it => it.applyError).map(it => it.image.id)
    if (ids.length === 0) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(ids.join('\n'))
        message.success(t('batchAiTagCopyFailedIdsDone', { count: ids.length }))
      } else {
        throw new Error('clipboard unavailable')
      }
    } catch {
      message.error(t('batchAiTagCopyFailedIdsFailed'))
    }
  }

  const doneCount = items.filter(it => it.status === 'done' || it.status === 'empty').length
  const finished = items.length > 0 && doneCount === items.length
  const failedItems = items.filter(it => it.applyError)
  const analysisFailed = items.filter(it => it.status === 'error')
  const analysisBusy = items.some(it => it.status === 'loading' || it.status === 'pending')

  const renderStatus = (it: BatchItem) => {
    switch (it.status) {
      case 'pending': return <Tag>{t('batchAiTagStatusPending')}</Tag>
      case 'loading': return <Tag color="processing">{t('batchAiTagStatusLoading')}</Tag>
      case 'done': return <Tag color="success">{t('batchAiTagStatusDone')}</Tag>
      case 'empty': return <Tag color="default">{t('batchAiTagNoSuggestion')}</Tag>
      case 'error':
        return (
          <Space size={4}>
            <Tag color="error">{t('batchAiTagStatusError')}</Tag>
            <Button size="small" type="link" onClick={() => retryOne(it.image.id)}>{t('batchAiTagRetry')}</Button>
          </Space>
        )
    }
  }

  return (
    <Drawer
      title={<span><RobotOutlined style={{ marginInlineEnd: 8 }} />{t('batchAiTagTitle')}</span>}
      placement="right"
      width={720}
      open={imageBatchAiTag}
      onClose={requestClose}
      destroyOnHidden={false}
      footer={
        phase === 'analyzing' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: token.colorTextSecondary }}>
              {t('batchAiTagAnalyzing', { done: finished ? items.length : doneCount, total: items.length })}
            </span>
            <Button onClick={requestClose}>{t('batchAiTagCancelAnalysis')}</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button size="small" onClick={() => setAllStrategy('merge')}>{t('batchAiTagAllMerge')}</Button>
              <Button size="small" onClick={() => setAllStrategy('overwrite')}>{t('batchAiTagAllOverwrite')}</Button>
              <Button size="small" onClick={() => setAllAiChecked(true)}>{t('batchAiTagSelectAllAi')}</Button>
              <Button size="small" onClick={() => setAllAiChecked(false)}>{t('batchAiTagClearAllAi')}</Button>
            </Space>
            <Space>
              <Button onClick={requestClose}>{t('batchAiTagClose')}</Button>
              <Button type="primary" loading={applying} disabled={retrying} onClick={applyAll}>{t('batchAiTagApply')}</Button>
            </Space>
          </div>
        )
      }
    >
      {phase === 'analyzing' ? (
        <Spin spinning={applying}>
          {!analysisBusy && analysisFailed.length > 0 && (
            <Alert
              type="warning"
              showIcon
              className="!mb-3"
              title={t('batchAiTagAnalysisFailedSummary', { count: analysisFailed.length })}
              action={
                <Space size={4} wrap>
                  <Button size="small" loading={analysisBusy} onClick={retryFailedAnalysis}>
                    {t('batchAiTagRetryFailedAnalysis')}
                  </Button>
                  <Button size="small" onClick={skipToReview}>
                    {t('batchAiTagSkipFailedReview')}
                  </Button>
                </Space>
              }
            />
          )}
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.image.id} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image.preview_url || it.image.url}
                  alt={it.image.title || it.image.id}
                  className="w-14 h-14 object-cover rounded"
                />
                <span className="flex-1 truncate text-sm">{it.image.title || it.image.id}</span>
                {renderStatus(it)}
              </div>
            ))}
          </div>
        </Spin>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">{t('batchAiTagReviewHint')}</div>
          {failedItems.length > 0 && (
            <Alert
              type="warning"
              showIcon
              title={t('batchAiTagFailedSummary', { count: failedItems.length })}
              action={
                <Space size={4} wrap>
                  <Button size="small" loading={retrying} onClick={retryAllFailed}>
                    {t('batchAiTagRetryAllFailed')}
                  </Button>
                  <Button size="small" onClick={copyFailedIds}>
                    {t('batchAiTagCopyFailedIds')}
                  </Button>
                </Space>
              }
            />
          )}
          {items.filter(it => it.status === 'done' && it.suggestion).map(it => (
            <div key={it.image.id} className="p-3 border border-border rounded-lg">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image.preview_url || it.image.url}
                  alt={it.image.title || it.image.id}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate max-w-[240px]">{it.image.title || it.image.id}</span>
                    <Space size={4}>
                      <span className="text-xs text-muted-foreground">{t('batchAiTagStrategy')}</span>
                      <Select<Strategy>
                        size="small"
                        value={it.strategy}
                        style={{ width: 150 }}
                        onChange={v => setItem(it.image.id, { strategy: v })}
                        options={[
                          { value: 'merge', label: t('batchAiTagMerge') },
                          { value: 'overwrite', label: t('batchAiTagOverwrite') },
                        ]}
                      />
                    </Space>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    <span className="text-xs text-muted-foreground">{t('batchAiTagExistingTags')}:</span>
                    {(Array.isArray(it.image.labels) && it.image.labels.length > 0)
                      ? it.image.labels.map(l => <Tag key={l} className="mr-0">{l}</Tag>)
                      : <span className="text-xs text-muted-foreground">-</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {it.suggestion!.matches.map(m => (
                  <div key={m.primary}>
                    <Checkbox
                      checked={!!it.selected[`p:${m.primary}`]}
                      onChange={e => toggleGroup(it.image.id, m.primary, m.secondaries, e.target.checked)}
                    >
                      <span className="font-medium">{m.primary}</span>
                    </Checkbox>
                    {m.secondaries.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 pl-6">
                        {m.secondaries.map(s => (
                          <Checkbox
                            key={s}
                            checked={!!it.selected[`s:${m.primary}:${s}`]}
                            onChange={e => toggleOne(it.image.id, `s:${m.primary}:${s}`, e.target.checked)}
                          >
                            {s}
                          </Checkbox>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {it.suggestion!.newTags.length > 0 && (
                  <div className="p-2 border border-dashed border-border rounded">
                    <div className="text-xs text-muted-foreground mb-1">{t('batchAiTagNewTagsBadge')}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {it.suggestion!.newTags.map(nt => (
                        <Checkbox
                          key={nt.name}
                          checked={!!it.selected[`n:${nt.name}`]}
                          onChange={e => toggleOne(it.image.id, `n:${nt.name}`, e.target.checked)}
                        >
                          {nt.name}（{nt.parentName}）
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                )}
                {it.applyError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <span>{t('batchAiTagSaveFailed')}</span>
                    <Button
                      size="small"
                      type="link"
                      loading={!!it.saving}
                      disabled={retrying || applying}
                      onClick={() => retrySaveOne(it.image.id)}
                    >
                      {t('batchAiTagRetrySave')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {items.filter(it => it.status === 'done' && it.suggestion).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">{t('batchAiTagNoSuggestion')}</div>
          )}
        </div>
      )}
    </Drawer>
  )
}
