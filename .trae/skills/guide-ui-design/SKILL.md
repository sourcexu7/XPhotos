---
name: "guide-ui-design"
description: "Provides UI design standards and components for travel guide/itinerary modules. Invoke when creating or refactoring guide-related UI components to ensure visual consistency."
---

# 攻略路书 UI 设计规范

## 概述

本规范定义了攻略路书各模块（行程、费用、清单、交通、摄影、提示）的统一视觉设计标准，确保跨模块的一致性和专业感。

## 设计原则

1. **统一性**：相同类型的元素使用相同的视觉处理
2. **层次感**：通过间距和阴影建立清晰的信息层级
3. **可读性**：文字与背景对比度符合 WCAG 标准
4. **响应式**：移动端优先，平滑适配桌面端

---

## 1. 色彩规范

### 1.1 主色调（按模块类型）

```typescript
const moduleColors = {
  itinerary: 'indigo',    // 行程 - 靛蓝色
  expense: 'indigo',      // 费用 - 靛蓝色
  checklist: 'emerald',   // 清单 - 翠绿色
  transport: 'indigo',    // 交通 - 靛蓝色
  photo: 'indigo',        // 摄影 - 靛蓝色
  tips: 'amber',          // 提示 - 琥珀色
}
```

### 1.2 颜色值映射

| 颜色 | 浅色模式 | 深色模式 | 用途 |
|------|----------|----------|------|
| **主色** | `indigo-600` | `indigo-400` | 标题、强调文字 |
| **主色浅** | `indigo-100` | `indigo-900/40` | 图标背景、标签 |
| **主色边框** | `indigo-200` | `indigo-700` | 边框、分割线 |
| **成功** | `emerald-500` | `emerald-400` | 完成状态 |
| **警告** | `amber-500` | `amber-400` | 提示、注意 |

---

## 2. 间距规范

### 2.1 标准间距值

```typescript
const spacing = {
  // 卡片间距
  cardGap: 'space-y-4 sm:space-y-5',      // 16px / 20px
  
  // 元素间距
  elementGap: 'gap-2',                     // 8px
  elementGapLarge: 'gap-3 sm:gap-4',       // 12px / 16px
  
  // 区块间距
  sectionMargin: 'mb-4 sm:mb-5',           // 16px / 20px
  
  // 文字间距
  textMargin: 'mt-2',                      // 8px
  textMarginLarge: 'mt-2.5 sm:mt-3',       // 10px / 12px
}
```

### 2.2 内边距规范

| 组件类型 | 移动端 | 桌面端 | 用途 |
|----------|--------|--------|------|
| **小型卡片** | `p-3` (12px) | `p-4` (16px) | 标签、小模块 |
| **标准卡片** | `p-4` (16px) | `p-5` (20px) | 内容卡片 |
| **大型卡片** | `p-5` (20px) | `p-6` (24px) | 强调模块 |

---

## 3. 圆角规范

```typescript
const borderRadius = {
  badge: 'rounded-2xl',      // 16px - 徽章、特殊强调
  card: 'rounded-xl',        // 12px - 主要卡片
  inner: 'rounded-lg',       // 8px - 内部元素、图标容器
  tag: 'rounded-full',       // 完全圆角 - 标签、状态
  button: 'rounded-lg',      // 8px - 按钮
}
```

---

## 4. 阴影规范

```typescript
const shadows = {
  none: '',                                    // 默认无阴影
  sm: 'shadow-sm',                             // 轻微阴影（徽章）
  md: 'shadow-md',                             // 标准阴影（悬停）
  lg: 'shadow-lg',                             // 强调阴影（特殊卡片）
  
  // 悬停效果
  hover: 'hover:shadow-md transition-shadow',
}
```

---

## 5. 组件规范

### 5.1 卡片容器（Card）

