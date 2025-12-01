# PicImpact UI 优化视觉对比

## 📸 截图说明指南

本文档指导如何获取优化前后的对比截图,以便验证优化效果。

---

## 🎯 需要截图的页面

### 1. 后台管理

#### 1.1 仪表盘 (Dashboard)
**路由**: `/admin`

**截图要点**:
- [ ] 整体布局(侧边栏 + 主内容区)
- [ ] Card 样式(统计卡片)
- [ ] Table 样式(相册统计)
- [ ] 响应式布局(折叠侧边栏状态)

**对比重点**:
- Token 间距是否统一(8px 网格)
- Card 圆角是否为 12px
- 阴影效果是否柔和
- 暗色模式是否完整支持

**截图尺寸建议**:
- 桌面端: 1920x1080
- 折叠状态: 1280x720

---

#### 1.2 图片列表
**路由**: `/admin/list`

**截图要点**:
- [ ] Table 分页器样式
- [ ] 操作按钮组
- [ ] 搜索/筛选区域
- [ ] 批量操作栏

**对比重点**:
- Table header 背景色
- 分页器间距
- 按钮 hover 效果
- 暗色模式表格对比度

---

#### 1.3 上传页面
**路由**: `/admin/upload`

**截图要点**:
- [ ] 拖拽上传区域
- [ ] 表单布局(左右分栏)
- [ ] EXIF 信息表单
- [ ] 标签选择器

**对比重点**:
- Form.Item 间距统一
- Card 布局规整
- Token 颜色使用
- 上传进度条样式

---

#### 1.4 设置页面
**路由**: `/admin/settings`

**截图要点**:
- [ ] 标签页样式
- [ ] 表单字段对齐
- [ ] 按钮组布局
- [ ] 保存反馈

**对比重点**:
- Tabs 样式
- Input/Select 统一性
- 表单验证提示
- 暗色模式输入框

---

### 2. 前台展示

#### 2.1 首页 - 瀑布流
**路由**: `/`

**截图要点**:
- [ ] 导航栏吸顶效果
- [ ] 图片卡片 hover 状态
- [ ] LivePhoto 标识
- [ ] 图片详情遮罩

**对比重点**:
- 导航栏毛玻璃效果
- Card hover 阴影
- 渐变遮罩平滑度
- 暗色模式导航栏

**截图尺寸建议**:
- 桌面端: 1920x1080 (滚动截取完整页面)
- 平板: 768x1024
- 手机: 375x812

---

#### 2.2 相册详情
**路由**: `/[album]`

**截图要点**:
- [ ] 相册标题样式
- [ ] 图片网格布局
- [ ] 分页器
- [ ] 加载状态

**对比重点**:
- Grid 间距统一
- 图片圆角
- 分页器位置
- Skeleton 骨架屏(如已实现)

---

#### 2.3 图片预览
**路由**: `/preview/[id]`

**截图要点**:
- [ ] EXIF 信息展示
- [ ] 操作按钮组(复制/下载)
- [ ] 标签展示
- [ ] 图片查看器

**对比重点**:
- EXIF 图标对齐
- Space 间距统一
- Tag 样式
- 暗色模式图片背景

---

## 🌓 暗色模式对比

### 关键截图点

每个页面需要获取:
1. **亮色模式截图**
2. **暗色模式截图**

### 暗色模式验证清单

- [ ] Menu 背景色: #1a1a1a
- [ ] Menu 选中项: #2d2d2d 背景 + #1890ff 文字
- [ ] Card 背景色: #1f1f1f
- [ ] Card 边框: #333
- [ ] Table 背景色: #1a1a1a
- [ ] Input 背景色: #262626
- [ ] Button 边框可见性
- [ ] 文本对比度 > 4.5:1

---

## 📱 响应式对比

### 断点测试

| 设备类型 | 屏幕宽度 | 截图要点 |
|---------|---------|---------|
| 手机竖屏 | 375px | 侧边栏是否隐藏,导航是否适配 |
| 手机横屏 | 667px | 图片网格列数调整 |
| 平板竖屏 | 768px | 侧边栏折叠/展开状态 |
| 平板横屏 | 1024px | 布局是否合理 |
| 笔记本 | 1366px | 标准桌面布局 |
| 桌面大屏 | 1920px | 最大宽度限制(1200px) |

---

## 🎨 细节对比

### 间距验证

使用浏览器开发者工具测量:

