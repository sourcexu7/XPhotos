import 'server-only'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { jwtAuth } from './middleware/auth'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigValue, invalidateConfigsCache } from '~/lib/db/query/configs'
import { db } from '~/lib/db'
import { cacheInvalidateByPattern } from '~/lib/redis'
import { AI_TAG_CONFIG_KEYS } from './ai-tag'
import { recordAiUsage, extractUsage } from '~/lib/db/operate/ai-usage'

const app = new Hono()

const AI_CONFIG_KEYS = [
  'ai_model_provider',
  'ai_model_api_key',
  'ai_model_base_url',
  'ai_model_name',
  'ai_model_temperature',
  'ai_model_system_prompt',
  ...AI_TAG_CONFIG_KEYS,
  // 金额估算单价（元/百万 tokens），留空则不显示估算消费
  'ai_price_input_per_m',
  'ai_price_output_per_m',
]

/**
 * 默认 System Prompt
 */
export const DEFAULT_SYSTEM_PROMPT = `你是一个专业的攻略文档解析专家。请将用户提供的攻略内容解析为结构化 JSON。

## 输出格式
必须输出合法 JSON，不要包含 markdown 代码块标记或注释：
{
  "guide_info": {
    "title": "攻略标题",
    "country": "国家",
    "city": "城市",
    "days": 数字天数,
    "start_date": "YYYY-MM-DD 或 null",
    "end_date": "YYYY-MM-DD 或 null"
  },
  "modules": [
    {
      "name": "模块显示名称",
      "template": "itinerary|expense|checklist|transport|photo|tips|railway|timeline|notes|review|seat|text|image",
      "moduleData": [],
      "contents": []
    }
  ]
}

## 模块类型总览

### 专用模块（有 moduleData 数组，contents 为 null）— 共 11 种

1. itinerary 行程安排 — 按天的详细行程安排，每天一个 item
2. expense 费用预算 — 各项费用明细，含分类和价格
3. checklist 准备清单 — 打包/准备清单，按分类组织
4. transport 交通信息 — 航班/火车/租车等交通信息
5. photo 摄影攻略 — 拍摄点位信息和建议
6. tips 特别提示 — 实用建议，按分类组织
7. railway 铁路信息 — 火车车次、时刻表、座位类型等详细铁路信息
8. timeline 交通时间线 — 以时间轴形式呈现行程中各类交通安排
9. notes 注意事项 — 要点式展示旅行中的重要注意事项，含优先级
10. review 景点点评 — 景点评价与反馈，含1-5星评分
11. seat 摄影机位推荐 — 摄影机位推荐，含拍摄参数、最佳时间季节、样图等

### 通用模块（有 contents 数组，moduleData 为 null）— 共 2 种

12. text 文本模块 — 用于攻略概览、行程总览、前言、注意事项、背景介绍等无法归入专用模块的内容
13. image 图片模块 — 用于图片展示

## 通用模块 contents 格式
contents 为数组，每项一条内容：
[{
  "type": "text",
  "content": { "text": "文本内容，支持 Markdown" }
}]
text 模块的 contents 可以包含多条文本内容。

## 各专用模块数据格式

### 1. itinerary 行程安排
moduleData 为数组，每天一个 item：
[{
  "id": "1",
  "date": "4.30",
  "title": "第一天：落地科莫多",
  "location": "机场 => 码头 => 卡隆岛",
  "description": "14:25 落地科莫多机场，15:30 抵达拉布安巴佐码头",
  "tips": "住宿：Zasgo Hotel",
  "highlights": ["卡隆岛日落", "万蝠出巢"]
}]
解析要点：按天分组，每天一个 item；date 用原文中的日期格式；location 用箭头连接路线

### 2. expense 费用预算
moduleData 为数组：
[{
  "id": "1",
  "name": "费用名称",
  "detail": "费用详情",
  "type": "费用类型如高铁/飞机/门票",
  "channel": "购买渠道如12306/携程",
  "unitPrice": 数字单价,
  "subtotal": 数字小计,
  "category": "transport|accommodation|food|ticket|equipment|shopping|other",
  "notes": "备注"
}]
规则：category 必须用英文枚举值；unitPrice 和 subtotal 必须是数字类型

费用分类对照表：
交通 → transport（高铁、飞机、打车、租车等）
住宿 → accommodation（酒店、民宿等）
餐饮 → food（早中晚餐、零食等）
门票 → ticket（景点门票）
设备 → equipment（租赁设备等）
购物 → shopping（纪念品、特产等）
其他 → other（无法归入以上分类的费用）

### 3. checklist 准备清单
moduleData 为数组，按分类组织：
[{
  "id": "1",
  "name": "分类名称如衣物准备",
  "items": [{ "id": "1-1", "name": "物品名", "checked": false }]
}]
解析要点：将清单按分类组织，如衣物准备、电子设备、证件文件等

### 4. transport 交通信息
moduleData 为数组：
[{
  "id": "1",
  "type": "flight|train|car",
  "route": "出发-到达如北京-上海",
  "flightNo": "航班号或null",
  "trainNo": "车次或null",
  "company": "航空公司或租车公司",
  "model": "机型或null",
  "date": "日期",
  "time": "时间范围",
  "baggage": "行李额或null",
  "seat": "座位或null",
  "price": 数字价格,
  "pickup": "取车地点或null",
  "dropoff": "还车地点或null",
  "days": 租车天数或null,
  "notes": "备注或null"
}]
规则：type 必须是 flight/train/car；price 必须是数字
解析要点：航班用 flightNo，火车用 trainNo，租车用 pickup/dropoff/days

### 5. photo 摄影攻略
moduleData 为数组：
[{
  "id": "1",
  "name": "拍摄点名称",
  "location": "拍摄位置",
  "description": "拍摄描述",
  "tips": "拍摄建议如光线/构图/时间"
}]
解析要点：区分于 seat 模块，photo 侧重拍摄点介绍，seat 侧重机位技术参数

### 6. tips 特别提示
moduleData 为数组：
[{
  "id": "1",
  "category": "分类如交通/住宿/美食/安全",
  "content": "具体建议内容"
}]
解析要点：按分类组织，如交通贴士、住宿贴士、美食贴士、安全贴士等

### 7. railway 铁路信息
moduleData 为数组：
[{
  "id": "1",
  "trainNo": "车次如G1234",
  "trainType": "high_speed|emu|direct|express|fast|ordinary",
  "route": "出发-到达如北京-上海",
  "departureStation": "出发站如北京南",
  "arrivalStation": "到达站如上海虹桥",
  "departureDate": "日期",
  "departureTime": "出发时间如08:00",
  "arrivalTime": "到达时间如13:00",
  "duration": "历时如5小时",
  "seatType": "business|first|second|soft_sleeper|hard_sleeper|hard_seat|standing",
  "seatNo": "座位号如12A",
  "carriage": "车厢号如5",
  "platform": "站台如3",
  "price": 数字价格,
  "notes": "备注或null"
}]
规则：trainType 必须用英文枚举值；seatType 必须用英文枚举值；price 必须是数字

列车类型对照表：
high_speed → 高铁（G开头）
emu → 动车（D开头）
direct → 直达（Z开头）
express → 特快（T开头）
fast → 快速（K开头）
ordinary → 普通

座位类型对照表：
business → 商务座
first → 一等座
second → 二等座
soft_sleeper → 软卧
hard_sleeper → 硬卧
hard_seat → 硬座
standing → 无座

### 8. timeline 交通时间线
moduleData 为数组：
[{
  "id": "1",
  "date": "日期",
  "time": "时间如08:00",
  "type": "flight|train|car|walk|other",
  "title": "标题如北京-上海",
  "description": "描述",
  "location": "地点如北京首都机场",
  "duration": "时长如2小时",
  "notes": "备注或null"
}]
规则：type 必须用英文枚举值；按时间顺序排列

交通类型对照表：
flight → 航班
train → 火车
car → 汽车
walk → 步行
other → 其他

### 9. notes 注意事项
moduleData 为数组：
[{
  "id": "1",
  "priority": "high|medium|low|success",
  "category": "分类如签证/安全/交通",
  "title": "要点标题",
  "content": "详细内容"
}]
规则：priority 必须用英文枚举值

优先级对照表：
high → 重要（红色，如签证、安全问题）
medium → 注意（橙色，如交通变动）
low → 提示（蓝色，如天气提醒）
success → 确认（绿色，如已确认事项）

### 10. review 景点点评
moduleData 为数组：
[{
  "id": "1",
  "attractionName": "景点名称如故宫",
  "rating": 数字1-5,
  "author": "点评人",
  "date": "日期",
  "content": "点评内容",
  "pros": "优点或null",
  "cons": "缺点或null",
  "visitType": "solo|couple|family|group|business"
}]
规则：rating 必须是1-5的数字；visitType 必须用英文枚举值

出行类型对照表：
solo → 独自出行
couple → 情侣出行
family → 家庭出行
group → 团队出行
business → 商务出行

### 11. seat 摄影机位推荐
moduleData 为数组：
[{
  "id": "1",
  "spotName": "机位名称如故宫角楼",
  "location": "拍摄地点如北京东城区",
  "bestTime": "sunrise|sunset|blue_hour|golden_hour|midday|night|anytime",
  "season": "spring|summer|autumn|winter|all_season",
  "direction": "east|south|west|north|southeast|southwest|northeast|northwest",
  "focalLength": "推荐焦段如16-35mm",
  "aperture": "推荐光圈如f/8",
  "shutterSpeed": "推荐快门如1/125s",
  "iso": "推荐ISO如100",
  "equipment": "推荐器材如三脚架、ND滤镜",
  "tips": "拍摄技巧或null",
  "sampleImage": "样图URL或null",
  "notes": "注意事项或null"
}]
规则：bestTime/season/direction 必须用英文枚举值

最佳时间对照表：
sunrise → 日出
sunset → 日落
blue_hour → 蓝调时刻
golden_hour → 黄金时刻
midday → 正午
night → 夜间
anytime → 随时

季节对照表：
spring → 春季
summer → 夏季
autumn → 秋季
winter → 冬季
all_season → 四季皆宜

方向对照表：
east → 朝东 / south → 朝南 / west → 朝西 / north → 朝北
southeast → 东南 / southwest → 西南 / northeast → 东北 / northwest → 西北

## 模块选择指南

### 何时使用哪个模块

| 原文内容 | 应使用的模块 | 说明 |
|---------|-------------|------|
| 按天描述的行程安排 | itinerary | 每天一个 item，含日期、地点、描述 |
| 费用列表、预算明细 | expense | 含分类和价格，必须是数字 |
| 打包清单、准备物品 | checklist | 按分类组织物品 |
| 航班/火车/租车信息 | transport | 区分 flight/train/car |
| 拍摄点位介绍 | photo | 侧重拍摄点描述 |
| 实用建议、小贴士 | tips | 按分类组织 |
| 火车车次详细信息 | railway | 含车次、时刻表、座位类型 |
| 全程交通时间轴 | timeline | 按时间顺序排列各类交通 |
| 重要注意事项、警告 | notes | 含优先级和分类 |
| 景点评价、点评 | review | 含1-5星评分 |
| 摄影机位技术参数 | seat | 含焦段、光圈、最佳时间等 |
| 攻略概览、前言、总述 | text | 无法归入专用模块的内容 |
| 纯图片展示 | image | 用于图片展示 |

### photo 与 seat 的区别
- photo：侧重拍摄点的介绍和描述（名称、位置、描述、建议）
- seat：侧重摄影技术参数（焦段、光圈、快门、ISO、最佳时间、季节、方向）

### transport 与 railway 的区别
- transport：通用交通信息（航班、火车、租车混合）
- railway：专门的铁路详细信息（车次、时刻表、座位类型、车厢号、站台）

### transport 与 timeline 的区别
- transport：按交通方式组织（每条记录是一种交通）
- timeline：按时间顺序组织（所有交通方式混合在时间轴上）

## 解析规则

1. 根据攻略内容智能选择模块类型和排列顺序
2. 所有 price/unitPrice/subtotal/rating 必须是 number 类型，不能是字符串
3. expense 的 category 必须用英文枚举值（参见费用分类对照表）
4. transport 的 type 必须是 flight/train/car
5. railway 的 trainType 和 seatType 必须用英文枚举值（参见对照表）
6. timeline 的 type 必须用英文枚举值（flight/train/car/walk/other）
7. notes 的 priority 必须用英文枚举值（high/medium/low/success）
8. review 的 rating 必须是1-5的数字，visitType 必须用英文枚举值
9. seat 的 bestTime/season/direction 必须用英文枚举值
10. 每个模块的 name 用简洁中文描述
11. 行程模块按天分组，每天一个 item
12. 攻略概览、行程总览、前言、背景介绍、总体说明等内容，用 text 模块，内容放在 contents 数组中
13. 如果内容不适合任何专用模块，用 text 模块，内容放在 contents 中
14. 专用模块的 moduleData 放数组数据，contents 设为 null
15. 通用模块的 moduleData 设为 null，contents 放内容数组
16. 输出必须是合法 JSON，不包含注释或 markdown 标记
17. 不要编造数据，如果原文没有某类信息则不创建对应模块
18. 尽可能完整地提取原文中的所有信息，不要遗漏
19. 如果原文同时包含交通详细信息和全程时间线，同时创建 transport 和 timeline 模块
20. 如果原文同时包含拍摄点介绍和机位技术参数，同时创建 photo 和 seat 模块

## 输出示例

{
  "guide_info": {
    "title": "科莫多五日游",
    "country": "印度尼西亚",
    "city": "科莫多",
    "days": 5,
    "start_date": "2024-04-30",
    "end_date": "2024-05-04"
  },
  "modules": [
    {
      "name": "行程概览",
      "template": "text",
      "moduleData": null,
      "contents": [{"type": "text", "content": {"text": "本次行程为5天4晚科莫多群岛之旅..."}}]
    },
    {
      "name": "每日行程",
      "template": "itinerary",
      "moduleData": [{"id": "1", "date": "4.30", "title": "第一天：落地科莫多", "location": "机场 => 码头 => 卡隆岛", "description": "14:25 落地...", "tips": "住宿：Zasgo Hotel", "highlights": ["卡隆岛日落"]}],
      "contents": null
    },
    {
      "name": "费用预算",
      "template": "expense",
      "moduleData": [{"id": "1", "name": "机票", "detail": "北京-科莫多往返", "type": "飞机", "channel": "携程", "unitPrice": 3360, "subtotal": 3360, "category": "transport", "notes": ""}],
      "contents": null
    },
    {
      "name": "注意事项",
      "template": "notes",
      "moduleData": [{"id": "1", "priority": "high", "category": "签证", "title": "签证办理", "content": "需提前办理印尼签证..."}],
      "contents": null
    }
  ]
}`


