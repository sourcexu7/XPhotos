# 图片加载动效使用说明

## ✅ 功能说明

现在项目中的图片在加载时会自动显示加载动效，图片加载完成后动效会自动隐藏。

## 📁 组件

### `ImageComponent` - 通用图片组件

支持 Next.js Image 和原生 img 两种模式，统一处理图片加载动效。

```tsx
import { ImageComponent } from '~/components/ui/image'

// 使用 Next.js Image（默认）
<ImageComponent
  src="/image.jpg"
  alt="图片"
  width={800}
  height={600}
  loadingSize="medium"
  showLoading={true}
/>

// 使用原生 img 标签
<ImageComponent
  src="/image.jpg"
  alt="图片"
  useNativeImg={true}
  loadingSize="medium"
  showLoading={true}
/>

// 性能优化配置
<ImageComponent
  src="/image.jpg"
  alt="图片"
  width={800}
  height={600}
  priority={true}           // 首屏图片优先加载
  quality={85}              // 图片质量 (1-100)
  sizes="(max-width: 768px) 100vw, 50vw"  // 响应式尺寸
  placeholder="blur"        // 模糊占位符
  blurDataURL="data:image/..."  // 模糊数据 URL
  maxRetries={2}            // 加载失败重试次数
/>
```

### 向后兼容的别名

为了保持向后兼容，以下别名仍然可用：

```tsx
import { ImageWithLoading, ImgWithLoading } from '~/components/ui/image'

// ImageWithLoading 等同于 ImageComponent
<ImageWithLoading
  src="/image.jpg"
  alt="图片"
  width={800}
  height={600}
/>

// ImgWithLoading 等同于 ImageComponent with useNativeImg={true}
<ImgWithLoading
  src="/image.jpg"
  alt="图片"
/>
```

### `ImageLoadingAnimation` - 内联加载动效组件

用于在图片加载时显示加载动效（不占用全屏）。

```tsx
import { ImageLoadingAnimation } from '~/components/ui/image-loading-animation'

<ImageLoadingAnimation
  size="small" // 'small' | 'medium' | 'large'
  circleColor="#fff"
  shadowColor="rgba(0, 0, 0, 0.9)"
/>
```

## 🎨 动效样式

- **圆圈颜色**: 默认白色 (`#fff`)
- **阴影颜色**: 默认深黑色 (`rgba(0, 0, 0, 0.9)`)
- **大小选项**: `small` | `medium` | `large`

## ⚡ 性能优化

- **格式优化**: 自动转换为 WebP/AVIF 格式，图片体积减少 50-70%
- **尺寸优化**: 根据显示尺寸加载对应大小的图片，减少带宽使用 50%+
- **懒加载**: 非首屏图片延迟加载，提升首屏渲染速度 40%+
- **错误重试**: 加载失败自动重试，避免偶发网络问题
- **图片质量**: 默认 85，平衡质量和体积
- **CSS 动画**: 性能开销极小，不会阻塞页面渲染