**应符合 8px 网格**:
- Card padding: 16px / 24px
- Form.Item margin: 16px
- Space gap: 8px / 12px / 16px
- Section margin: 16px / 24px

### 圆角验证

**标准圆角**:
- 小组件: 4px (`borderRadiusSM`)
- 默认: 8px (`borderRadius`)
- Card: 12px (`borderRadiusLG`)

### 阴影验证

**三级阴影**:
- 默认: `boxShadow` (轻微)
- 次级: `boxShadowSecondary` (中等)
- 三级: `boxShadowTertiary` (较深,Affix 等)

---

## 🔧 截图工具推荐

### 浏览器插件
- **Full Page Screen Capture**: 完整页面截图
- **Fireshot**: 支持编辑/注释
- **GoFullPage**: 滚动截图

### 设计工具
- **Figma**: 对比设计稿
- **Photoshop**: 像素级对比
- **XScope**: Mac 屏幕测量工具

### 响应式测试
- Chrome DevTools: Device Mode
- Firefox Responsive Design Mode
- BrowserStack: 多设备真机测试

---

## 📊 对比报告模板

### 单个组件对比

```markdown
## [组件名称] 优化对比

### 优化前
![优化前截图](./screenshots/before/component-name.png)

**问题**:
- ❌ 使用 Tailwind hardcoded 颜色
- ❌ 间距不统一(13px, 15px 等非标准值)
- ❌ 暗色模式支持不完整
- ❌ 阴影过重

### 优化后
![优化后截图](./screenshots/after/component-name.png)

**改进**:
- ✅ 使用 Token 系统(95%+ 覆盖)
- ✅ 间距符合 8px 网格
- ✅ 暗色模式完整支持
- ✅ 阴影柔和,符合 Material Design

### 代码对比

**优化前**:
```tsx
<div className="p-4 mb-3 rounded-lg shadow-md">
```

**优化后**:
```tsx
const { token } = theme.useToken()
<div style={{ 
  padding: token.padding, 
  marginBottom: token.marginSM,
  borderRadius: token.borderRadiusLG,
  boxShadow: token.boxShadow,
}}>
```

### 性能对比
- 首次渲染: 减少 15ms
- 主题切换: 无闪烁
- Bundle 大小: 减少 8KB (移除 Tailwind)
```

---

## 🎬 动效对比

### 需要录制的交互

1. **主题切换**
   - 亮色 → 暗色平滑过渡
   - 所有组件同步更新

2. **侧边栏折叠**
   - Logo 尺寸变化
   - 菜单文字淡入淡出
   - 宽度动画

3. **卡片 Hover**
   - 阴影渐变
   - 缩放效果(scale 1.02)
   - 遮罩透明度

4. **导航栏吸顶**
   - Affix 触发效果
   - 毛玻璃背景
   - 阴影出现

### 录制工具
- **LICEcap**: GIF 录制
- **ScreenToGif**: 编辑友好
- **Kap**: Mac 轻量级工具

---

## 📋 截图检查清单

### 上传前检查

- [ ] 分辨率足够(最低 1280px 宽)
- [ ] 无敏感信息(用户名/邮箱等)
- [ ] 窗口完整(无截断)
- [ ] 光标/高亮状态清晰
- [ ] 文件命名规范(`before-admin-dashboard.png`)

### 文件命名规范

```
screenshots/
├── before/
│   ├── admin-dashboard-light.png
│   ├── admin-dashboard-dark.png
│   ├── admin-list-light.png
│   ├── admin-upload-light.png
│   └── frontend-home-light.png
└── after/
    ├── admin-dashboard-light.png
    ├── admin-dashboard-dark.png
    ├── admin-list-light.png
    ├── admin-upload-light.png
    └── frontend-home-light.png
```

---

## 🚀 快速开始

### 1. 本地启动项目
```bash
pnpm install
pnpm dev
```

### 2. 清除浏览器缓存
- Chrome: Ctrl+Shift+Delete
- 选择"缓存的图片和文件"
- 时间范围:全部

### 3. 设置测试账号
```bash
# 创建测试用户
pnpm prisma studio
# 添加测试数据
```

### 4. 开始截图
1. 打开 Chrome DevTools (F12)
2. 切换到 Device Mode (Ctrl+Shift+M)
3. 选择设备/分辨率
4. 截取完整页面

### 5. 对比验证
1. 使用图片对比工具
2. 标注差异点
3. 填写优化报告

---

**文档更新**: 2025-01-26  
**作者**: GitHub Copilot
