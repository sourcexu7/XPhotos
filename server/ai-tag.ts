import 'server-only'
import { Hono } from 'hono'
import { jwtAuth } from './middleware/auth'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigValue, invalidateConfigsCache } from '~/lib/db/query/configs'
import { fetchTagsTree } from '~/lib/db/query/tags'
import { recordAiUsage, extractUsage } from '~/lib/db/operate/ai-usage'

// AI 标签推荐 —— 视觉模型分析图片内容，从现有两级标签库中推荐标签。
// 所有失败路径返回结构化 { error }，前端任何失败均静默降级为纯手动标签模式。

const app = new Hono()

/**
 * AI 标签配置键（与 ai_guide 的 ai_model_* 键共用 configs 表）：
 * - ai_tag_enabled：'1'/'0' 总开关
 * - ai_tag_base_url / ai_tag_api_key / ai_tag_model：视觉模型配置，留空回退主 AI 配置
 */
export const AI_TAG_CONFIG_KEYS = [
  'ai_tag_enabled',
  'ai_tag_base_url',
  'ai_tag_api_key',
  'ai_tag_model',
]

const FETCH_IMAGE_TIMEOUT_MS = 15000
// 视觉模型为推理模型（带 reasoning_tokens），响应耗时更长，放宽到 60s
const VISION_TIMEOUT_MS = 60000
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_MATCH_GROUPS = 5
const MAX_SECONDARIES_PER_GROUP = 5
const MAX_NEW_TAGS = 3
const MAX_TAG_NAME_LENGTH = 50

interface TagTaxonomy {
  /** 小写一级名 -> 规范一级名 */
  primaryByName: Map<string, string>
  /** 小写一级名 -> (小写二级名 -> 规范二级名) */
  childrenByPrimary: Map<string, Map<string, string>>
  /** 库内全部标签名（一级+二级）的小写集合，用于新标签查重 */
  allNames: Set<string>
  /** 注入 prompt 的标签库文本行 */
  lines: string[]
}

/**
 * 读取最终生效的视觉模型配置；标签专属项留空时回退主 AI 配置
 */
async function resolveVisionConfig() {
  const [enabled, tagBaseUrl, tagApiKey, tagModel, mainBaseUrl, mainApiKey, mainModel] = await Promise.all([
    fetchConfigValue('ai_tag_enabled'),
    fetchConfigValue('ai_tag_base_url'),
    fetchConfigValue('ai_tag_api_key'),
    fetchConfigValue('ai_tag_model'),
    fetchConfigValue('ai_model_base_url'),
    fetchConfigValue('ai_model_api_key'),
    fetchConfigValue('ai_model_name'),
  ])
  const baseUrl = (tagBaseUrl || mainBaseUrl || 'https://api.deepseek.com/v1').trim()
  const apiKey = (tagApiKey || mainApiKey || '').trim()
  const model = (tagModel || mainModel || '').trim()
  return {
    enabled: enabled === '1',
    baseUrl,
    apiKey,
    model,
    configured: Boolean(apiKey && model),
  }
}

/**
 * 由标签树构建校验用索引与 prompt 文本
 */
function buildTaxonomy(tree: Awaited<ReturnType<typeof fetchTagsTree>>): TagTaxonomy {
  const primaryByName = new Map<string, string>()
  const childrenByPrimary = new Map<string, Map<string, string>>()
  const allNames = new Set<string>()
  const lines: string[] = []

  for (const node of tree ?? []) {
    const primary = (node.category ?? '').trim()
    if (!primary) continue
    const pLower = primary.toLowerCase()
    if (primaryByName.has(pLower)) continue
    primaryByName.set(pLower, primary)
    allNames.add(pLower)

    const childMap = new Map<string, string>()
    const childNames: string[] = []
    for (const child of node.children ?? []) {
      const name = (child.name ?? '').trim()
      if (!name) continue
      const cLower = name.toLowerCase()
      if (childMap.has(cLower) || cLower === pLower) continue
      childMap.set(cLower, name)
      allNames.add(cLower)
      childNames.push(name)
    }
    childrenByPrimary.set(pLower, childMap)
    lines.push(`- ${primary} => ${childNames.length ? childNames.join(', ') : '（无二级标签）'}`)
  }

  return { primaryByName, childrenByPrimary, allNames, lines }
}

function buildSystemPrompt(taxonomy: TagTaxonomy): string {
  return [
    '你是摄影图片内容分析专家，负责为摄影作品推荐标签。',
    '',
    '## 标签库（一级标签 => 二级标签列表）',
    ...taxonomy.lines,
    '',
    '## 任务',
    '分析图片内容，从标签库中选出最匹配的标签。',
    '',
    '## 规则',
    '1. 优先只从标签库中选择；matches 最多 3 组，每组 secondaries 最多 5 个。',
    '2. secondaries 中的二级标签必须属于对应的一级标签，不得跨组。',
    '3. 仅当图片内容明显无法用现有标签描述时，才在 newTags 中建议新标签（最多 2 个），',
    '   且 parentName 必须是标签库中真实存在的一级标签名。',
    '4. 不要发明标签库以外的 matches 内容；无法匹配时 matches 返回空数组。',
    '5. 只输出 JSON，不要包含 markdown 代码块标记或注释。',
    '',
    '## 输出格式',
    '{"matches":[{"primary":"一级标签名","secondaries":["二级标签名"]}],"newTags":[{"name":"新标签名","parentName":"一级标签名"}]}',
  ].join('\n')
}