```tsx
// 标准内容卡片
const ContentCard = ({ children, className = '' }) => (
  <div className={`
    p-4 sm:p-5
    rounded-xl
    bg-white/70 dark:bg-slate-800/70
    backdrop-blur
    border border-slate-200/50 dark:border-slate-700/50
    hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700
    transition-all
    ${className}
  `}>
    {children}
  </div>
)

// 次要/嵌套卡片
const SubCard = ({ children, className = '' }) => (
  <div className={`
    p-3 sm:p-4
    rounded-lg
    bg-white/60 dark:bg-slate-800/60
    backdrop-blur-sm
    border border-slate-200/50 dark:border-slate-700/50
    ${className}
  `}>
    {children}
  </div>
)
```

### 5.2 日期徽章（DayBadge）

```tsx
const DayBadge = ({ dayIndex }: { dayIndex: number }) => (
  <div className="relative flex-shrink-0">
    {/* 外圈光晕 */}
    <div className="absolute inset-0 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-2xl blur-md" />
    
    {/* 主徽章 */}
    <div className="relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-200/50 dark:border-indigo-700/30">
      <span className="text-[10px] sm:text-xs font-medium text-indigo-400 dark:text-indigo-400 uppercase tracking-wider">Day</span>
      <span className="text-lg sm:text-xl font-bold leading-none">{dayIndex + 1}</span>
    </div>
  </div>
)
```

### 5.3 图标容器（IconContainer）

```tsx
const IconContainer = ({ 
  children, 
  color = 'slate',
  size = 'sm' 
}: { 
  children: React.ReactNode
  color?: 'slate' | 'indigo' | 'emerald' | 'amber'
  size?: 'sm' | 'md'
}) => {
  const colorMap = {
    slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  }
  
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
  }
  
  return (
    <div className={`flex items-center justify-center rounded-lg ${sizeMap[size]} ${colorMap[color]}`}>
      {children}
    </div>
  )
}
```

### 5.4 标签（Tag）

```tsx
const Tag = ({ 
  children, 
  color = 'indigo',
  variant = 'filled'
}: { 
  children: React.ReactNode
  color?: 'indigo' | 'emerald' | 'amber' | 'slate'
  variant?: 'filled' | 'outlined'
}) => {
  const colorMap = {
    filled: {
      indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300',
    },
    outlined: {
      indigo: 'border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300',
      emerald: 'border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
      amber: 'border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300',
      slate: 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    },
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium ${colorMap[variant][color]}`}>
      {children}
    </span>
  )
}
```

### 5.5 时间轴节点（TimelineDot）

```tsx
const TimelineDot = ({ color = 'indigo' }: { color?: 'indigo' | 'emerald' | 'amber' }) => {
  const colorMap = {
    indigo: 'border-indigo-400 ring-indigo-100 dark:ring-indigo-900/30',
    emerald: 'border-emerald-400 ring-emerald-100 dark:ring-emerald-900/30',
    amber: 'border-amber-400 ring-amber-100 dark:ring-amber-900/30',
  }
  
  return (
    <div className={`
      absolute -left-[25px] sm:-left-[29px] top-3
      w-2.5 h-2.5 sm:w-3 sm:h-3
      rounded-full
      bg-white dark:bg-slate-800
      border-2
      shadow-sm
      ring-2
      ${colorMap[color]}
    `} />
  )
}
```

### 5.6 时间轴线（TimelineLine）

```tsx
const TimelineLine = ({ color = 'slate' }: { color?: 'slate' | 'indigo' }) => {
  const colorMap = {
    slate: 'bg-slate-200 dark:bg-slate-700',
    indigo: 'bg-gradient-to-b from-indigo-300 via-indigo-200 to-transparent dark:from-indigo-700 dark:via-indigo-800',
  }
  
  return (
    <div className={`absolute left-0 top-0 bottom-0 w-px ${colorMap[color]}`} />
  )
}
```

### 5.7 提示框（TipBox）

```tsx
const TipBox = ({ 
  children, 
  type = 'info',
  icon = '💡'
}: { 
  children: React.ReactNode
  type?: 'info' | 'warning' | 'success'
  icon?: string
}) => {
  const typeMap = {
    info: 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    warning: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300',
    success: 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300',
  }
  
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${typeMap[type]}`}>
      <span className="flex-shrink-0 text-sm">{icon}</span>
      <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
    </div>
  )
}
```

---

## 6. 模块特定规范

### 6.1 行程模块（Itinerary）

```tsx
// 日期标题
const DayHeader = ({ dayIndex, title, date }: { dayIndex: number; title?: string; date?: string }) => (
  <div className="flex items-start gap-4 mb-5 sm:mb-6">
    <DayBadge dayIndex={dayIndex} />
    <div className="flex-1 min-w-0 pt-1">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
        {title || `第 ${dayIndex + 1} 天`}
      </h3>
      {date && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
          {/* 日历图标 */}
          <span>{date}</span>
        </p>
      )}
    </div>
  </div>
)

// 活动时间
const ActivityTime = ({ time }: { time: string }) => (
  <div className="flex items-center gap-2 mb-2">
    <IconContainer color="indigo" size="sm">
      <ClockIcon className="w-3.5 h-3.5" />
    </IconContainer>
    <span className="text-xs sm:text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">
      {time}
    </span>
  </div>
)
```

### 6.2 费用模块（Expense）

```tsx
// 费用统计卡片
const ExpenseStatCard = ({ 
  label, 
  value, 
  prefix = '',
  highlight = false 
}: { 
  label: string
  value: string | number
  prefix?: string
  highlight?: boolean
}) => (
  <div className={`
    p-4 sm:p-5 rounded-xl
    ${highlight 
      ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-200/50 dark:border-indigo-800/30' 
      : 'bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50'
    }
    backdrop-blur-sm
  `}>
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </p>
    <p className={`text-xl sm:text-2xl font-bold ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
      {prefix}{value}
    </p>
  </div>
)

