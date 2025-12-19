# 图片加载动效使用说明

## ✅ 功能说明

现在项目中的图片在加载时会自动显示加载动效，图片加载完成后动效会自动隐藏。

## 📁 新增组件

### 1. `ImageLoadingAnimation` - 内联加载动效组件

用于在图片加载时显示加载动效（不占用全屏）。

```tsx
import { ImageLoadingAnimation } from '~/components/ui/image-loading-animation'

<ImageLoadingAnimation
  visible={isLoading}
  size="small" // 'small' | 'medium' | 'large'
  circleColor="#fff"
  shadowColor="rgba(0, 0, 0, 0.9)"
/>
```

### 2. `ImageWithLoading` - Next.js Image 包装组件

带加载动效的 Next.js Image 组件。

```tsx
import { ImageWithLoading } from '~/components/ui/image-with-loading'

<ImageWithLoading
  src="/image.jpg"
  alt="图片"
  width={800}
  height={600}
  loadingSize="medium"
  showLoading={true}
/>
```

### 3. `ImgWithLoading` - 原生 img 标签包装组件

带加载动效的原生 img 标签组件。

```tsx
import { ImgWithLoading } from '~/components/ui/img-with-loading'

<ImgWithLoading
  src="/image.jpg"
  alt="图片"
  loadingSize="small"
  showLoading={true}
/>
```

## 🎯 已更新的组件

以下组件已自动集成图片加载动效：

1. **`components/ui/image-gallery.tsx`** - 图片画廊组件
   - 使用 `ImgWithLoading` 组件
   - 加载动效大小：`small`

2. **`components/gallery/waterfall/waterfall-image.tsx`** - 瀑布流图片组件
   - 使用 `ImageLoadingAnimation` 包装 `MotionImage`
   - 加载动效大小：`small`

## 💡 使用示例

### 示例 1: 在现有组件中添加加载动效

```tsx
'use client'

import { useState } from 'react'
import { ImageLoadingAnimation } from '~/components/ui/image-loading-animation'
import { MotionImage } from '~/components/album/motion-image'

export function MyImageComponent() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative">
      {isLoading && (
        <ImageLoadingAnimation
          visible={isLoading}
          size="small"
        />
      )}
      <MotionImage
        src="/image.jpg"
        alt="图片"
        width={800}
        height={600}
        className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}
```

### 示例 2: 使用 ImageWithLoading（推荐）

```tsx
import { ImageWithLoading } from '~/components/ui/image-with-loading'

export function MyImageComponent() {
  return (
    <ImageWithLoading
      src="/image.jpg"
      alt="图片"
      width={800}
      height={600}
      loadingSize="medium"
      showLoading={true}
    />
  )
}
```

### 示例 3: 使用 ImgWithLoading（原生 img）

```tsx
import { ImgWithLoading } from '~/components/ui/img-with-loading'

export function MyImageComponent() {
  return (
    <ImgWithLoading
      src="/image.jpg"
      alt="图片"
      loadingSize="small"
      className="w-full h-auto"
    />
  )
}
```

## 🎨 自定义配置

### 加载动效大小

- `small` - 小尺寸（适合缩略图）
- `medium` - 中等尺寸（适合常规图片）
- `large` - 大尺寸（适合大图）

### 自定义颜色

```tsx
<ImageLoadingAnimation
  circleColor="#ff6b6b"
  shadowColor="rgba(255, 107, 107, 0.6)"
/>
```

### 禁用加载动效

```tsx
<ImageWithLoading
  src="/image.jpg"
  showLoading={false} // 禁用加载动效
/>
```

## 📱 响应式适配

加载动效已内置响应式适配：
- 自动适配不同屏幕尺寸
- 手机端自动缩小显示
- 硬件加速优化，流畅动画

## 🔧 技术细节

1. **加载状态检测**：通过 `onLoad` 事件检测图片加载完成
2. **错误处理**：图片加载失败时显示错误提示
3. **性能优化**：使用 CSS 过渡动画，硬件加速
4. **兼容性**：兼容主流浏览器（Safari、Chrome、微信浏览器等）

## ⚠️ 注意事项

1. 如果图片已经缓存，可能看不到加载动效（这是正常的）
2. 加载动效会在图片加载完成后自动隐藏
3. 可以通过 `showLoading` 属性控制是否显示加载动效
4. 加载动效不会影响图片的正常显示和交互

## 🐛 故障排除

### 问题：加载动效不显示

**解决方案**：
- 检查 `showLoading` 是否为 `true`
- 检查图片是否已经加载完成（可能太快看不到）
- 检查浏览器控制台是否有错误

### 问题：加载动效一直显示

**解决方案**：
- 检查 `onLoad` 事件是否正确触发
- 检查图片 URL 是否有效
- 检查网络连接

## 📚 相关文档

- [加载动效完整文档](./LOADING_ANIMATION_README.md)
- [集成说明](./LOADING_INTEGRATION.md)

