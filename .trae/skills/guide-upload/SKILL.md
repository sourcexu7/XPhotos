---
name: "guide-upload"
description: "攻略文档上传技能。当用户需要将攻略文档上传到后台系统时调用此技能。支持处理文档内容分析、模块类型识别、数据上传和问题排查等功能。当用户遇到攻略数据上传后无法在后台查看详细内容时，也调用此技能进行问题排查。 Invoke when user asks for '攻略上传` or `上传攻略` 或 `攻略内容显示问题`."
---

# 攻略文档上传技能

## 概述

本技能用于将攻略文档上传到后台管理系统，支持多种模块类型的数据处理和上传。

## 核心功能

1. **文档内容分析**： 解析攻略文档结构，识别模块类型
2. **数据格式转换**： 将文档内容转换为前端组件期望的格式
3. **数据上传**: 通过 API 接口上传数据到后台系统
4. **问题排查**: 排查数据上传后的显示问题

5. **编码处理**: 解决中文编码问题

## 技术难点与解决方案

### 1. 中文编码问题

**问题描述**:
- Windows PowerShell 默认使用 GBK 编码
- Node.js 脚本在 Windows 控制台输出中文乱码
- 数据库存储时中文显示为问号

**根本原因**:
- Windows 系统默认编码与 UTF-8 不兼容
- 数据库连接未指定客户端编码

**解决方案**:

#### 方案一： 数据库连接配置（推荐）

```javascript
// 在 Prisma 连接 URL 中添加 client_encoding=utf8
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://user:pass@host:5432/db?client_encoding=utf8'
    },
  },
})
```

#### 方案二: Node.js 脚本直接操作数据库

```javascript
// 使用 Node.js 脚本直接操作数据库，避免 PowerShell 编码问题
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://...?client_encoding=utf8'
    },
  },
})

async function createGuide(data) {
  return await prisma.guides.create({ data })
}
```

#### 方案三: 鷻加环境变量

```env
# .env 文件
DATABASE_URL="postgresql://user:pass@host:5432/db?client_encoding=utf8"
```

### 2. 数据格式匹配问题

**问题描述**:
- 前端组件期望的数据格式与后端存储的格式不一致
- 例如：ExpenseModule 期望 `ExpenseItem[]` 格式
- ChecklistModule 期望 `ChecklistCategory[]` 格式
- ItineraryModule 期望 `ItineraryItem[]` 格式
- TransportModule 期望 `TransportItem[]` 格式

**根本原因**:
- 前端组件有特定的接口定义
- 上传数据时未检查前端期望的格式
- 数据结构不匹配导致组件无法正确渲染

**解决方案**:

#### 步骤一: 分析前端组件接口定义

```typescript
// components/admin/guide-editor/modules/expense-module.tsx
interface ExpenseItem {
  id: string
  name: string
  detail: string        // 详情描述
  type: string          // 类型（高铁、飞机、门票等）
  channel: string       // 渠道（12306、携程等）
  unitPrice: number     // 单价（必须是 number 类型）
  subtotal: number      // 小计（必须是 number 类型）
  category: string      // 分类（必须是英文：transport, accommodation, food, ticket, equipment, shopping, other）
  notes: string
}

// components/admin/guide-editor/modules/transport-module.tsx
interface TransportItem {
  id: string
  type: 'flight' | 'train' | 'car'  // 交通类型
  route?: string           // 航线/路线（如：北京-上海）
  flightNo?: string        // 航班号
  trainNo?: string         // 车次
  company?: string         // 航空公司/租车公司
  model?: string           // 车型
  date: string
  time: string
  baggage?: string         // 行李额
  seat?: string            // 座位
  price?: number           // 价格（必须是 number 类型）
  pickup?: string          // 取车地点
  dropoff?: string         // 还车地点
  days?: number            // 租车天数
  notes?: string
}

// components/admin/guide-editor/modules/checklist-module.tsx
interface ChecklistCategory {
  id: string
  name: string
  items: ChecklistItem[]
}

// components/admin/guide-editor/modules/itinerary-module.tsx
interface ItineraryItem {
  id: string
  date: string
  title: string
  location: string
  description: string
  tips: string
  highlights: string[]
}
```

#### 步骤二: 确保上传数据格式一致

