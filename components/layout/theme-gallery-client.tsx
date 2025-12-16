'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ImageFilters, ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery'
import WaterfallGallery from '~/components/layout/theme/waterfall/main/waterfall-gallery'
import { Button } from '~/components/ui/button'
import { Filter, LayoutGrid, Rows } from 'lucide-react'
import { MultiSelect } from '~/components/ui/multi-select'
import { cn } from '~/lib/utils'

interface ThemeGalleryClientProps extends ImageHandleProps {
  systemStyle: string
  preferredStyle?: 'waterfall' | 'single'
  // 新增：是否启用前端筛选面板（仅作品画廊页开启）
  enableFilters?: boolean
  // 新增：EXIF 选项（由服务端预先计算，相机 / 镜头列表）
  filterOptions?: {
    cameras: string[]
    lenses: string[]
  }
  // 新增：标签候选列表（如果有）
  tagOptions?: string[]
}

export default function ThemeGalleryClient({
  systemStyle,
  preferredStyle,
  enableFilters = false,
  filterOptions,
  tagOptions,
  ...props
}: ThemeGalleryClientProps) {
  const { data: total } = useSwrPageTotalHook(props)

  const isSingleAlbum = props.album && props.album !== '/' && props.album !== 'all'

  // 计算“后台默认 + 数量规则”得到的基础主题：
  // - 首页 / 作品合集：完全按照后台首选项（1=单列，2=瀑布流，其他视为瀑布流）
  // - 单个相册：若有 preferredStyle（封面跳转时附带）优先；否则按数量：>10 瀑布流；<=10 单列
  const baseStyle: 'waterfall' | 'single' = useMemo(() => {
    if (preferredStyle) return preferredStyle

    if (isSingleAlbum && typeof total === 'number') {
      return total > 10 ? 'waterfall' : 'single'
    }
    // 首页 / 合集：后台首选项
    return systemStyle === '1' ? 'single' : 'waterfall'
  }, [isSingleAlbum, total, systemStyle, preferredStyle])

  const [currentStyle, setCurrentStyle] = useState<'waterfall' | 'single'>(baseStyle)
  const [userOverridden, setUserOverridden] = useState(false)

  // 新增：前端筛选状态
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [cameraFilter, setCameraFilter] = useState<string[]>([])
  const [lensFilter, setLensFilter] = useState<string[]>([])
  const [tagsFilter, setTagsFilter] = useState<string[]>([])
  const filterSectionRef = useRef<HTMLDivElement | null>(null)
  // 滚动时自动收起筛选，避免遮挡图片
  useEffect(() => {
    if (!enableFilters) return
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0
    const onScroll = () => {
      const currentY = window.scrollY
      if (filtersOpen && currentY > lastY + 8) {
        setFiltersOpen(false)
      }
      lastY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enableFilters, filtersOpen])


  const filters: ImageFilters | undefined = enableFilters
    ? {
        cameras: cameraFilter.length ? cameraFilter : undefined,
        lenses: lensFilter.length ? lensFilter : undefined,
        tags: tagsFilter.length ? tagsFilter : undefined,
      }
    : undefined

  // 当后台设置或图片数量变化时，如果用户没手动切换，则跟随基础主题
  useEffect(() => {
    if (!userOverridden) {
      setCurrentStyle(baseStyle)
    }
  }, [baseStyle, userOverridden])

  const toggleTheme = () => {
    setUserOverridden(true)
    setCurrentStyle(prev => (prev === 'waterfall' ? 'single' : 'waterfall'))
  }

  const getGalleryComponent = () => {
    const galleryProps = {
      ...props,
      // 改造点：向主题组件传入前端筛选条件
      filters,
    }
    return currentStyle === 'waterfall'
      ? <WaterfallGallery {...galleryProps} />
      : <SimpleGallery {...galleryProps} />
  }

  const toggleLabel = useMemo(
    () => currentStyle === 'waterfall' ? '切换到单列' : '切换到瀑布流',
    [currentStyle],
  )

  return (
    <>
      {getGalleryComponent()}

      {/* Theme & Filter Toggle Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        {enableFilters && (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-background/85 backdrop-blur-sm shadow-lg border-border hover:bg-accent"
            onClick={() => setFiltersOpen(o => !o)}
            title={filtersOpen ? '收起筛选' : '展开筛选'}
            aria-expanded={filtersOpen}
            aria-controls="gallery-filter-panel"
          >
            <Filter className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border-border hover:bg-accent"
          onClick={toggleTheme}
          title={toggleLabel}
        >
          {currentStyle === 'waterfall'
            ? <Rows className="h-5 w-5" />
            : <LayoutGrid className="h-5 w-5" />}
        </Button>
      </div>
      {enableFilters && filtersOpen && (
        <div
          id="gallery-filter-panel"
          ref={filterSectionRef}
          className="fixed bottom-24 right-8 z-50 w-[min(92vw,520px)] rounded-2xl border border-border/60 bg-background/85 shadow-2xl supports-[backdrop-filter]:backdrop-blur-xl"
        >
          <div className="px-4 pt-3 pb-4 space-y-3 text-xs md:text-sm text-foreground/80">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MultiSelect
                label="相机"
                placeholder="选择相机型号"
                options={(filterOptions?.cameras || []).map(v => ({ label: v, value: v }))}
                selected={cameraFilter}
                onChange={setCameraFilter}
                className="bg-background/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)]"
              />
              <MultiSelect
                label="镜头"
                placeholder="选择镜头型号"
                options={(filterOptions?.lenses || []).map(v => ({ label: v, value: v }))}
                selected={lensFilter}
                onChange={setLensFilter}
                className="bg-background/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)]"
              />
              <MultiSelect
                label="标签"
                placeholder="选择标签"
                options={(tagOptions || []).map(v => ({ label: v, value: v }))}
                selected={tagsFilter}
                onChange={setTagsFilter}
                className="bg-background/70 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
