'use client'

import Image from 'next/image'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { Github, Instagram, Book, MessagesSquare } from 'lucide-react'

interface AboutConfig {
  config_key: string
  config_value: string
}

export default function AboutPage() {
  // Bug修复：前台实时同步后台修改，使用 SWR 获取最新配置
  const { data } = useSWR<AboutConfig[]>('/api/v1/settings/get-custom-info', fetcher)

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

  const socialLinks = [
    { key: 'ins', label: 'INS', href: insUrl, icon: <Instagram className="h-4 w-4" /> },
    { key: 'xhs', label: '小红书', href: xhsUrl, icon: <Book className="h-4 w-4" /> },
    { key: 'weibo', label: '微博', href: weiboUrl, icon: <MessagesSquare className="h-4 w-4" /> },
    { key: 'github', label: 'GitHub', href: githubUrl, icon: <Github className="h-4 w-4" /> },
  ].filter(item => !!item.href)

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] pt-[80px] pb-16">
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        {/* 布局：桌面端左右分栏，移动端上下结构 */}
        <div className="flex flex-col md:flex-row items-stretch gap-12 md:gap-16">
          {/* 左侧：文字介绍 + 社交链接 */}
          <section className="md:flex-1 flex flex-col justify-center space-y-6">
            <header>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-[0.16em] text-[#e0e0e0] mb-3">
                ABOUT ME
              </h1>
              <p className="text-sm md:text-base text-[#999999] leading-relaxed max-w-xl">
                {intro}
              </p>
            </header>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm text-[#b3b3b3] hover:text-white transition-colors"
                  >
                    <span className="mr-2 h-[1px] w-4 bg-[#b3b3b3]/60" />
                    {link.icon}
                    <span className="ml-1">{link.label}</span>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* 右侧：个人 9:16 照片（移动端置顶） */}
          <section className="md:flex-1 order-first md:order-last">
            <div className="relative max-w-[360px] mx-auto w-full aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-black/40">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="关于我"
                  fill
                  sizes="(max-width: 768px) 80vw, 360px"
                  className="object-cover"
                  priority={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#555555]">
                  尚未配置个人照片
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


