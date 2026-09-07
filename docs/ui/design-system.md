# XPhotos 前台设计规范（Design System）

> **适用范围**：前台所有页面（`app/(default)/**`、`app/(theme)/**`、`/preview/**`、`/login`）及共享组件（`components/ui/**`、`components/album/**`、`components/gallery/**`、`components/hero/**`、`components/layout/**`）。
>
> **文档目的**：为后续 UI 设计与开发提供统一、可落地的标准。所有 class 字符串均从代码中精确摘录。
>
> **相关文档**：[前台 UI 交互参考](../reference/frontend-ui.md) | [UI 组件参考](../reference/ui-components.md)

---

## 目录

1. [设计语言概述](#一设计语言概述)
2. [色彩系统](#二色彩系统)
3. [排版系统](#三排版系统)
4. [圆角 · 间距 · 层级](#四圆角--间距--层级)
5. [组件规范](#五组件规范)
6. [动效规范](#六动效规范)
7. [页面设计规范](#七页面设计规范)
8. [响应式设计规则](#八响应式设计规则)
9. [可访问性规范](#九可访问性规范)
10. [落地检查清单](#十落地检查清单)

---

## 一、设计语言概述

### 1.1 风格定位

| 维度 | 定义 |
| --- | --- |
| 整体气质 | **摄影作品优先**的画廊式设计——图片是唯一主角，UI 装饰保持克制 |
| 浅色模式 | 温暖胶片风（SamAlive 风格）：米白纸感底色 + 琥珀橙主色 + 青蓝辅助色 |
| 暗色模式 | 深邃电影感：深蓝灰底（非纯黑）+ 亮暖橙 + 亮青色，带径向渐变氛围与噪点纹理 |
| 标题字体 | 展示型衬线字体 Playfair Display，营造画册/杂志感 |
| 正文字体 | Geist 无衬线，现代、干净、高可读性 |
| 圆角语言 | 中大圆角为主（`rounded-lg` ~ `rounded-2xl`），圆形仅用于图标按钮与胶囊按钮 |

### 1.2 核心原则

1. **图片主导**：任何 UI 元素不得与图片争夺视觉焦点；遮罩、徽章均使用半透明黑/白。
2. **留白呼吸感**：区块间垂直间距 ≥ `py-24`（96px），网格间距 `gap-8`（32px）。
3. **克制装饰**：每 3 个内容区块最多 1 个 eyebrow 小标题；仅 EXIF 信息区使用 eyebrow。
4. **统一交互反馈**：所有可交互元素必须有 hover、`focus-visible:ring`、`active` 缩放三态。
5. **尊重系统偏好**：全局响应 `prefers-reduced-motion`，暗色模式为一等公民。

---

## 二、色彩系统

### 2.1 核心设计令牌

> 来源：`style/globals.css`（`:root` / `.dark`），基于 Tailwind CSS v4 `@theme inline` 映射。

| 令牌 | 浅色模式 | 暗色模式 | 语义与使用场景 |
| --- | --- | --- | --- |
| `--background` | `#FFFFFF` 纯白 | `#0A0A0A` 近黑（非纯黑，保留层次） | 页面底色（白瓷方案：纯白底 / 近黑底） |
| `--foreground` | `#0A0A0A` 近黑 | `#FAFAFA` | 主文字色 |
| `--card` | `#FFFFFF` | `#141414` | 卡片/面板底色 |
| `--card-foreground` | `#0A0A0A` | `#FAFAFA` | 卡片内主文字 |
| `--popover` | `#FFFFFF` | `#141414` | 弹层（下拉/气泡）底色 |
| `--popover-foreground` | `#0A0A0A` | `#FAFAFA` | 弹层内文字 |
| `--primary` | `#0A0A0A` 纯黑 | `#FAFAFA` 反白 | 品牌主色：主按钮（黑白灰体系，克制用彩） |
| `--primary-foreground` | `#FFFFFF` | `#0A0A0A` | 主色上的文字 |
| `--secondary` | `#F5F5F5` 中性灰 | `#1C1C1C` | 次级实心按钮、辅助强调 |
| `--secondary-foreground` | `#0A0A0A` | `#FAFAFA` | 次色上的文字 |
| `--muted` | `#F5F5F5` | `#1C1C1C` | 弱背景：hover 背景、EXIF 行底、骨架屏、标签实底 |
| `--muted-foreground` | `#737373` 中灰 | `#A3A3A3` | 辅助文字（描述、说明、占位文字） |
| `--accent` | `#F5F5F5` | `#1C1C1C` | hover 强调背景（ghost 按钮；图片标签 hover 已改用 antd 令牌） |
| `--accent-foreground` | `#0A0A0A` | `#FAFAFA` | accent 背景上的文字 |
| `--destructive` | `#DC2626` | `#F87171` | 危险操作（删除、清除筛选） |
| `--border` | `#E5E5E5` | `#262626` | 边框 |
| `--input` | `#E5E5E5` | `#262626` | 输入框边框 |
| `--ring` | `#2563EB` 蓝 | `#60A5FA` | focus ring 颜色（全站唯一的主题蓝，蓝色仅收敛于此） |
| `--radius` | `0.75rem` | `0.75rem` | 圆角基准值 |

### 2.2 图表色板（chart-1 ~ chart-5）

| 令牌 | 浅色 | 暗色 | 用途 |
| --- | --- | --- | --- |
| `--chart-1` | `#2563EB` 蓝 | `#60A5FA` | 图表主系列（与焦点环蓝一致） |
| `--chart-2` | `#737373` 中灰 | `#A3A3A3` | 图表次系列 |
| `--chart-3` | `#93C5FD` 浅蓝 | `#3B82F6` | 图表第三系列 |
| `--chart-4` | `#404040` 深灰 | `#D4D4D8` | 图表第四系列 |
| `--chart-5` | `#D4D4D8` 浅灰 | `#52525B` | 图表第五系列 |

### 2.3 侧栏令牌（sidebar-*）

与 card/primary 体系同源：`--sidebar` 同 `--card`、`--sidebar-primary` 同 `--primary`、`--sidebar-accent` 同 `--accent`。后台侧栏使用，前台不直接引用。

### 2.4 色彩使用规则

1. **禁止硬编码色值**：前台一律使用语义令牌（`text-muted-foreground` 而非 `text-gray-500`）。唯一例外：图片上的覆盖层（`bg-black/40`、`text-white`）。
2. **主色使用克制**：`primary` 为纯黑/反白（白瓷体系），只出现在主按钮、选中态。全站唯一的彩色是焦点环蓝（`--ring`）与 antd 标签蓝（来自 antd 令牌），禁止再引入其他品牌色。大面积背景永远用 `background` / `muted`。
3. **图片覆盖层专用色**：图片上的文字/控件用 `text-white` + `bg-black/40~60` + `backdrop-blur`，不使用主题令牌（保证任何照片上的可读性）。
4. **暗色模式特有效果**（仅 `.dark` 生效）：
   - 背景径向渐变氛围：中性白微光（约 4%/3% 双光晕，非彩色）；
   - 全局噪点纹理覆盖层（`opacity: 0.04` 的 SVG feTurbulence）。
5. **玻璃拟态卡**（`.glass-card` 工具类）：`backdrop-filter: blur(20px)` + 半透明底 + 内侧高光边框，用于登录面板等需要"浮起"感的场景。

---

## 三、排版系统

### 3.1 字体家族

> 来源：`style/globals.css` 第 2 行（Google Fonts 引入）与 `@theme inline`。

| 令牌 | 字体栈 | 可用字重 | 使用场景 |
| --- | --- | --- | --- |
| `--font-sans` | `'Geist', system-ui, sans-serif` | 300 / 400 / 500 / 600 / 700 / 800 | 全站默认正文与 UI 文字（body 默认） |
| `--font-serif` | `'Playfair Display', Georgia, serif` | 400 / 500 / 600 / 700 | 品牌标识（Logo）、大标题、移动端菜单项 |
| `--font-mono` | `'Fira Code', monospace` | — | 代码/技术性文字（极少使用） |

### 3.2 字号层级（自上而下）

| 层级 | 精确样式 | 实际示例 | 使用场景 |
| --- | --- | --- | --- |
| **Hero 大标题** | `text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1]` | 首页 Hero 标题 | 仅首页最大标题，白色文字置于图片上 |
| **区块大标题** | `text-3xl sm:text-4xl md:text-5xl font-light` | 「作品集精选」 | 首页相册区、各页面核心区块标题 |
| **页面标题** | `text-2xl` ~ `text-3xl font-medium`（按页面） | 相册页标题 | 内页主标题 |
| **弹窗标题** | `text-lg leading-none font-semibold` | DialogTitle | 对话框 |
| **导航 Logo** | `text-[22px] font-serif font-medium tracking-[-0.02em]` | 站点名 | 桌面/移动端导航品牌位 |
| **导航菜单项** | `text-[15px] tracking-[0.02em]` | 首页/相册/攻略… | 桌面导航链接 |
| **移动端菜单项** | `text-[22px] font-serif tracking-[-0.01em]`（`py-3`） | 移动抽屉菜单 | 移动端全屏菜单 |
| **正文** | `text-sm`（UI）/ `text-base`（长文） | 说明段落 | 默认 UI 文字为 text-sm |
| **区块描述** | `text-lg text-muted-foreground` | 区块标题下描述文字 | 配合区块大标题 |
| **辅助/说明文字** | `text-xs text-muted-foreground` | EXIF 值、页脚说明 | 次要信息 |
| **页脚说明** | `text-[13px] leading-relaxed text-muted-foreground` | 页脚版权/描述 | 页脚 |
| **eyebrow 小标题** | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` | 「EXIF」 | 分组标题（全站唯一使用处见 7.5） |
| **移动菜单分组标签** | `text-[11px] uppercase tracking-[0.12em]` | 相册分组标题 | 移动菜单内分组 |
| **LivePhoto 徽章** | `text-[9px] font-medium tracking-wider` | LIVE 角标 | 瀑布流卡片角标 |

### 3.3 字重规范

| 字重 | class | 使用场景 |
| --- | --- | --- |
| Light 300 | `font-light` | Hero 大标题、区块大标题（摄影感的关键：细字重大字号） |
| Normal 400 | `font-normal`（默认） | 正文、图片标签（antd Tag 默认字重） |
| Medium 500 | `font-medium` | 按钮、导航项、筛选 chip、徽章、页脚品牌 |
| Semibold 600 | `font-semibold` | 弹窗标题、eyebrow |

### 3.4 字间距与行高

| class | 使用场景 |
| --- | --- |
| `tracking-[-0.02em]` | 导航 Logo（衬线大字收紧） |
| `tracking-[-0.01em]` | 移动端菜单项 |
| `tracking-[0.02em]` | 桌面导航菜单项 |
| `tracking-widest` | eyebrow 小标题 |
| `tracking-[0.12em]` | 移动菜单分组标签 |
| `tracking-wide` | Hero CTA 按钮 |
| `leading-[1.1]` | Hero 大标题 |
| `leading-relaxed` | 页脚说明、长段描述 |
| `leading-none` | 弹窗标题 |

### 3.5 文字颜色使用规则

| 场景 | 令牌 |
| --- | --- |
| 主文字/标题 | `text-foreground` |
| 辅助描述 | `text-muted-foreground` |
| 品牌强调（标题中的重点词） | `text-primary` |
| 图片上覆盖文字 | `text-white`（配 `bg-black/*` 遮罩） |
| Hero 副标语 | 渐变文字 `bg-gradient-to-r … bg-clip-text text-transparent`（仅此一处允许） |
| 危险文字 | `text-destructive` |

---

## 四、圆角 · 间距 · 层级

### 4.1 圆角体系

基准 `--radius: 0.75rem`（12px），派生：`radius-sm = 8px`、`radius-md = 10px`、`radius-lg = 12px`、`radius-xl = 16px`。

| 元素 | 圆角 | 说明 |
| --- | --- | --- |
| 按钮（Button 组件） | `rounded-lg` | 全站统一；例外见下 |
| 预览页导航箭头 | `rounded-xl` | 图片覆盖式按钮 |
| 清除筛选按钮 | `rounded-xl` | 大面积触控元素 |
| 卡片（相册卡） | `rounded-2xl` | 16px 大圆角 |
| 图片卡片（瀑布流/单列） | `rounded-lg` / `rounded` | 移动端单列为 `rounded` |
| 图片标签（TagLink） | `4px` | 白瓷中性实底方案，圆角与 antd Tag 规格一致 |
| 筛选 chip / 胶囊按钮 | `rounded-full` | 筛选面板、Hero CTA、加载更多 |
| 图标按钮（导航/侧栏） | `rounded-full` | 圆形 hover 容器 |
| 弹窗/下拉/输入框 | `rounded-lg` / `rounded-md` | Antd/Radix 默认修正后 |
| 移动端返回按钮（预览页） | `rounded-xl` | 全断点统一 `rounded-xl`（曾修复过不一致问题） |

### 4.2 容器与页面间距

| 约定 | 精确值 | 使用页面 |
| --- | --- | --- |
| 标准容器 | `container mx-auto px-4 max-w-7xl` | 首页相册区 |
| 窄容器 | `container mx-auto px-4 max-w-6xl mx-auto` | `/covers` |
| 内容容器 | `max-w-6xl mx-auto px-4 md:px-6 lg:px-8` | `/about` |
| 页脚容器 | `max-w-[1400px] mx-auto px-8 py-12` | Footer |
| 导航高度 | `h-14`（fixed，内容区 `pt-14` 让位） | 全站 |
| 区块垂直间距 | `py-24`（区块级）、`py-16`（次级区块） | 首页/内页区块 |
| 标题与内容间距 | `mb-16`（区块标题下）、`mb-4`（卡片内） | 区块标题 |
| 网格间距 | `gap-8`（相册/封面）、`md:gap-12`（covers 加宽） | 网格布局 |
| 筛选面板内部 | `space-y-6` | 筛选区块之间 |
| 瀑布流页面 | `px-3 pt-2 pb-16` | 相册/画廊页 |
| 侧栏操作区 | `pt-2 border-t border-border/60` | 预览页操作按钮区上方 |

### 4.3 层级（z-index）

| 层 | 值 | 元素 |
| --- | --- | --- |
| 导航栏 | `z-50` | `fixed top-0` |
| 弹窗遮罩/内容 | `z-50` | Dialog |
| 图片上导航箭头 | `z-20` | 预览页 |
| 暗色噪点纹理 | `z-1`（pointer-events-none） | `.dark::before` |

---

## 五、组件规范

> 状态样式约定：每个可交互组件必须覆盖 **正常 / 悬停（hover）/ 激活（active）/ 焦点（focus-visible）/ 禁用（disabled）** 五态；焦点统一使用 `focus-visible:ring-2` + ring 色 `--ring`（主色）。

### 5.1 Button（`components/ui/button.tsx`）

**基础类**（所有 variant 共享）：

```
inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium
transition-all duration-200 shrink-0 outline-none
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50
[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0
```

**Variants 状态表**：

| Variant | 正常 | 悬停 | 激活/选中 | 禁用 | 使用场景 |
| --- | --- | --- | --- | --- | --- |
| `default` | `bg-primary text-primary-foreground border border-transparent shadow-sm rounded-lg` | `hover:bg-primary/90` | — | 基础禁用态 | 主操作（保存、确认） |
| `minimal` | `bg-card text-card-foreground border border-border rounded-lg` | `hover:bg-muted hover:text-foreground` | `data-[active=true]` / `aria-pressed`：`bg-primary/10 border-primary text-primary` | `bg-muted text-muted-foreground cursor-not-allowed` | 工具栏切换按钮（默认轻量按钮） |
| `outline` | `border border-border bg-background text-foreground shadow-none rounded-lg` | `hover:bg-muted hover:text-foreground` | — | 基础禁用态 | 次要操作 |
| `secondary` | `bg-secondary text-secondary-foreground border border-transparent shadow-sm` | `hover:bg-secondary/80` | — | 基础禁用态 | 次级强调按钮 |
| `ghost` | `border border-transparent` | `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50` | — | 基础禁用态 | 工具栏、列表行内操作 |
| `destructive` | `bg-destructive text-white border border-transparent shadow-sm` | `hover:bg-destructive/90` | — | 基础禁用态；`focus-visible:ring-destructive/30` | 删除等危险操作 |
| `link` | `text-primary underline-offset-4 border border-transparent` | `hover:underline` | — | 基础禁用态 | 文字链接型按钮 |

**尺寸表**：

| Size | 精确样式 | 使用场景 |
| --- | --- | --- |
| `default` | `h-10 px-4` | 常规按钮 |
| `sm` | `h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5` | 紧凑场景 |
| `lg` | `h-10 rounded-md px-6 has-[>svg]:px-4` | 强调按钮 |
| `icon` | `size-9` | 纯图标按钮 |

**通用规则**：按钮内文字必须 `whitespace-nowrap`（防换行，曾修复过预览页按钮换行问题）；图标统一 `size-4`，图标需 `pointer-events-none`。

### 5.2 图标按钮（非 Button 组件体系）

| 形态 | 精确样式 | 场景 |
| --- | --- | --- |
| 导航圆形图标按钮 | `inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/60 transition-all duration-300`（汉堡为 `w-10 h-10`） | 主题/语言切换、移动端菜单触发 |
| 图片覆盖式导航箭头 | `w-11 h-11 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm`，定位 `absolute top-1/2 -translate-y-1/2 left-4/right-4 z-20`（移动端 `left-3/right-3`） | 预览页上一张/下一张 |
| 预览页关闭/返回 | `w-9 h-9 rounded-lg hover:bg-muted transition-colors touch-manipulation text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60` | 预览页头部 |
| 单列画廊操作按钮 | `rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60` | 下载/复制链接等 |

**硬性要求**：纯图标按钮必须携带 `aria-label`（使用 i18n key，如 `t('Button.goBack')`）。

### 5.3 Input（`components/ui/input.tsx`）

| 状态 | 精确样式 |
| --- | --- |
| 正常 | `h-10 rounded-[4px] border border-input text-foreground bg-background` |
| 悬停 | `hover:border-foreground/20` |
| 焦点 | `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none` |
| 禁用 | `disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed` |
| 校验失败 | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` |

> 注记：Input/Select 已于 2026-09-07 完成白瓷令牌迁移（旧硬编码蓝 `#4299e1`/`#409eff`/`#ecf5ff` 清零），全部使用语义令牌，暗色模式自动适配。

### 5.4 Select（`components/ui/select.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| Trigger | `flex h-9 w-full items-center justify-between gap-2 rounded bg-background border border-input px-3 py-2 hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50` |
| Content | `relative z-50 rounded border border-border bg-popover`（阴影+动画） |
| Item | `relative flex w-full cursor-pointer items-center rounded py-2 px-3 text-foreground hover:bg-accent data-[state=checked]:bg-ring/10 data-[state=checked]:text-foreground` |

### 5.5 Dialog（`components/ui/dialog.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| 遮罩 | `fixed inset-0 z-50 bg-black/50`（fade/zoom 动画） |
| 内容 | `fixed top-[50%] left-[50%] z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg` |
| 关闭按钮 | `absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 cursor-pointer focus:ring-ring` |
| 标题 | `text-lg leading-none font-semibold` |
| 描述 | `text-muted-foreground text-sm` |

### 5.6 Tooltip（`components/ui/tooltip.tsx`）

```
bg-primary text-primary-foreground z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance
```
带四方向滑入动画与箭头（`fill-primary`）。深色底白字，与主色一致。

### 5.7 Skeleton（`components/ui/skeleton.tsx`）

```
bg-accent animate-pulse rounded-md
```
用于图片加载占位（瀑布流加载占位使用 `bg-muted animate-pulse`）。

### 5.8 标签（Tag，antd 组件化）

**图片标签（TagLink，`components/ui/tag-link.tsx`）** — 预览页侧栏 / 单列画廊共用，点击跳转 `/tag/:tag`：

- 基于 antd v6 `Tag.CheckableTag` 完全受控 filled 态（`checked` 恒为 true），**零手写色值**
- 视觉全部来自 antd 设计令牌：底色 `colorPrimary`(#1677ff) → hover `colorPrimaryHover`(#4096ff) → 按下 `colorPrimaryActive`(#0958d9)，白字；暗色随 antd 暗色算法自动适配
- 尺寸（antd 原生）：`fontSize: 12px`、`lineHeight: 20px`、`padding: 0 7px`、圆角 4px、无 `#` 前缀
- 间距：**antd v6 Tag 已移除内建 margin**，横向间距必须由容器提供——容器统一 `flex flex-wrap gap-x-3 gap-y-2`（横向 12px / 换行 8px）
- a11y：`tabIndex=0` + `role="link"` + Enter/Space 触发（补齐 antd span 默认不可聚焦的缺口）；焦点环 `focus-visible:ring-2 focus-visible:ring-ring/60`
- 实现注意：v6 `CheckableTagProps` 未声明 tabIndex 等透传属性，组件内已做一次带注释的类型收窄；改主题色只需全局 `ConfigProvider` 的 `colorPrimary` 令牌

**形态 B — 筛选 chip**（筛选面板，多选，保留手写实现）：

```
rounded-full border px-3 py-1.5 text-xs font-medium
选中态：border-primary bg-primary/10 text-primary
未选中态：border-border text-muted-foreground
```

### 5.9 EXIF 信息行

> 数据统一来自 `lib/exif.ts` 的 `buildExifRows()`（字段：camera/lens/date/aperture/shutter/focalLength/iso/resolution/location），前台两处（预览页、单列画廊）共用，保证格式与单位一致。

| 部件 | 精确样式 |
| --- | --- |
| 区块标题（eyebrow） | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` + 右侧延伸线 `flex-1 h-px bg-border` |
| 单行 | `flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30` |
| 字段名 | `text-xs text-muted-foreground`（固定宽度对齐） |
| 字段值 | `text-xs text-foreground`（可截断省略） |

### 5.10 相册卡片（AlbumCard，`components/album/album-grid.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| 卡片容器 | `relative aspect-[4/3] overflow-hidden rounded-2xl mb-4` |
| 封面图 | `w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110` |
| 底部渐变遮罩 | `absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300` |
| 卡片悬停 | framer-motion `whileHover={{ y: -8 }}`（上浮 8px） |
| 区块标题 | `text-3xl sm:text-4xl md:text-5xl font-light`（前景色 + `text-primary` 强调词） |
| 区块描述 | `text-muted-foreground max-w-2xl mx-auto text-lg` |

### 5.11 瀑布流图片卡片（`components/ui/virtual-waterfall-gallery.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| 卡片 | `absolute overflow-hidden rounded-lg cursor-pointer` |
| 加载占位 | `bg-muted animate-pulse` |
| LivePhoto 徽章 | `absolute top-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white tracking-wider` |
| 「加载更多」按钮 | `rounded-full border border-border bg-card px-5 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50` |

### 5.12 导航栏（`components/layout/unified-nav.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| 容器 | `w-full fixed top-0 left-0 z-50 h-14 transition-all duration-500 ease-out` |
| 滚动态 | `bg-background/80 backdrop-blur-2xl border-b border-border/30 shadow-[…]` |
| Logo | `text-[22px] font-serif font-medium tracking-[-0.02em] group-hover:opacity-60` |
| 桌面菜单项 | `px-4 py-1.5 text-[15px] tracking-[0.02em] hover:text-foreground`（active 指示器随主题色） |
| 主题切换 | Antd `Segmented`，配色绑定 CSS 变量：track `var(--muted)`、选中 `var(--card)`/`var(--foreground)` |
| 语言切换 | `w-9 h-9 rounded-full hover:bg-muted/60 transition-all duration-300` |
| 移动端汉堡 | `w-10 h-10 rounded-full hover:bg-muted/60 transition-all duration-300` |
| 移动抽屉 | 背景 `pt-14`；链接 `py-3 text-[22px] font-serif tracking-[-0.01em]`；分组标签 `mt-8 pt-6 text-[11px] uppercase tracking-[0.12em]` |

### 5.13 页脚（`components/layout/footer.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| 容器 | `border-t border-border/40`，内层 `max-w-[1400px] mx-auto px-8 py-12` |
| 品牌名 | `text-[19px] font-serif font-medium group-hover:opacity-60` |
| 说明文字 | `text-[13px] leading-relaxed text-muted-foreground` |

### 5.14 筛选面板（`components/layout/theme-gallery-client.tsx`）

| 部件 | 精确样式 |
| --- | --- |
| 面板组织 | `space-y-6`（相机/镜头/标签各一区块） |
| 搜索框 | `rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50` |
| AND/OR 切换 | `rounded-md border px-3 py-1 text-xs font-medium` |
| 清除全部按钮 | `w-full rounded-xl border border-destructive/30 py-2.5 text-sm text-destructive hover:bg-destructive/8` |

### 5.15 登录面板（`components/login/user-from.tsx`）

- 容器：`BorderBeam` 流光边框包裹 + `backdropFilter: blur(16px)` 玻璃拟态 + `borderRadius: token.borderRadiusLG * 2`；
- 表单：Antd `Form / Input / Input.Password`；
- 提交按钮：`height: 44px`、`fontWeight: 500`、Antd primary。

---

## 六、动效规范

### 6.1 入场动效（framer-motion）

| 参数 | 标准值 | 说明 |
| --- | --- | --- |
| 初始态 | `{ opacity: 0, y: 20 }`（标题）/ `{ opacity: 0, y: 30 }`（卡片） | 上移入场 |
| 过渡 | `duration: 0.6, ease: 'easeOut'` | 统一时长 |
| 触发 | `whileInView` + `viewport={{ once: true }}` | 进入视口一次性播放 |
| 级联 | 卡片 `delay: index * 0.1` | 网格 stagger |
| 降级 | `useReducedMotion()` 为 true 时禁用（`initial={false}`、`duration: 0`） | 无障碍硬性要求 |

### 6.2 悬停动效

| 元素 | 效果 |
| --- | --- |
| 卡片封面图 | `group-hover:scale-110`，`duration-700 ease-out`（慢速沉浸式放大） |
| 卡片本体 | `whileHover={{ y: -8 }}` 上浮 |
| 遮罩 | `opacity-60 → group-hover:opacity-80`（`duration-300`） |
| 链接箭头 | `group-hover:translate-x-1` |
| 按钮 | `active:scale-[0.98]`（Button）/ `.btn-press:active { transform: scale(0.98) }`（工具类） |
| 图片标签 | 无按压缩放（遵循 antd Tag 行为），按下反馈为色阶加深 `colorPrimaryActive` |
| Logo/品牌 | `group-hover:opacity-60` |

### 6.3 全局过渡与动画降级

- 全局色彩过渡：`transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease`（`html` 上含背景渐变过渡，服务于主题切换）。
- 按钮 `:active` 触觉反馈：`.btn-press` 工具类（`transition: transform 0.1s ease`）。
- 装饰性 keyframes 库（`style/globals.css`）：`blob`、`float-slow/medium/fast`、`pulse-slow/medium`、`glow(-delayed)`、`twinkle(-delayed/-slow)`、`nebula(-delayed)`（Hero 氛围光）、`shimmer`（骨架屏）、`showUp`（入场）、`shake`（错误抖动）。
- **硬性规则**：
  1. `prefers-reduced-motion: reduce` 时全局动画/过渡时长强制 0.01ms；
  2. 组件不可见时通过 `data-animation-paused="true"` 暂停动画，避免 CPU/GPU 空转；
  3. 移动端（<768px）装饰动画（float/pulse/glow/nebula）不透明度降至 0.6；
  4. 页面平滑滚动 `html { scroll-behavior: smooth }`。

---

## 七、页面设计规范

### 7.1 全局框架（`app/layout.tsx` + `app/(default)/layout.tsx`）

```
html (字体/主题 class)
└─ body (min-h-screen, bg-background text-foreground)
   ├─ Providers（next-intl → ConfigStore → ThemeProvider → AntdConfigProvider）
   ├─ UnifiedNav（fixed h-14 z-50）
   ├─ main (pt-14，为导航让位)
   │   └─ 页面内容
   ├─ Footer
   └─ Modal 挂载点
```

主题相册页（`app/(theme)/[...album]`）独立于 default 布局，自行控制顶部（返回容器 `container mx-auto px-4 mb-4`）。

### 7.2 首页 `/`

**结构**：`min-h-screen` → HeroSection → AlbumGrid。

**Hero 区**（`components/hero/hero-section.tsx`）：
- 全屏背景轮播（精选图片），文字白色置于图片上；
- 大标题：`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1]`；
- 副标语：渐变文字（全站唯一渐变文字）；
- 说明文字：`text-white/60 text-xs sm:text-sm font-light`；
- CTA 按钮：`px-5 sm:px-7 py-2.5 sm:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full !text-white text-xs sm:text-sm font-medium tracking-wide hover:bg-white/20`；
- 氛围装饰光使用 float/glow/nebula 动画（移动端降载）。

**相册区**（`components/album/album-grid.tsx`）：
- 区块：`py-24 bg-background`，容器 `container mx-auto px-4 max-w-7xl`；
- 标题居中 `mb-16 text-center`；
- 网格：`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`，最多展示 6 个相册；
- 超过 6 个时显示「查看全部相册」：`px-8 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 group btn-press`（箭头 `group-hover:translate-x-1`）。

**视觉层次**：Hero（沉浸图片）→ 区块标题（细字重大字号）→ 卡片（图片即内容）→ 胶囊按钮（收束）。

### 7.3 封面页 `/covers`

- 容器：`container mx-auto px-4`，内层 `grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto`；
- 双列大封面卡（桌面），单列（移动）；
- 返回按钮跳回 `/albums`。

### 7.4 作品合集 `/albums` 与主题相册页 `/theme/[...album]`

**布局决策**（`theme-gallery-client.tsx`）：根据系统样式偏好与相册图片数量自动选择 `waterfall`（瀑布流）或 `single`（单列）布局，用户可手动切换。

**瀑布流布局**：外层 `w-full min-h-screen bg-background px-3 pt-2 pb-16`；虚拟滚动（性能优化）；图片卡片 `rounded-lg`。

**单列布局**（`gallery-image.tsx`）：
- 移动端图片：`relative select-none shadow-md rounded overflow-hidden w-full mb-2`；
- 信息区含 EXIF 行（共享 `buildExifRows`）、图片标签（TagLink，antd Tag）、操作按钮行（下载/复制等）；
- LivePhoto 徽章：`absolute top-2 left-2`，SVG `text-white opacity-75 drop-shadow-lg`（24×24）。

**筛选面板**：见 5.14；筛选条件变更后需点击查询生效（页面有提示文案）；移动端提供筛选入口并显示已应用筛选数量。

### 7.5 预览页 `/preview/[id]`（`components/album/preview-image.tsx`）

**方向性规则：桌面图片在左（主导），信息栏在右。**

```
桌面（≥lg）: [ 图片区 flex-1 min-w-0 | 侧栏 aside w-[300px] xl:w-[320px] lg:border-l ]
移动（<lg）: [ 图片区 min-h-[50dvh] ] 上
             [ 侧栏（border-t）] 下
```

- 图片区：`hidden lg:flex flex-1 min-w-0 items-center justify-center relative`（无背景色无 padding）；移动端 `lg:hidden w-full flex-shrink-0 min-h-[50dvh] relative`；
- 导航箭头：图片覆盖式（见 5.2），桌面 `left-4/right-4`、移动 `left-3/right-3`；键盘 ←/→ 切换（lightbox 打开时禁用）；
- 侧栏：`w-full lg:w-[300px] xl:w-[320px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-card overflow-y-auto`；
- 侧栏结构（自上而下）：返回区（圆形图标按钮 + 标题）→ EXIF 区（唯一 eyebrow + 分隔线 + `bg-muted/30` 行列表）→ 标签区（无 eyebrow，直接展示 TagLink 标签，容器 `gap-x-3 gap-y-2`）→ 操作区（`pt-2 border-t border-border/60`，按钮 `grid grid-cols-2 gap-2`：复制直链/下载等）；
- 装饰克制：每 3 区块最多 1 个 eyebrow（仅 EXIF 区有）。

### 7.6 关于页 `/about`

- 容器：`max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8`；
- 布局：`flex flex-col lg:flex-row`——左侧介绍文案 + 社交链接，右侧画廊图片轮播；
- 文案数据来自 `about_intro` 等配置项。

### 7.7 攻略页 `/guides` 与详情 `/guides/[id]`

- 列表页：卡片式布局，封面图替换为预览图 URL（服务端处理），带国家/城市/天数 meta 信息；
- 详情页：目录导航 + 模块化内容渲染 + 关联相册图集；接口使用 Redis 缓存（`guides:list` / `guide:${id}`）。

### 7.8 登录页 `/login`

- 居中玻璃拟态面板（`BorderBeam` + blur(16px)），Antd 表单体系；
- 提交按钮高 44px；错误反馈使用 `animate-shake` 抖动动画。

---

## 八、响应式设计规则

### 8.1 断点行为约定

| 断点 | 宽度 | 关键行为变化 |
| --- | --- | --- |
| 默认（<sm） | <640px | 单列布局；Hero 标题 `text-4xl`；导航折叠为汉堡抽屉；图片导航箭头 `left-3/right-3`；触控目标 ≥44px；装饰动画降载（opacity 0.6） |
| `sm` | ≥640px | Hero 标题升至 `text-5xl`；按钮内边距增大（`px-7 py-3`） |
| `md` | ≥768px | 网格升为 2 列（`md:grid-cols-2`）；区块标题 `text-4xl`；Hero 标题 `text-6xl`；容器水平 padding 增至 `md:px-6` |
| `lg` | ≥1024px | 相册网格 3 列；预览页切换为左图右栏横排（`lg:flex-row`、`lg:border-l`）；关于页双栏（`lg:flex-row`）；Hero 标题 `text-7xl`；区块标题 `text-5xl` |
| `xl` | ≥1280px | 预览页侧栏加宽至 `xl:w-[320px]` |

### 8.2 触控与移动端规则

1. 可点击元素添加 `touch-manipulation`（消除 300ms 延迟、禁用双击缩放干扰）；
2. 全局禁用点击高亮：`body { -webkit-tap-highlight-color: transparent }`；
3. 移动端图片区最小高度用 `min-h-[50dvh]`（动态视口单位，非固定像素）；
4. 移动端筛选通过按钮唤起面板，按钮显示已应用筛选数量徽标；
5. 复杂表格/瀑布流在移动端使用紧凑模式（导航菜单 13px 紧凑规则 `compact-nav-menu`）。

---

## 九、可访问性规范

| 规则 | 要求 | 依据 |
| --- | --- | --- |
| 图标按钮 | 必须带 `aria-label`（i18n key） | 预览页返回按钮等已实现 |
| 焦点可见 | 所有可交互元素必须 `focus-visible:ring-2 focus-visible:ring-ring(/60)` + 适当 `ring-offset` | Button 组件基础类；全局 `outline-ring/50` |
| 语义化 | 可点击元素用 `<button type="button">` 而非 `<span>`/`<div>`；antd 组件场景补齐键盘可达性 | 图片标签为 antd CheckableTag（span），已补 `tabIndex`/`role="link"`/Enter·Space |
| 状态语义 | 切换按钮使用 `aria-pressed` 或 `data-active` | minimal variant 支持选中态样式 |
| 动效降级 | 尊重 `prefers-reduced-motion`；framer-motion 使用 `useReducedMotion` | 全局 CSS + 组件双重保障 |
| 触控目标 | 最小 44×44px（`size-9`=36px 需配合外层点击区或提升到 `size-11`） | 图片导航箭头为 `w-11 h-11` |
| 色彩对比 | 辅助文字统一 `text-muted-foreground`（已验证对比度达标）；图片上文字必须加遮罩 | 覆盖层规范 |

---

## 十、落地检查清单

新增或修改前台 UI 时逐项核对：

- [ ] 颜色仅使用语义令牌（`bg-muted`、`text-muted-foreground`…），图片覆盖层除外
- [ ] 字体：正文 `font-sans` 默认；大标题 `font-light` + 大字号；品牌字 `font-serif`
- [ ] 圆角：按钮 `rounded-lg`、卡片 `rounded-2xl`、图标圆钮 `rounded-full`、胶囊 `rounded-full`
- [ ] 按钮有 `whitespace-nowrap`；图标按钮有 `aria-label`
- [ ] 交互五态齐全：正常 / hover / active（缩放）/ focus-visible（ring）/ disabled
- [ ] 动效遵循 0.6s easeOut 入场 + once 触发；`useReducedMotion` 已接入
- [ ] 响应式断点核对 sm/md/lg/xl；移动端触控目标 ≥44px、加 `touch-manipulation`
- [ ] 区块间距 `py-24`、网格 `gap-8`、容器 `max-w-7xl/6xl`
- [ ] EXIF 展示使用 `lib/exif.ts` 共享数据，不自拼字段
- [ ] 下载逻辑使用 `lib/image-download.ts`，不自行实现
- [ ] 提示文案走 i18n（zh/en/ja/zh-TW 四语补齐），不硬编码中文
- [ ] 暗色模式检查：非纯黑背景、噪点纹理、卡片层次在暗色下正常

---

*文档来源：`style/globals.css`、`components/ui/**`、`components/album/**`、`components/gallery/**`、`components/hero/**`、`components/layout/**` 代码实测摘录。*
*最后更新：2026-09-07*
