# 瀑布流布局 (Waterfall Layout)

## 概述

瀑布流布局是一种现代化的图片展示方式，参考了 Pinterest 和 Sam Alive 等摄影网站的设计理念。

## 特点

### 1. 流式布局
- 图片宽度固定，高度自适应原始比例
- 自动填充空白区域，避免界面留白
- 支持多种尺寸作品混合展示

### 2. 响应式设计
- 移动设备：2 列布局
- 平板设备：3 列布局  
- 桌面设备：4-5 列布局
- 最大宽度：1600px

### 3. 交互体验
- 图片悬停时显示半透明渐变遮罩
- 底部展示图片描述信息
- 点击图片跳转到详情页
- 支持 LivePhoto 标识

### 4. 极简导航
- 顶部悬浮导航栏
- 滚动时背景模糊效果
- 不干扰作品浏览

### 5. 性能优化
- 图片懒加载 (lazy loading)
- BlurHash 占位符
- 自动加载更多（滚动到底部前 800px 触发）
- SWR 数据缓存

## 启用方式

1. 进入后台管理页面：`/admin/settings/preferences`
2. 找到"首页主题选择"选项
3. 选择"瀑布流主题"（值为 2）
4. 点击提交保存

或直接在数据库中设置：
```sql
UPDATE configs 
SET config_value = '2' 
WHERE config_key = 'custom_index_style';
```

## 技术实现

### 组件结构
```
components/
├── gallery/waterfall/
│   └── waterfall-image.tsx          # 单个图片卡片组件
└── layout/theme/waterfall/
    ├── main/
    │   └── waterfall-gallery.tsx    # 主画廊布局
    └── nav/
        └── waterfall-nav.tsx        # 顶部导航栏
```

### CSS 多列布局
使用 CSS `columns` 属性实现瀑布流：
- 简单高效，无需复杂计算
- 浏览器原生支持
- 自动平衡列高度

### 核心代码
```tsx
<div className="
  columns-2 gap-4           // 移动端 2 列
  md:columns-3 md:gap-6     // 平板 3 列
  lg:columns-4 lg:gap-6     // 桌面 4 列
  xl:columns-5 xl:gap-6     // 大屏 5 列
">
  {images.map(image => <WaterfallImage key={image.id} photo={image} />)}
</div>
```

## 样式配置

### 图片卡片
- `break-inside-avoid`：防止图片被列分割
- `mb-4`：底部间距
- `hover:scale-[1.02]`：悬停微缩放效果
- `transition-all duration-300`：平滑过渡

### 导航栏
- `backdrop-blur-md`：背景模糊
- `bg-white/80`：半透明白色背景
- `shadow-sm`：轻微阴影
- 滚动距离 > 50px 时显示背景色

## 与其他主题对比

| 特性 | 默认主题 | 简单主题 | 瀑布流主题 |
|------|---------|---------|-----------|
| 布局方式 | Masonry 砌体 | 单列垂直 | CSS 多列 |
| 列数 | 2-4 列 | 1 列 | 2-5 列 |
| 导航栏 | 固定顶部 | 固定顶部 | 悬浮半透明 |
| 图片比例 | 保持原始 | 保持原始 | 保持原始 |
| 悬停效果 | 无 | 无 | 缩放+遮罩 |
| 适用场景 | 通用 | 博客风格 | 摄影作品集 |

## 自定义修改

### 修改列数
编辑 `waterfall-gallery.tsx`：
```tsx
className="
  columns-3        // 移动端改为 3 列
  lg:columns-6     // 大屏改为 6 列
"
```

### 修改间距
```tsx
gap-4      // 改为 gap-8 增加间距
gap-2      // 改为 gap-2 减少间距
```

### 修改最大宽度
```tsx
max-w-[1600px]  // 改为 max-w-[1920px] 或其他值
```

### 修改悬停效果
编辑 `waterfall-image.tsx`：
```tsx
hover:scale-[1.05]          // 增大缩放比例
hover:shadow-2xl           // 添加阴影
```

## 浏览器兼容性

- Chrome 50+
- Firefox 52+
- Safari 10+
- Edge 12+

CSS Columns 属性支持良好，无需担心兼容性问题。

## 性能建议

1. 图片建议尺寸：
   - 宽度：800-1200px
   - 格式：WebP / JPEG
   - 质量：80-85%

2. BlurHash：
   - 提升加载体验
   - 减少布局偏移

3. 自动加载：
   - 默认距底部 800px 触发
   - 可根据需要调整阈值

## 参考资源

- [Sam Alive Photography](https://www.samalive.co/cityscape)
- [Pinterest Layout](https://pinterest.com)
- [CSS Multi-column Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Columns)
