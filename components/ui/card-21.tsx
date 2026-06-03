'use client'

import * as React from 'react'
import { cn } from '~/lib/utils'
import Link from 'next/link'

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string
  location: string
  flag?: string
  stats: string
  href: string
  themeColor: string
  exploreText?: string
  enableImageColor?: boolean
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s
  const l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * 颜色提取 hook：只在 enabled=true 且 imageUrl 非空时执行 canvas 解码。
 * 通过 IntersectionObserver 懒触发，避免首屏所有卡同时 decode CPU 抖动。
 */
function useImageColor(imageUrl: string, fallback: string, enabled: boolean) {
  const [color, setColor] = React.useState(fallback)

  React.useEffect(() => {
    if (!enabled || !imageUrl || typeof imageUrl !== 'string') return

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const heightToSample = Math.floor(img.height * 0.2)
        const startY = img.height - heightToSample
        if (heightToSample <= 0) return

        canvas.width = img.width
        canvas.height = heightToSample
        ctx.drawImage(img, 0, startY, img.width, heightToSample, 0, 0, img.width, heightToSample)

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4 * 10) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
        }
        if (count > 0) {
          setColor(rgbToHsl(Math.round(r / count), Math.round(g / count), Math.round(b / count)))
        }
      } catch {
        // CORS 等异常时保持 fallback
      }
    }
  }, [imageUrl, enabled])

  return color
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  (
    {
      className,
      imageUrl,
      location,
      flag,
      stats,
      href,
      themeColor: initialThemeColor,
      exploreText = 'Explore Now',
      enableImageColor = true,
      ...props
    },
    ref,
  ) => {
    // IntersectionObserver：卡片进入视口后才启动取色，避免首屏全量 decode
    const cardRef = React.useRef<HTMLDivElement>(null)
    const [inView, setInView] = React.useState(false)

    React.useEffect(() => {
      const el = cardRef.current
      if (!el || !enableImageColor) return
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true)
            io.disconnect()
          }
        },
        { rootMargin: '100px' },
      )
      io.observe(el)
      return () => io.disconnect()
    }, [enableImageColor])

    const themeColor = useImageColor(
      enableImageColor && inView ? (imageUrl ?? '') : '',
      initialThemeColor,
      enableImageColor && inView,
    )

    return (
      <div
        ref={(node) => {
          // 合并 forwardRef 和内部 ref
          cardRef.current = node!
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        style={{ '--theme-color': themeColor } as React.CSSProperties}
        className={cn('group w-full h-full', className)}
        {...props}
      >
        <Link
          href={href}
          className="relative block w-full h-full overflow-hidden shadow-lg
                     transition-all duration-500 ease-in-out
                     group-hover:scale-105 group-hover:shadow-[0_0_60px_-15px_hsl(var(--theme-color)/0.6)]"
          aria-label={`Explore details for ${location}`}
          style={{ boxShadow: '0 0 40px -15px hsl(var(--theme-color) / 0.5)' }}
        >
          {/* 背景图：改用 <img> 实现 lazy load，绝对定位填满容器 */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={location}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover
                         transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
          )}

          {/* Content */}
          <div className="relative flex flex-col justify-center items-center h-full p-6 text-white text-center">
            <h3 className="text-4xl font-bold tracking-[0.2em] uppercase drop-shadow-lg">
              {location}
            </h3>
            {flag && <span className="text-2xl mt-2 drop-shadow-md">{flag}</span>}
            <p className="text-sm text-white/90 mt-3 font-medium tracking-widest uppercase opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              {stats}
            </p>
          </div>
        </Link>
      </div>
    )
  },
)
DestinationCard.displayName = 'DestinationCard'

export { DestinationCard }
