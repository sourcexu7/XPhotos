import 'server-only'
import { db } from '~/lib/db'

export interface AiUsageEntry {
  scene: 'guide_parse' | 'guide_test' | 'tag_recommend' | 'tag_test'
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cacheHitTokens?: number
  durationMs?: number
  success?: boolean
}

/**
 * 记录一次 AI 调用的用量明细。
 * 任何失败都静默吞掉，绝不影响主流程（用量记录是旁路功能）。
 */
export async function recordAiUsage(entry: AiUsageEntry): Promise<void> {
  try {
    await db.aiUsageLog.create({
      data: {
        scene: entry.scene,
        model: entry.model || 'unknown',
        promptTokens: Math.max(0, Math.floor(entry.promptTokens ?? 0)),
        completionTokens: Math.max(0, Math.floor(entry.completionTokens ?? 0)),
        totalTokens: Math.max(0, Math.floor(entry.totalTokens ?? 0)),
        reasoningTokens: Math.max(0, Math.floor(entry.reasoningTokens ?? 0)),
        cacheHitTokens: Math.max(0, Math.floor(entry.cacheHitTokens ?? 0)),
        durationMs: Math.max(0, Math.floor(entry.durationMs ?? 0)),
        success: entry.success ?? true,
      },
    })
  } catch (error) {
    console.error('Failed to record AI usage log:', error)
  }
}

/** 从上游响应体提取 usage 字段（OpenAI 兼容格式） */
export function extractUsage(usage: any): {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  reasoningTokens: number
  cacheHitTokens: number
} {
  return {
    promptTokens: Number(usage?.prompt_tokens) || 0,
    completionTokens: Number(usage?.completion_tokens) || 0,
    totalTokens: Number(usage?.total_tokens) || 0,
    reasoningTokens: Number(usage?.completion_tokens_details?.reasoning_tokens) || 0,
    cacheHitTokens: Number(usage?.prompt_tokens_details?.cached_tokens) || 0,
  }
}
