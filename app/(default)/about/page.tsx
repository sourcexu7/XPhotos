'use client'

import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { Github, Instagram, Book, MessagesSquare } from 'lucide-react'
import { FramerCarousel, CarouselItem } from '~/components/ui/framer-carousel'

interface AboutConfig {
  config_key: string
  config_value: string
}

export default function AboutPage() {
  // 使用公开 API 获取配置（无需登录）
  const { data } = useSWR<AboutConfig[]>('/api/v1/public/about-info', fetcher)

  const map = (data || []).reduce<Record<string, string>>((acc, cur) => {
    if (cur.config_key) acc[cur.config_key] = cur.config_value || ''
    return acc
  }, {})

  const intro = map['about_intro'] || '偏爱自然光人像与城市夜景，在每一次快门中寻找情绪与秩序的平衡。'
  const photoPreview = map['about_photo_preview_url'] || ''
  const insUrl = map['about_ins_url'] || ''
  const xhsUrl = map['about_xhs_url'] || ''
  const weiboUrl = map['about_weibo_url'] || ''
  const githubUrl = map['about_github_url'] || ''

  // 解析多图画廊数据（JSON 数组格式）
  let galleryImages: CarouselItem[] = []
  try {
    const galleryJson = map['about_gallery_images']
    if (galleryJson) {
      const parsed = JSON.parse(galleryJson)
      if (Array.isArray(parsed)) {
        galleryImages = parsed.map((url: string, idx: number) => ({
          id: `gallery-${idx}`,
          url,
        }))
      }
    }
  } catch {
    // JSON 解析失败，使用空数组
  }

  // 若没有多图数据，回退到单张个人照片
  if (galleryImages.length === 0 && photoPreview) {
    galleryImages = [{ id: 'single', url: photoPreview, title: '' }]
  }

  const socialLinks = [
    { key: 'ins', label: 'INS', href: insUrl, icon: <Instagram className="h-4 w-4" /> },
    { key: 'xhs', label: '小红书', href: xhsUrl, icon: <Book className="h-4 w-4" /> },
    { key: 'weibo', label: '微博', href: weiboUrl, icon: <MessagesSquare className="h-4 w-4" /> },
    { key: 'github', label: 'GitHub', href: githubUrl, icon: <Github className="h-4 w-4" /> },
  ].filter(item => !!item.href)

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 响应式布局：移动端上下结构，桌面端 1/3 + 2/3 */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20">
          
          {/* 左侧：个人简介 + 社交媒体链接 */}
          <section className="w-full lg:w-[30%] flex flex-col justify-center space-y-6 order-2 lg:order-1">
            {/* 标题区域 */}
            <header className="space-y-4">
              <div className="inline-block">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-[0.08em] text-white">
                  ABOUT ME
                </h1>
                <div className="mt-2 h-0.5 w-12 bg-gradient-to-r from-white/80 to-transparent" />
              </div>
              
              <p className="text-sm md:text-base lg:text-lg text-[#a0a0a0] leading-relaxed max-w-md">
                {intro}
              </p>
            </header>

            {/* 社交媒体链接 */}
            {socialLinks.length > 0 && (
              <nav className="space-y-3">
                <h2 className="text-xs uppercase tracking-[0.2em] text-[#666666] font-medium">
                  Follow Me
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-[#b3b3b3] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <span className="transform group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      <span className="font-medium">{link.label}</span>
                    </a>
                  ))}
                </div>
              </nav>
            )}

            {/* 装饰性分隔线 */}
            <div className="hidden lg:flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              <span className="text-[10px] text-[#555555] uppercase tracking-widest">Photography</span>
            </div>
          </section>

          {/* 右侧：多图轮播展示 */}
          <section className="w-full lg:w-[65%] order-1 lg:order-2 lg:pl-4">
            {galleryImages.length > 0 ? (
              <FramerCarousel
                items={galleryImages}
                autoPlay={galleryImages.length > 1}
                autoPlayInterval={6000}
                showNavButtons={true}
                showIndicators={true}
                aspectRatio="16/9"
              />
            ) : (
              <div 
                className="w-full flex items-center justify-center rounded-2xl border border-white/10 bg-black/40"
                style={{ aspectRatio: '16/9' }}
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#555555]">尚未配置个人照片</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
