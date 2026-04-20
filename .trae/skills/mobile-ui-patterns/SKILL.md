---
name: "mobile-ui-patterns"
description: "移动端UI适配最佳实践。当用户需要进行移动端响应式设计、解决移动端布局问题、优化移动端用户体验时调用此技能。"
---

# 移动端UI适配最佳实践

本技能总结了移动端UI适配的经验和最佳实践，帮助快速解决常见的移动端布局问题。

## 核心原则

### 1. 移动优先设计
- 默认样式针对移动端，使用 `sm:`、`md:`、`lg:` 断点逐步增强
- 避免桌面优先再降级到移动端

### 2. 触摸友好
- 最小点击区域 44x44px
- 按钮添加 `active:scale-95` 点击反馈
- 避免过小的交互元素

### 3. 内容优先
- 重要信息优先展示
- 次要信息可折叠或隐藏
- 避免横向滚动

---

## 常见问题与解决方案

### 一、表格移动端适配

#### 问题：表格在移动端溢出、拥挤

#### 解决方案1：卡片视图替代表格

```tsx
{/* 移动端卡片视图 */}
<div className="sm:hidden space-y-1.5">
  {items.map((item) => (
    <div key={item.id} className="p-2 bg-white/50 rounded-lg border border-border/50">
      {/* 第一行：主要信息 */}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-[11px] font-medium truncate flex-1">{item.name}</span>
        <span className="text-[11px] font-bold flex-shrink-0">¥{item.total}</span>
      </div>
      {/* 第二行：次要信息（单行） */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {item.type && <span className="px-1.5 py-0.5 rounded bg-blue-100 whitespace-nowrap">{item.type}</span>}
        {item.channel && <span className="truncate flex-1 min-w-0">{item.channel}</span>}
        <span className="flex-shrink-0">¥{item.price}</span>
      </div>
    </div>
  ))}
</div>

{/* 桌面端表格视图 */}
<div className="hidden sm:block overflow-x-auto">
  <table className="w-full text-sm">...</table>
</div>
```

#### 关键技巧：
- 使用 `sm:hidden` 和 `hidden sm:block` 切换视图
- 卡片内边距 `p-2` 而非 `p-2.5`，减少留白
- 第二行使用 `flex items-center` 单行显示，增加信息密度
- 使用 `line-clamp-1` 限制详情行数

---

### 二、文字对齐问题

#### 问题：不同大小的文字垂直不对齐

#### 解决方案：使用 baseline 对齐

```tsx
{/* 错误：items-center 会导致文字视觉不对齐 */}
<div className="flex items-center gap-2">
  <span className="text-[10px]">10:00</span>
  <span className="text-base font-medium">地点名称</span>
</div>

{/* 正确：items-baseline 确保文字基线对齐 */}
<div className="flex items-baseline gap-1.5">
  <span className="text-[10px] leading-[1.4]">10:00</span>
  <span className="text-[11px] font-medium leading-[1.4]">地点名称</span>
</div>
```

#### 关键技巧：
- 使用 `items-baseline` 替代 `items-center`
- 统一设置 `leading-[1.4]` 或相同的 `leading` 值
- 左侧指示点位置需要配合调整：`top-[7px]`（根据字体大小微调）

---

### 三、底部导航栏

#### 问题：移动端需要便捷的模块导航

#### 解决方案：固定底部导航栏

```tsx
<div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
  <div className="flex items-center justify-between px-3 py-2.5">
    <button
      onClick={() => setShowNav(!showNav)}
      className="flex items-center gap-2 text-sm font-medium active:scale-95 transition-transform"
      aria-label="打开目录导航"
    >
      <svg className={`w-5 h-5 transition-transform ${showNav ? 'rotate-180' : ''}`}>...</svg>
      <span>目录</span>
    </button>
    {activeId && (
      <span className="text-xs text-muted-foreground max-w-[50%] truncate">
        {modules.find(m => m.id === activeId)?.name}
      </span>
    )}
  </div>
  
  {showNav && (
    <div className="border-t border-border max-h-[60vh] overflow-y-auto overscroll-contain">
      <nav className="p-2 space-y-1">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => handleNav(module.id)}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 active:scale-[0.98] ${
              isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
            }`}
          >
            <span className="text-lg">{module.icon}</span>
            <span className="text-sm truncate">{module.name}</span>
          </button>
        ))}
      </nav>
      <div className="h-4" /> {/* 底部安全区域 */}
    </div>
  )}
</div>
```

#### 关键技巧：
- 使用 `backdrop-blur-md` 毛玻璃效果
- 添加 `active:scale-95` 点击反馈
- 导航项使用 `rounded-xl` 圆角
- 添加 `aria-label` 无障碍标签
- 底部添加安全区域 `h-4`

---

### 四、间距与字体优化

#### 移动端间距原则

| 元素 | 移动端 | 桌面端 |
|------|--------|--------|
| 模块间距 | `mb-3` | `mb-8` |
| 卡片内边距 | `p-2` ~ `p-3` | `p-4` ~ `p-6` |
| 元素间距 | `gap-1.5` ~ `gap-2` | `gap-3` ~ `gap-4` |
| 列表项间距 | `space-y-1.5` | `space-y-2` ~ `space-y-4` |

#### 字体大小建议

| 用途 | 移动端 | 桌面端 |
|------|--------|--------|
| 标题 | `text-base` ~ `text-lg` | `text-xl` ~ `text-2xl` |
| 正文 | `text-[11px]` ~ `text-xs` | `text-sm` ~ `text-base` |
| 辅助文字 | `text-[10px]` | `text-xs` |
| 标签 | `text-[9px]` ~ `text-[10px]` | `text-xs` |

---

### 五、防止内容溢出

#### 常用技巧

```tsx
{/* 文字截断 */}
<span className="truncate">长文字内容</span>

{/* 多行截断 */}
<p className="line-clamp-2">多行文字内容</p>

{/* 防止换行 */}
<span className="whitespace-nowrap">不换行内容</span>

{/* 弹性宽度 */}
<div className="flex gap-2">
  <span className="truncate flex-1 min-w-0">可压缩内容</span>
  <span className="flex-shrink-0">固定宽度内容</span>
</div>
```

---

### 六、封面图片适配

#### 问题：封面在不同设备显示效果差异大

#### 解决方案：响应式宽高比

```tsx
<div className="relative w-full aspect-[3/4] sm:aspect-[21/9] lg:aspect-[3/1] overflow-hidden">
  <Image src={cover} alt={title} fill className="object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
</div>
```

#### 关键技巧：
- 移动端使用竖屏比例 `aspect-[3/4]`
- 平板使用宽屏比例 `aspect-[21/9]`
- 桌面使用超宽比例 `aspect-[3/1]`
- 添加渐变遮罩确保文字可读

---

## 检查清单

在完成移动端适配后，请检查：

- [ ] 所有文字使用 `truncate` 或 `line-clamp` 防止溢出
- [ ] 表格在移动端使用卡片视图
- [ ] 不同大小文字使用 `items-baseline` 对齐
- [ ] 按钮和交互元素有触摸反馈
- [ ] 底部导航栏有毛玻璃效果和安全区域
- [ ] 图片使用响应式宽高比
- [ ] 所有间距使用响应式断点

---

## 相关文件

- [后台 UI 优化指南](../../rules/admin-ui-optimization.md)
- [性能优化配置](../../rules/configuration.md)

---

*创建时间：2026-04-14*
*最后更新：2026-04-14*
