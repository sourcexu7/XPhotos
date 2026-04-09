# 前台夜间模式技术方案

## 项目现状分析

### 现有样式系统
- 项目已具备完整的 CSS 变量系统，包含白天和夜间模式的颜色定义
- 使用 Tailwind CSS 作为样式框架
- 已定义 `dark` 类的样式变量，支持夜间模式的基本样式

### 现有布局结构
- 前台包含多个主题：default, simple, waterfall, template
- 每个主题有独立的头部和主体组件
- 已实现主题选择功能，但缺少夜间模式切换功能

### 现有组件
- 已有的 `HeaderIconGroup` 组件可扩展添加夜间模式切换按钮
- 已有的 `ThemeSelector` 组件可参考其实现方式

## 技术方案

### 1. 夜间模式切换组件

#### 组件设计
- 创建 `DarkModeToggle` 组件，集成到 `HeaderIconGroup` 中
- 使用太阳/月亮图标表示模式切换
- 提供平滑的过渡动画

#### 实现细节
```tsx
// components/ui/dark-mode-toggle.tsx
'use client'

import { useState, useEffect } from 'react'
import { SunMoonIcon } from '~/components/icons/sun-moon.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip.tsx'
import { useTranslations } from 'next-intl'

export default function DarkModeToggle() {
  const t = useTranslations()
  const [isDark, setIsDark] = useState(false)

  // 初始化深色模式状态
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialMode = savedMode ? savedMode === 'true' : systemPrefersDark
    setIsDark(initialMode)
    if (initialMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // 切换深色模式
  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    
    // 更新 DOM 类
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // 保存到 localStorage
    localStorage.setItem('darkMode', newMode.toString())
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: newMode }))
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-muted/50 transition-colors duration-200"
          aria-label={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}
        >
          <SunMoonIcon 
            size={18} 
            className={`transition-transform duration-300 ${isDark ? 'rotate-180' : ''}`} 
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDark ? t('Theme.lightMode') : t('Theme.darkMode')}</p>
      </TooltipContent>
    </Tooltip>
  )
}
```

### 2. 集成到现有组件

#### 修改 HeaderIconGroup
```tsx
// components/layout/header-icon-group.tsx
import DarkModeToggle from '~/components/ui/dark-mode-toggle.tsx'

// 在返回的 JSX 中添加
<div className="flex items-center space-x-1">
  <Tooltip>
    <TooltipTrigger asChild>
      <div>
        <CompassIcon 
          onClick={() => setCommand(true)} 
          size={18}
          aria-label={t('Link.settings')}
        />
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>{t('Link.settings')}</p>
    </TooltipContent>
  </Tooltip>
  
  <DarkModeToggle />
</div>
```

### 3. 状态管理

#### 全局状态
- 使用 localStorage 持久化存储用户偏好
- 支持系统主题偏好检测
- 提供自定义事件通知其他组件

#### 响应式主题
- 监听系统主题变化
- 实时更新界面主题

```tsx
// 添加系统主题监听
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    const savedMode = localStorage.getItem('darkMode')
    if (!savedMode) {
      setIsDark(e.matches)
      if (e.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
  
  mediaQuery.addEventListener('change', handleChange)
  return () => mediaQuery.removeEventListener('change', handleChange)
}, [])
```

### 4. 样式优化

#### 主题变量检查
- 确保所有前台组件使用 CSS 变量而非硬编码颜色
- 检查并修复可能的样式冲突

#### 动画效果
- 添加平滑的主题切换过渡动画
- 优化图标和界面元素的过渡效果

```css
/* 添加到 globals.css */
@media (prefers-reduced-motion: no-preference) {
  html {
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  * {
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  }
}
```

### 5. 响应式设计

#### 移动端适配
- 确保夜间模式在移动设备上正常显示
- 优化触摸交互体验

#### 不同主题适配
- 确保夜间模式与所有前台主题（default, simple, waterfall, template）兼容
- 测试不同主题下的夜间模式效果

### 6. 性能优化

#### 加载优化
- 优先加载主题设置，避免页面闪烁
- 使用 `document.documentElement.classList` 实现即时主题切换

#### 渲染优化
- 避免不必要的重渲染
- 使用 React.memo 优化组件性能

### 7. 测试策略

#### 功能测试
- 测试夜间模式切换功能
- 测试 localStorage 持久化
- 测试系统主题同步

#### 兼容性测试
- 测试不同浏览器的兼容性
- 测试不同设备的显示效果
- 测试不同前台主题的兼容性

#### 性能测试
- 测试主题切换的响应速度
- 测试页面加载性能

## 实施步骤

### 1. 准备工作
- 检查现有 CSS 变量和样式
- 确认所有前台组件使用 CSS 变量

### 2. 组件实现
- 创建 `DarkModeToggle` 组件
- 集成到 `HeaderIconGroup`
- 添加必要的国际化支持

### 3. 样式优化
- 添加主题切换过渡动画
- 确保所有组件支持夜间模式

### 4. 测试与调试
- 测试功能完整性
- 测试兼容性
- 优化性能

### 5. 部署
- 更新相关文档
- 部署到生产环境

## 预期成果

1. **完整的夜间模式支持**：用户可以在前台界面切换夜间模式
2. **持久化存储**：用户偏好会被保存，下次访问时保持相同设置
3. **系统主题同步**：支持自动跟随系统主题设置
4. **平滑过渡**：主题切换时提供流畅的动画效果
5. **全主题兼容**：与所有前台主题无缝集成
6. **响应式设计**：在所有设备上正常显示

## 技术栈

- **React**：前端框架
- **Tailwind CSS**：样式系统
- **LocalStorage**：持久化存储
- **Media Queries**：系统主题检测
- **Custom Events**：组件间通信

## 风险评估

### 潜在风险
1. **样式冲突**：可能与现有组件样式产生冲突
2. **性能问题**：主题切换可能导致页面闪烁
3. **兼容性问题**：不同浏览器对 CSS 变量和媒体查询的支持不同

### 缓解措施
1. **全面测试**：在不同浏览器和设备上进行测试
2. **渐进增强**：确保在不支持的浏览器上优雅降级
3. **性能优化**：使用高效的主题切换实现
4. **代码审查**：确保所有组件正确使用 CSS 变量

## 结论

本技术方案提供了一个完整的前台夜间模式实现，通过利用现有的 CSS 变量系统和添加必要的组件，实现了一个用户友好、性能优化的夜间模式功能。该方案考虑了响应式设计、性能优化和兼容性问题，确保在各种设备和浏览器上都能提供良好的用户体验。