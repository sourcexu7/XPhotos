# UI 组件重构计划：对齐 Ant Design 6

> **状态**：🚧 P0/P1 已完成并通过浏览器冒烟（2026-09-08）；P2/P3 待实施
>
> **依据**：[Ant Design 官方组件文档](https://ant.design/llms-full.txt)（75 组件）+ 项目实装核对（antd 6.6.2 / Radix / Tailwind 4）
>
> **目标**：收敛 `components/ui/` 手写组件中与 antd 重复的部分，统一前后台组件语言，清理死代码与冗余依赖

---

## 一、现状总览：双轨并存的 UI 体系

| 维度 | 后台（`/admin/**`） | 前台（`/`、`/albums`、`/guides`…） |
|---|---|---|
| 组件来源 | **antd 6.6.2**（78 个文件引用） | 手写 `components/ui/*`（shadcn 风格：Radix + Tailwind + cva） |
| 图标 | `@ant-design/icons`（63 文件） | `lucide-react`（16 文件） |
| Toast | antd `message`（19 文件） | `sonner`（3 文件） |
| 动画 | 少量 | ~~`framer-motion` + `motion/react` 双包并存~~ → 已统一 `motion/react`（36 文件 codemod，`framer-motion` 卸载） |

v1.2.1–v1.2.5 已将后台模块（module-base、filter-bar、ChipMultiSelect 等）统一到 antd，方向正确。遗留问题集中在 **`components/ui/` 的 20 个手写组件**。

---

## 二、逐组件评估与重构方案

### A 类：死代码 —— 直接删除（零风险，收益立得）

以下 **9 个组件全项目 0 引用**（精确扫描核实），为 shadcn 初始化遗留物：

| 文件 | antd 对应物 | 备注 |
|---|---|---|
| `components/ui/input.tsx` | `Input` | 后台已直接用 antd Input |
| `components/ui/select.tsx` | `Select` | Radix 组合式 API，与 antd 用法完全不同 |
| `components/ui/tag.tsx` | `Tag` / `Tag.CheckableTag` | ChipMultiSelect 已迁走 |
| `components/ui/sheet.tsx` | `Drawer` | 抽屉已在用 antd Drawer |
| `components/ui/tooltip.tsx` | `Tooltip`（7 文件在用 antd 版） | |
| `components/ui/separator.tsx` | `Divider`（2 文件在用 antd 版） | |
| `components/ui/label.tsx` | `Form` / `Typography.Text` | |
| `components/ui/skeleton.tsx` | `Skeleton`（已有 1 文件用 antd 版） | |
| `components/ui/image-loading-animation.tsx` | `Spin` | |

**连带依赖清理**（删除后无引用）：

- `@radix-ui/react-select`、`react-tooltip`、`react-separator`、`react-label`、`react-slot`（仅 button 的 asChild 用）
- 未用的 ~20 个 radix 包：accordion、menubar、navigation-menu、toggle-group、context-menu、hover-card、popover、alert-dialog、aspect-ratio、avatar、checkbox、collapsible、dropdown-menu、progress、radio-group、scroll-area、slider、switch、tabs、toggle、react-icons 等
- ⚠️ `@radix-ui/react-dialog` **需保留**——仍被 `dialog.tsx` → `command.tsx` 链条使用（见 B-3）

---

### B 类：高匹配可重构（有真实调用方）

#### B-1. EmptyState / ErrorState → antd `Empty` / `Result`（优先级 ★★★）

使用方仅 3 文件（`guides/page.tsx`、`guides/[id]/page.tsx`、`waterfall-gallery.tsx`），成本最低、一致性收益直接。

```tsx
// 现有 EmptyState 调用
<EmptyState icon={CameraIcon} title={t('empty.title')} description={...}
  actionLabel={...} onAction={...} />

// → antd 6 等价
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description={<Typography.Text type="secondary">{t('empty.title')}</Typography.Text>}
>
  {onAction && <Button onClick={onAction}>{actionLabel}</Button>}
</Empty>

// ErrorState → antd Result
<Result status="error" title={t('error.title')} subTitle={message}
  extra={onRetry && <Button onClick={onRetry}>{t('error.retry')}</Button>} />
```

- **样式迁移**：圆形图标底 → antd 自带插画（或 `image` 传自定义）；`bg-destructive/5` 错误容器 → `Result` 自带语义色
- **附带修复**：现 ErrorState 硬编码中文 `'出错了'` / `'重试'`（empty-state.tsx L59-L75），迁移时必须换成 i18n key
- **收益**：消灭约 80 行自维护组件 + 补齐 i18n + 插画风格与后台 Empty 统一

#### B-2. LoadingAnimation → antd `Spin`（优先级 ★★☆）

`loading-animation.tsx`（含 7KB CSS）只被 `app/providers/loading-animation-providers.tsx` 一处使用。

```tsx
// 全屏加载遮罩，antd 5.11+ 原生支持
<Spin fullscreen tip={t('loading')} />
```

- **迁移策略**：保留 `useLoadingAnimation` hook 接口不动（show/hide 是业务封装），内部渲染从自绘 CSS 动画换成 `Spin fullscreen`；`backgroundColor` prop → 外层 div 或 `style` 透传
- **实际结果（2026-09-08）**：全项目无业务方调用 show/hide，`useLoadingAnimation` hook 与 `loading-animation.tsx` 一并删除，仅保留 `LoadingAnimationProviders`（内部 `<Spin fullscreen />`）
- **风险**：视觉从"三个旋转圆点"变为 antd 指示器——纯装饰差异；若想保留圆点风格可给 `Spin` 传自定义 `indicator`
- **收益**：删除 7KB 专用 CSS，加载态语言与全站统一

#### B-3. Dialog → antd `Modal`（优先级 ★★☆，连带决策）

`dialog.tsx` 的唯一消费链是 `ui/command.tsx`（cmdk 命令面板）→ `layout/command.tsx`。

```tsx
// radix 组合式
<Dialog open><DialogContent className="max-w-md">
  <DialogTitle>…</DialogTitle>…
</DialogContent></Dialog>

// → antd 受控式
<Modal open centered footer={null} width={448} title={t('…')}
  onCancel={close} destroyOnHidden>
  …
</Modal>
```

- **关键决策**：cmdk 是命令面板专用实现（键盘导航、过滤、分组），antd 无对应物。为迁 Modal 而重写命令面板不值得。二选一：
  - **方案 1（推荐）**：保留 cmdk，连带保留 dialog.tsx（139 行、单一消费方），不动
  - **方案 2**：用 `Modal` + antd `Input` + 自维护列表重写命令面板，约 1 天工作量，键盘交互需自测

#### B-4. Button → antd `Button`（优先级 ★☆☆，收益大但视觉回归重）

`button.tsx`（7 个使用文件：hero、login、about、covers、command、empty-state、covers-back-button）。antd 6 已验证 API：`color`（default/primary/danger + 13 预设色）× `variant`（outlined/dashed/solid/filled/text/link）与现有 7 个 cva 变体几乎一一对应：

| 现有 variant | antd 6 写法 |
|---|---|
| `default`（主色实心） | `<Button color="primary" variant="solid">` |
| `minimal`（前台主按钮风格） | `variant="outlined"` + 主题 token 微调，无完全对应 |
| `destructive` | `color="danger" variant="solid"` |
| `outline` | `color="default" variant="outlined"` |
| `secondary` | `color="default" variant="filled"` |
| `ghost` | `variant="text"` |
| `link` | `color="primary" variant="link"` |
| `size` default(h40) / sm(h32) / icon(36) | `large` / `middle` + `icon` 槽位 |
| `asChild`（Radix Slot） | antd `Button href` 或外包 `Link` |

- **为何建议缓行**：`minimal` 变体（bg-card + aria-pressed 选中态 + active:scale 按压）是前台刻意设计的"白瓷"语言，antd 无对应；强行迁移需 ConfigProvider 组件级 token 覆盖，视觉回归 7 个页面
- **建议**：除非后续要做前后台视觉完全统一，否则保留 button.tsx（已用语义令牌、暗色自适配，维护成本低）

#### B-5. TagLink（优先级 ★☆☆，可不改）

`tag-link.tsx` 注释已明确**按 antd Tag 规格实现**（22px 高 / 12px 字号 / 4px 圆角），本质是"antd Tag 的可导航版"。antd `Tag` 虽支持 `onClick` 透传，但**不提供** `tabIndex` / `role="link"` / Enter·Space 键盘导航——这正是 TagLink 的核心价值。

- **结论：保留**，仅建议把 `color-mix` hover 写法换成 antd 同款 `colorFillContentHover` token 语义（可选微调）

---

### C 类：保留自定义（antd 无对应物）

| 组件 | 结论 |
|---|---|
| `border-beam.tsx` | antd 无边框流光组件，保留（beam/orbit 双模式已稳定） |
| `command.tsx` + `layout/command.tsx` | cmdk 命令面板，antd 无对应，保留 |
| `virtual-waterfall-gallery.tsx` | 虚拟化瀑布流，antd 无对应，保留 |
| `card-21.tsx`（DestinationCard） | 业务型封面卡片而非通用 Card，保留 |
| `framer-carousel.tsx` | 理论可换 antd `Carousel`（autoplay/dots/easing），但现有实现深度定制（reduced-motion、懒加载指示、宽高比控制），antd Carousel 基于 slick、样式定制反而繁琐。**建议保留**，除非要砍掉 framer-motion 依赖 |

---

## 三、体系级一致性问题（比单组件更重要）

1. **双动画库**（✅ 已统一到 `motion`，2026-09-08）：36 个文件已由 codemod 改写为 `motion/react`，`framer-motion` 已卸载。后续新代码一律使用 `motion/react`
2. **双 Toast**：`sonner`（前台 3 文件）vs antd `message`（后台 19 文件）。建议统一 `App.useApp().message`（项目已有 AntdApp 包裹层），sonner 可移除；若前台坚持 sonner 的暗色玻璃风格，则至少在 `lib/` 层封装统一入口，禁止组件直接 import sonner
3. **双图标库**：lucide（16）vs @ant-design/icons（63）。不必强行全换，规则应为：**同一视图内不混用**；与 antd 组件同行的操作图标优先 @ant-design/icons
4. **主题令牌双轨**：shadcn CSS 变量（`--background/--primary/--ring`…，由 `.dark` 类切换）与 antd `ConfigProvider theme.algorithm` 各自为政。**统一方案**：建单一令牌源（如 `lib/theme/tokens.ts` 导出 light/dark 两套色值），Tailwind CSS vars 与 antd theme token 都从这里生成；或启用 antd `theme={{ cssVar: true }}` 让 antd 消费同一批 CSS 变量。这是后续所有前台 antd 化的前提

---

## 四、重构收益汇总

| 收益 | 说明 |
|---|---|
| 维护性 | 删除 9 个死组件（约 900 行 TSX + 7KB CSS）与 ~20 个未用 Radix 依赖，`components/ui` 从 20 文件收敛到 8 个 |
| 一致性 | 空态/加载态/弹窗前后台同一语言；a11y（焦点管理、键盘、ARIA、reduced-motion）由 antd 兜底 |
| 开发效率 | 新功能直接用 antd 成熟能力（loading/disabled/locale/icon 槽），不再维护 cva 变体字符串 |
| 升级安全 | 消灭"模仿 antd 但手工复刻"的组件后，antd 升级只需跟官方 changelog——v1.2.3 `BorderBeam` 崩溃正是复刻陷阱的反面教材 |

---

## 五、兼容性风险与对策

| 风险 | 对策 |
|---|---|
| **前台 bundle 增大**：前台页面引入 antd 会拉入 antd 运行时 chunk | 后台已全量使用 antd，共享 chunk 实际已存在；仅首访纯前台用户有增量。对策：迁移集中在已有交互复杂度的页面 |
| **前台暗色切换**：antd 组件需随 `.dark` 切换 | 前台根 Provider 挂 `ConfigProvider`，依据 next-themes `resolvedTheme` 切 `theme.algorithm`（后台已有同类实现可复用） |
| **视觉回归**：Button/Empty 的前台"白瓷"风格与 antd 默认风格有差 | B-1/B-2 用 `Empty.PRESENTED_IMAGE_SIMPLE` + token 定制贴近；Button 建议缓行（见 B-4） |
| **静态方法告警**：`message.success()` 直调在 React 18 concurrent 下有告警 | 统一 `App.useApp()`（项目已大量正确使用，保持即可） |
| **antd 6 废弃 API**：`destroyOnClose`→`destroyOnHidden`、`Drawer width`→`styles.wrapper.width`、`Card bordered`→`variant="outlined"`、`Space direction`→`orientation` 等 | 新代码直接用新 API（项目 6 处已修，见 v1.2.1 记录） |

---

## 六、实施路线图

| 阶段 | 内容 | 影响面 | 验收 |
|---|---|---|---|
| **P0 清理**（✅ 已完成 2026-09-08） | 删 9 个死组件 + 移除 41 个无引用依赖（24 Radix + 17 杂项）+ 统一动画库到 `motion`（36 文件 codemod）+ 删除陈旧 package-lock.json | 仅删除与 import 改写 | `tsc` 通过 |
| **P1 空态/加载态**（✅ 已完成 2026-09-08） | EmptyState→Empty/Result（waterfall-gallery、guides×2）；LoadingAnimation→Spin fullscreen（loading-animation-providers.tsx）；删除 empty-state.tsx / loading-animation.tsx / .css 三个死文件。3 处 ErrorState 硬编码中文文案迁移时留中文（前台本地常量，无 i18n 上下文） | 3 消费方 + 全局 loading Provider | `tsc` 通过，浏览器冒烟通过（首页/相册/攻略列表/详情） |
| **P2 体系** | 令牌单一源；Toast/图标收敛规范成文 | 全局 | 暗色切换抽查前后台各 3 页 |
| **P3 评估项** | Dialog/Modal、Button、Carousel —— 按视觉统一需求再决策 | 7+ 文件 | 视觉走查 |

---

## 相关文档

- [设计系统](./design-system.md)
- [设计优化记录](./design-optimization.md)
- [后台 UI 文档](./admin.md)

---

*创建：2026-09-08 ｜ 基于 antd 6.6.2 实装核对*
