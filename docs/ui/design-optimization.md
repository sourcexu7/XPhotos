# XPhotos 前台设计优化方案

> **审计对象**：[design-system.md](./design-system.md)（现状设计规范）
> **优化方向**：交互模式 / 视觉设计 / 配色重构
> **设计基准**：Linear · Stripe · Vercel 的高级简约语言——纯白底、细边框、低噪声、色彩极度克制
> **配套 Demo**：[design-demo.html](./design-demo.html)（双击即可在浏览器中切换 5 套配色 + 明暗模式对比）

---

## 一、交互模式优化

### P0 — 直接影响操作效率

| # | 现状问题 | 优化方案 | 涉及模块 |
| --- | --- | --- | --- |
| 1 | 相册页筛选"变更后需点击查询生效"（规范 7.4），多一步确认、心智负担重 | **筛选即时生效**：chip 点击即触发查询（乐观 UI + 300ms 防抖合并多选）；筛选状态同步到 URL query（`?cameras=…&tags=…`），支持分享与浏览器回退；每个已选 chip 提供 `×` 即时移除；保留"清除全部"兜底 | `theme-gallery-client.tsx` |
| 2 | 预览页 ←/→ 切图无方向性过渡，图片与侧栏信息"硬切"闪变 | **方向性滑动动效**：图片按切换方向 translate 0→∓24px 淡入，`0.35s cubic-bezier(0.22,1,0.36,1)`；EXIF 数值 150ms 交叉淡入；预加载相邻一张消除白屏 | `preview-image.tsx` |
| 3 | 复制直链/下载操作只有 toast，按钮本身无状态 | **按钮内联反馈**：复制成功后图标 morph 为 check 1.5s 后还原；下载按钮三态 idle→spinner→check；toast 降级为仅错误时出现 | `preview-image.tsx`、`gallery-image.tsx`、`lib/image-download.ts` |

### P1 — 提升流畅感与反馈质量

| # | 现状问题 | 优化方案 | 涉及模块 |
| --- | --- | --- | --- |
| 4 | 「加载更多」点击后无进行中状态，可能重复点击 | 内联 spinner + 文案切换「加载中…」，按钮禁用态保持；可选增强：IntersectionObserver 触底自动加载，手动按钮作降级保留 | `waterfall-gallery.tsx` |
| 5 | 桌面导航当前项指示器瞬间跳变 | framer-motion `layoutId` 让下划线在菜单项间滑动过渡（0.25s） | `unified-nav.tsx` |
| 6 | 登录失败 toast + shake 割裂 | 错误改为**表单内联提示**（`aria-live="polite"`），shake 幅度 3px→2px 保留；toast 仅用于网络级异常 | `user-from.tsx` |
| 7 | 图片卡片 hover 信息出现无节奏 | hover 300ms 延迟后才展示 EXIF 摘要浮层（避免扫过即闪），移动端直接常显摘要行 | 瀑布流/单列卡片组件 |
| 8 | 预览页返回按钮语义模糊 | Tooltip 显示目标位置（如「返回 城市漫步」）；Esc 键与返回按钮行为统一 | `preview-image.tsx` |

### P2 — 打磨项

| # | 现状问题 | 优化方案 |
| --- | --- | --- |
| 9 | 骨架屏形态不一（部分自写 `animate-pulse`） | 统一收口 `Skeleton` 组件；图片占位加 `shimmer` 微光扫过 |
| 10 | 触控按压反馈不统一（仅 Button 有 `active:scale`） | 所有可点击卡片统一 `active:scale-[0.98]`；图片导航箭头增加按压态 `active:scale-95` |

### 微交互通用参数（新增约定）

- 时长：微反馈 150ms / 常规过渡 250ms / 入场 600ms；缓动统一 `cubic-bezier(0.22, 1, 0.36, 1)`（easeOutQuint 系）
- 所有反馈动效必须被 `useReducedMotion` 与全局 `prefers-reduced-motion` 覆盖（沿用现有机制）

