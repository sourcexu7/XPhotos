# 加载动效集成说明

## ✅ 已完成集成

加载动效已成功集成到项目中，现在会在页面加载时自动显示，加载完成后自动隐藏。

## 📁 文件结构

```
components/ui/
  ├── loading-animation.tsx          # React 组件
  ├── loading-animation.css          # 样式文件
  ├── loading-animation-example.tsx  # 使用示例
  └── LOADING_ANIMATION_README.md    # 详细文档

app/providers/
  └── loading-animation-providers.tsx # Provider 组件
```

## 🎯 当前集成方式

### 全局自动加载（已启用）

在 `app/layout.tsx` 中已添加 `LoadingAnimationProviders`，会在所有页面自动显示加载动效：

```tsx
<LoadingAnimationProviders>
  {/* 页面内容 */}
</LoadingAnimationProviders>
```

**行为**：
- ✅ 页面加载时自动显示
- ✅ 页面加载完成后自动隐藏（延迟 300ms）
- ✅ 适配手机端屏幕
- ✅ 硬件加速优化

## 🔧 自定义使用

### 方式 1: 在特定页面使用（手动控制）

```tsx
'use client'

import { LoadingAnimation, useLoadingAnimation } from '~/components/ui/loading-animation'

export default function MyPage() {
  const { isLoading, show, hide } = useLoadingAnimation()

  const fetchData = async () => {
    show()
    try {
      await fetch('/api/data')
    } finally {
      hide()
    }
  }

  return (
    <>
      <LoadingAnimation visible={isLoading} />
      <button onClick={fetchData}>加载数据</button>
    </>
  )
}
```

### 方式 2: 自定义颜色

修改 `app/providers/loading-animation-providers.tsx`：

```tsx
<LoadingAnimation
  backgroundColor="rgba(0, 0, 0, 0.7)"
  circleColor="#ff6b6b"
  shadowColor="rgba(255, 107, 107, 0.6)"
/>
```

### 方式 3: 禁用全局自动加载

如果不想在全局显示，可以：

1. 从 `app/layout.tsx` 中移除 `LoadingAnimationProviders`
2. 在需要的页面单独使用 `<LoadingAnimation />`

## 📱 响应式适配

组件已内置响应式适配：
- **大屏设备**（> 768px）：原始尺寸
- **中等屏幕**（481px - 768px）：缩放至 90%
- **小屏手机**（≤ 480px）：缩放至 80%
- **超小屏**（≤ 360px）：缩放至 70%

## 🎨 样式自定义

### 通过 CSS 变量自定义

在 `style/globals.css` 中添加：

```css
:root {
  --loading-bg-color: rgba(0, 0, 0, 0.7);
  --loading-circle-color: #ff6b6b;
  --loading-shadow-color: rgba(255, 107, 107, 0.6);
}
```

### 通过 Props 自定义

```tsx
<LoadingAnimation
  backgroundColor="rgba(0, 0, 0, 0.7)"
  circleColor="#ff6b6b"
  shadowColor="rgba(255, 107, 107, 0.6)"
/>
```

## 📚 更多示例

查看 `components/ui/loading-animation-example.tsx` 获取更多使用示例。

## 📖 完整文档

查看 `components/ui/LOADING_ANIMATION_README.md` 获取完整的 API 文档和使用说明。

## 🔍 测试

1. 启动开发服务器：`npm run dev`
2. 打开浏览器，刷新页面
3. 应该能看到加载动效在页面加载时显示，加载完成后自动隐藏

## ⚠️ 注意事项

- 组件使用 `z-index: 9999`，确保在其他内容之上
- 遮罩层会阻止用户交互，加载完成后会自动移除
- 如果页面加载很快，可能看不到动效（这是正常的）