/**
 * 解析 AI 返回内容：优先直接 JSON.parse，失败则提取首个 {...} 块再解析
 */
function parseLooseJson(content: string): any {
  if (!content) return null
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * 严格校验清洗 AI 推荐：
 * - primary 必须命中库中一级标签（大小写不敏感），否则整组丢弃
 * - secondaries 必须属于该一级标签，跨组/未知一律剔除
 * - newTags 必须指定真实一级 parentName，且不得与库内任何标签重名
 */
function sanitizeRecommendation(parsed: any, taxonomy: TagTaxonomy) {
  const matches: { primary: string; secondaries: string[] }[] = []
  const seenGroups = new Set<string>()
  const rawMatches = Array.isArray(parsed?.matches) ? parsed.matches : []

  for (const m of rawMatches) {
    if (!m || typeof m !== 'object') continue
    const canonicalPrimary = taxonomy.primaryByName.get(String(m.primary ?? '').trim().toLowerCase())
    if (!canonicalPrimary) continue
    const groupKey = canonicalPrimary.toLowerCase()
    if (seenGroups.has(groupKey)) continue

    const children = taxonomy.childrenByPrimary.get(groupKey) ?? new Map<string, string>()
    const secondaries: string[] = []
    const seenSec = new Set<string>()
    const rawSecs = Array.isArray(m.secondaries) ? m.secondaries : []
    for (const s of rawSecs) {
      if (typeof s !== 'string') continue
      const canonical = children.get(s.trim().toLowerCase())
      if (!canonical) continue
      const cLower = canonical.toLowerCase()
      if (seenSec.has(cLower)) continue
      seenSec.add(cLower)
      secondaries.push(canonical)
      if (secondaries.length >= MAX_SECONDARIES_PER_GROUP) break
    }

    seenGroups.add(groupKey)
    matches.push({ primary: canonicalPrimary, secondaries })
    if (matches.length >= MAX_MATCH_GROUPS) break
  }

  const newTags: { name: string; parentName: string }[] = []
  const seenNew = new Set<string>()
  const rawNew = Array.isArray(parsed?.newTags) ? parsed.newTags : []

  for (const t of rawNew) {
    if (!t || typeof t !== 'object') continue
    const name = typeof t.name === 'string' ? t.name.trim() : ''
    const parentCanonical = taxonomy.primaryByName.get(
      typeof t.parentName === 'string' ? t.parentName.trim().toLowerCase() : '',
    )
    if (!name || name.length > MAX_TAG_NAME_LENGTH) continue
    if (!parentCanonical) continue
    const lower = name.toLowerCase()
    if (taxonomy.allNames.has(lower) || seenNew.has(lower)) continue
    seenNew.add(lower)
    newTags.push({ name, parentName: parentCanonical })
    if (newTags.length >= MAX_NEW_TAGS) break
  }

  return { matches, newTags }
}

/**
 * AI 标签能力状态：前端据此决定是否渲染 AI 入口（关闭/未配置时不渲染任何 AI 按钮）
 */
app.get('/status', jwtAuth, async (c) => {
  try {
    const cfg = await resolveVisionConfig()
    return c.json({ code: 200, data: { enabled: cfg.enabled, configured: cfg.configured } })
  } catch (error) {
    console.error('Error fetching AI tag status:', error)
    return c.json({ code: 200, data: { enabled: false, configured: false } })
  }
})

/**
 * AI 标签推荐
 * 请求：{ imageUrl: string } —— 已上传的 WebP 预览图 URL（服务端抓图，避免前端传大 base64 与 CORS 问题）
 */
app.post('/recommend', jwtAuth, async (c) => {
  try {
    const body = await c.req.json().catch(() => null)
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : ''
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      return c.json({ error: 'INVALID_IMAGE_URL' }, 400)
    }

    const cfg = await resolveVisionConfig()
    if (!cfg.enabled) {
      return c.json({ error: 'AI_TAG_DISABLED' }, 403)
    }
    if (!cfg.configured) {
      return c.json({ error: 'AI_TAG_NOT_CONFIGURED' }, 400)
    }
    const startedAt = Date.now()

    const tree = await fetchTagsTree()
    const taxonomy = buildTaxonomy(tree)
    if (taxonomy.primaryByName.size === 0) {
      // 标签库为空：无可推荐内容，返回空结果（前端隐藏入口）
      return c.json({ code: 200, data: { matches: [], newTags: [] } })
    }

    // 服务端抓取预览图并转 base64 data URL（视觉 API 需可直接读取图片内容）
    let imgRes: Response
    try {
      imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(FETCH_IMAGE_TIMEOUT_MS) })
    } catch {
      return c.json({ error: 'IMAGE_FETCH_FAILED' }, 400)
    }
    if (!imgRes.ok) {
      return c.json({ error: 'IMAGE_FETCH_FAILED' }, 400)
    }
    const buf = Buffer.from(await imgRes.arrayBuffer())
    if (buf.byteLength === 0) {
      return c.json({ error: 'IMAGE_FETCH_FAILED' }, 400)
    }
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      return c.json({ error: 'IMAGE_TOO_LARGE' }, 400)
    }
    const contentType = imgRes.headers.get('content-type')?.split(';')[0] || 'image/webp'
    const dataUrl = `data:${contentType};base64,${buf.toString('base64')}`

    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(taxonomy) },
          {
            role: 'user',
            content: [
              { type: 'text', text: '请分析这张摄影图片，按系统规则输出推荐标签 JSON。' },
              // detail: 'low' —— 服务端将图片缩放到 512×512 处理，显著节省图片 token
              { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
            ],
          },
        ],
        temperature: 0.2,
        // 上限非成本：推理 token（reasoning_tokens）+ JSON 输出共用该额度
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('AI tag vision API error:', response.status, errText.slice(0, 300))
      await recordAiUsage({
        scene: 'tag_recommend', model: cfg.model, durationMs: Date.now() - startedAt, success: false,
      })
      return c.json({ error: 'AI_UPSTREAM_ERROR', message: errText.slice(0, 300) }, 502)
    }

    const data = await response.json()
    await recordAiUsage({
      scene: 'tag_recommend', model: cfg.model,
      ...extractUsage(data?.usage),
      durationMs: Date.now() - startedAt,
      success: true,
    })
    const content: string = data?.choices?.[0]?.message?.content || ''
    const parsed = parseLooseJson(content)
    if (!parsed) {
      return c.json({ error: 'AI_BAD_RESPONSE' }, 502)
    }

    const cleaned = sanitizeRecommendation(parsed, taxonomy)
    return c.json({ code: 200, data: cleaned })
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return c.json({ error: 'AI_TIMEOUT' }, 504)
    }
    console.error('AI tag recommend error:', error)
    throw new HTTPException(500, { message: 'AI tag recommendation failed', cause: error })
  }
})