```javascript
// ✅ 正确的费用数据格式
const expenseItems = [
  { 
    id: '1', 
    name: '南京-扬州高铁', 
    detail: '高铁',
    type: '高铁', 
    channel: '12306', 
    unitPrice: 56,      // number 类型
    subtotal: 56,       // number 类型
    category: 'transport',  // 英文分类
    notes: '' 
  }
]

// ❌ 错误的费用数据格式（会导致费用显示为0）
const wrongExpenseItems = [
  { 
    id: '1', 
    name: '交通费', 
    category: '交通',     // ❌ 中文分类
    amount: 144,          // ❌ 错误字段名，应该是 unitPrice + subtotal
    notes: '备注' 
  }
]

// ✅ 正确的交通数据格式
const transportItems = [
  {
    id: '1',
    type: 'flight',
    route: '扬州泰州机场T2 - 中川机场T2',  // ✅ 使用 route 字段
    flightNo: '9C7371',
    company: '春秋航空',
    date: '2025年3月29日',
    time: '7:00 - 10:05',
    baggage: '7kg随身，20kg托运',
    price: 336,           // ✅ number 类型
    notes: '时长3h5min'
  },
  {
    id: '2',
    type: 'car',
    company: '租车自驾',
    model: '西北环线',
    pickup: '兰州',
    dropoff: '兰州',
    days: 7,
    date: '2025年3月30日-4月5日',
    time: '7天',
    price: 959.5,         // ✅ number 类型
    notes: '车费+油费+高速费人均'
  }
]

// ❌ 错误的交通数据格式（会导致显示"未设置路线"）
const wrongTransportItems = [
  {
    id: '1',
    type: 'flight',
    from: '扬州泰州机场T2',  // ❌ 错误字段，应该用 route
    to: '中川机场T2',        // ❌ 错误字段，应该用 route
    price: '336',           // ❌ 字符串类型，应该是 number
  }
]

const checklistCategories = [
  {
    id: '1',
    name: '衣物准备',
    items: [
      { id: '1-1', name: '拍照衣物', checked: false }
    ]
  }
]

const itineraryItems = [
  { 
    id: '1', 
    date: '3.29',
    title: '第一天：兰州',
    location: '禄口机场 => 中川机场', 
    description: '行程描述', 
    tips: '住宿提示',
    highlights: ['景点1', '景点2']
  }
]
```

#### 费用模块分类对照表

| 中文分类 | 英文 category 值 | 说明 |
|---------|-----------------|------|
| 交通 | `transport` | 高铁、飞机、打车、租车等 |
| 住宿 | `accommodation` | 酒店、民宿等 |
| 餐饮 | `food` | 早中晚餐、零食等 |
| 门票 | `ticket` | 景点门票 |
| 设备 | `equipment` | 租赁设备等 |
| 购物 | `shopping` | 纪念品、特产等 |
| 其他 | `other` | 其他费用 |

### 3. 接口数据传输完整性问题

**问题描述**:
- API 响应数据可能被截断
- 域名可能无法正确解析嵌套对象
- 数据类型转换可能丢失信息

**根本原因**:
- API 返回格式与前端期望不一致
- JSON 序列化/反序列化问题
- 网络传输问题

**解决方案**:

#### 检查 API 响应处理

```typescript
// server/guide-modules.ts
app.get('/module-data/:moduleId', jwtAuth, async (c) => {
  const content = await db.guideModuleContents.findFirst({
    where: { 
      module_id: moduleId,
      type: 'module_data',
    },
  })
  // 返回格式: { data: content?.content || null }
  return c.json({ data: content?.content || null })
})
```

#### 壔端数据处理

```typescript
// components/admin/guide-editor/content-editor.tsx
useEffect(() => {
  if (module && isSpecialModule) {
    fetch(`${API_BASE}/module-data/${module.id}`)
      .then(res => res.json())
      .then(json => {
        const data = json.data || []  // 注意这里:空数组作为默认值
        setSpecialModuleData(data)
        onContentDataChange?.(data)
      })
      .catch(console.error)
  }
}, [module?.id, isSpecialModule])
```

### 4. 权限控制与数据过滤问题

**问题描述**:
- JWT 认证可能失败
- 权限校验可能阻止数据访问
- 数据过滤规则可能排除某些数据

**根本原因**:
- Token 过期或无效
- 权限中间件配置问题
- 数据过滤逻辑问题

**解决方案**:

#### 检查认证流程
```typescript
// 1. 确保 token 有效
const token = localStorage.getItem('auth_token')
if (!token) {
  // 重新登录
}

```

