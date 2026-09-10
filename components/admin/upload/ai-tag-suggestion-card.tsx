'use client'

import React from 'react'
import { Button, Tag, theme } from 'antd'
import { CloseOutlined, LoadingOutlined, RobotOutlined, TagsOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { createAiNewTag, type AiTagNewTag, type AiTagStatus, type AiTagSuggestion } from '~/hooks/useAiTagRecommend'

interface AiTagSuggestionCardProps {
  status: AiTagStatus
  suggestion: AiTagSuggestion | null
  /** 当前已选标签（用于高亮已采纳项） */
  appliedLabels: string[]
  /** 应用一组标签：names 加入标签列表，categoryMap 记录二级/新标签的一级归属 */
  onApply: (names: string[], categoryMap: Record<string, string>) => void
  onDismiss: () => void
  /** 分析失败时的重试回调（可选，提供后失败态展示重试按钮） */
  onRetry?: () => void
}

const pillStyle = (selected: boolean, colorPrimary: string, colorBgBase: string): React.CSSProperties => ({
  cursor: 'pointer',
  borderRadius: '16px',
  padding: '2px 10px',
  fontSize: '12px',
  backgroundColor: selected ? colorPrimary : undefined,
  color: selected ? colorBgBase : undefined,
})

/**
 * AI 推荐标签卡片（人工审核后采纳，不会自动写入）。
 * 与多文件上传中的推荐交互保持一致：一级/二级标签点击采纳，虚线标签为 AI 建议新建。
 */
export default function AiTagSuggestionCard({
  status,
  suggestion,
  appliedLabels,
  onApply,
  onDismiss,
  onRetry,
}: AiTagSuggestionCardProps) {
  const { token } = theme.useToken()
  const t = useTranslations('Upload')

  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <div className="mb-3 px-3 py-2 rounded-md border border-dashed border-border text-xs text-text-secondary flex items-center gap-2">
        <LoadingOutlined spin />
        {t('aiRecommendLoading')}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mb-3 px-3 py-2 rounded-md border border-dashed border-border text-xs text-text-secondary flex items-center gap-2">
        <RobotOutlined />
        <span>{t('aiRecommendFailed')}</span>
        {onRetry && (
          <Button type="link" size="small" className="px-1" onClick={onRetry}>
            {t('aiRecommendRetry')}
          </Button>
        )}
      </div>
    )
  }

  const hasSuggestion = !!suggestion && (suggestion.matches.length > 0 || suggestion.newTags.length > 0)
  if (status === 'done' && !hasSuggestion) return null

  const adopted = (name: string) => appliedLabels.some(l => l.toLowerCase() === name.toLowerCase())

  const handleAdoptAll = async () => {
    if (!suggestion) return
    await Promise.all(suggestion.newTags.map(nt => createAiNewTag(nt)))
    const names: string[] = []
    const categoryMap: Record<string, string> = {}
    const push = (name: string, parent?: string) => {
      if (!names.some(n => n.toLowerCase() === name.toLowerCase())) names.push(name)
      if (parent) categoryMap[name] = parent
    }
    suggestion.matches.forEach(m => {
      push(m.primary)
      m.secondaries.forEach(s => push(s, m.primary))
    })
    suggestion.newTags.forEach(nt => push(nt.name, nt.parentName))
    onApply(names, categoryMap)
  }

  const handleAdoptNewTag = async (nt: AiTagNewTag) => {
    await createAiNewTag(nt)
    onApply([nt.name], { [nt.name]: nt.parentName })
  }

  return (
    <div className="mb-3 p-3 rounded-md border border-border bg-background-alt">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
          <RobotOutlined />
          {t('aiRecommendCardTitle')}
        </span>
        <div className="flex items-center gap-1">
          <Button size="small" type="link" className="px-1" onClick={handleAdoptAll}>
            {t('aiAdoptAll')}
          </Button>
          <Button
            size="small"
            type="text"
            icon={<CloseOutlined />}
            aria-label={t('aiDismiss')}
            onClick={onDismiss}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        {suggestion?.matches.map(m => (
          <div key={m.primary} className="flex flex-wrap items-center gap-1.5">
            <Tag
              style={pillStyle(adopted(m.primary), token.colorPrimary, token.colorBgBase)}
              onClick={() => onApply([m.primary], {})}
            >
              {m.primary}
            </Tag>
            {m.secondaries.map(s => (
              <Tag
                key={s}
                style={pillStyle(adopted(s), token.colorPrimary, token.colorBgBase)}
                onClick={() => onApply([s], { [s]: m.primary })}
              >
                {s}
              </Tag>
            ))}
          </div>
        ))}
        {suggestion?.newTags.map(nt => (
          <div key={nt.name} className="flex flex-wrap items-center gap-1.5">
            <Tag style={{ ...pillStyle(adopted(nt.name), token.colorPrimary, token.colorBgBase), borderStyle: 'dashed' }} onClick={() => handleAdoptNewTag(nt)}>
              <TagsOutlined className="mr-1" />
              {t('aiNewTagBadge')} · {nt.name}（{nt.parentName}）
            </Tag>
          </div>
        ))}
      </div>
    </div>
  )
}