/**
 * 视觉模型连通性测试（独立于主 AI 配置的测试）
 */
app.post('/test-connection', jwtAuth, async (c) => {
  try {
    const cfg = await resolveVisionConfig()
    if (!cfg.apiKey) {
      return c.json({ success: false, message: 'API Key 未配置（视觉模型与主 AI 配置均为空）' }, 400)
    }
    if (!cfg.model) {
      return c.json({ success: false, message: '模型名未配置（视觉模型与主 AI 配置均为空）' }, 400)
    }

    const startedAt = Date.now()
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: '回复"连接成功"四个字' }],
          },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      await recordAiUsage({
        scene: 'tag_test', model: cfg.model, durationMs: Date.now() - startedAt, success: false,
      })
      return c.json({ success: false, message: `API 返回 ${response.status}: ${errText.slice(0, 200)}` }, 500)
    }

    const data = await response.json()
    await recordAiUsage({
      scene: 'tag_test', model: cfg.model,
      ...extractUsage(data?.usage),
      durationMs: Date.now() - startedAt,
      success: true,
    })
    const reply = data?.choices?.[0]?.message?.content || ''
    return c.json({ success: true, message: `连接成功，模型回复: ${reply}` })
  } catch (error: any) {
    return c.json({ success: false, message: `连接失败: ${error?.message ?? '未知错误'}` }, 500)
  }
})

/**
 * 余额查询（视觉模型配置，优先 ai_tag_api_key，留空回退主 AI 配置）
 * DeepSeek: GET {base}/user/balance，Bearer 鉴权；base 去掉末尾 /v1（余额端点不带版本前缀）
 */
app.get('/balance', jwtAuth, async (c) => {
  try {
    const cfg = await resolveVisionConfig()
    if (!cfg.apiKey) {
      return c.json({ success: false, message: 'API Key 未配置' }, 400)
    }
    const balanceBase = cfg.baseUrl.replace(/\/v1\/?$/i, '')
    const response = await fetch(`${balanceBase}/user/balance`, {
      headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    const json = await response.json().catch(() => null)
    if (!response.ok) {
      const msg = (json as any)?.error?.message || `API 返回 ${response.status}`
      return c.json({ success: false, message: msg }, 502)
    }
    return c.json({
      success: true,
      is_available: !!(json as any)?.is_available,
      balance_infos: (json as any)?.balance_infos ?? [],
    })
  } catch (error: any) {
    return c.json({ success: false, message: `余额查询失败: ${error?.message ?? '未知错误'}` }, 500)
  }
})

/**
 * 保存 AI 标签配置后失效配置缓存（由 ai-guide 的 PUT /config 统一写入，
 * 这里仅在本模块需要单独刷新时使用）
 */
export async function invalidateAiTagConfigCache() {
  await invalidateConfigsCache(...AI_TAG_CONFIG_KEYS)
}

export default app