/**
 * 获取 AI 模型配置
 */
app.get('/config', jwtAuth, async (c) => {
  try {
    const configs = await db.configs.findMany({
      where: { config_key: { in: AI_CONFIG_KEYS } },
      select: { config_key: true, config_value: true },
    })
    // 对 API Key 做掩码处理（ai_model_api_key / ai_tag_api_key 等统一按前缀判断）
    const result = configs.map(item => {
      if (item.config_key.endsWith('_api_key') && item.config_value) {
        const val = item.config_value
        const masked = val.length > 8
          ? val.slice(0, 4) + '****' + val.slice(-4)
          : '****'
        return { ...item, config_value: masked, hasKey: true }
      }
      return { ...item, hasKey: !!item.config_value }
    })
    // 如果 prompt 未配置或为空，返回默认值
    const promptItem = result.find(item => item.config_key === 'ai_model_system_prompt')
    if (!promptItem) {
      result.push({ config_key: 'ai_model_system_prompt', config_value: DEFAULT_SYSTEM_PROMPT, hasKey: false })
    } else if (!promptItem.config_value) {
      promptItem.config_value = DEFAULT_SYSTEM_PROMPT
    }
    return c.json({ data: result })
  } catch (error) {
    console.error('Error fetching AI model config:', error)
    throw new HTTPException(500, { message: 'Failed to fetch AI model config', cause: error })
  }
})