#### 检查权限中间件
```typescript
// server/guide-modules.ts
app.get('/module-data/:moduleId', jwtAuth, async (c) => {
  // jwtAuth 中间件会验证 token
  // 如果 token 无效，会返回 401 错误
})
```

## 问题排查流程

### 步骤 1: 验证数据存储

```bash
# 运行检查脚本
node scripts/check-module-data.js
```

### 步骤 2: 检查 API 响应

```bash
# 使用 curl 或浏览器开发者工具检查 API 响应
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/guide-modules/module-data/<moduleId>
```

### 步骤 3: 检查前端组件渲染

```typescript
// 在组件中添加调试日志
useEffect(() => {
  console.log('Module data:', specialModuleData)
}, [specialModuleData])
```

### 步骤 4: 检查数据库原始数据

```sql
-- 直接查询数据库
SELECT * FROM guide_module_contents WHERE type = 'module_data';
```

## 预防措施

### 1. 编码问题预防
- 始终在数据库连接字符串中添加 `client_encoding=utf8`
- 使用 Node.js 脚本直接操作数据库，避免 PowerShell 编码问题
- 验证数据存储后通过 API 查询确认

### 2. 数据格式验证
- 上传前仔细阅读前端组件的接口定义
- 确保数据格式与前端期望完全一致
- 添加类型检查和验证逻辑
- 使用 TypeScript 接口定义提高代码质量

### 3. 错误处理
- 所有 API 调用都应有错误处理
- 记录详细错误信息便于排查
- 提供用户友好的错误提示
- 实现重试机制处理网络错误

### 4. 数据完整性
- 上传后验证数据是否正确存储
- 检查所有字段是否正确传递
- 确保关联数据完整性
- 定期备份数据

---

## 攻略编辑器常见问题与解决方案

### 1. 后台编辑模块数据为空问题

**问题描述**:
- 前台攻略页面能显示数据
- 后台编辑器点击模块显示"暂无数据"
- 预览功能显示"攻略不存在"

**根本原因**:
- 后台 API `/api/v1/guide-modules/module/:guideId` 只返回模块基础信息
- 未像前台 API 那样加载 `moduleData`（special template 的数据存储在 `guideModuleContents` 表）
- 前端组件期望模块对象上有 `moduleData` 属性

**解决方案**:

#### 后端 API 改造

```typescript
// server/guide-modules.ts
app.get('/module/:guideId', jwtAuth, async (c) => {
  const modules = await db.guideModules.findMany({
    where: { guide_id: guideId },
    include: { contents: { orderBy: { sort: 'asc' } } },
    orderBy: { sort: 'asc' },
  })
  
  // 加载 special template 的 moduleData（与前台一致）
  const specialTemplates = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips']
  const modulesWithData = await Promise.all(
    modules.map(async (mod) => {
      if (specialTemplates.includes(mod.template || '')) {
        const moduleData = await db.guideModuleContents.findFirst({
          where: { module_id: mod.id, type: 'module_data' },
        })
        return { ...mod, moduleData: moduleData?.content || [] }
      }
      return mod
    })
  )
  
  return c.json({ data: modulesWithData })
})
```

#### 前端组件改造

```typescript
// components/admin/guide-editor/content-editor.tsx
// 优先使用模块上已有的 moduleData（后台已加载）
useEffect(() => {
  if (module && isSpecialModule) {
    if (module.moduleData !== undefined) {
      const data = module.moduleData || []
      setSpecialModuleData(data)
      onContentDataChange?.(data)
    } else {
      // 兼容旧逻辑：单独加载 moduleData
      fetch(`${API_BASE}/module-data/${module.id}`)
        .then(res => res.json())
        .then(json => {
          const data = json.data || []
          setSpecialModuleData(data)
          onContentDataChange?.(data)
        })
        .catch(console.error)
    }
  }
}, [module?.id, isSpecialModule, module?.moduleData])
```

### 2. 前端组件状态不同步问题

**问题描述**:
- 编辑按钮点击无反应
- 数据已从父组件传入但组件内部状态未更新

**根本原因**:
- 组件使用 `useState(value || [])` 初始化状态
- 当 `value` prop 从父组件异步传入时，状态不会自动更新
- React 的 useState 初始值只在首次渲染时使用

**解决方案**:

```typescript
// 所有模块组件都需要添加 useEffect 同步 value
export default function ExpenseModule({ value, onChange }: ExpenseModuleProps) {
  const [items, setItems] = useState<ExpenseItem[]>(value || [])
  
  // 添加 useEffect 同步父组件传入的 value
  useEffect(() => {
    if (value && value.length > 0) {
      setItems(value)
    }
  }, [value])
  
  // ... 其他逻辑
}
```

