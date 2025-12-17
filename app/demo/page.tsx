'use client'

import { FramerCarousel, CarouselItem } from '@/components/ui/framer-carousel'

// 测试用示例数据（使用 Unsplash 的高质量图片）
const demoPhotos: CarouselItem[] = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?w=1200&auto=format&fit=crop',
    title: 'Misty Mountain Majesty',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1539552678512-4005a33c64db?w=1200&auto=format&fit=crop',
    title: 'Winter Wonderland',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1709983966747-58c311fa6976?w=1200&auto=format&fit=crop',
    title: 'Autumn Mountain Retreat',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
    title: 'Alpine Sunrise',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop',
    title: 'Mountain Peak Vista',
  },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* 页面标题 */}
      <header className="pt-16 pb-8 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          FramerCarousel Demo
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          基于 Framer Motion 的响应式轮播组件，支持拖拽手势、自动播放、16:9 宽高比等特性
        </p>
      </header>

      {/* Demo 区域 1: 默认配置（16:9） */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">
          默认配置（16:9 宽高比，手动切换）
        </h2>
        <FramerCarousel items={demoPhotos} aspectRatio="16/9" />
      </section>

      {/* Demo 区域 2: 自动播放 */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">
          自动播放模式（3秒间隔）
        </h2>
        <FramerCarousel
          items={demoPhotos}
          autoPlay={true}
          autoPlayInterval={3000}
          aspectRatio="16/9"
        />
      </section>

      {/* Demo 区域 3: 简洁模式（无导航按钮） */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">
          简洁模式（仅指示器，无导航按钮）
        </h2>
        <FramerCarousel
          items={demoPhotos.slice(0, 3)}
          showNavButtons={false}
          showIndicators={true}
          aspectRatio="16/9"
        />
      </section>

      {/* Demo 区域 4: 单张图片 */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">
          单张图片展示
        </h2>
        <FramerCarousel items={[demoPhotos[0]]} aspectRatio="16/9" />
      </section>

      {/* Demo 区域 5: 不同宽高比 */}
      <section className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">
          自定义宽高比（4:3）
        </h2>
        <FramerCarousel
          items={demoPhotos.slice(0, 4)}
          aspectRatio="4/3"
        />
      </section>

      {/* 功能说明 */}
      <footer className="max-w-4xl mx-auto px-4 py-12 border-t border-white/10">
        <h3 className="text-lg font-semibold mb-4">组件特性</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            响应式设计，适配移动端/平板/桌面端
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            16:9 宽高比（可自定义）
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            拖拽手势支持（触摸屏友好）
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            流畅的 Spring 动画效果
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            可选自动播放功能
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            可自定义导航按钮和指示器
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            照片计数器显示当前位置
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            TypeScript 类型安全
          </li>
        </ul>
      </footer>
    </div>
  )
}