---

## 二、视觉设计提升

### 2.1 去"AI 风"装饰（最高优先）

现状规范中的以下元素属于典型 AI 生成风格，全部移除：

| 移除项 | 位置 | 替代方案 |
| --- | --- | --- |
| Hero 副标语**文字渐变**（`bg-clip-text text-transparent`） | `hero-section.tsx` | 纯白/纯前景色，细字重 |
| float / glow / nebula / blob **氛围光斑动画** | Hero 装饰层、globals.css keyframes | 直接删除；视觉纵深交给照片本身 |
| 暗色模式径向渐变光晕 + 噪点纹理 | `.dark` 背景与 `::before` | 可保留噪点（极克制、不算 AI 风），删除彩色光晕 |

### 2.2 排版层级精修

1. 大标题统一收紧字距：`text-4xl/5xl` 级别标题追加 `tracking-[-0.02em]`（大字号收紧 = 高级感的关键细节）；
2. 区块标题中的主色强调词（`text-primary` 橙色）取消——**黑白灰标题内不做色彩强调**，层级靠字重与字号；
3. 层级收敛为四档：Display（Hero）/ Title（区块）/ Body（正文）/ Caption（辅助），不再出现 14 级散乱组合；
4. EXIF 区去"表格感"：删除 `bg-muted/30` 背景块，改为**无底行 + 极细分隔线**（`border-b border-border/60`），字段名/值左右对齐——画册排版感。

### 2.3 阴影与边框语言（Linear 式）

- **边框优先，阴影极轻**：卡片常态仅 `1px border`；hover 才出现 `shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]`；
- 弃用现有 `shadow-sm/shadow-lg` 混用与 `.glass-card` 重玻璃拟态（仅登录页保留轻磨砂）；
- 分隔线统一降透明度：`border-border/60`。

### 2.4 图片展示细节

| 项 | 现状 | 调整 |
| --- | --- | --- |
| 卡片图 hover 缩放 | `scale-110` + 700ms | `scale-[1.03]` + 500ms easeOutQuint（克制、不糊） |
| 底部遮罩 | `from-black/60` | `from-black/45 via-transparent`（更通透） |
| 卡片上浮 | `whileHover y:-8` | `y:-4`（大卡片 8px 显"跳"） |

### 2.5 圆角收敛（两档制）

- 控件级（按钮/输入/EXIF 行）= 12px（`rounded-xl`）
- 容器级（卡片/面板/弹窗）= 16px（`rounded-2xl`）
- 胶囊（`rounded-full`）仅保留给 chip 与分段控制器，普通按钮**不再使用胶囊**（与"查看全部相册"等现状冲突，逐步替换）

### 2.6 主色降噪原则

界面静态面积中**不允许出现品牌色**（0%）；主色仅存在于：focus ring、选中态、active 指示器三类"状态语义"中。图片是唯一的色彩来源——这是摄影站高级感的根本。

---

## 三、配色方案重构（5 套）

> 全部基于中性色优先原则：底色/文字/边框构成 95% 的画面，彩色只做状态点缀。
> 每套均含浅色 + 暗色完整令牌，与现有 `style/globals.css` 令牌命名一一对应，替换即可全局生效。

### 方案 A — Porcelain 白瓷（Vercel 风）⭐ 推荐

最克制的画廊感：纯白底、纯黑主按钮、蓝色仅作链接/焦点。

| 令牌 | 浅色 | 暗色 |
| --- | --- | --- |
| background | `#FFFFFF` | `#0A0A0A` |
| card | `#FFFFFF` | `#141414` |
| foreground | `#0A0A0A` | `#FAFAFA` |
| muted | `#F5F5F5` | `#1C1C1C` |
| muted-foreground | `#737373` | `#A3A3A3` |
| border | `#E5E5E5` | `#262626` |
| primary | `#0A0A0A`（黑） | `#FAFAFA`（白） |
| primary-foreground | `#FFFFFF` | `#0A0A0A` |
| primary-hover | `#262626` | `#E5E5E5` |
| accent（链接/选中） | `#2563EB` | `#60A5FA` |
| accent-weak | `#EFF6FF` | `rgba(96,165,250,.12)` |
| destructive | `#DC2626` | `#F87171` |
| ring | `rgba(37,99,235,.35)` | `rgba(96,165,250,.40)` |

