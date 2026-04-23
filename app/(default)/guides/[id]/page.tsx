'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, ChevronDown, ImageIcon } from 'lucide-react'
import GuideGuideTOC, { moduleColors, moduleIcons } from '@/components/guides/guide-toc'

interface Content {
  id: string
  module_id: string
  type: string
  content: any
  sort: number
}

interface Module {
  id: string
  name: string
  template: string | null
  contents?: Content[]
  moduleData?: any
}

interface Album {
  id: string
  name: string
  album_value: string
  cover?: string
}

interface GuideAlbumsRelation {
  id: string
  guide_id: string
  album_id: string
  album: Album
}

interface Guide {
  id: string
  title: string
  country: string
  city: string
  days: number
  start_date?: string
  end_date?: string
  cover_image?: string
  content?: any
  show: number
  sort: number
  createdAt: string
  components?: any[]
  modules?: Module[]
  albums: GuideAlbumsRelation[]
}

const tipStyles: Record<string, string> = {
  warning: 'border-l-amber-400 bg-amber-50/80 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200',
  info: 'border-l-blue-400 bg-blue-50/80 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200',
  success: 'border-l-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200',
  weather: 'border-l-cyan-400 bg-cyan-50/80 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-200',
  emergency: 'border-l-pink-400 bg-pink-50/80 dark:bg-pink-900/20 text-pink-900 dark:text-pink-200',
  safety: 'border-l-red-400 bg-red-50/80 dark:bg-red-900/20 text-red-900 dark:text-red-200',
}

