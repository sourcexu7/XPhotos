'use client'

import { memo, useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import type { ImageType } from '~/types'
import { useRouter } from 'next-nprogress-bar'

/**
 * 单列画廊轻量图片卡片
 *
 * 性能设计：
 *  - 先用占位 + 原生 <img loading="lazy" decoding="async">，避免 Next.js Image 的额外 JS 开销
 *  - 首次进入视口才初始化（IntersectionObserver + rootMargin 200px 预加载）
 *  - 图片源：优先 preview_url，回退 url（不加载原图到列表页）
 *  - 只有进入视口后才创建图片元素，离屏区域只保留占位 div
 *  - 通过 content-visibility: auto 让浏览器跳过离屏卡片的布局/绘制
 */

const DEFAULT_ASPECT_RATIO = 1.5 // 默认 3:2，避免 CLS 抖动

interface SimpleGalleryCardProps {
  photo: ImageType
  index?: number
  eager?: boolean
}

function SimpleGalleryCardInner({ photo, eager }: SimpleGalleryCardProps) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(eager ?? false)
  const [loaded, setLoaded] = useState(false)

  // 进入视口才创建 <img>；一旦进入后保持状态避免重复卸载
  useEffect(() => {
    if (inView) return
    if (!ref.current) return
    const el = ref.current
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            io.disconnect()
            return
          }
        }
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView])

  const src = photo.preview_url || photo.url || ''
  const width = typeof photo.width === 'number' && photo.width > 0 ? photo.width : 1200
  const height = typeof photo.height === 'number' && photo.height > 0 ? photo.height : Math.round(1200 / DEFAULT_ASPECT_RATIO)
  const estimatedHeight = Math.round(800 / (width / height))

  const handleClick = useCallback(() => {
    router.push(`/preview/${photo.id}`)
  }, [router, photo.id])

  return (
    <div
      ref={ref}
      className="w-full mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6"
      style={{
        // content-visibility 在类型库中尚不可用，通过断言绕过 TS 检查
        ...({
          contentVisibility: 'auto',
          containIntrinsicSize: `0px ${estimatedHeight}px`,
        } as CSSProperties),
      }}
    >
      <div
        className="relative cursor-pointer select-none overflow-hidden rounded bg-muted/30 shadow-sm hover:shadow-md transition-shadow"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* 占位：用宽高比保留空间，避免 CLS */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${width} / ${height}`,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 100%)',
          }}
        >
          {inView && src ? (
            <img
              src={src}
              alt={photo.title || '摄影作品'}
              width={width}
              height={height}
              loading={eager ? 'eager' : 'lazy'}
              decoding={eager ? 'sync' : 'async'}
              fetchPriority={eager ? 'high' : 'auto'}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'cover',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          ) : null}

          {/* 加载中骨架 */}
          {!loaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(200,200,200,0.15) 0%, rgba(200,200,200,0.35) 50%, rgba(200,200,200,0.15) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          )}

          {/* Live Photo 指示 */}
          {photo.type === 2 && loaded && (
            <span className="absolute top-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white tracking-wider">
              LIVE
            </span>
          )}
        </div>

        {/* 标题（仅加载完成后显示） */}
        {photo.title && loaded && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pointer-events-none">
            <p className="text-white text-sm font-medium line-clamp-1">{photo.title}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const SimpleGalleryCard = memo(SimpleGalleryCardInner)
export default SimpleGalleryCard