/**
 * 更新 AI 模型配置
 */
app.put('/config', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const items: { config_key: string; config_value: string }[] = body

    // 如果 API Key 是掩码值（包含 ****），跳过更新
    const updates = items.filter(item => {
      if (item.config_key.endsWith('_api_key') && item.config_value.includes('****')) {
        return false
      }
      return true
    })

    for (const item of updates) {
      const existing = await db.configs.findFirst({
        where: { config_key: item.config_key },
      })
      if (existing) {
        await db.configs.update({
          where: { config_key: item.config_key },
          data: { config_value: item.config_value },
        })
      } else {
        await db.configs.create({
          data: { config_key: item.config_key, config_value: item.config_value },
        })
      }
    }

    await invalidateConfigsCache(...AI_CONFIG_KEYS)
    await cacheInvalidateByPattern('configs:*')
    return c.json({ message: 'AI model config updated successfully' })
  } catch (error) {
    console.error('Error updating AI model config:', error)
    throw new HTTPException(500, { message: 'Failed to update AI model config', cause: error })
  }
})

/**
 * 测试 AI 模型连接
 */
app.post('/test-connection', jwtAuth, async (c) => {
  try {
    const apiKey = await fetchConfigValue('ai_model_api_key')
    const baseUrl = await fetchConfigValue('ai_model_base_url', 'https://api.deepseek.com/v1')
    const modelName = await fetchConfigValue('ai_model_name', 'deepseek-chat')

    if (!apiKey) {
      return c.json({ success: false, message: 'API Key 未配置' }, 400)
    }

    const testStartedAt = Date.now()
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: '回复"连接成功"四个字' }],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errText = await response.text()
      await recordAiUsage({
        scene: 'guide_test', model: modelName, durationMs: Date.now() - testStartedAt, success: false,
      })
      return c.json({ success: false, message: `API 返回 ${response.status}: ${errText.slice(0, 200)}` }, 500)
    }

    const data = await response.json()
    await recordAiUsage({
      scene: 'guide_test', model: modelName,
      ...extractUsage(data?.usage),
      durationMs: Date.now() - testStartedAt,
      success: true,
    })
    const reply = data.choices?.[0]?.message?.content || ''
    return c.json({ success: true, message: `连接成功，模型回复: ${reply}` })
  } catch (error: any) {
    return c.json({ success: false, message: `连接失败: ${error.message}` }, 500)
  }
})