**应用规范**：主按钮黑底白字；accent 蓝仅用于超链接、focus ring、选中 chip 描边；标题强调不用色。

### 方案 B — Graphite 石墨（Linear 风）

略带灰度的底色拉开与卡片的层次，靛蓝点缀最有 SaaS 质感。

| 令牌 | 浅色 | 暗色 |
| --- | --- | --- |
| background | `#FAFAFA` | `#101012` |
| card | `#FFFFFF` | `#17171A` |
| foreground | `#18181B` | `#EDEDEF` |
| muted | `#F4F4F5` | `#1E1E22` |
| muted-foreground | `#52525B` | `#9D9DA8` |
| border | `#E4E4E7` | `#26262B` |
| primary | `#18181B` | `#EDEDEF` |
| primary-foreground | `#FFFFFF` | `#101012` |
| primary-hover | `#2D2D32` | `#D4D4DA` |
| accent | `#5E6AD2`（Linear Indigo） | `#7B87E8` |
| accent-weak | `#EEF0FB` | `rgba(123,135,232,.14)` |
| destructive | `#DC2626` | `#F87171` |
| ring | `rgba(94,106,210,.35)` | `rgba(123,135,232,.40)` |

**应用规范**：底/卡分离（#FAFAFA vs #FFFFFF）制造微妙层次；accent 用于导航 active 指示器与选中态。

### 方案 C — Azure 晴空（Stripe 风）

唯一一套"彩色主按钮"方案：靛蓝主色传递服务与信任感，适合强化下载/注册等转化路径。

| 令牌 | 浅色 | 暗色 |
| --- | --- | --- |
| background | `#FFFFFF` | `#0B1120` |
| card | `#FFFFFF` | `#131C31` |
| foreground | `#0F172A` | `#E2E8F0` |
| muted | `#F1F5F9` | `#1B2740` |
| muted-foreground | `#64748B` | `#94A3B8` |
| border | `#E2E8F0` | `#23304D` |
| primary | `#4F46E5`（Indigo-600） | `#6366F1` |
| primary-foreground | `#FFFFFF` | `#FFFFFF` |
| primary-hover | `#4338CA` | `#7C7FF2` |
| accent | `#0EA5E9`（Sky-500） | `#38BDF8` |
| accent-weak | `#F0F9FF` | `rgba(56,189,248,.12)` |
| destructive | `#DC2626` | `#F87171` |
| ring | `rgba(79,70,229,.30)` | `rgba(124,127,242,.40)` |

**应用规范**：primary 面积上限 5%（主按钮/选中态）；与冷调风光照片同框最协调；人像暖调照片为主时慎用。

### 方案 D — Mist 雾灰（美术馆风）

冷灰底 + 微暖青铜点缀，最接近实体画廊/画册的观感。

| 令牌 | 浅色 | 暗色 |
| --- | --- | --- |
| background | `#F7F7F8` | `#131315` |
| card | `#FFFFFF` | `#1B1B1E` |
| foreground | `#111113` | `#F4F4F5` |
| muted | `#EEEEF0` | `#222226` |
| muted-foreground | `#6E6E73` | `#9B9BA3` |
| border | `#E3E3E6` | `#2A2A2E` |
| primary | `#111113` | `#F4F4F5` |
| primary-foreground | `#FFFFFF` | `#131315` |
| primary-hover | `#2A2A2E` | `#DDDDE2` |
| accent | `#A8825C`（青铜，仅选中态） | `#C9A87E` |
| accent-weak | `#F6F1EA` | `rgba(201,168,126,.12)` |
| destructive | `#DC2626` | `#F87171` |
| ring | `rgba(168,130,92,.35)` | `rgba(201,168,126,.40)` |