**需要同步的模块**:
- `expense-module.tsx`
- `itinerary-module.tsx`
- `checklist-module.tsx`
- `transport-module.tsx`
- `tips-module.tsx`
- `photo-module.tsx`

### 3. Antd 6 废弃 API 迁移

**问题描述**:
- 控制台大量废弃警告
- 影响开发体验和代码可维护性

**迁移指南**:

#### Statistic 组件

```tsx
// 旧版（已废弃）
<Statistic valueStyle={{ color: '#ef4444', fontWeight: 'bold' }} />

// 新版
<Statistic styles={{ content: { color: '#ef4444', fontWeight: 'bold' } }} />
```

#### Card 组件

```tsx
// 旧版（已废弃）
<Card bodyStyle={{ padding: 0 }} />

// 新版
<Card styles={{ body: { padding: 0 } }} />
```

#### Timeline 组件

```tsx
// 旧版（已废弃）
<Timeline items={[
  {
    dot: <Icon />,
    children: <Content />
  }
]} />

// 新版
<Timeline items={[
  {
    icon: <Icon />,      // dot → icon
    content: <Content /> // children → content
  }
]} />
```

#### Spin 组件

```tsx
// 旧版（tip 不生效）
<Spin size="large" tip="加载中..." />

// 新版（需要嵌套子元素）
<Spin size="large" tip="加载中...">
  <div className="w-20 h-20" />
</Spin>
```

#### List 组件

```tsx
// List 组件已废弃，建议使用自定义列表或 Flex 布局替代
// 暂时可继续使用，但会在下一主版本移除
```

### 4. 封面编辑功能实现

**问题描述**:
- 需要关联相册并选择封面
- 相册 URL 格式不一致（`/albums/dxal` vs `/dxal`）
- 选择封面时无法加载相册图片

**解决方案**:

#### 相册 URL 处理

```typescript
// 统一处理相册 URL
const getAlbumUrl = (albumValue: string) => {
  if (albumValue.startsWith('/albums/')) {
    return albumValue.replace('/albums/', '/')
  }
  return albumValue
}
```

#### 图片加载 API 参数

```typescript
// 错误：使用 album id
fetch(`/api/v1/public/gallery/images?album=${albumId}`)

// 正确：使用 album_value（如 /dxal）
fetch(`/api/v1/public/gallery/images?album=${encodeURIComponent(albumValue)}`)
```

#### 相册封面更新支持部分更新

```typescript
// lib/db/operate/albums.ts
export async function updateAlbum(album: Partial<AlbumType> & { id: string }) {
  const updateData: any = { updatedAt: new Date() }
  
  // 只更新传入的字段
  if (album.cover !== undefined) updateData.cover = album.cover
  if (album.name !== undefined) updateData.name = album.name
  // ... 其他字段
  
  await tx.albums.update({
    where: { id: album.id },
    data: updateData,
  })
}
```

### 5. Next.js Image 组件 sizes 属性

**问题描述**:
- 控制台警告：Image with "fill" is missing "sizes" prop

**解决方案**:

```tsx
// 所有使用 fill 属性的 Image 组件都需要添加 sizes
<Image
  src={coverImage}
  alt="Cover"
  fill
  sizes="100%"           // 全宽
  className="object-cover"
/>

<Image
  src={thumbnail}
  alt="Thumbnail"
  fill
  sizes="150px"          // 固定尺寸
  className="object-cover"
/>

<Image
  src={responsive}
  alt="Responsive"
  fill
  sizes="(max-width: 768px) 100vw, 33vw"  // 响应式
  className="object-cover"
/>
```

### 6. 图标导入错误

**问题描述**:
- `Element type is invalid` 错误
- 图标组件未正确导出

**常见错误图标名称**:
- ❌ `ExternalOutlined` → ✅ `ExportOutlined`
- ❌ `TicketOutlined` → ✅ `TagOutlined`（或 `TagsOutlined`）

**解决方案**:

```typescript
// 检查图标是否存在
import { 
  ExportOutlined,   // 导出图标
  TagOutlined,      // 标签图标
  TagsOutlined,     // 多标签图标
} from '@ant-design/icons'
```

### 7. 行程模块天数显示问题

**问题描述**:
- 前台显示"第 1 天 · 6 个行程"，所有行程都归到第1天
- 后台预览组件 `TypeError: Cannot read properties of null (reading 'reduce')`