/**
 * AI 调用用量明细 + 汇总（今日/本月 tokens 与次数）
 */
app.get('/usage', jwtAuth, async (c) => {
  try {
    const limitRaw = Number(c.req.query('limit') || 100)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 100

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [items, todayAgg, monthAgg] = await Promise.all([
      db.aiUsageLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.aiUsageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { totalTokens: true },
        _count: true,
      }),
      db.aiUsageLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
        _count: true,
      }),
    ])

    return c.json({
      code: 200,
      data: {
        items,
        summary: {
          todayTokens: todayAgg._sum.totalTokens ?? 0,
          todayRequests: todayAgg._count ?? 0,
          monthTokens: monthAgg._sum.totalTokens ?? 0,
          monthPromptTokens: monthAgg._sum.promptTokens ?? 0,
          monthCompletionTokens: monthAgg._sum.completionTokens ?? 0,
          monthRequests: monthAgg._count ?? 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching AI usage:', error)
    throw new HTTPException(500, { message: 'Failed to fetch AI usage', cause: error })
  }
})

/**
 * 余额查询（主 AI 配置）
 * DeepSeek: GET {base}/user/balance，Bearer 鉴权；base 去掉末尾 /v1（余额端点不带版本前缀）
 */
app.get('/balance', jwtAuth, async (c) => {
  try {
    const apiKey = await fetchConfigValue('ai_model_api_key')
    const baseUrl = await fetchConfigValue('ai_model_base_url', 'https://api.deepseek.com/v1')
    if (!apiKey) {
      return c.json({ success: false, message: 'API Key 未配置' }, 400)
    }
    const balanceBase = baseUrl.replace(/\/v1\/?$/i, '')
    const response = await fetch(`${balanceBase}/user/balance`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
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
 * 规范化 AI 解析结果（修正模块数组结构、数字类型等）
 */
function normalizeParsedGuide(parsed: any): any {
  const specialTemplates = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips', 'railway', 'timeline', 'notes', 'review', 'seat']
  parsed.modules = (parsed.modules as any[]).map((mod: any, index: number) => {
    // 确保 template 字段存在
    if (!mod.template) {
      mod.template = 'text'
    }
    // 专用模块：确保 moduleData 是数组
    if (specialTemplates.includes(mod.template)) {
      if (mod.moduleData == null) {
        mod.moduleData = []
      } else if (!Array.isArray(mod.moduleData)) {
        mod.moduleData = [mod.moduleData]
      }
      // 修正数字类型字段（AI 有时返回字符串类型的数字）
      mod.moduleData = mod.moduleData.map((item: any, i: number) => {
        if (typeof item !== 'object' || item === null) return item
        const fixed = { ...item }
        if (!fixed.id) fixed.id = String(i + 1)
        const numericFields = ['unitPrice', 'subtotal', 'price', 'days']
        for (const field of numericFields) {
          if (fixed[field] != null && typeof fixed[field] !== 'number') {
            const num = Number(fixed[field])
            if (!isNaN(num)) {
              fixed[field] = num
            } else {
              delete fixed[field]
            }
          }
        }
        if (fixed.checked != null && typeof fixed.checked !== 'boolean') {
          fixed.checked = fixed.checked === 'true' || fixed.checked === true
        }
        return fixed
      })
      // 专用模块不需要 contents
      mod.contents = null
    } else {
      // 通用模块：moduleData 为 null，确保 contents 是数组
      mod.moduleData = null
      if (!mod.contents) {
        mod.contents = []
      } else if (!Array.isArray(mod.contents)) {
        mod.contents = [mod.contents]
      }
      // 确保 contents 每项有 type 和 content
      mod.contents = mod.contents.map((item: any) => {
        if (typeof item !== 'object' || item === null) {
          return { type: 'text', content: { text: String(item) } }
        }
        const fixed = { ...item }
        if (!fixed.type) fixed.type = 'text'
        if (!fixed.content) {
          fixed.content = { text: fixed.text || fixed.content || '' }
        }
        return fixed
      })
    }
    // 确保有 name
    if (!mod.name) {
      mod.name = `模块 ${index + 1}`
    }
    return mod
  })
  return parsed
}

/**
 * AI 解析攻略文档（SSE 流式）
 *
 * 以流式方式调用 DeepSeek 并透传进度事件给前端：
 * - 避免长请求被 CDN 回源超时（524）中断：连接上持续有字节流动
 * - 事件类型：progress（解析进度）、result（最终结构化 JSON）、error（失败原因）、ping（心跳）
 */
app.post('/parse-guide', jwtAuth, async (c) => {
  const { content } = await c.req.json()

  if (!content || content.trim().length < 10) {
    return c.json({ error: '攻略内容过短，至少需要 10 个字符' }, 400)
  }

  // 读取 AI 配置
  const apiKey = await fetchConfigValue('ai_model_api_key')
  const baseUrl = await fetchConfigValue('ai_model_base_url', 'https://api.deepseek.com/v1')
  const modelName = await fetchConfigValue('ai_model_name', 'deepseek-chat')
  const tempStr = await fetchConfigValue('ai_model_temperature', '0.3')
  const temperature = parseFloat(tempStr) || 0.3
  // 从数据库读取自定义 prompt，如果没有则用默认
  const systemPrompt = await fetchConfigValue('ai_model_system_prompt', DEFAULT_SYSTEM_PROMPT)

  if (!apiKey) {
    return c.json({ error: 'AI 模型未配置，请先在设置中配置 API Key' }, 400)
  }

  // 上游请求控制器：客户端断开或上游空闲超时时中止，避免浪费 token
  const upstream = new AbortController()

  // 防止中间层缓冲 SSE 流
  c.header('X-Accel-Buffering', 'no')

  return streamSSE(c, async (stream) => {
    const send = (payload: Record<string, unknown>) =>
      stream.writeSSE({ data: JSON.stringify(payload) })

    let finished = false
    let lastDataAt = Date.now()
    // 用量统计：流式响应最后带 usage 的分块（需 stream_options.include_usage）
    let usageCaptured: any = null
    const parseStartedAt = Date.now()

    // 心跳：首 token 前长时间无输出时保持连接，避免 CDN 空闲超时；
    // 同时兜底处理上游 120 秒无任何数据的情况
    const heartbeat = setInterval(() => {
      if (finished) return
      if (Date.now() - lastDataAt > 120000) {
        upstream.abort()
        return
      }
      stream.writeSSE({ data: JSON.stringify({ type: 'ping' }) }).catch(() => {})
    }, 10000)

    // 客户端断开时中止上游请求
    stream.onAbort(() => {
      upstream.abort()
    })

    try {
      // 流式调用 DeepSeek API
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content },
          ],
          temperature,
          response_format: { type: 'json_object' },
          max_tokens: 8000,
          stream: true,
          // 流式响应附带最终 usage 分块，用于消费明细统计
          stream_options: { include_usage: true },
        }),
        signal: upstream.signal,
      })

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => '')
        console.error('DeepSeek API error:', response.status, errText)
        finished = true
        await send({ type: 'error', error: `AI 解析失败 (${response.status}): ${errText.slice(0, 300)}` })
        return
      }

      // 读取上游 SSE 流：累积完整内容，同时向前端推送进度
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let fullContent = ''
      let lastProgressAt = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        lastDataAt = Date.now()
        sseBuffer += decoder.decode(value, { stream: true })

        let newlineIdx: number
        while ((newlineIdx = sseBuffer.indexOf('\n')) !== -1) {
          const line = sseBuffer.slice(0, newlineIdx).trim()
          sseBuffer = sseBuffer.slice(newlineIdx + 1)
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const chunk = JSON.parse(payload)
            const usage = chunk.usage
            if (usage) usageCaptured = usage
            const delta: string | undefined = chunk.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) {
              fullContent += delta
              const now = Date.now()
              // 进度事件节流：每 300ms 推送一次
              if (now - lastProgressAt > 300) {
                lastProgressAt = now
                await send({ type: 'progress', chars: fullContent.length })
              }
            }
          } catch {
            // 忽略无法解析的分块
          }
        }
      }

      if (!fullContent) {
        finished = true
        await send({ type: 'error', error: 'AI 返回内容为空' })
        return
      }

      // 解析 JSON（兼容 markdown 包裹的情况）
      let parsed: any
      try {
        parsed = JSON.parse(fullContent)
      } catch {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          finished = true
          await send({ type: 'error', error: 'AI 返回内容无法解析为 JSON' })
          return
        }
      }

      if (!parsed.guide_info || !parsed.modules) {
        finished = true
        await send({ type: 'error', error: 'AI 返回结构不完整，缺少 guide_info 或 modules' })
        return
      }

      finished = true
      await send({ type: 'progress', chars: fullContent.length })
      await send({ type: 'result', data: normalizeParsedGuide(parsed) })
    } catch (error: any) {
      console.error('AI parse guide stream error:', error)
      finished = true
      let msg = `AI 解析失败: ${error.message}`
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        msg = 'AI 解析超时或连接中断，请缩短文档内容后重试'
      }
      await send({ type: 'error', error: msg }).catch(() => {})
    } finally {
      clearInterval(heartbeat)
      // 用量明细落库：无论成败都记录（usage 仅在正常读完流时可用）
      await recordAiUsage({
        scene: 'guide_parse',
        model: modelName,
        ...(usageCaptured ? extractUsage(usageCaptured) : {}),
        durationMs: Date.now() - parseStartedAt,
        success: Boolean(usageCaptured),
      }).catch(() => {})
    }
  })
})

export default app