// 费用分类标题
const ExpenseCategoryHeader = ({ 
  icon, 
  label, 
  amount, 
  percentage 
}: { 
  icon: string
  label: string
  amount: string
  percentage: number
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h4>
    </div>
    <div className="text-right">
      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{amount}</span>
      <span className="text-xs text-slate-500 ml-1">({percentage}%)</span>
    </div>
  </div>
)
```

### 6.3 清单模块（Checklist）

```tsx
// 清单分类卡片
const ChecklistCategory = ({ 
  title, 
  icon,
  total,
  checked,
  children 
}: { 
  title: string
  icon?: string
  total: number
  checked: number
  children: React.ReactNode
}) => {
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0
  const isComplete = progress === 100
  
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {icon && <span className="text-base sm:text-lg">{icon}</span>}
          <span className="truncate">{title}</span>
        </h4>
        <Tag color={isComplete ? 'emerald' : 'indigo'}>
          {checked}/{total}
        </Tag>
      </div>
      
      {/* 进度条 */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3 sm:mb-4">
        <div 
          className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* 清单项 */}
      {children}
    </div>
  )
}

// 清单项
const ChecklistItem = ({ 
  text, 
  checked,
  required 
}: { 
  text: string
  checked: boolean
  required?: boolean
}) => (
  <li className={`flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ${checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
    <span className="flex-1 min-w-0 truncate">{text}</span>
    {required && (
      <Tag color="amber" variant="outlined">必带</Tag>
    )}
  </li>
)
```

### 6.4 交通模块（Transport）

```tsx
// 交通卡片 - 统一使用毛玻璃风格，左侧色条区分类型
const TransportCard = ({ 
  type,
  route,
  time,
  details 
}: { 
  type: 'flight' | 'train' | 'car'
  route: string
  time: string
  details: React.ReactNode
}) => {
  const typeMap = {
    flight: { color: 'border-l-blue-400', label: '航班' },
    train: { color: 'border-l-emerald-400', label: '高铁' },
    car: { color: 'border-l-amber-400', label: '租车' },
  }
  
  return (
    <div className={`
      relative p-4 sm:p-5 
      rounded-xl 
      bg-white/70 dark:bg-slate-800/70
      backdrop-blur
      border border-slate-200/50 dark:border-slate-700/50
      border-l-4 ${typeMap[type].color}
      hover:shadow-md
      transition-all
    `}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
          {route}
        </span>
        <Tag color="slate" variant="outlined">{typeMap[type].label}</Tag>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">{time}</p>
      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-slate-600 dark:text-slate-400">
        {details}
      </div>
    </div>
  )
}
```

### 6.5 摄影机位模块（Photo）

```tsx
// 摄影机位卡片
const PhotoSpotCard = ({ 
  name,
  policy,
  focalLength,
  bestTime,
  notes
}: { 
  name: string
  policy: 'allowed' | 'forbidden' | 'register'
  focalLength?: string
  bestTime?: string
  notes?: string
}) => {
  const policyMap = {
    allowed: { label: '可飞', color: 'emerald' as const },
    forbidden: { label: '禁飞', color: 'slate' as const },
    register: { label: '需登记', color: 'amber' as const },
  }
  
  const p = policyMap[policy]
  
  return (
    <div className="p-3 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5">
      {/* 标题栏 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</span>
        <Tag color={p.color}>{p.label}</Tag>
      </div>
      
      {/* 参数标签 */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-2">
        {focalLength && (
          <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded">
            {focalLength}
          </span>
        )}
        {bestTime && (
          <Tag color="amber">{bestTime}</Tag>
        )}
      </div>
      
      {/* 备注 */}
      {notes && (
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2">
          {notes}
        </p>
      )}
    </div>
  )
}
```

### 6.6 提示模块（Tips）

```tsx
// 提示项
const TipItem = ({ 
  title,
  content,
  type = 'info'
}: { 
  title: string
  content: string
  type?: 'info' | 'warning' | 'success'
}) => {
  const typeMap = {
    info: {
      border: 'border-l-blue-400',
      bg: 'bg-blue-50/80 dark:bg-blue-900/20',
      text: 'text-blue-900 dark:text-blue-200',
      icon: 'ℹ️',
    },
    warning: {
      border: 'border-l-amber-400',
      bg: 'bg-amber-50/80 dark:bg-amber-900/20',
      text: 'text-amber-900 dark:text-amber-200',
      icon: '⚠️',
    },
    success: {
      border: 'border-l-emerald-400',
      bg: 'bg-emerald-50/80 dark:bg-emerald-900/20',
      text: 'text-emerald-900 dark:text-emerald-200',
      icon: '✅',
    },
  }
  
  const t = typeMap[type]
  
  return (
    <div className={`p-3 sm:p-5 border-l-2 ${t.border} ${t.bg} rounded-r-xl backdrop-blur-sm`}>
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0">{t.icon}</span>
        <div>
          <p className={`text-sm sm:text-base font-bold mb-1 ${t.text}`}>{title}</p>
          <p className={`text-xs sm:text-sm leading-relaxed ${t.text}`}>{content}</p>
        </div>
      </div>
    </div>
  )
}
```

---

## 7. 使用示例

### 7.1 完整行程模块示例

```tsx
function ItineraryModule({ data }: { data: any }) {
  return (
    <div className="space-y-8 sm:space-y-12">
      {data.days.map((day: any, dayIndex: number) => (
        <div key={dayIndex}>
          {/* 日期标题 */}
          <DayHeader 
            dayIndex={dayIndex} 
            title={day.title} 
            date={day.date}
          />
          
          {/* 时间轴 */}
          <div className="relative pl-7 sm:pl-8 ml-7 sm:ml-8">
            <TimelineLine color="slate" />
            
            <div className="space-y-4 sm:space-y-5">
              {day.activities.map((activity: any, idx: number) => (
                <div key={idx} className="relative">
                  <TimelineDot color="indigo" />
                  
                  <ContentCard>
                    <ActivityTime time={activity.time} />
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activity.content}
                    </p>
                  </ContentCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 8. 注意事项

1. **始终使用 `sm:` 前缀处理响应式**，保持移动端优先
2. **暗色模式类名必须成对出现**，如 `bg-white/70 dark:bg-slate-800/70`
3. **避免使用非标准间距值**（如 `mt-2.5`），使用标准 4px 倍数
4. **保持透明度一致**，主要卡片 70%，次要卡片 60%
5. **悬停效果统一使用** `hover:shadow-md hover:border-indigo-200`

---

## 9. 更新日志

- **v1.0.0** (2026-04-22): 初始版本，建立统一设计规范