export default function GuideDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const moduleRefs = useRef<Record<string, HTMLElement | null>>({})
  const coverRef = useRef<HTMLDivElement>(null)

  const { scrollY } = useScroll()
  const coverY = useTransform(scrollY, [0, 500], [0, 150])
  const coverOpacity = useTransform(scrollY, [0, 400], [1, 0.3])

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetch(`/api/v1/public/guides/${id}`)
        .then(res => res.json())
        .then(result => {
          if (result.data) setGuide(result.data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleModuleClick = useCallback((moduleId: string) => {
    setActiveModuleId(moduleId)
    setShowMobileNav(false)
    const element = moduleRefs.current[moduleId]
    if (element) {
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }, [])

  useEffect(() => {
    if (!guide?.modules?.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveModuleId(entry.target.id.replace('module-', ''))
          }
        })
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0,
      }
    )

    guide.modules.forEach((module) => {
      const element = document.getElementById(`module-${module.id}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [guide?.modules])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">攻略不存在</p>
          <Link href="/guides" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">返回列表</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 lg:pb-0">
      {/* Immersive Cover */}
      <div ref={coverRef} className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden">
        <motion.div
          style={{ y: coverY, opacity: coverOpacity }}
          className="absolute inset-0"
        >
          {guide.cover_image ? (
            <Image
              src={guide.cover_image}
              alt={guide.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-slate-100 to-indigo-50/50 dark:from-indigo-900/20 dark:via-slate-900 dark:to-indigo-800/20" />
          )}
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/40 dark:via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Back Button */}
        <Link
          href="/guides"
          className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10 inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">返回列表</span>
        </Link>

        {/* Title Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 lg:p-16">
          <div className="max-w-4xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-3"
            >
              Travel Guide
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-4xl lg:text-6xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-4 leading-tight"
            >
              {guide.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400"
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="truncate">{guide.country} · {guide.city}</span>
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                {guide.days} 天
              </span>
              {guide.start_date && (
                <>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                  <time dateTime={guide.start_date} className="hidden sm:inline">
                    {new Date(guide.start_date).toLocaleDateString('zh-CN')}
                    {guide.end_date && ` — ${new Date(guide.end_date).toLocaleDateString('zh-CN')}`}
                  </time>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
          >
            <span className="text-xs">向下滚动</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="flex gap-8 justify-center">
          {/* TOC Sidebar */}
          {guide.modules && guide.modules.length > 0 && (
            <div className="hidden lg:block flex-shrink-0">
              <GuideGuideTOC
                modules={guide.modules}
                activeModuleId={activeModuleId}
                onModuleClick={handleModuleClick}
              />
            </div>
          )}

          <main className="flex-1 min-w-0 lg:max-w-[66.666667%]">
            {/* Related Albums */}
            {guide.albums?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8 sm:mb-14"
              >
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  关联相册
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {guide.albums.map((relation) => {
                    const albumUrl = relation.album.album_value.startsWith('/albums/')
                      ? relation.album.album_value.replace('/albums/', '/')
                      : relation.album.album_value

                    return (
                      <Link
                        key={relation.id}
                        href={albumUrl}
                        className="group block"
                      >
                        <div className="border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 rounded-xl overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl hover:shadow-lg hover:-translate-y-0.5">
                          <div className="aspect-[3/2] relative overflow-hidden">
                            {relation.album.cover ? (
                              <Image
                                src={relation.album.cover}
                                alt={relation.album.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                              <p className="text-sm sm:text-base font-semibold text-white truncate">{relation.album.name}</p>
                              <p className="text-xs text-white/70 mt-0.5">点击查看相册</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Modules */}
            {guide.modules && guide.modules.length > 0 ? (
              <div className="space-y-3 sm:space-y-8">
                {guide.modules.map((module) => renderModuleWithRef(module, moduleRefs))}
              </div>
            ) : guide.components && guide.components.length > 0 ? (
              <div className="space-y-3 sm:space-y-8">
                {guide.components.sort((a, b) => a.sort - b.sort).map((component: any) =>
                  component.type === 'image' ? (
                    <div key={component.id} className="mb-4 sm:mb-10">
                      {component.content?.images?.map((image: string, index: number) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <Image src={image} alt={`图片 ${index + 1}`} width={1200} height={800} className="w-full h-auto rounded-xl" />
                          {component.content?.caption && (
                            <p className="mt-1.5 sm:mt-3 text-xs text-slate-600 dark:text-slate-400 text-center">{component.content.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : component.type === 'text' ? (
                    <div key={component.id} className="mb-4 sm:mb-10 prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base" dangerouslySetInnerHTML={{ __html: component.content?.text || '' }} />
                  ) : null
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-20 border-t border-slate-200/50 dark:border-slate-700/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">暂无内容</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      {guide.modules && guide.modules.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100 active:scale-95 transition-transform"
              aria-label="打开目录导航"
            >
              <svg className={`w-5 h-5 transition-transform ${showMobileNav ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span>目录</span>
            </button>
            {activeModuleId && (
              <span className="text-xs text-slate-600 dark:text-slate-400 max-w-[50%] truncate">
                {guide.modules.find(m => m.id === activeModuleId)?.name}
              </span>
            )}
          </div>

          {showMobileNav && (
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 max-h-[60vh] overflow-y-auto overscroll-contain">
              <nav className="p-2 space-y-1">
                {guide.modules.map((module) => {
                  const colors = moduleColors[module.template || ''] || moduleColors.tips
                  const isActive = activeModuleId === module.id

                  return (
                    <button
                      key={module.id}
                      onClick={() => handleModuleClick(module.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] ${
                        isActive
                          ? `${colors.bg} ${colors.text} font-medium shadow-sm`
                          : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{moduleIcons[module.template || ''] || '📄'}</span>
                      <span className="text-sm truncate">{module.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      )}
                    </button>
                  )
                })}
              </nav>
              <div className="h-4" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function renderModuleWithRef(module: Module, moduleRefs: React.MutableRefObject<Record<string, HTMLElement | null>>) {
  const moduleData = module.moduleData || []
  const colors = moduleColors[module.template || ''] || moduleColors.tips
  const icon = moduleIcons[module.template || ''] || '📄'

  return (
    <motion.section
      key={module.id}
      id={`module-${module.id}`}
      ref={(el) => { moduleRefs.current[module.id] = el }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={`mb-3 sm:mb-8 last:mb-0 rounded-xl sm:rounded-2xl overflow-hidden border-l-4 ${colors.border} ${colors.bg} dark:bg-opacity-30 backdrop-blur-xl`}
    >
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
          <span className="text-lg sm:text-2xl">{icon}</span>
          <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{module.name}</h2>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-4 lg:p-6 border border-slate-200/30 dark:border-slate-700/30">
          {module.template === 'itinerary' && renderItinerary(moduleData)}
          {module.template === 'expense' && renderExpense(moduleData)}
          {module.template === 'checklist' && renderChecklist(moduleData)}
          {module.template === 'transport' && renderTransport(moduleData)}
          {module.template === 'photo' && renderPhoto(moduleData)}
          {module.template === 'tips' && renderTips(moduleData)}
          {!module.template && module.contents?.sort((a, b) => a.sort - b.sort).map(renderContent)}
        </div>
      </div>
    </motion.section>
  )
}

function renderContent(content: Content) {
  switch (content.type) {
    case 'text':
      return (
        <div key={content.id} className="mb-3 sm:mb-6 leading-relaxed text-xs sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {content.content?.text}
        </div>
      )
    case 'image':
      return content.content?.url ? (
        <figure key={content.id} className="mb-4 sm:mb-8">
          <Image src={content.content.url} alt={content.content.alt || ''} width={1200} height={800} className="w-full h-auto rounded-xl" />
          {content.content?.caption && (
            <figcaption className="mt-1.5 sm:mt-3 text-xs text-slate-600 dark:text-slate-400 text-center">{content.content.caption}</figcaption>
          )}
        </figure>
      ) : null
    case 'video':
      return content.content?.url ? (
        <div key={content.id} className="mb-3 sm:mb-6 p-2.5 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl">
          <div className="flex items-start gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5 sm:mb-1 truncate">{content.content.caption || '视频'}</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{content.content.platform} · {content.content.url}</p>
            </div>
          </div>
        </div>
      ) : null
    case 'link':
      return content.content?.url ? (
        <a key={content.id} href={content.content.url} target="_blank" rel="noopener noreferrer"
          className="group mb-3 sm:mb-6 flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors block rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm active:bg-slate-100 dark:active:bg-slate-700">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{content.content.title || '链接'}</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">{content.content.description}</p>
          </div>
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      ) : null
    case 'task':
      const tasks = content.content?.tasks || []
      const completed = tasks.filter((t: any) => t.completed).length
      return tasks.length > 0 ? (
        <div key={content.id} className="mb-3 sm:mb-6 p-2.5 sm:p-5 border-l-2 border-l-amber-400 bg-amber-50/60 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">任务清单</span>
            <span className="ml-auto text-xs font-semibold px-1.5 sm:px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">{completed}/{tasks.length}</span>
          </div>
          <ul className="space-y-1 sm:space-y-2">
            {tasks.map((task: any, idx: number) => (
              <li key={idx} className={`flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span className="truncate">{task.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null
    case 'warning':
      const warnStyles: Record<string, string> = {
        warning: 'border-l-amber-400 bg-amber-50/60 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200',
        danger: 'border-l-red-400 bg-red-50/60 dark:bg-red-900/20 text-red-900 dark:text-red-200',
        info: 'border-l-blue-400 bg-blue-50/60 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200',
        success: 'border-l-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200',
      }
      return content.content?.text ? (
        <div key={content.id} className={`mb-3 sm:mb-6 p-2.5 sm:p-5 border-l-2 rounded-xl backdrop-blur-sm ${warnStyles[content.content?.type] || warnStyles.warning}`}>
          {content.content?.title && <p className="text-xs sm:text-base font-bold mb-0.5 sm:mb-1">{content.content.title}</p>}
          <p className="text-xs sm:text-sm leading-relaxed">{content.content.text}</p>
        </div>
      ) : null
    case 'divider':
      return <hr key={content.id} className="my-4 sm:my-8 border-slate-200/50 dark:border-slate-700/50" />
    default:
      return null
  }
}

// ==================== Itinerary with Timeline ====================
function renderItinerary(data: any) {
  if (!data) return <EmptyState message="暂无行程安排" icon="🗓️" />

  const renderLinkCard = (link: { url: string; title?: string; platform?: string }) => {
    const getDomain = (url: string) => {
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        if (domain.includes('xiaohongshu')) return '小红书'
        if (domain.includes('mafengwo')) return '马蜂窝'
        if (domain.includes('ctrip')) return '携程'
        if (domain.includes('dianping')) return '大众点评'
        if (domain.includes('bilibili')) return 'B站'
        return domain
      } catch {
        return '链接'
      }
    }

    return (
      <a
        key={link.url}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:py-1.5 bg-slate-100/80 dark:bg-slate-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md sm:rounded-lg text-xs text-slate-600 dark:text-slate-400 transition-colors group active:scale-95 backdrop-blur-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700"
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        <span className="truncate max-w-[80px] sm:max-w-[200px]">{link.title || getDomain(link.url)}</span>
        <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 text-xs">↗</span>
      </a>
    )
  }

  // ==========================================
  // 统一设计规范组件
  // ==========================================

  // Day Badge Component - 日期徽章
  const DayBadge = ({ dayIndex }: { dayIndex: number }) => (
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-2xl blur-md" />
      <div className="relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-200/50 dark:border-indigo-700/30">
        <span className="text-[10px] sm:text-xs font-medium text-indigo-400 dark:text-indigo-400 uppercase tracking-wider">Day</span>
        <span className="text-lg sm:text-xl font-bold leading-none">{dayIndex + 1}</span>
      </div>
    </div>
  )

  // Icon Container - 图标容器
  const IconContainer = ({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo' | 'slate' | 'amber' }) => {
    const colorMap = {
      indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
      slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400',
      amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    }
    return (
      <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${colorMap[color]}`}>
        {children}
      </div>
    )
  }

  // Tag Component - 标签
  const Tag = ({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo' | 'emerald' | 'amber' | 'slate' }) => {
    const colorMap = {
      indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium ${colorMap[color]}`}>
        {children}
      </span>
    )
  }

  // Content Card - 内容卡片
  const ContentCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 sm:p-5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all ${className}`}>
      {children}
    </div>
  )

  // Timeline Dot - 时间轴节点
  const TimelineDot = () => (
    <div className="absolute -left-[25px] sm:-left-[29px] top-3 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-400 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-900/30" />
  )

  // Timeline Line - 时间轴线
  const TimelineLine = () => (
    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
  )

  // Tip Box - 提示框
  const TipBox = ({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' }) => {
    const typeMap = {
      info: 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
      warning: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300',
    }
    return (
      <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${typeMap[type]}`}>
        <span className="flex-shrink-0 text-sm">{type === 'warning' ? '💡' : 'ℹ️'}</span>
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
    )
  }

  // Day Header Component - 日期标题
  const DayHeader = ({ dayIndex, title, date }: { dayIndex: number; title?: string; date?: string }) => (
    <div className="flex items-start gap-4 mb-5 sm:mb-6">
      <DayBadge dayIndex={dayIndex} />
      <div className="flex-1 min-w-0 pt-1">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
          {title || `第 ${dayIndex + 1} 天`}
        </h3>
        {date && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="truncate">{date}</span>
          </p>
        )}
      </div>
    </div>
  )

  // Activity Time - 活动时间
  const ActivityTime = ({ time }: { time: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <IconContainer color="indigo">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </IconContainer>
      <span className="text-xs sm:text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">{time}</span>
    </div>
  )

  // Location Info - 位置信息
  const LocationInfo = ({ location }: { location: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <IconContainer color="slate">
        <MapPin className="w-3.5 h-3.5" />
      </IconContainer>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{location}</span>
    </div>
  )

  // Highlights - 亮点标签组
  const Highlights = ({ items }: { items: string[] }) => (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {items.map((h, i) => (
        <Tag key={i} color="indigo">{h}</Tag>
      ))}
    </div>
  )

  // ==========================================
  // 主渲染逻辑
  // ==========================================

  if (data.days) {
    return (
      <div className="space-y-8 sm:space-y-12">
        {data.days.map((day: any, dayIndex: number) => (
          <div key={dayIndex}>
            <DayHeader dayIndex={dayIndex} title={day.title} date={day.date} />
            <div className="relative pl-7 sm:pl-8 ml-7 sm:ml-8">
              <TimelineLine />
              <div className="space-y-4 sm:space-y-5">
                {day.activities.map((activity: any, idx: number) => (
                  <div key={idx} className="relative">
                    <TimelineDot />
                    <ContentCard>
                      <ActivityTime time={activity.time} />
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activity.content}</p>
                      {activity.links?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                          {activity.links.map(renderLinkCard)}
                        </div>
                      )}
                    </ContentCard>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <EmptyState message="暂无行程安排" icon="🗓️" />

    const groupedByDay: Record<string, any[]> = {}
    data.forEach((item: any, index: number) => {
      const dayKey = item.date || item.day || `day_${index + 1}`
      if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
      groupedByDay[dayKey].push(item)
    })

    return (
      <div className="space-y-8 sm:space-y-12">
        {Object.keys(groupedByDay).map((dayKey, dayIndex) => {
          const dayItems = groupedByDay[dayKey]
          const firstItem = dayItems[0]
          const dayTitle = firstItem.title || `第 ${dayIndex + 1} 天`
          const dayDate = firstItem.date || (typeof firstItem.day === 'number' ? undefined : firstItem.day) || firstItem.title

          return (
            <div key={dayKey}>
              <DayHeader dayIndex={dayIndex} title={dayTitle} date={dayDate} />
              <div className="relative pl-7 sm:pl-8 ml-7 sm:ml-8">
                <TimelineLine />
                <div className="space-y-4 sm:space-y-5">
                  {dayItems.map((item: any) => (
                    <div key={item.id} className="relative">
                      <TimelineDot />
                      <ContentCard>
                        {item.location && <LocationInfo location={item.location} />}
                        {item.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{item.description}</p>
                        )}
                        {item.highlights?.length > 0 && <Highlights items={item.highlights} />}
                        {item.tips && (
                          <div className="mt-3">
                            <TipBox type="warning">{item.tips}</TipBox>
                          </div>
                        )}
                      </ContentCard>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return <EmptyState message="暂无行程安排" icon="🗓️" />
}

// ==================== Expense with Visualization ====================
function renderExpense(data: any) {
  if (!data) return <EmptyState message="暂无费用明细" icon="💸" />

  if (data.total !== undefined && data.items) {
    const total = data.total
    const currency = data.currency || 'CNY'

    return (
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-200/50 dark:border-indigo-800/30 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">总费用</p>
            <p className="text-xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{currency === 'CNY' ? '¥' : ''}{total.toLocaleString()}</p>
          </div>
          <div className="p-3 sm:p-5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">费用项</p>
            <p className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{data.items.length} <span className="text-sm font-normal text-slate-500">项</span></p>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-4 sm:space-y-6">
          {data.items.map((category: any) => (
            <div key={category.category}>
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">{category.category}</h4>
              <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {category.subitems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 sm:py-3 first:pt-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate">{item.name || '未命名'}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 ml-2 sm:ml-4 flex-shrink-0">{currency === 'CNY' ? '¥' : ''}{item.price || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <EmptyState message="暂无费用明细" icon="💸" />
    const total = data.reduce((sum: number, item: any) => sum + (Number(item.subtotal) || 0), 0)
    
    // 统一使用 indigo 色系
    const categories: Record<string, { label: string; icon: string }> = {
      transport: { label: '交通', icon: '✈️' },
      accommodation: { label: '住宿', icon: '🏨' },
      food: { label: '餐饮', icon: '🍜' },
      ticket: { label: '门票', icon: '🎫' },
      equipment: { label: '设备', icon: '📷' },
      shopping: { label: '购物', icon: '🛍️' },
      other: { label: '其他', icon: '📦' },
    }

    const groupedByCategory: Record<string, any[]> = {}
    data.forEach((item: any) => {
      const cat = item.category || 'other'
      if (!groupedByCategory[cat]) groupedByCategory[cat] = []
      groupedByCategory[cat].push(item)
    })

    // 统计卡片组件
    const StatCard = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
      <div className={`p-4 sm:p-5 rounded-xl backdrop-blur-sm ${highlight ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-200/50 dark:border-indigo-800/30' : 'bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50'}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
      </div>
    )

    // 费用分类卡片
    const ExpenseCategoryCard = ({ cat, items }: { cat: string; items: any[] }) => {
      const catInfo = categories[cat] || categories.other
      const catTotal = items.reduce((sum: number, item: any) => sum + (Number(item.subtotal) || 0), 0)
      const percentage = total > 0 ? Math.round((catTotal / total) * 100) : 0

      return (
        <div className="p-4 sm:p-5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{catInfo.icon}</span>
              <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">{catInfo.label}</h4>
            </div>
            <div className="text-right">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">¥{catTotal.toFixed(0)}</span>
              <span className="text-xs text-slate-500 ml-1">({percentage}%)</span>
            </div>
          </div>
          
          {/* 进度条 */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
          
          {/* 费用项列表 - 移动端 */}
          <div className="space-y-2 sm:hidden">
            {items.map((item: any) => (
              <div key={item.id} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1 min-w-0 truncate">{item.name || '-'}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">¥{item.subtotal || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {item.type && <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">{item.type}</span>}
                  {item.channel && <span className="truncate flex-1 min-w-0">{item.channel}</span>}
                </div>
              </div>
            ))}
          </div>
          
          {/* 费用项列表 - 桌面端表格 */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                  <th className="text-left py-3 font-medium text-slate-600 dark:text-slate-400">事项</th>
                  <th className="text-left py-3 font-medium text-slate-600 dark:text-slate-400">详情</th>
                  <th className="text-left py-3 font-medium text-slate-600 dark:text-slate-400">类型</th>
                  <th className="text-right py-3 font-medium text-slate-600 dark:text-slate-400">金额</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-200/30 dark:border-slate-700/30">
                    <td className="py-3 text-slate-900 dark:text-slate-100">{item.name || '-'}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{item.detail || '-'}</td>
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                        {item.type || '-'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-slate-100">¥{item.subtotal || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return (
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="col-span-2">
            <StatCard label="总费用" value={`¥${total.toFixed(2)}`} highlight />
          </div>
          <StatCard label="费用项" value={data.length.toString()} />
          <StatCard label="日均" value={`¥${(total / 8).toFixed(0)}`} />
        </div>

        {/* Category Details */}
        <div className="space-y-4 sm:space-y-5">
          {Object.keys(groupedByCategory).map(cat => (
            <ExpenseCategoryCard key={cat} cat={cat} items={groupedByCategory[cat]} />
          ))}
        </div>
      </div>
    )
  }

  return <EmptyState message="暂无费用明细" icon="💸" />
}

// ==================== Checklist with Progress ====================
function renderChecklist(data: any) {
  if (!data) return <EmptyState message="暂无准备清单" icon="📋" />

  // 清单分类卡片组件
  const ChecklistCategoryCard = ({ 
    title, 
    icon,
    total,
    checked,
    children 
  }: { 
    title: string
    icon?: string
    total: number
    checked: number
    children: React.ReactNode
  }) => {
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0
    const isComplete = progress === 100
    
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {icon && <span className="text-base sm:text-lg">{icon}</span>}
            <span className="truncate">{title}</span>
          </h4>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isComplete ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'}`}>
            {checked}/{total}
          </span>
        </div>
        
        {/* 进度条 */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        
        {/* 清单项 */}
        {children}
      </div>
    )
  }

  // 清单项组件
  const ChecklistItem = ({ 
    text, 
    checked,
    required 
  }: { 
    text: string
    checked: boolean
    required?: boolean
  }) => (
    <li className={`flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ${checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
      <span className="flex-1 min-w-0 truncate">{text}</span>
      {required && (
        <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded flex-shrink-0">
          必带
        </span>
      )}
    </li>
  )

  if (data.sections) {
    return (
      <div className="space-y-4 sm:space-y-5">
        {data.sections.map((section: any, index: number) => {
          const total = section.items?.length || 0
          const checked = section.items?.filter((i: any) => i.checked).length || 0

          return (
            <ChecklistCategoryCard 
              key={index}
              title={section.title}
              total={total}
              checked={checked}
            >
              {section.items?.length > 0 && (
                <ul className="space-y-2">
                  {section.items.map((item: any, itemIndex: number) => (
                    <ChecklistItem 
                      key={itemIndex}
                      text={item.text}
                      checked={item.checked}
                      required={item.required}
                    />
                  ))}
                </ul>
              )}
            </ChecklistCategoryCard>
          )
        })}
      </div>
    )
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <EmptyState message="暂无准备清单" icon="📋" />

    return (
      <div className="space-y-4 sm:space-y-5">
        {data.map((cat: any) => {
          const total = cat.items?.length || 0
          const checked = cat.items?.filter((i: any) => i.checked).length || 0

          return (
            <ChecklistCategoryCard 
              key={cat.id}
              title={cat.name}
              icon={cat.icon || '📋'}
              total={total}
              checked={checked}
            >
              {cat.items?.length > 0 && (
                <ul className="space-y-2">
                  {cat.items.map((item: any) => (
                    <ChecklistItem 
                      key={item.id}
                      text={item.name}
                      checked={item.checked}
                    />
                  ))}
                </ul>
              )}
            </ChecklistCategoryCard>
          )
        })}
      </div>
    )
  }

  return <EmptyState message="暂无准备清单" icon="📋" />
}

// ==================== Transport - 统一毛玻璃风格 ====================
function renderTransport(data: any) {
  if (!data) return <EmptyState message="暂无交通信息" icon="🚗" />

  // 交通类型配置 - 统一使用左侧色条区分
  const transportTypes: Record<string, { label: string; icon: string; color: string }> = {
    flight: { label: '航班', icon: '✈️', color: 'border-l-indigo-400' },
    train: { label: '高铁', icon: '🚄', color: 'border-l-indigo-400' },
    car: { label: '租车', icon: '🚗', color: 'border-l-indigo-400' },
    other: { label: '其他', icon: '🚗', color: 'border-l-slate-400' },
  }

  // 交通卡片组件 - 统一毛玻璃风格
  const TransportCard = ({ item, type }: { item: any; type: string }) => {
    const typeInfo = transportTypes[type] || transportTypes.other
    const route = item.route || (item.from && item.to ? `${item.from} → ${item.to}` : '未设置路线')
    
    return (
      <div className={`
        relative p-4 sm:p-5 
        rounded-xl 
        bg-white/70 dark:bg-slate-800/70
        backdrop-blur
        border border-slate-200/50 dark:border-slate-700/50
        border-l-4 ${typeInfo.color}
        hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700
        transition-all
      `}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeInfo.icon}</span>
            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {route}
            </span>
          </div>
          {(item.flightNo || item.trainNo) && (
            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full flex-shrink-0">
              {item.flightNo || item.trainNo}
            </span>
          )}
        </div>
        
        {/* 时间 */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
          {item.date} {item.time}
        </p>
        
        {/* 详情 */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400">
          {item.baggage && <span className="whitespace-nowrap">行李: {item.baggage}</span>}
          {item.seat && <span className="whitespace-nowrap">座位: {item.seat}</span>}
          {item.price && <span className="font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">¥{item.price}</span>}
          {item.company && <span className="truncate">{item.company} {item.model && `· ${item.model}`}</span>}
          {item.days && <span className="whitespace-nowrap">{item.days}天</span>}
          {item.pickup && <span className="truncate">{item.pickup} → {item.dropoff}</span>}
          {item.notes && <span className="truncate">{item.notes}</span>}
        </div>
      </div>
    )
  }

  // 处理 data.items 格式
  if (data.items) {
    const flights = data.items.filter((i: any) => i.type === '飞机')
    const trains = data.items.filter((i: any) => i.type === '高铁')
    const cars = data.items.filter((i: any) => i.type === '租车')
    const others = data.items.filter((i: any) => !['飞机', '高铁', '租车'].includes(i.type))

    const groups: { title: string; items: any[]; type: string }[] = []
    if (flights.length > 0) groups.push({ title: '航班', items: flights, type: 'flight' })
    if (trains.length > 0) groups.push({ title: '高铁', items: trains, type: 'train' })
    if (cars.length > 0) groups.push({ title: '租车', items: cars, type: 'car' })
    if (others.length > 0) groups.push({ title: '其他', items: others, type: 'other' })

    return (
      <div className="space-y-5 sm:space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 flex items-center gap-2">
              {transportTypes[group.type]?.icon || '🚗'} {group.title}
            </h4>
            <div className="space-y-3 sm:space-y-4">
              {group.items.map((item: any, index: number) => (
                <TransportCard key={index} item={item} type={group.type} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 处理数组格式
  if (Array.isArray(data)) {
    if (data.length === 0) return <EmptyState message="暂无交通信息" icon="🚗" />

    const flights = data.filter((i: any) => i.type === 'flight')
    const trains = data.filter((i: any) => i.type === 'train')
    const cars = data.filter((i: any) => i.type === 'car')
    const others = data.filter((i: any) => !['flight', 'train', 'car'].includes(i.type))

    const groups: { title: string; items: any[]; type: string }[] = []
    if (flights.length > 0) groups.push({ title: '航班', items: flights, type: 'flight' })
    if (trains.length > 0) groups.push({ title: '高铁', items: trains, type: 'train' })
    if (cars.length > 0) groups.push({ title: '租车', items: cars, type: 'car' })
    if (others.length > 0) groups.push({ title: '其他', items: others, type: 'other' })

    return (
      <div className="space-y-5 sm:space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 flex items-center gap-2">
              {transportTypes[group.type]?.icon || '🚗'} {group.title}
            </h4>
            <div className="space-y-3 sm:space-y-4">
              {group.items.map((item: any) => (
                <TransportCard key={item.id} item={item} type={group.type} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <EmptyState message="暂无交通信息" icon="🚗" />
}

// ==================== Photo Spots ====================
function renderPhoto(data: any[]) {
  if (!data || data.length === 0) return <EmptyState message="暂无摄影机位" icon="📷" />

  // 无人机政策配置
  const dronePolicy: Record<string, { label: string; color: 'emerald' | 'slate' | 'amber' }> = {
    allowed: { label: '可飞', color: 'emerald' },
    forbidden: { label: '禁飞', color: 'slate' },
    register: { label: '需登记', color: 'amber' },
  }

  // 摄影机位卡片组件
  const PhotoSpotCard = ({ spot }: { spot: any }) => {
    const policy = dronePolicy[spot.dronePolicy] || dronePolicy.allowed
    
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:-translate-y-0.5">
        {/* 标题栏 */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
            {spot.name || '未命名机位'}
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 bg-${policy.color}-100 dark:bg-${policy.color}-900/40 text-${policy.color}-700 dark:text-${policy.color}-300`}>
            {policy.label}
          </span>
        </div>
        
        {/* 参数标签 */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-2">
          {spot.focalLength && (
            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded">
              {spot.focalLength}
            </span>
          )}
          {spot.bestTime && (
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
              {spot.bestTime}
            </span>
          )}
        </div>
        
        {/* 备注 */}
        {spot.notes && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2">
            {spot.notes}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {data.map((spot: any) => (
        <PhotoSpotCard key={spot.id} spot={spot} />
      ))}
    </div>
  )
}

// ==================== Tips ====================
function renderTips(data: any[]) {
  if (!data || data.length === 0) return <EmptyState message="暂无特别提示" icon="💡" />

  // 提示类型配置 - 统一使用左侧边框样式
  const tipTypes: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    info: {
      border: 'border-l-indigo-400',
      bg: 'bg-indigo-50/80 dark:bg-indigo-900/20',
      text: 'text-indigo-900 dark:text-indigo-200',
      icon: 'ℹ️',
    },
    warning: {
      border: 'border-l-amber-400',
      bg: 'bg-amber-50/80 dark:bg-amber-900/20',
      text: 'text-amber-900 dark:text-amber-200',
      icon: '⚠️',
    },
    success: {
      border: 'border-l-emerald-400',
      bg: 'bg-emerald-50/80 dark:bg-emerald-900/20',
      text: 'text-emerald-900 dark:text-emerald-200',
      icon: '✅',
    },
  }

  // 提示项组件
  const TipItem = ({ tip }: { tip: any }) => {
    const typeInfo = tipTypes[tip.type] || tipTypes.info
    
    return (
      <div className={`p-4 sm:p-5 border-l-4 ${typeInfo.border} ${typeInfo.bg} rounded-r-xl backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 text-lg">{typeInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm sm:text-base font-bold mb-1 ${typeInfo.text}`}>
              {tip.title || '提示'}
            </p>
            <p className={`text-xs sm:text-sm leading-relaxed ${typeInfo.text}`}>
              {tip.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {data.map((tip: any) => (
        <TipItem key={tip.id} tip={tip} />
      ))}
    </div>
  )
}

// ==================== Empty State Component ====================
function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <div className="text-center py-8 sm:py-12">
      <span className="text-3xl sm:text-4xl mb-3 block">{icon}</span>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}
