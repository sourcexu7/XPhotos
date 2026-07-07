'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import type { ImageFilters, ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery'
import WaterfallGallery from '~/components/layout/theme/waterfall/main/waterfall-gallery'
import { LayoutGrid, Rows, SlidersHorizontal, X, Check, ArrowUpDown, Settings2 } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useFilterStore } from '~/lib/store/filter-store'
import { useIsMobile } from '~/hooks/use-mobile'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'

interface ThemeGalleryClientProps extends ImageHandleProps {
  systemStyle: string
  preferredStyle?: 'waterfall' | 'single'
  enableFilters?: boolean
  filterOptions?: { cameras: string[]; lenses: string[] }
  tagOptions?: string[]
}

// ─── 排序 segment ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: undefined, label: '默认' },
  { value: 'desc' as const, label: '最新' },
  { value: 'asc' as const, label: '最早' },
]

function SortSegment({
  value,
  onChange,
}: {
  value: 'desc' | 'asc' | undefined
  onChange: (v: 'desc' | 'asc' | undefined) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">拍摄时间排序</p>
      <div className="flex gap-1.5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
              opt.value === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 多选列表（移动端友好，不用 Popover） ────────────────────────────────────
function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const filtered = useMemo(
    () => (search.trim() ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options),
    [options, search],
  )

  const toggle = (v: string) => {
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    onChange(Array.from(next))
  }

  if (options.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            清除
          </button>
        )}
      </div>

      {/* 搜索框（选项多时有用） */}
      {options.length > 6 && (
        <div className="relative mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`搜索${label}…`}
            className={cn(
              'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Chip 列表，自然换行 */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((opt) => {
          const active = selectedSet.has(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {active && <Check className="h-3 w-3 shrink-0" />}
              {opt}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground">无匹配结果</p>
        )}
      </div>
    </div>
  )
}

// ─── 标签逻辑 AND / OR ───────────────────────────────────────────────────────
function TagOperatorSegment({
  value,
  onChange,
}: {
  value: 'and' | 'or'
  onChange: (v: 'and' | 'or') => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">标签匹配：</span>
      {(['and', 'or'] as const).map((op) => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={cn(
            'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
            value === op
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-accent',
          )}
        >
          {op === 'and' ? '全部匹配' : '任一匹配'}
        </button>
      ))}
    </div>
  )
}

// ─── 筛选面板内容 ────────────────────────────────────────────────────────────
function FilterPanel({
  filterOptions,
  tagOptions,
  showSort,
  cameras,
  lenses,
  tags,
  tagsOperator,
  sort,
  setCameras,
  setLenses,
  setTags,
  setTagsOperator,
  setSort,
  onReset,
}: {
  filterOptions?: { cameras: string[]; lenses: string[] }
  tagOptions?: string[]
  showSort: boolean
  cameras: string[]
  lenses: string[]
  tags: string[]
  tagsOperator: 'and' | 'or'
  sort: 'desc' | 'asc' | undefined
  setCameras: (v: string[]) => void
  setLenses: (v: string[]) => void
  setTags: (v: string[]) => void
  setTagsOperator: (v: 'and' | 'or') => void
  setSort: (v: 'desc' | 'asc' | undefined) => void
  onReset: () => void
}) {
  const hasAny = cameras.length > 0 || lenses.length > 0 || tags.length > 0 || sort !== undefined

  return (
    <div className="space-y-6">
      {showSort && <SortSegment value={sort} onChange={setSort} />}

      <ChipMultiSelect
        label="相机"
        options={filterOptions?.cameras ?? []}
        selected={cameras}
        onChange={setCameras}
      />

      <ChipMultiSelect
        label="镜头"
        options={filterOptions?.lenses ?? []}
        selected={lenses}
        onChange={setLenses}
      />

      <ChipMultiSelect
        label="标签"
        options={tagOptions ?? []}
        selected={tags}
        onChange={setTags}
      />

      {tags.length > 1 && (
        <TagOperatorSegment value={tagsOperator} onChange={setTagsOperator} />
      )}

      {hasAny && (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-destructive/30 py-2.5 text-sm text-destructive hover:bg-destructive/8 transition-colors"
        >
          清除全部筛选
        </button>
      )}
    </div>
  )
}

// ─── FAB 展开菜单 ─────────────────────────────────────────────────────────────
function FabMenu({
  open,
  currentStyle,
  sortByShootTime,
  activeCount,
  showSort,
  onToggleStyle,
  onCycleSort,
  onOpenFilter,
  onClose,
}: {
  open: boolean
  currentStyle: 'waterfall' | 'single'
  sortByShootTime: 'desc' | 'asc' | undefined
  activeCount: number
  showSort: boolean
  onToggleStyle: () => void
  onCycleSort: () => void
  onOpenFilter: () => void
  onClose: () => void
}) {
  const sortLabel = sortByShootTime === 'desc' ? '最新' : sortByShootTime === 'asc' ? '最早' : '默认'

  const items: {
    icon: React.ReactNode
    label: string
    dot?: boolean
    badge?: number
    onClick: () => void
  }[] = [
    {
      icon:
        currentStyle === 'waterfall' ? (
          <Rows className="h-[15px] w-[15px]" />
        ) : (
          <LayoutGrid className="h-[15px] w-[15px]" />
        ),
      label: currentStyle === 'waterfall' ? '单列' : '瀑布流',
      onClick: () => {
        onToggleStyle()
        onClose()
      },
    },
  ]

  if (showSort) {
    items.push({
      icon: <ArrowUpDown className="h-[15px] w-[15px]" />,
      label: sortLabel,
      dot: sortByShootTime !== undefined,
      onClick: () => {
        onCycleSort()
      },
    })
  }

  items.push({
    icon: <SlidersHorizontal className="h-[15px] w-[15px]" />,
    label: '筛选',
    dot: activeCount > 0,
    badge: activeCount > 0 ? activeCount : undefined,
    onClick: () => {
      onOpenFilter()
      onClose()
    },
  })

  return (
    <>
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex items-center gap-2.5"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(10px)',
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            transitionDelay: open ? `${i * 35}ms` : '0ms',
          }}
        >
          <span className="rounded-md bg-background/90 backdrop-blur-md border border-border/60 px-2.5 py-1 text-[11px] font-medium text-foreground tracking-wide whitespace-nowrap shadow-sm">
            {item.label}
          </span>
          <button
            type="button"
            onClick={item.onClick}
            className={cn(
              'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              'border shadow-sm transition-opacity duration-150 active:opacity-60',
              item.dot
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background/90 backdrop-blur-md border-border/60 text-foreground',
            )}
          >
            {item.icon}
            {item.badge !== undefined && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        </div>
      ))}
    </>
  )
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function ThemeGalleryClient({
  systemStyle,
  preferredStyle,
  enableFilters = false,
  filterOptions,
  tagOptions,
  ...props
}: ThemeGalleryClientProps) {
  const { data: total } = useSwrPageTotalHook(props)
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  const isSingleAlbum = props.album && props.album !== '/' && props.album !== 'all'

  const baseStyle: 'waterfall' | 'single' = useMemo(() => {
    if (preferredStyle) return preferredStyle
    if (isSingleAlbum && typeof total === 'number') return total > 10 ? 'waterfall' : 'single'
    return systemStyle === '1' ? 'single' : 'waterfall'
  }, [isSingleAlbum, total, systemStyle, preferredStyle])

  const [currentStyle, setCurrentStyle] = useState<'waterfall' | 'single'>(baseStyle)
  const [userOverridden, setUserOverridden] = useState(false)

  useEffect(() => {
    if (!userOverridden) setCurrentStyle(baseStyle)
  }, [baseStyle, userOverridden])

  useEffect(() => {
    if (!fabOpen) return
    const handleClick = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [fabOpen])

  const {
    cameraFilter,
    lensFilter,
    tagsFilter,
    tagsOperator,
    sortByShootTime,
    setCameraFilter,
    setLensFilter,
    setTagsFilter,
    setTagsOperator,
    setSortByShootTime,
    resetFilters,
  } = useFilterStore()

  const filters: (ImageFilters & { tagsOperator?: 'and' | 'or' }) | undefined = useMemo(() => {
    if (!enableFilters) return undefined
    return {
      cameras: cameraFilter.length ? cameraFilter : undefined,
      lenses: lensFilter.length ? lensFilter : undefined,
      tags: tagsFilter.length ? tagsFilter : undefined,
      tagsOperator: tagsFilter.length > 0 ? tagsOperator : undefined,
    }
  }, [enableFilters, cameraFilter, lensFilter, tagsFilter, tagsOperator])

  const toggleTheme = () => {
    setUserOverridden(true)
    setCurrentStyle((prev) => (prev === 'waterfall' ? 'single' : 'waterfall'))
  }

  const cycleSort = () => {
    setSortByShootTime(
      sortByShootTime === undefined ? 'desc' : sortByShootTime === 'desc' ? 'asc' : undefined,
    )
  }

  const activeCount = cameraFilter.length + lensFilter.length + tagsFilter.length
  const hasActivity = activeCount > 0 || sortByShootTime !== undefined

  const galleryProps = {
    ...props,
    filters,
    sortByShootTime: enableFilters && props.album === '/' ? sortByShootTime : undefined,
  }

  const filterPanelProps = {
    filterOptions,
    tagOptions,
    showSort: props.album === '/',
    cameras: cameraFilter,
    lenses: lensFilter,
    tags: tagsFilter,
    tagsOperator,
    sort: sortByShootTime,
    setCameras: setCameraFilter,
    setLenses: setLensFilter,
    setTags: setTagsFilter,
    setTagsOperator,
    setSort: setSortByShootTime,
    onReset: resetFilters,
  }

  return (
    <>
      {/* ── 画廊内容 ── */}
      <div>
        {currentStyle === 'waterfall' ? (
          <WaterfallGallery {...galleryProps} />
        ) : (
          <SimpleGallery {...galleryProps} />
        )}
      </div>

      {/* ── 相册详情页：单个切换按钮 ── */}
      {!enableFilters && (
        <button
          type="button"
          aria-label={currentStyle === 'waterfall' ? '切换为单列' : '切换为瀑布流'}
          onClick={toggleTheme}
          className={cn(
            'fixed bottom-6 right-5 z-40',
            'flex h-11 w-11 items-center justify-center rounded-full',
            'bg-background/95 backdrop-blur-xl',
            'border border-border/80',
            'shadow-[0_2px_12px_rgba(0,0,0,0.10)]',
            'text-foreground transition-opacity duration-150 active:opacity-60',
          )}
        >
          {currentStyle === 'waterfall' ? (
            <Rows className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
        </button>
      )}

      {/* ── /albums 页：FAB 展开菜单 ── */}
      {enableFilters && (
        <div ref={fabRef} className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3">
          <FabMenu
            open={fabOpen}
            currentStyle={currentStyle}
            sortByShootTime={sortByShootTime}
            activeCount={activeCount}
            showSort={props.album === '/'}
            onToggleStyle={toggleTheme}
            onCycleSort={cycleSort}
            onOpenFilter={() => setSheetOpen(true)}
            onClose={() => setFabOpen(false)}
          />

          <button
            type="button"
            aria-label={fabOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={fabOpen}
            onClick={() => setFabOpen((v) => !v)}
            className={cn(
              'relative flex h-12 w-12 items-center justify-center rounded-full',
              'bg-background/95 backdrop-blur-xl',
              'border border-border/80',
              'shadow-[0_2px_16px_rgba(0,0,0,0.12)]',
              'text-foreground',
              'transition-transform duration-200 active:scale-95',
              fabOpen && 'rotate-45',
            )}
          >
            {fabOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            {!fabOpen && hasActivity && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      )}

      {/* ── 筛选面板 Sheet ── */}
      {enableFilters && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side={isMobile ? 'bottom' : 'right'}
            className={cn(
              'flex flex-col gap-0 p-0',
              isMobile ? 'h-[90dvh] rounded-t-2xl' : 'w-80 sm:w-96',
            )}
          >
            {/* 拖拽把手（移动端） */}
            {isMobile && (
              <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/25" />
            )}

            <SheetHeader className="flex-row items-center justify-between border-b px-5 py-4 shrink-0">
              <SheetTitle className="text-base font-semibold">筛选 & 排序</SheetTitle>
              {hasActivity && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-destructive hover:underline"
                >
                  清除全部
                </button>
              )}
            </SheetHeader>

            {/* 可滚动内容区 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <FilterPanel {...filterPanelProps} />
            </div>

            {/* 底部完成按钮（移动端） */}
            {isMobile && (
              <div className="shrink-0 border-t px-5 py-4 bg-background">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity active:opacity-70"
                >
                  完成
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