**根本原因**:
- 前台渲染逻辑使用 `item.day` 字段分组（数字类型）
- 上传数据使用 `item.date` 字段（如 "4.30", "5.1"）
- 后台预览组件接口定义与数据格式不匹配
- 渲染函数未处理 `null` 值

**解决方案**:

#### 前台渲染逻辑修复

```typescript
// app/(default)/guides/[id]/page.tsx
// 修复分组逻辑，支持 date 字段
const groupedByDay: Record<string, any[]> = {}
data.forEach((item: any, index: number) => {
  const dayKey = item.date || item.day || `第${index + 1}天`
  if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
  groupedByDay[dayKey].push(item)
})

// 显示每天的标题
{Object.keys(groupedByDay).map((dayKey, dayIndex) => {
  const dayItems = groupedByDay[dayKey]
  const firstItem = dayItems[0]
  const dayTitle = firstItem.title || dayKey
  
  return (
    <div key={dayKey}>
      <span>第 {dayIndex + 1} 天</span>
      <span>· {dayTitle}</span>
      {/* ... */}
    </div>
  )
})}
```

#### 后台预览组件修复

```typescript
// components/admin/guide-editor/modules/module-preview.tsx
// 1. 更新接口定义
interface ItineraryItem {
  id: string
  date: string      // 使用 date 而不是 time
  title: string     // 添加 title
  location: string
  description: string
  tips: string
  highlights: string[]  // 添加 highlights
}

// 2. 添加空值保护
const renderItinerary = (items: ItineraryItem[] | null) => {
  const safeItems = items || []
  // ...
}

// 3. 所有渲染函数都需要添加空值保护
const renderExpense = (items: ExpenseItem[] | null) => {
  const safeItems = items || []
  // ...
}
```

#### 行程数据格式

```javascript
// ✅ 正确的行程数据格式
const itineraryItems = [
  { 
    id: '1', 
    date: '4.30',           // 日期字段
    title: '落地科莫多',      // 每天标题
    location: '机场 => 码头 => 卡隆岛',
    description: `⏰ 时间安排：
• 14:25 落地科莫多机场
• 15:30 抵达拉布安巴佐码头`,
    tips: '住宿：Zasgo Hotel',
    highlights: ['卡隆岛日落', '万蝠出巢']
  }
]

// ❌ 错误的行程数据格式（会导致所有行程归到第1天）
const wrongItineraryItems = [
  { 
    id: '1', 
    day: 1,                 // ❌ 使用 day 数字，前台期望 date 字符串
    time: '14:25',          // ❌ 使用 time 而不是 date
    location: '机场',
    description: '描述',
  }
]
```

### 8. 模块预览组件空值保护

**问题描述**:
- `TypeError: Cannot read properties of null (reading 'reduce')`
- `TypeError: Cannot read properties of null (reading 'length')`

**根本原因**:
- 数据可能为 `null` 而不是空数组
- 渲染函数未处理 `null` 值

**解决方案**:

```typescript
// 所有渲染函数都需要添加空值保护
const renderItinerary = (items: ItineraryItem[] | null) => {
  const safeItems = items || []
  // ...
}

const renderExpense = (items: ExpenseItem[] | null) => {
  const safeItems = items || []
  const total = safeItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  // ...
}

const renderChecklist = (categories: ChecklistCategory[] | null) => {
  const safeCategories = categories || []
  // ...
}

const renderTransport = (items: TransportItem[] | null) => {
  const safeItems = items || []
  // ...
}

const renderPhoto = (spots: PhotoSpot[] | null) => {
  const safeSpots = spots || []
  // ...
}

const renderTips = (tips: Tip[] | null) => {
  const safeTips = tips || []
  // ...
}
```

---

## 最佳实践总结

### API 设计
1. **前后台数据一致性**：后台 API 应返回与前台相同的数据结构
2. **部分更新支持**：更新接口应支持只传入需要更新的字段
3. **参数类型明确**：API 文档应明确参数类型（id vs value）

### 前端组件
1. **状态同步**：使用 useEffect 同步 props 到内部状态
2. **类型定义**：为所有接口定义 TypeScript 类型
3. **废弃 API**：及时迁移废弃 API，避免技术债务

### 图片处理
1. **sizes 属性**：所有 fill 模式的 Image 都需要 sizes
2. **URL 编码**：传递 URL 参数时使用 encodeURIComponent
3. **格式优化**：优先使用 WebP/AVIF 格式

