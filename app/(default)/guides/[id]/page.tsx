'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
            setActiveModuleId(entry.target.id)
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
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [guide?.modules])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">攻略不存在</p>
          <Link href="/guides" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">返回列表</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-24 lg:pb-0">
      <div className="relative w-full aspect-[3/4] sm:aspect-[21/9] lg:aspect-[3/1] overflow-hidden bg-slate-200 dark:bg-slate-800">
        {guide.cover_image ? (
          <Image src={guide.cover_image} alt={guide.title} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-slate-100 to-blue-50/50 dark:from-blue-900/20 dark:via-slate-900 dark:to-blue-800/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/60 dark:via-slate-950/60 to-transparent" />
        <Link
          href="/guides"
          className="absolute top-3 left-3 sm:top-6 sm:left-6 z-10 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors rounded-full shadow-md border border-slate-200/50 dark:border-slate-700/50"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="hidden sm:inline">返回列表</span>
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-16">
          <div className="max-w-4xl">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-1.5 sm:mb-3">Travel Guide</p>
            <h1 className="text-lg sm:text-2xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2 sm:mb-4 leading-tight">{guide.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="truncate">{guide.country} · {guide.city}</span>
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {guide.days} 天
              </span>
              {guide.start_date && (
                <>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                  <time dateTime={guide.start_date} className="hidden sm:inline text-xs">
                    {new Date(guide.start_date).toLocaleDateString('zh-CN')}
                    {guide.end_date && ` — ${new Date(guide.end_date).toLocaleDateString('zh-CN')}`}
                  </time>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-12 lg:py-16">
        <div className="flex gap-8 justify-center">
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
            {guide.albums?.length > 0 && (
              <section className="mb-6 sm:mb-14">
                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-3 sm:mb-6">关联相册</h2>
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
                        <div className="border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-300 rounded-xl overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl">
                          <div className="aspect-[3/2] relative overflow-hidden">
                            {relation.album.cover ? (
                              <Image 
                                src={relation.album.cover} 
                                alt={relation.album.name} 
                                fill 
                                sizes="(max-width: 768px) 100vw, 33vw" 
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                                <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0a.375.375 0 01.75 0z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                              <p className="text-sm sm:text-base font-semibold text-white truncate">{relation.album.name}</p>
                              <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">点击查看相册</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

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
                            <p className="mt-1.5 sm:mt-3 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 text-center">{component.content.caption}</p>
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
    <section
      key={module.id}
      id={`module-${module.id}`}
      ref={(el) => { moduleRefs.current[module.id] = el }}
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
          {!module.template && module.contents?.map(renderContent)}
        </div>
      </div>
    </section>
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
            <figcaption className="mt-1.5 sm:mt-3 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 text-center">{content.content.caption}</figcaption>
          )}
        </figure>
      ) : null
    case 'video':
      return content.content?.url ? (
        <div key={content.id} className="mb-3 sm:mb-6 p-2.5 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl">
          <div className="flex items-start gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5 sm:mb-1 truncate">{content.content.caption || '视频'}</p>
              <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 truncate">{content.content.platform} · {content.content.url}</p>
            </div>
          </div>
        </div>
      ) : null
    case 'link':
      return content.content?.url ? (
        <a key={content.id} href={content.content.url} target="_blank" rel="noopener noreferrer"
          className="group mb-3 sm:mb-6 flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-colors block rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm active:bg-slate-100 dark:active:bg-slate-700">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{content.content.title || '链接'}</p>
            <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">{content.content.description}</p>
          </div>
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <span className="ml-auto text-[9px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">{completed}/{tasks.length}</span>
          </div>
          <ul className="space-y-1 sm:space-y-2">
            {tasks.map((task: any, idx: number) => (
              <li key={idx} className={`flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
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
          <p className="text-[11px] sm:text-sm leading-relaxed">{content.content.text}</p>
        </div>
      ) : null
    case 'divider':
      return <hr key={content.id} className="my-4 sm:my-8 border-slate-200/50 dark:border-slate-700/50" />
    default:
      return null
  }
}

function renderItinerary(data: any) {
  if (!data) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无行程安排</p>
  
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
        className="inline-flex items-center gap-1 sm:gap-2 px-2 py-1 sm:py-1.5 bg-slate-100/80 dark:bg-slate-700/60 hover:bg-slate-200/80 dark:hover:bg-slate-600/60 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 transition-colors group active:scale-95 backdrop-blur-sm"
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        <span className="truncate max-w-[80px] sm:max-w-[200px]">{link.title || getDomain(link.url)}</span>
        <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 text-[10px]">↗</span>
      </a>
    )
  }
  
  if (data.days) {
    return (
      <div className="space-y-3 sm:space-y-6">
        {data.days.map((day: any, dayIndex: number) => (
          <div key={dayIndex} className="border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 pb-3 sm:pb-6 last:pb-0">
            <h3 className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2.5 sm:mb-4">{day.date} · {day.title}</h3>
            <div className="space-y-2 sm:space-y-3">
              {day.activities.map((activity: any, idx: number) => (
                <div key={idx} className="flex gap-2 sm:gap-3">
                  <span className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-400 w-10 sm:w-14 flex-shrink-0 pt-0.5">{activity.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activity.content}</p>
                    {activity.links?.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                        {activity.links.map(renderLinkCard)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无行程安排</p>
    
    const groupedByDay: Record<string, any[]> = {}
    data.forEach((item: any, index: number) => {
      const dayKey = item.date || item.day || `第${index + 1}天`
      if (!groupedByDay[dayKey]) groupedByDay[dayKey] = []
      groupedByDay[dayKey].push(item)
    })

    return (
      <div className="space-y-3 sm:space-y-6">
        {Object.keys(groupedByDay).map((dayKey, dayIndex) => {
          const dayItems = groupedByDay[dayKey]
          const firstItem = dayItems[0]
          const dayTitle = firstItem.title || dayKey
          
          return (
            <div key={dayKey} className="border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 pb-3 sm:pb-6 last:pb-0">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-4">
                <span className="text-[11px] sm:text-sm font-bold text-orange-600 dark:text-orange-400">第 {dayIndex + 1} 天</span>
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">· {dayTitle}</span>
              </div>
              <div className="space-y-2.5 sm:space-y-4">
                {dayItems.map((item: any) => (
                  <div key={item.id} className="group relative pl-3 sm:pl-0">
                    <div className="absolute left-0 top-[7px] sm:hidden w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        {item.location && (
                          <p className="text-[11px] sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-[1.4] mb-1">📍 {item.location}</p>
                        )}
                        {item.description && (
                          <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{item.description}</p>
                        )}
                        {item.highlights && item.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.highlights.map((h: string, i: number) => (
                              <span key={i} className="text-[9px] sm:text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">{h}</span>
                            ))}
                          </div>
                        )}
                        {item.tips && (
                          <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1.5 sm:mt-2 flex items-start gap-1">
                            <span className="flex-shrink-0">💡</span>
                            <span className="whitespace-pre-line">{item.tips}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  
  return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无行程安排</p>
}

function renderExpense(data: any) {
  if (!data) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无费用明细</p>
  
  if (data.total !== undefined && data.items) {
    const total = data.total
    const currency = data.currency || 'CNY'
    
    return (
      <div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-6 p-2.5 sm:p-5 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl backdrop-blur-sm">
          <div>
            <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 sm:mb-1">总费用</p>
            <p className="text-base sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{currency === 'CNY' ? '¥' : ''}{total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 sm:mb-1">费用项</p>
            <p className="text-base sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{data.items.length} <span className="text-[10px] sm:text-base font-normal text-slate-600 dark:text-slate-400">项</span></p>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-6">
          {data.items.map((category: any) => (
            <div key={category.category}>
              <h4 className="text-[11px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">{category.category}</h4>
              <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {category.subitems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 sm:py-3 first:pt-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-[11px] sm:text-sm text-slate-700 dark:text-slate-300 truncate">{item.name || '未命名'}</span>
                    </div>
                    <span className="text-[11px] sm:text-sm font-semibold text-slate-900 dark:text-slate-100 ml-2 sm:ml-4 flex-shrink-0">{currency === 'CNY' ? '¥' : ''}{item.price || 0}</span>
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
    if (data.length === 0) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无费用明细</p>
    const total = data.reduce((sum: number, item: any) => sum + (Number(item.subtotal) || 0), 0)
    const categories: Record<string, { label: string; color: string }> = {
      transport: { label: '交通', color: 'text-blue-600 dark:text-blue-400' },
      accommodation: { label: '住宿', color: 'text-emerald-600 dark:text-emerald-400' },
      food: { label: '餐饮', color: 'text-amber-600 dark:text-amber-400' },
      ticket: { label: '门票', color: 'text-purple-600 dark:text-purple-400' },
      equipment: { label: '设备', color: 'text-pink-600 dark:text-pink-400' },
      shopping: { label: '购物', color: 'text-cyan-600 dark:text-cyan-400' },
      other: { label: '其他', color: 'text-slate-600 dark:text-slate-400' },
    }

    const groupedByCategory: Record<string, any[]> = {}
    data.forEach((item: any) => {
      const cat = item.category || 'other'
      if (!groupedByCategory[cat]) groupedByCategory[cat] = []
      groupedByCategory[cat].push(item)
    })

    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6 p-2.5 sm:p-5 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl backdrop-blur-sm">
          <div className="col-span-2">
            <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 sm:mb-1">总费用</p>
            <p className="text-lg sm:text-3xl font-bold text-blue-600 dark:text-blue-400">¥{total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 sm:mb-1">费用项</p>
            <p className="text-base sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{data.length}</p>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 sm:mb-1">日均</p>
            <p className="text-base sm:text-2xl font-bold text-slate-900 dark:text-slate-100">¥{(total / 8).toFixed(0)}</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-6">
          {Object.keys(groupedByCategory).map(cat => {
            const catInfo = categories[cat] || categories.other
            const items = groupedByCategory[cat]
            return (
              <div key={cat}>
                <h4 className={`text-[11px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3 ${catInfo.color}`}>{catInfo.label}</h4>
                <div className="space-y-1.5 sm:space-y-0">
                  {items.map((item: any) => (
                    <div key={item.id} className="sm:hidden p-2 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-slate-900 dark:text-slate-100 flex-1 min-w-0 truncate">{item.name || '-'}</span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">¥{item.subtotal || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                        {item.type && <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 whitespace-nowrap">{item.type}</span>}
                        {item.channel && <span className="truncate flex-1 min-w-0">{item.channel}</span>}
                        <span className="flex-shrink-0">¥{item.unitPrice || 0}</span>
                      </div>
                      {item.detail && <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{item.detail}</p>}
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                        <th className="text-left py-2.5 sm:py-3 font-medium text-slate-600 dark:text-slate-400 w-[15%]">事项</th>
                        <th className="text-left py-2.5 sm:py-3 font-medium text-slate-600 dark:text-slate-400 w-[28%]">详情</th>
                        <th className="text-left py-2.5 sm:py-3 font-medium text-slate-600 dark:text-slate-400 w-[10%]">类型</th>
                        <th className="text-left py-2.5 sm:py-3 font-medium text-slate-600 dark:text-slate-400 w-[10%]">渠道</th>
                        <th className="text-right py-2.5 sm:py-3 font-medium text-slate-600 dark:text-slate-400 w-[12%]">单价</th>
                        <th className="text-right py-2.5 sm:py-3 font-medium text-slate-600 dark:text-slate-400 w-[12%]">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => (
                        <tr key={item.id} className="border-b border-slate-200/30 dark:border-slate-700/30">
                          <td className="py-2.5 sm:py-3 text-slate-900 dark:text-slate-100">{item.name || '-'}</td>
                          <td className="py-2.5 sm:py-3 text-slate-600 dark:text-slate-400 truncate max-w-0">{item.detail || '-'}</td>
                          <td className="py-2.5 sm:py-3"><span className="inline-block px-2 py-0.5 rounded text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 whitespace-nowrap">{item.type || '-'}</span></td>
                          <td className="py-2.5 sm:py-3 text-slate-600 dark:text-slate-400">{item.channel || '-'}</td>
                          <td className="py-2.5 sm:py-3 text-right text-slate-600 dark:text-slate-400">¥{item.unitPrice || 0}</td>
                          <td className="py-2.5 sm:py-3 text-right font-semibold text-slate-900 dark:text-slate-100">¥{item.subtotal || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  
  return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无费用明细</p>
}

function renderChecklist(data: any) {
  if (!data) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无准备清单</p>
  
  if (data.sections) {
    return (
      <div className="space-y-3 sm:space-y-6">
        {data.sections.map((section: any, index: number) => {
          const total = section.items?.length || 0
          const checked = section.items?.filter((i: any) => i.checked).length || 0
          const progress = total > 0 ? Math.round((checked / total) * 100) : 0

          return (
            <div key={index} className="p-2.5 sm:p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="text-[11px] sm:text-base font-bold text-slate-900 dark:text-slate-100">{section.title}</h4>
                <span className={`text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${progress === 100 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>{checked}/{total}</span>
              </div>
              <div className="w-full h-1 sm:h-1.5 bg-slate-200/50 dark:bg-slate-700/50 mb-2 sm:mb-3 overflow-hidden rounded-full">
                <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              {section.items?.length > 0 && (
                <ul className="space-y-1 sm:space-y-2">
                  {section.items.map((item: any, itemIndex: number) => (
                    <li key={itemIndex} className={`flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className="flex-1 min-w-0 truncate">{item.text}</span>
                      {item.required && <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded flex-shrink-0">必带</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无准备清单</p>

    return (
      <div className="space-y-3 sm:space-y-6">
        {data.map((cat: any) => {
          const total = cat.items?.length || 0
          const checked = cat.items?.filter((i: any) => i.checked).length || 0
          const progress = total > 0 ? Math.round((checked / total) * 100) : 0

          return (
            <div key={cat.id} className="p-2.5 sm:p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="text-[11px] sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-lg">{cat.icon || '📋'}</span>
                  <span className="truncate">{cat.name}</span>
                </h4>
                <span className={`text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${progress === 100 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>{checked}/{total}</span>
              </div>
              <div className="w-full h-1 sm:h-1.5 bg-slate-200/50 dark:bg-slate-700/50 mb-2 sm:mb-3 overflow-hidden rounded-full">
                <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              {cat.items?.length > 0 && (
                <ul className="space-y-1 sm:space-y-2">
                  {cat.items.map((item: any) => (
                    <li key={item.id} className={`flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无准备清单</p>
}

function renderTransport(data: any) {
  if (!data) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无交通信息</p>
  
  if (data.items) {
    const flights = data.items.filter((i: any) => i.type === '飞机')
    const trains = data.items.filter((i: any) => i.type === '高铁')
    const cars = data.items.filter((i: any) => i.type === '租车')
    const others = data.items.filter((i: any) => !['飞机', '高铁', '租车'].includes(i.type))

    type GroupProps = { title: string; icon: React.ReactNode; color: string; items: any[] }

    const groups: GroupProps[] = []

    if (flights.length > 0) groups.push({ title: '航班', icon: '✈️', color: 'border-l-blue-400 bg-blue-50/40 dark:bg-blue-900/20', items: flights })
    if (trains.length > 0) groups.push({ title: '高铁/火车', icon: '🚄', color: 'border-l-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20', items: trains })
    if (cars.length > 0) groups.push({ title: '租车', icon: '🚗', color: 'border-l-amber-400 bg-amber-50/40 dark:bg-amber-900/20', items: cars })
    if (others.length > 0) groups.push({ title: '其他', icon: '🚗', color: 'border-l-slate-400 bg-slate-50/40 dark:bg-slate-900/20', items: others })

    return (
      <div className="space-y-4 sm:space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 sm:mb-4">{group.icon} {group.title}</h4>
            <div className="space-y-2 sm:space-y-3">
              {group.items.map((item: any, index: number) => (
                <div key={index} className={`p-2.5 sm:p-4 border-l-2 rounded-r-xl backdrop-blur-sm ${group.color}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{item.from} → {item.to}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">{item.date} {item.time}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                    {item.price && <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.price}</span>}
                    {item.notes && <span className="truncate">{item.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无交通信息</p>
    
    const flights = data.filter((i: any) => i.type === 'flight')
    const trains = data.filter((i: any) => i.type === 'train')
    const cars = data.filter((i: any) => i.type === 'car')

    type GroupProps = { title: string; icon: React.ReactNode; color: string; items: any[] }

    const groups: GroupProps[] = []

    if (flights.length > 0) groups.push({ title: '航班', icon: '✈️', color: 'border-l-blue-400 bg-blue-50/40 dark:bg-blue-900/20', items: flights })
    if (trains.length > 0) groups.push({ title: '高铁/火车', icon: '🚄', color: 'border-l-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/20', items: trains })
    if (cars.length > 0) groups.push({ title: '租车', icon: '🚗', color: 'border-l-amber-400 bg-amber-50/40 dark:bg-amber-900/20', items: cars })

    return (
      <div className="space-y-4 sm:space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 sm:mb-4">{group.icon} {group.title}</h4>
            <div className="space-y-2 sm:space-y-3">
              {group.items.map((item: any) => (
                <div key={item.id} className={`p-2.5 sm:p-4 border-l-2 rounded-r-xl backdrop-blur-sm ${group.color}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{item.route || '未设置路线'}</span>
                    <span className="text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full flex-shrink-0">{item.flightNo || item.trainNo || ''}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">{item.date} {item.time}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-4 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                    {item.baggage && <span className="whitespace-nowrap">行李: {item.baggage}</span>}
                    {item.seat && <span className="whitespace-nowrap">座位: {item.seat}</span>}
                    {item.price && <span className="text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">¥{item.price}</span>}
                    {item.company && <span className="truncate">{item.company} · {item.model}</span>}
                    {item.days && <span className="whitespace-nowrap">{item.days}天</span>}
                    {item.pickup && <span className="truncate">{item.pickup} → {item.dropoff}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无交通信息</p>
}

function renderPhoto(data: any[]) {
  if (!data || data.length === 0) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无摄影机位</p>

  const dronePolicy: Record<string, { label: string; style: string }> = {
    allowed: { label: '可飞', style: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
    forbidden: { label: '禁飞', style: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
    register: { label: '需登记', style: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
      {data.map((spot: any) => {
        const policy = dronePolicy[spot.dronePolicy] || dronePolicy.allowed
        return (
          <div key={spot.id} className="p-2.5 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{spot.name || '未命名机位'}</span>
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${policy.style}`}>{policy.label}</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
              {spot.focalLength && <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">{spot.focalLength}</span>}
              {spot.bestTime && <span className="text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">{spot.bestTime}</span>}
            </div>
            {spot.notes && <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5 sm:mt-2 line-clamp-2">{spot.notes}</p>}
          </div>
        )
      })}
    </div>
  )
}

function renderTips(data: any[]) {
  if (!data || data.length === 0) return <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 py-3 sm:py-4">暂无特别提示</p>
  return (
    <div className="space-y-2.5 sm:space-y-4">
      {data.map((tip: any) => (
        <div key={tip.id} className={`p-2.5 sm:p-5 border-l-2 rounded-r-xl backdrop-blur-sm ${tipStyles[tip.type] || tipStyles.info}`}>
          <p className="text-[11px] sm:text-base font-bold mb-0.5 sm:mb-1">{tip.title || '提示'}</p>
          <p className="text-[11px] sm:text-sm leading-relaxed">{tip.content}</p>
        </div>
      ))}
    </div>
  )
}
