'use client'

import { useCallback, useRef, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'

export interface AiTagMatch {
  primary: string
  secondaries: string[]
}

export interface AiTagNewTag {
  name: string
  parentName: string
}

export interface AiTagSuggestion {
  matches: AiTagMatch[]
  newTags: AiTagNewTag[]
}

export type AiTagStatus = 'idle' | 'loading' | 'done' | 'error'

/**
 * AI 标签推荐（单图场景，供简单上传/LivePhoto 上传使用）。
 * 能力关闭/未配置/请求失败时静默降级为纯手动标签模式。
 * 自动通道由调用方在上传完成后调用 recommend(previewUrl) 触发。
 */
export function useAiTagRecommend() {
  const { data: aiTagStatus } = useSWR<{ code: number; data: { enabled: boolean; configured: boolean } }>(
    '/api/v1/ai-tag/status',
    fetcher,
  )
  const aiTagAvailable = !!(aiTagStatus?.data?.enabled && aiTagStatus?.data?.configured)
  const aiTagAvailableRef = useRef(aiTagAvailable)
  aiTagAvailableRef.current = aiTagAvailable

  const [aiStatus, setAiStatus] = useState<AiTagStatus>('idle')
  const [aiSuggestion, setAiSuggestion] = useState<AiTagSuggestion | null>(null)

  const recommend = useCallback(async (imageUrl: string) => {
    setAiStatus('loading')
    try {
      const res = await fetch('/api/v1/ai-tag/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.code === 200 && json.data) {
        setAiSuggestion(json.data)
        setAiStatus('done')
      } else {
        setAiStatus('error')
      }
    } catch {
      setAiStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setAiStatus('idle')
    setAiSuggestion(null)
  }, [])

  return { aiTagAvailable, aiTagAvailableRef, aiStatus, aiSuggestion, recommend, reset }
}

/**
 * 创建 AI 建议的新标签（遵循现有标签体系：挂在指定一级标签下；创建失败不阻断）
 */
export async function createAiNewTag(nt: AiTagNewTag) {
  try {
    await fetch('/api/v1/settings/tags/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nt.name, parentName: nt.parentName }),
    })
  } catch {
    // 忽略创建失败：标签仍作为普通标签写入图片
  }
}
