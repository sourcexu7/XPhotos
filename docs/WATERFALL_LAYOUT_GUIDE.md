# 瀑布流布局使用指南

## 快速开始

### 1. 启用瀑布流布局

进入管理后台：
1. 访问 `/admin/settings/preferences`
2. 找到"首页主题选择"下拉菜单
3. 选择"瀑布流主题"
4. 点击"提交"按钮保存

### 2. 查看效果

刷新首页，您将看到：
- ✅ 顶部悬浮半透明导航栏
- ✅ 多列瀑布流图片布局
- ✅ 图片悬停时的渐变遮罩效果
- ✅ 滚动加载更多功能

## 特性展示

### 响应式布局
```
手机端（< 768px）：  2 列
平板端（768-1024px）：3 列  
桌面端（1024-1280px）：4 列
大屏端（> 1280px）：  5 列
```

### 交互体验
- **图片点击**：跳转到详情预览页
- **悬停效果**：
  - 图片轻微放大（scale 1.02）
  - 底部渐变遮罩显现
  - 展示图片描述信息
- **LivePhoto 标识**：左上角圆形图标

### 自动加载
- 滚动到距离底部 800px 时自动加载下一页
- 加载状态显示旋转图标
- 手动加载按钮作为备用

## 设计理念

参考了 [Sam Alive](https://www.samalive.co/cityscape) 等摄影网站的设计：

1. **极简主义**
   - 顶部导航仅在滚动时显示背景
   - 无侧边栏、无多余装饰
   - 图片本身是唯一焦点

2. **流式布局**
   - 支持不同尺寸和比例的图片
   - 自动填充空白区域
   - 类似 Pinterest 的视觉体验

3. **性能优化**
   - BlurHash 占位符加载
   - 图片懒加载（lazy loading）
   - SWR 数据缓存和预取

## 与其他主题切换

系统支持三种主题样式：

| 主题 | 配置值 | 特点 |
|------|--------|------|
| 默认主题 | 0 | Masonry 砌体布局，带侧边栏 |
| 简单主题 | 1 | 单列垂直布局，博客风格 |
| **瀑布流主题** | **2** | **多列流式布局，摄影作品集风格** |

您可以随时在设置中切换主题，无需重启服务。

## 自定义修改

### 修改列数和间距

编辑 `components/layout/theme/waterfall/main/waterfall-gallery.tsx`：

```tsx
// 当前配置
columns-2 gap-4           // 手机：2列，间距4
md:columns-3 md:gap-6     // 平板：3列，间距6  
lg:columns-4 lg:gap-6     // 桌面：4列，间距6
xl:columns-5 xl:gap-6     // 大屏：5列，间距6

// 示例：增加列数
columns-3 gap-3           // 手机改为3列
lg:columns-6 lg:gap-4     // 桌面改为6列
```

### 修改最大宽度

```tsx
// 当前：max-w-[1600px]
// 改为：max-w-[1920px]  // 更宽
// 改为：max-w-7xl       // 使用 Tailwind 预设值
```

### 修改悬停效果

编辑 `components/gallery/waterfall/waterfall-image.tsx`：

```tsx
// 当前：hover:scale-[1.02]
// 改为：
hover:scale-105           // 放大更明显
hover:shadow-xl          // 添加阴影
hover:brightness-110     // 增加亮度
```

### 修改遮罩样式

```tsx
// 当前：from-black/60
// 改为：
from-blue-900/70         // 蓝色遮罩
from-black/80            // 更深的遮罩
via-black/20             // 调整渐变中间点
```

### 修改自动加载阈值

编辑 `waterfall-gallery.tsx` 的 `handleScroll` 函数：

```tsx
// 当前：距底部 800px 触发
if (scrollTop + windowHeight >= documentHeight - 800) {
  
// 改为距底部 1200px 触发（提前加载）
if (scrollTop + windowHeight >= documentHeight - 1200) {
  
// 改为距底部 400px 触发（延迟加载）
if (scrollTop + windowHeight >= documentHeight - 400) {
```

### 修改导航栏

编辑 `components/layout/theme/waterfall/nav/waterfall-nav.tsx`：

```tsx
// 修改触发滚动距离（当前 50px）
setIsScrolled(window.scrollY > 100)  // 改为 100px

// 修改背景透明度
bg-white/80              // 改为 bg-white/90（更不透明）
backdrop-blur-md         // 改为 backdrop-blur-lg（更强模糊）

// 修改 Logo 文字
<Link href="/">GALLERY</Link>
// 改为你的网站名称
```

## 技术细节

### 为什么使用 CSS Columns？

相比其他瀑布流实现方案：

| 方案 | 优点 | 缺点 |
|------|------|------|
| CSS Columns | 简单、原生支持、性能好 | 顺序是竖向的 |
| Flexbox | 灵活 | 需要复杂计算 |
| Grid | 精确控制 | 需要预知高度 |
| JS 库（Masonry） | 功能强大 | 额外依赖、性能开销 |

我们选择 CSS Columns 因为：
- ✅ 无需 JavaScript 计算
- ✅ 浏览器原生优化
- ✅ 代码简单易维护
- ✅ 性能最佳

### 文件结构

```
components/
└── gallery/waterfall/
    └── waterfall-image.tsx           # 单张图片卡片
└── layout/theme/waterfall/
    ├── main/
    │   └── waterfall-gallery.tsx     # 主画廊容器
    ├── nav/
    │   └── waterfall-nav.tsx         # 顶部导航
    └── README.md                     # 技术文档

app/(default)/
└── page.tsx                          # 首页路由（已集成）

messages/
├── zh.json                           # 中文翻译
├── en.json                           # 英文翻译
├── zh-TW.json                        # 繁体中文
└── ja.json                           # 日文

prisma/
└── seed.ts                           # 数据库种子（已更新）
```

## 常见问题

### Q: 图片顺序不对？
A: CSS Columns 是竖向填充的，这是正常行为。如果需要横向顺序，可以考虑使用 Grid 布局（需要重写）。

### Q: 图片被切断了？
A: 确保图片容器有 `break-inside-avoid` 类，这已经在 `waterfall-image.tsx` 中设置。

### Q: 导航栏遮挡内容？
A: 首页已添加 `pt-16`（padding-top: 4rem）确保内容在导航栏下方。

### Q: 自动加载不工作？
A: 检查浏览器控制台是否有错误，确保 `useEffect` 中的滚动监听已正确设置。

### Q: 想要 3 种主题混合？
A: 可以为不同相册设置不同主题，需要修改路由逻辑来支持。

## 性能建议

### 图片优化
- **格式**：WebP > JPEG > PNG
- **宽度**：800-1200px（响应式）
- **质量**：80-85%
- **工具**：TinyPNG, Squoosh

### BlurHash 设置
在上传时自动生成，建议：
- 分辨率：4x3 或 6x4
- 生成速度快，体积小

### 服务器配置
- 启用 Gzip/Brotli 压缩
- 设置图片缓存策略
- CDN 加速（可选）

## 反馈与贡献

如果您有任何问题或建议：
1. 提交 Issue 到项目仓库
2. 分享您的自定义样式
3. 贡献代码改进

## 更新日志

### v1.0.0 (2025-11-24)
- ✅ 实现瀑布流布局
- ✅ 添加悬浮导航栏
- ✅ 支持响应式设计
- ✅ 图片悬停效果
- ✅ 自动加载更多
- ✅ 多语言支持

---

享受您的摄影作品集！ 📸
