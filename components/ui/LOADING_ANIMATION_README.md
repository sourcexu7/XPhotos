# 加载动效组件使用说明

基于 Uiverse.io by mobinkakei 的加载动效代码优化，提供完整的 React 组件集成方案。

## 📋 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [使用示例](#使用示例)
- [样式自定义](#样式自定义)
- [兼容性说明](#兼容性说明)
- [集成步骤](#集成步骤)

## ✨ 功能特性

- ✅ **响应式设计**：自动适配不同尺寸手机（含全面屏、小屏机型）
- ✅ **居中显示**：动效整体居中显示，尺寸按屏幕比例自适应缩放
- ✅ **自动隐藏**：页面加载完成后自动隐藏动效
- ✅ **手动控制**：支持手动控制显示/隐藏
- ✅ **异步支持**：兼容异步数据加载场景（如接口请求时显示）
- ✅ **颜色自定义**：可自定义背景色、圆圈色、阴影色
- ✅ **遮罩层**：避免加载动效与页面内容重叠干扰
- ✅ **硬件加速**：开启硬件加速，保证动画流畅性
- ✅ **浏览器兼容**：兼容主流手机浏览器（微信浏览器、Safari、Chrome）

## 🚀 快速开始

### 1. 基础使用（自动显示/隐藏）

```tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function Page() {
  return (
    <>
      <LoadingAnimation />
      {/* 你的页面内容 */}
    </>
  );
}
```

### 2. 手动控制显示

```tsx
import { useState } from 'react';
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // 模拟异步操作
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      <LoadingAnimation visible={isLoading} />
      <button onClick={handleClick}>开始加载</button>
    </>
  );
}
```

### 3. 使用 Hook 控制（推荐）

```tsx
import { LoadingAnimation, useLoadingAnimation } from '@/components/ui/loading-animation';

export default function Page() {
  const { isLoading, show, hide } = useLoadingAnimation();

  const fetchData = async () => {
    show();
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      // 处理数据
    } finally {
      hide();
    }
  };

  return (
    <>
      <LoadingAnimation visible={isLoading} />
      <button onClick={fetchData}>获取数据</button>
    </>
  );
}
```

## 📚 API 文档

### LoadingAnimation 组件 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | `undefined` | 是否显示加载动效（受控模式） |
| `backgroundColor` | `string` | `'rgba(0, 0, 0, 0.5)'` | 背景色（遮罩层颜色） |
| `circleColor` | `string` | `'#fff'` | 圆圈颜色 |
| `shadowColor` | `string` | `'rgba(0, 0, 0, 0.9)'` | 阴影颜色 |
| `className` | `string` | `''` | 自定义类名 |
| `autoHide` | `boolean` | `true` | 是否自动在页面加载完成后隐藏 |
| `autoHideDelay` | `number` | `300` | 自动隐藏的延迟时间（毫秒） |

### useLoadingAnimation Hook

返回对象：

| 属性 | 类型 | 说明 |
|------|------|------|
| `isLoading` | `boolean` | 当前加载状态 |
| `show` | `() => void` | 显示加载动效 |
| `hide` | `() => void` | 隐藏加载动效 |
| `toggle` | `() => void` | 切换加载动效显示状态 |

## 💡 使用示例

### 示例 1：页面加载时显示

```tsx
// app/page.tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function HomePage() {
  return (
    <>
      <LoadingAnimation />
      <div>页面内容</div>
    </>
  );
}
```

### 示例 2：接口请求时显示

```tsx
'use client';

import { useState } from 'react';
import { LoadingAnimation, useLoadingAnimation } from '@/components/ui/loading-animation';

export default function DataPage() {
  const { isLoading, show, hide } = useLoadingAnimation();
  const [data, setData] = useState(null);

  const loadData = async () => {
    show();
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      hide();
    }
  };

  return (
    <>
      <LoadingAnimation visible={isLoading} />
      <button onClick={loadData}>加载数据</button>
      {data && <div>{JSON.stringify(data)}</div>}
    </>
  );
}
```

### 示例 3：自定义颜色

```tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function CustomPage() {
  return (
    <>
      <LoadingAnimation
        backgroundColor="rgba(255, 255, 255, 0.8)"
        circleColor="#007bff"
        shadowColor="rgba(0, 123, 255, 0.5)"
      />
      <div>页面内容</div>
    </>
  );
}
```

### 示例 4：禁用自动隐藏

```tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function ManualPage() {
  return (
    <>
      <LoadingAnimation autoHide={false} />
      <div>页面内容</div>
    </>
  );
}
```

### 示例 5：在 Next.js App Router 中使用

```tsx
// app/layout.tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoadingAnimation />
        {children}
      </body>
    </html>
  );
}
```

## 🎨 样式自定义

### 方式 1：通过 Props 自定义颜色

```tsx
<LoadingAnimation
  backgroundColor="rgba(0, 0, 0, 0.7)"
  circleColor="#ff6b6b"
  shadowColor="rgba(255, 107, 107, 0.6)"
/>
```

### 方式 2：通过 CSS 变量自定义

```css
/* 在你的全局 CSS 文件中 */
:root {
  --loading-bg-color: rgba(0, 0, 0, 0.7);
  --loading-circle-color: #ff6b6b;
  --loading-shadow-color: rgba(255, 107, 107, 0.6);
}
```

### 方式 3：通过 className 覆盖样式

```tsx
<LoadingAnimation className="my-custom-loading" />
```

```css
.my-custom-loading {
  background-color: rgba(255, 255, 255, 0.9);
}

.my-custom-loading .loading-circle {
  background-color: #007bff;
}
```

## 📱 响应式适配说明

组件已内置响应式适配逻辑：

- **大屏设备**（> 768px）：原始尺寸（scale: 1）
- **中等屏幕**（481px - 768px）：缩放至 90%（scale: 0.9）
- **小屏手机**（≤ 480px）：缩放至 80%（scale: 0.8）
- **超小屏**（≤ 360px）：缩放至 70%（scale: 0.7）

如需调整缩放比例，可修改 `loading-animation.css` 中的媒体查询。

## 🔧 兼容性说明

### 支持的浏览器

- ✅ Chrome（Android/iOS）
- ✅ Safari（iOS）
- ✅ 微信内置浏览器
- ✅ Firefox Mobile
- ✅ Edge Mobile

### 兼容性优化

1. **硬件加速**：使用 `transform: translateZ(0)` 和 `will-change` 属性
2. **WebKit 前缀**：添加 `-webkit-` 前缀以兼容 Safari
3. **动画降级**：支持 `prefers-reduced-motion` 媒体查询
4. **固定定位**：使用 `position: fixed` 确保全屏覆盖

## 📝 集成步骤

### 步骤 1：复制文件

确保以下文件已存在于项目中：

- `components/ui/loading-animation.tsx`
- `components/ui/loading-animation.css`

### 步骤 2：在布局中引入（可选）

如果需要在全局显示加载动效，可以在根布局中引入：

```tsx
// app/layout.tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoadingAnimation />
        {children}
      </body>
    </html>
  );
}
```

### 步骤 3：在需要的页面中使用

```tsx
import { LoadingAnimation } from '@/components/ui/loading-animation';

export default function MyPage() {
  return (
    <>
      <LoadingAnimation />
      {/* 你的内容 */}
    </>
  );
}
```

### 步骤 4：自定义样式（可选）

如需自定义颜色，可以通过 Props 或 CSS 变量进行修改。

## 🐛 常见问题

### Q: 动效在手机上显示过大或过小？

A: 组件已内置响应式适配，会根据屏幕尺寸自动缩放。如需调整，可修改 `loading-animation.css` 中的媒体查询。

### Q: 如何禁用自动隐藏？

A: 设置 `autoHide={false}` 属性。

### Q: 如何在异步请求中使用？

A: 使用 `useLoadingAnimation` Hook，在请求开始时调用 `show()`，请求结束时调用 `hide()`。

### Q: 动效在 Safari 上不流畅？

A: 组件已添加 WebKit 前缀和硬件加速优化，如仍有问题，请检查是否有其他 CSS 冲突。

### Q: 如何修改遮罩层透明度？

A: 通过 `backgroundColor` Prop 修改，例如：`backgroundColor="rgba(0, 0, 0, 0.3)"`。

## 📄 许可证

原始动效代码来自 [Uiverse.io by mobinkakei](https://uiverse.io)。

## 🔗 相关资源

- [Uiverse.io](https://uiverse.io)
- [CSS 动画性能优化](https://web.dev/animations/)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)

