# XPhotos 摄影网站 Figma 设计指南

> 本文档为 XPhotos 摄影网站的所有页面提供详细的 Figma 设计 prompt，包含页面用途、核心功能模块、交互要求、视觉风格偏好、响应式设计规范等。

---

## 🎨 整体设计规范

### 品牌色彩系统

#### 浅色模式
- **背景色**: `#FAF8F5` (柔和米白色)
- **前景色**: `#1A1A1A` (深灰黑)
- **主色 (暖橙色)**: `#D97706` (SamAlive标志性暖橙色)
- **次色 (青蓝色)**: `#0891B2` (SamAlive标志性青蓝色)
- **卡片背景**: `#FFFFFF`
- **边框色**: `#E7E5E4`
- **柔和色**: `#F5F0E8`
- **强调背景**: `#FEF3C7`

#### 深色模式
- **背景色**: `#050505` (深黑背景)
- **前景色**: `#F5F5F5` (浅灰白)
- **主色**: `#F59E0B` (亮暖橙色)
- **次色**: `#06B6D4` (亮青色)
- **卡片背景**: `#111111`
- **边框色**: `#262626`
- **柔和色**: `#1A1A1A`
- **强调背景**: `#292524`

### 字体系统
- **无衬线字体**: `Geist Sans` (主要用于正文、UI 等
- **衬线字体**: `Playfair Display` (用于标题、展示文字)
- **等宽字体**: `Fira Code`

### 圆角规范
- **小**: `0.5rem`
- **中**: `0.75rem`
- **大**: `1rem`
- **特大**: `1.25rem`
- **圆形**: `9999px`

### 动画规范
- 采用流畅的动画过渡效果，使用 Framer Motion
- 主要动画缓动: `easeOut`
- 持续时间: `0.3-1.2秒

---

## 📱 前台页面设计

---

### 1️⃣ 首页 (Hero)

#### 页面用途
- 作为摄影网站的门面，展示精选摄影作品，营造视觉冲击力

#### 核心功能模块
1. **全屏轮播背景 (自动轮播精选照片)
2. **导航标识 (顶部左侧 "Photography" 文字标识)
3. **轮播控制 (左右切换按钮)
4. **主标题区域 ("Every Moment Tells a Story")
5. **副标题 (中文描述)
6. **CTA 按钮 ("探索作品集")
7. **轮播指示器 (横向圆点指示器)
8. **滚动指示 (向下滚动提示)

#### 交互要求
- 背景图片自动轮播 (5秒切换一次)
- 左右箭头可手动切换
- 点击 CTA 按钮跳转至 /covers
- 支持键盘左右键切换轮播图
- 滚动指示器有上下浮动动画

#### 视觉风格偏好
- **背景全屏图片
- 渐变遮罩增强文字可读性
- 优雅的视觉层次
- SamAlive 标志性青橙色调

#### 响应式设计规范
- **移动端**: 标题字号更小
- **平板**: 适中字号
- **桌面**: 大标题字号
- 保持文字始终居中

#### Figma Prompt
```
Create a modern photography website homepage hero section with:

1. FULL-SCREEN IMAGE SLIDER
- Background: Full-screen photographic images with auto-playing carousel (5 seconds per slide)
- Gradient overlay: From black/80 (bottom) → black/30 (middle) → black/20 (top)
- Vignette effect: Radial gradient from transparent center to dark edges

2. TOP NAVIGATION
- Left: "Photography" text in light white/90, letter-spacing 0.2em, uppercase
- Right: Previous/Next arrow buttons (white/70 hover to white)

3. CENTER TITLE AREA
- Subtitle: "Visual Storytelling" (white/60, uppercase, letter-spacing 0.3em)
- Main title: "Every Moment" + "Tells a Story" (light font, gradient text from amber-400 → orange-400 → cyan-400)
- Chinese subtitle: "捕捉光影，定格永恒 — 用镜头记录生活的美好瞬间 (white/70, light weight)

4. BOTTOM SECTION
- Slide indicators: Horizontal dots, active dot has gradient amber-orange, longer width
- CTA Button: "探索作品集" with right arrow, glassy white/10 backdrop-blur border white/20, rounded-full
- Scroll indicator: "Scroll" text + animated chevron-down

COLOR SYSTEM: SamAlive photography style - warm amber-orange (#D97706 primary, cyan-blue (#0891B2) secondary
FONT: Geist Sans + Playfair Display
ANIMATIONS: Framer Motion style smooth transitions
RESPONSIVE: Mobile/Tablet/Desktop breakpoints

Create both light and dark mode variants
```

---

### 2️⃣ 相册封面页 (Covers)

#### 页面用途
- 展示所有相册封面，用户可点击进入具体相册

#### 核心功能模块
1. **返回按钮** (返回至 /albums)
2. **相册封面卡片网格
3. **相册名称展示**
4. **相册照片数量**
5. **加载状态**
6. **错误重试**

#### 交互要求
- 点击相册卡片进入相册主题页
- 支持无限加载/瀑布流/单列切换
- 响应式网格布局

#### 视觉风格偏好
- 卡片式布局
- 优雅的悬停效果
- 卡片阴影轻微缩放

#### 响应式设计规范
- 移动端: 1列
- 平板: 2-3列
- 桌面: 3-4列

#### Figma Prompt
```
Design an album covers gallery page:

1. TOP NAVIGATION
- Back button with left arrow + "返回作品合集"
- Clean minimal header

2. ALBUM COVER GRID
- Responsive grid layout (1 col mobile → 2-3 tablet → 3-4 desktop
- Album cards with:
  - Cover image with subtle hover effect (scale + shadow)
  - Album name overlay at bottom
  - Photo count indicator
  - Soft rounded corners
  - Subtle shadow

3. VISUAL STYLE
- SamAlive photography style
- Warm amber-orange (#D97706) primary color
- Clean, elegant, minimal aesthetic
- Card hover: gentle scale (1.02x)
- Smooth transitions (0.3s ease-out)

RESPONSIVE BREAKPOINTS:
- Mobile (<640px: 1 column
- Tablet (640-1024px: 2-3 columns
- Desktop (>1024px: 3-4 columns

Create both light and dark mode variants
```

---

### 3️⃣ 作品合集页 (Albums)

#### 页面用途
- 展示所有照片，支持筛选、排序、主题切换

#### 核心功能模块
1. **导航栏** (首页/封面/相册/关于我)
2. **筛选面板** (相机/镜头/标签)
3. **排序选择器** (拍摄时间/默认)
4. **主题切换** (瀑布流/单列)
5. **照片网格** (瀑布流/单列)
6. **照片卡片** (点击查看大图)
7. **加载状态** (骨架屏)

#### 交互要求
- 点击照片进入预览页
- 筛选相机/镜头/标签多选
- 标签支持 AND/OR 逻辑
- 排序: 从新到旧/从旧到新/默认
- 主题切换按钮悬浮在右下角

#### 视觉风格偏好
- 优雅的瀑布流布局
- 现代化筛选面板
- 浮动操作按钮
- 清晰的视觉层次

#### 响应式设计规范
- 移动端: 单列 + 筛选按钮在右上角
- 平板/桌面: 筛选面板固定在一侧

#### Figma Prompt
```
Design a photography gallery page with:

1. NAVIGATION
- Header with logo and navigation links
- Dark/light mode toggle

2. FILTER & SORT CONTROLS
- Floating action buttons at bottom right:
  - Sort button (arrow-up-down icon)
  - Filter button (funnel icon)
  - Theme toggle button (grid/rows icons)

3. FILTER PANEL
- Multi-select for cameras
- Multi-select for lenses
- Multi-select for tags with AND/OR toggle
- Apply/Reset buttons

4. PHOTO GALLERY
- Masonry waterfall layout (default)
- Single column layout option
- Photo cards with:
  - Subtle hover effects
  - Smooth transitions
  - Clean borders

5. VISUAL STYLE
- SamAlive warm amber-orange (#D97706) primary
- Cyan-blue (#0891B2) secondary
- Clean, elegant, photography-focused
- Subtle shadows, clean typography

RESPONSIVE BREAKPOINTS:
- Mobile: Single column, filter as drawer
- Tablet/Desktop: Filters panel, multi-column

Create both light and dark mode variants
```

---

### 4️⃣ 关于我页 (About)

#### 页面用途
- 展示摄影师介绍、社交链接、个人画廊

#### 核心功能模块
1. **导航栏
2. **个人介绍区域**
3. **社交链接按钮** (INS/小红书/微博/GitHub)
4. **个人照片画廊** (轮播或网格)
5. **加载状态**
6. **错误重试**

#### 交互要求
- 社交链接在新窗口打开
- 照片画廊可点击查看大图
- 响应式布局

#### 视觉风格偏好
- 优雅的个人展示
- 温馨的暖色调
- 简洁的布局

#### 响应式设计规范
- 移动端: 单列堆叠
- 平板/桌面: 多列布局

#### Figma Prompt
```
Design an "About Me" photographer page:

1. NAVIGATION
- Header with back button + navigation

2. HERO INTRO
- Photographer name/title
- Personal introduction text
- Warm, inviting copy

3. SOCIAL LINKS
- Social media buttons (Instagram, Xiaohongshu, Weibo, GitHub)
- Clean icon + text
- Hover effects

4. PHOTO GALLERY
- Photo carousel or grid
- Personal photos
- Clean presentation

5. VISUAL STYLE
- SamAlive warm amber-orange (#D97706) style
- Elegant serif typography (Playfair Display for headings
- Warm, inviting aesthetic
- Clean, minimal layout

RESPONSIVE BREAKPOINTS:
- Mobile: Stacked single column
- Tablet/Desktop: Multi-column grid

Create both light and dark mode variants
```

---

### 5️⃣ 图片预览页 (Preview)

#### 页面用途
- 展示单张照片的大图预览，提供下载、分享、全屏查看等功能

#### 核心功能模块
1. **关闭按钮** (X)
2. **大图展示**
3. **照片信息栏**
4. **复制图片直链按钮
5. **复制分享链接按钮
6. **下载按钮** (条件显示)
7. **全屏查看按钮**
8. **标签展示** (可点击跳转)
9. **EXIF 信息** (相机/镜头/光圈/快门/ISO)
10. **拍摄时间/地点

#### 交互要求
- 点击关闭返回
- 点击标签跳转至该标签筛选页
- 下载按钮触发下载
- 全屏查看启动灯箱
- 支持键盘 ESC 关闭
- 支持左右箭头切换相邻照片

#### 视觉风格偏好
- 沉浸式体验
- 深色背景突出照片
- 简洁的操作按钮
- 优雅的信息展示

#### 响应式设计规范
- 移动端: 单列布局
- 平板/桌面: 照片 + 信息侧边栏

#### Figma Prompt
```
Design a photo preview page:

1. FULLSCREEN PHOTO VIEW
- Large photo display
- Dark background (dark mode default or overlay)
- Subtle gradient for better reading

2. TOP ACTION BAR
- Close button (X icon, top left
- Action buttons (copy direct link, copy share link, download, expand to fullscreen)
- Icons with subtle backgrounds

3. PHOTO INFO
- EXIF information (camera, lens, aperture, shutter, ISO)
- Shooting date/time
- Location (if available)
- Tags (clickable, warm amber-orange tags)
- License information

4. VISUAL STYLE
- Immersive, photo-focused
- Dark background
- Clean, minimal UI
- SamAlive warm amber-orange (#D97706) accent
- Subtle buttons, elegant typography

RESPONSIVE BREAKPOINTS:
- Mobile: Stacked layout
- Tablet/Desktop: Photo + info sidebar

Create both light and dark mode variants
```

---

### 6️⃣ 主题相册页 (Theme Album)

#### 页面用途
- 展示特定相册的所有照片

#### 核心功能模块
1. **返回按钮** (返回至 /covers)
2. **相册标题**
3. **照片网格** (瀑布流/单列)
4. **主题切换** (悬浮按钮)
5. **照片卡片** (点击预览)

#### 交互要求
- 点击返回优先回退或跳转
- 支持主题切换
- 点击照片预览
- 预加载封面数据

#### 视觉风格偏好
- 与作品合集相同风格
- 主题切换悬浮按钮

#### 响应式设计规范
- 移动端: 单列
- 平板/桌面: 多列

#### Figma Prompt
```
Design a theme album gallery page:

1. TOP NAVIGATION
- Back button with left arrow
- Album title
- Clean header

2. ALBUM PHOTO GALLERY
- Responsive grid (same as albums page)
- Photo cards (same style as albums)
- Masonry waterfall or single column layout option

3. THEME TOGGLE
- Floating action button at bottom right
- Toggle between waterfall and single column

4. VISUAL STYLE
- Consistent with albums page
- SamAlive warm amber-orange (#D97706) primary
- Clean, elegant, photography-focused

RESPONSIVE BREAKPOINTS:
- Mobile: Single column
- Tablet/Desktop: Multi-column

Create both light and dark mode variants
```

---

## 🖥️ 后台管理页面设计

---

### 7️⃣ 后台仪表盘 (Dashboard)

#### 页面用途
- 展示统计数据概览，快速访问常用功能

#### 核心功能模块
1. **侧边导航**
2. **统计卡片** (照片总数/相册总数/标签总数/访问统计)
3. **图表区域** (照片按年/月统计)
4. **最近上传照片列表
5. **快捷操作**

#### 交互要求
- 侧边导航跳转
- 图表交互
- 快捷操作按钮

#### 视觉风格偏好
- 现代化 Admin UI
- 卡片式布局
- 清晰的数据可视化
- SamAlive 配色

#### 响应式设计规范
- 移动端: 侧边栏折叠
- 平板/桌面: 侧边栏展开

#### Figma Prompt
```
Design an admin dashboard page:

1. SIDEBAR NAVIGATION
- Logo/Brand at top
- Navigation menu (dashboard, upload, list, albums, analytics, settings)
- User profile at bottom

2. MAIN CONTENT
- Statistics cards grid (4 cards: total photos, total albums, total tags, visits)
- Charts (photos by year/month, visit trends)
- Recent uploads list
- Quick actions

3. VISUAL STYLE
- Modern admin UI
- Card-based layout
- SamAlive warm amber-orange (#D97706) + cyan-blue (#0891B2) colors
- Clean data visualization
- Elegant typography

RESPONSIVE BREAKPOINTS:
- Mobile: Collapsible sidebar
- Tablet/Desktop: Expanded sidebar

Create both light and dark mode variants
```

---

### 8️⃣ 上传页 (Upload)

#### 页面用途
- 上传单张/多张/LivePhoto照片

#### 核心功能模块
1. **侧边导航
2. **上传模式切换** (单张/LivePhoto/多张)
3. **存储选择** (S3/R2/COS/AList)
4. **相册选择**
5. **AList目录选择** (条件显示)
6. **文件拖拽/选择区域
7. **文件列表展示
8. **EXIF信息编辑**
9. **标签选择** (一级/二级)
10. **预设标签**
11. **提交按钮**

#### 交互要求
- 支持拖拽上传
- 自动上传
- 实时预览
- EXIF编辑
- 标签多选
- 批量操作

#### 视觉风格偏好
- 现代化表单
- 清晰的步骤引导
- 友好的反馈

#### 响应式设计规范
- 移动端: 单列
- 平板/桌面:

#### Figma Prompt
```
Design an admin photo upload page:

1. SIDEBAR NAVIGATION
- Same as dashboard

2. UPLOAD MODE TOGGLE
- Tabs: Single / LivePhoto / Multiple

3. STORAGE & ALBUM SELECTION
- Storage dropdown (S3, R2, COS, AList)
- Album dropdown (required)
- AList directory selector (if AList selected

4. FILE UPLOAD AREA
- Drag & drop zone
- File preview cards
- Delete button per file

5. EXIF EDITOR
- Camera brand/model
- Aperture/shutter/ISO
- Preset tags
- Custom tags input

6. SUBMIT ACTIONS
- Submit button (primary)
- Loading states
- Error states

7. VISUAL STYLE
- Modern form-based UI
- Clear step-by-step flow
- Friendly feedback
- SamAlive warm amber-orange (#D97706) + cyan-blue (#0891B2) accents

RESPONSIVE BREAKPOINTS:
- Mobile: Stacked form
- Tablet/Desktop: Multi-column form

Create both light and dark mode variants
```

---

### 9️⃣ 图片列表页 (List)

#### 页面用途
- 管理所有照片，支持筛选、排序、批量操作

#### 核心功能模块
1. **侧边导航**
2. **筛选栏** (相册/公开/精选/相机/镜头/快门/光圈/ISO/标签)
3. **查询/清空按钮**
4. **布局切换** (卡片/列表)
5. **照片列表/卡片**
6. **批量操作栏** (全选/刷新/删除)
7. **照片操作** (显示开关/精选/排序/绑定相册/设为封面/编辑/查看)
8. **分页**

#### 交互要求
- 筛选条件暂存，查询时生效
- 批量选择操作
- 单个照片的各种操作
- 布局切换

#### 视觉风格偏好
- 清晰的表格/卡片布局
- 高效的管理界面
- 明确的操作按钮

#### 响应式设计规范
- 移动端: 筛选抽屉
- 平板/桌面: 筛选面板

#### Figma Prompt
```
Design an admin photo list management page:

1. SIDEBAR NAVIGATION
- Same as dashboard

2. FILTER BAR
- Filters: Album, Public status, Featured, Camera, Lens, Shutter, Aperture, ISO, Tags
- Query/Reset buttons
- Layout toggle (card/list view)
- Mobile: Filter drawer
- Desktop: Filter panel

3. PHOTO GRID/LIST
- Photo cards with:
  - Checkbox for selection
  - View button (top right
  - Public toggle switch
  - Featured star
  - Sort badge
  - Action buttons (move up/down/top/bottom
  - Bind album button
  - Set as cover button
  - Edit button

4. BATCH ACTIONS
- Select all checkbox
- Refresh button
- Batch delete button

5. VISUAL STYLE
- Efficient admin UI
- Clear data presentation
- SamAlive warm amber-orange (#D97706) + cyan-blue (#0891B2) accents
- Clean, functional design

RESPONSIVE BREAKPOINTS:
- Mobile: Drawer filters
- Tablet/Desktop: Panel filters

Create both light and dark mode variants
```

---

### 🔟 相册管理页 (Albums)

#### 页面用途
- 管理相册，新增/编辑/删除/排序/显示开关/设为封面/管理排序

#### 核心功能模块
1. **侧边导航**
2. **新增相册按钮**
3. **刷新按钮**
4. **相册列表**
5. **相册操作** (编辑/删除/显示开关/排序/管理排序)
6. **新增/编辑侧边栏/弹窗**
7. **排序管理面板**

#### 交互要求
- 新增/编辑相册
- 删除相册确认
- 排序操作
- 管理相册内照片排序

#### 视觉风格偏好
- 清晰的相册卡片
- 明确的操作按钮
- 排序管理面板

#### 响应式设计规范
- 移动端: 单列
- 平板/桌面: 多列

#### Figma Prompt
```
Design an admin album management page:

1. SIDEBAR NAVIGATION
- Same as dashboard

2. TOP ACTIONS
- Add album button (+ icon + text
- Refresh button

3. ALBUM LIST/GRID
- Album cards with:
  - Cover image
  - Album name
  - Photo count
  - Action buttons (edit, delete, public toggle, sort, manage sort)

4. ADD/EDIT ALBUM SIDEBAR/DRAWER
- Form fields (name, album value, cover, theme, etc.)
- Save/Cancel buttons

5. ALBUM SORT MANAGEMENT PANEL
- Album photo list
- Drag to reorder
- Move up/down/top/bottom buttons
- Batch top/bottom
- Reset sort
- Save/Cancel

6. VISUAL STYLE
- Clean admin UI
- Clear album cards
- SamAlive warm amber-orange (#D97706) + cyan-blue (#0891B2) accents

RESPONSIVE BREAKPOINTS:
- Mobile: Single column
- Tablet/Desktop: Multi-column

Create both light and dark mode variants
```

---

### 1️⃣1️⃣ 统计页 (Analytics)

#### 页面用途
- 展示访问统计、照片统计等

#### 核心功能模块
1. **侧边导航**
2. **统计卡片**
3. **图表** (访问趋势/照片统计)
4. **数据表格**

#### 交互要求
- 图表交互
- 时间范围选择

#### 视觉风格偏好
- 数据可视化
- 清晰的图表
- SamAlive 配色

#### 响应式设计规范
- 移动端: 单列堆叠
- 平板/桌面: 多列图表

#### Figma Prompt
```
Design an admin analytics page:

1. SIDEBAR NAVIGATION
- Same as dashboard

2. STATISTICS CARDS
- Key metrics cards

3. CHARTS
- Visit trends line chart
- Photos by year/month bar chart
- Other data visualizations

4. DATA TABLES
- Detailed data tables

5. VISUAL STYLE
- Data-focused UI
- Clear charts
- SamAlive warm amber-orange (#D97706) + cyan-blue (#0891B2) chart colors
- Clean, readable typography

RESPONSIVE BREAKPOINTS:
- Mobile: Stacked charts
- Tablet/Desktop: Multi-column

Create both light and dark mode variants
```

---

### 1️⃣2️⃣ 设置页 (Settings)

#### 页面用途
- 管理系统设置、标签、存储、账号等

#### 核心功能模块
1. **侧边导航**
2. **设置菜单** (偏好/账号/验证器/密钥/标签/存储)
3. **偏好设置** (网站标题/作者/首页样式/下载开关/原图开关/预览压缩/关于我/社交链接/关于我画廊)
4. **标签管理** (新增/编辑/移动/删除一级/二级标签)
5. **存储设置** (S3/R2/COS/AList配置)
6. **账号设置** (头像/密码修改)
7. **验证器设置**
8. **密钥设置**

#### 交互要求
- Tab切换设置项
- 表单验证
- 保存/重置
- 标签管理操作

#### 视觉风格偏好
- 清晰的分组
- 表单控件
- SamAlive 配色

#### 响应式设计规范
- 移动端: 堆叠
- 平板/桌面: 侧边栏 + 内容区

#### Figma Prompt
```
Design an admin settings page with multiple sections:

1. SIDEBAR NAVIGATION
- Same as dashboard

2. SETTINGS TABS
- Tabs: Preferences, Account, Authenticator, Passkey, Tags, Storage

3. PREFERENCES SECTION
- Form fields:
  - Custom title
  - Custom author
  - Homepage style
  - Download enable toggle
  - Original image enable toggle
  - Preview quality/width limit
  - About me intro
  - Social links
  - About me gallery (add/remove/reorder photos)
- Save button

4. TAGS MANAGEMENT
- Two-level tag tree
- Add/Edit/Move/Delete tags
- Tag completeness check button

5. STORAGE SETTINGS
- Tabs: S3, R2, COS, AList
- Config forms for each
- Validate button (S3/COS)
- Save config

6. ACCOUNT SETTINGS
- Avatar upload
- Change password form

7. VISUAL STYLE
- Clean settings UI
- Clear grouping
- Form controls
- SamAlive warm amber-orange (#D97706) + cyan-blue (#0891B2) accents

RESPONSIVE BREAKPOINTS:
- Mobile: Stacked
- Tablet/Desktop: Sidebar + content

Create both light and dark mode variants
```

---

### 1️⃣3️⃣ 登录页 (Login)

#### 页面用途
- 用户登录/注册

#### 核心功能模块
1. **登录表单** (邮箱/密码)
2. **登录按钮**
3. **注册链接**
4. **密钥登录**
5. **验证器登录**

#### 交互要求
- 表单验证
- 错误提示
- 登录成功跳转

#### 视觉风格偏好
- 简洁的登录界面
- 优雅的设计
- SamAlive 配色

#### 响应式设计规范
- 移动端: 居中卡片
- 平板/桌面: 居中卡片

#### Figma Prompt
```
Design a login page:

1. LOGIN FORM
- Centered card layout
- Email input
- Password input
- Login button (primary warm amber-orange)

2. ALTERNATIVE LOGIN
- Passkey login button
- Authenticator login option

3. VISUAL STYLE
- Clean, elegant login UI
- SamAlive warm amber-orange (#D97706) primary
- Warm, inviting design
- Clean typography

RESPONSIVE BREAKPOINTS:
- Mobile/Tablet/Desktop: Centered card

Create both light and dark mode variants
```

---

## 📐 通用组件设计

### 导航栏 (Header)
- Logo
- 导航链接
- 深色/浅色模式切换
- 响应式布局

### 侧边栏 (Sidebar)
- Logo/Brand
- 导航菜单
- 用户信息
- 折叠/展开

### 卡片 (Card)
- 圆角
- 阴影
- 悬停效果
- SamAlive 配色

### 按钮 (Button)
- 主按钮 (暖橙色)
- 次按钮 (青蓝色)
- 幽灵按钮
- 图标按钮

### 表单控件
- 输入框
- 选择器
- 开关
- 标签
- 多选

---

## 🎯 设计原则总结

### 整体风格
- SamAlive 摄影风格
- 温暖琥珀橙 + 优雅青蓝配色
- 现代化 Next.js + Tailwind CSS
- Framer Motion 流畅动画
- 优雅的字体组合 (Geist + Playfair Display
- 响应式设计 (移动优先)

### 设计目标
- 突出摄影作品
- 优雅的用户体验
- 高效的后台管理
- 一致的视觉语言
- 完美的深色/浅色模式

### 技术栈参考
- Next.js 15
- React 19
- Tailwind CSS
- Ant Design
- Framer Motion
- shadcn/ui