**应用规范**：青铜 accent **只**允许出现在当前导航项指示线、选中筛选 chip、滚动进度三处，面积必须 <1%；其余一切中性。

### 方案 E — Onyx 玄黑（暗色优先）

纯单色系（zero hue）：以暗色为一等公民设计的沉浸看图方案，照片在近黑底上对比最强烈。

| 令牌 | 浅色 | 暗色 |
| --- | --- | --- |
| background | `#FFFFFF` | `#09090B` |
| card | `#FFFFFF` | `#101012` |
| foreground | `#111113` | `#F4F4F5` |
| muted | `#F6F6F7` | `#18181B` |
| muted-foreground | `#6B6B70` | `#A1A1AA` |
| border | `#E8E8EA` | `#1F1F23` |
| primary | `#111113` | `#F4F4F5` |
| primary-foreground | `#FFFFFF` | `#09090B` |
| primary-hover | `#2E2E33` | `#E4E4E7` |
| accent | `#71717A`（灰，选中态用边框+字重表达） | `#A1A1AA` |
| accent-weak | `rgba(113,113,122,.10)` | `rgba(161,161,170,.12)` |
| destructive | `#DC2626` | `#F87171` |
| ring | `rgba(17,17,19,.30)` | `rgba(244,244,245,.35)` |

**应用规范**：全站无彩色；选中态靠**边框加深 + 字重 500** 表达而非色相；适合作为默认暗色主题。

### 5 套方案选型对照

| 方案 | 一句话定位 | 主按钮 | 彩色用量 | 最适合 |
| --- | --- | --- | --- | --- |
| A Porcelain ⭐ | Vercel 式极简画廊 | 黑 | 仅蓝色状态点 | 默认方案，稳妥高级 |
| B Graphite | Linear 式 SaaS 质感 | 黑 | 靛蓝点缀 | 想要"产品感" |
| C Azure | Stripe 式服务信任 | 靛蓝 | 主色实心 | 强化转化路径 |
| D Mist | 美术馆画册感 | 黑 | 青铜 <1% | 追求独特艺术气质 |
| E Onyx | 纯单色沉浸 | 黑/白 | 零彩色 | 暗色优先的看图体验 |

---

## 四、迁移落地指南

1. **令牌替换**：5 套方案的令牌与 `style/globals.css` 现有命名一一对应（`--background/--card/--primary/--muted/…`），选定后整块替换 `:root` 与 `.dark` 即可全局生效；
2. **存量硬编码同步清理**：`components/ui/input.tsx`（`#e6e6e6`/`#4299e1`）、`select.tsx`（`#e5e5e5`/`#409eff`/`#ecf5ff`）需一并迁移到令牌，否则新配色下表单会"漏色"；
3. **Antd 组件对齐**：导航 Segmented 已绑定 CSS 变量无需处理；登录页 Antd `token.colorBgContainer/colorPrimary` 需在 `AntdConfigProvider` 中按新方案同步；
4. **渐变文字/氛围光删除清单**：`hero-section.tsx` 渐变副标语与 float/glow/nebula 装饰层、`globals.css` 对应 keyframes 及移动端降载规则；
5. **灰度验证**：切换后重点检查——图片卡片 hover 遮罩、EXIF 分隔线、筛选选中 chip、暗色模式边框可见性。

---

## 五、Demo 使用说明

文件：[design-demo.html](./design-demo.html)（零依赖，双击打开）

- 顶部工具条：**A–E 方案切换** + **明/暗模式开关**，所有组件实时联动；
- 展示组件：导航栏、区块标题、按钮全变体（含禁用态）、表单（输入/下拉/错误态）、相册卡片（hover 效果）、标签 chip 两形态、EXIF 信息区（新版去底样式）、分页胶囊、页脚；
- 对比时重点关注：暗色下边框可辨度、图片卡片遮罩通透度、彩色出现在画面中的"次数"是否足够克制。
