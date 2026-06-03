'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ImageFilters, ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery'
import WaterfallGallery from '~/components/layout/theme/waterfall/main/waterfall-gallery'
import { LayoutGrid, Rows, SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useFilterStore } from '~/lib/store/filter-store'
import { useIsMobile } from '~/hooks/use-mobile'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'

interface ThemeGalleryClientProps extends ImageHandleProps {
  systemStyle: string
  preferredStyle?: 'waterfall' | 'single'
  enableFilters?: boolean
  filterOptions?: { cameras: string[]; lenses: string[] }
  tagOptions?: string[]
}

// ─── MultiSelect ─────────────────────────────────────────────────────────────
interface SelectProps {
  label: string
  placeholder: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}

function InlineMultiSelect({ label, placeholder, options, selected, onChange }: SelectProps) {
  const [open, setOpen] = useState(false)
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const toggle = (v: string) => {
    const next = new Set(selected)
    next.has(v) ? next.delete(v) : next.add(v)
    onChange(Array.from(next))
  }

  return (
    <div className="w-full">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm',
              'bg-background/60 hover:bg-accent/40 transition-colors',
              selected.length ? 'border-primary/50 text-foreground' : 'border-border/60 text-muted-foreground',
            )}
          >
            <span className="truncate">
              {selected.length ? `已选 ${selected.length} 项` : placeholder}
            </span>
            <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={6}>
          <Command>
            <CommandInput placeholder={`搜索${label}...`} className="h-9" />
            <CommandList className="max-h-52">
              <CommandEmpty>无匹配结果</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem key={opt} onSelect={() => toggle(opt)} className="flex items-center justify-between text-sm">
                    <span className="truncate">{opt}</span>
                    {selectedSet.has(opt) && <Check className="ml-2 h-4 w-4 shrink-0 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
              {v}
              <button type="button" aria-label={`移除 ${v}`} onClick={() => toggle(v)} className="rounded-full hover:bg-primary/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 排序选择器 ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'desc' as const, label: '最新优先' },
  { value: 'asc' as const, label: '最早优先' },
  { value: undefined, label: '默认排序' },
]

function SortSelect({ value, onChange }: { value: 'desc' | 'asc' | undefined; onChange: (v: 'desc' | 'asc' | undefined) => void }) {
  const [open, setOpen] = useState(false)
  const label = SORT_OPTIONS.find((o) => o.value === value)?.label ?? '排序'

  return (
    <div className="w-full">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">排序</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm',
              'bg-background/60 hover:bg-accent/40 transition-colors',
              value !== undefined ? 'border-primary/50 text-foreground' : 'border-border/60 text-muted-foreground',
            )}
          >
            <span>{label}</span>
            <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start" sideOffset={6}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                opt.value === value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent/50',
              )}
            >
              {opt.label}
              {opt.value === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── 标签逻辑切换 ────────────────────────────────────────────────────────────
function TagOperatorToggle({ value, onChange }: { value: 'and' | 'or'; onChange: (v: 'and' | 'or') => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">标签逻辑：</span>
      {(['and', 'or'] as const).map((op) => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={cn(
            'rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors',
            value === op ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent',
          )}
        >
          {op.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

// ─── 筛选面板内容 ────────────────────────────────────────────────────────────
function FilterPanel({
  filterOptions, tagOptions, showSort,
  cameras, lenses, tags, tagsOperator, sort,
  setCameras, setLenses, setTags, setTagsOperator, setSort, onReset,
}: {
  filterOptions?: { cameras: string[]; lenses: string[] }
  tagOptions?: string[]
  showSort: boolean
  cameras: string[]; lenses: string[]; tags: string[]; tagsOperator: 'and' | 'or'
  sort: 'desc' | 'asc' | undefined
  setCameras: (v: string[]) => void; setLenses: (v: string[]) => void
  setTags: (v: string[]) => void; setTagsOperator: (v: 'and' | 'or') => void
  setSort: (v: 'desc' | 'asc' | undefined) => void; onReset: () => void
}) {
  const hasAny = cameras.length > 0 || lenses.length > 0 || tags.length > 0

  return (
    <div className="space-y-5">
      {showSort && <SortSelect value={sort} onChange={setSort} />}
      {(filterOptions?.cameras?.length ?? 0) > 0 && (
        <InlineMultiSelect label="相机" placeholder="选择相机型号" options={filterOptions!.cameras} selected={cameras} onChange={setCameras} />
      )}
      {(filterOptions?.lenses?.length ?? 0) > 0 && (
        <InlineMultiSelect label="镜头" placeholder="选择镜头型号" options={filterOptions!.lenses} selected={lenses} onChange={setLenses} />
      )}
      {(tagOptions?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <InlineMultiSelect label="标签" placeholder="选择标签" options={tagOptions!} selected={tags} onChange={setTags} />
          {tags.length > 1 && <TagOperatorToggle value={tagsOperator} onChange={setTagsOperator} />}
        </div>
      )}
      {hasAny && (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-destructive/40 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          清除全部筛选
        </button>
      )}
    </div>
  )
}

// ─── Pill ────────────────────────────────────────────────────────────────────
function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
      <span className="truncate">{label}</span>
      <button type="button" aria-label={`移除 ${label}`} onClick={onRemove} className="shrink-0 rounded-full p-2 -m-1 hover:bg-primary/20 touch-manipulation">
        <X className="h-3 w-3" />
      </button>
    </span>
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

  const {
    cameraFilter, lensFilter, tagsFilter, tagsOperator, sortByShootTime,
    setCameraFilter, setLensFilter, setTagsFilter, setTagsOperator, setSortByShootTime, resetFilters,
  } = useFilterStore()

  const filters: ImageFilters & { tagsOperator?: 'and' | 'or' } | undefined = useMemo(() => {
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

  const activeCount = cameraFilter.length + lensFilter.length + tagsFilter.length

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
    <TooltipProvider delayDuration={300}>
      {/* ── 画廊内容 ── */}
      <div>
        {currentStyle === 'waterfall'
          ? <WaterfallGallery {...galleryProps} />
          : <SimpleGallery {...galleryProps} />}
      </div>

      {/* ── 悬浮工具组（桌面 + 移动共用，右下角） ── */}
      {enableFilters && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-2">

          {/* 激活筛选 pill 摘要（有筛选时向上展开） */}
          {activeCount > 0 && (
            <div className="flex flex-col items-end gap-1.5 max-w-[200px]">
              {cameraFilter.map((v) => (
                <Pill key={`cam:${v}`} label={v} onRemove={() => setCameraFilter(cameraFilter.filter((c) => c !== v))} />
              ))}
              {lensFilter.map((v) => (
                <Pill key={`lens:${v}`} label={v} onRemove={() => setLensFilter(lensFilter.filter((l) => l !== v))} />
              ))}
              {tagsFilter.map((v) => (
                <Pill key={`tag:${v}`} label={`#${v}`} onRemove={() => setTagsFilter(tagsFilter.filter((t) => t !== v))} />
              ))}
            </div>
          )}

          {/* 工具按钮组 */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-border/40 bg-background/80 backdrop-blur-[12px] p-1.5 shadow-lg">

            {/* 排序（仅 /albums 页） */}
            {props.album === '/' && (
              <>
                
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={sortByShootTime === 'desc' ? '最新优先' : sortByShootTime === 'asc' ? '最早优先' : '默认排序'}
                        onClick={() => setSortByShootTime(
                          sortByShootTime === undefined ? 'desc' : sortByShootTime === 'desc' ? 'asc' : undefined
                        )}
                        className={cn(
                          'relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all duration-200',
                          sortByShootTime !== undefined
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="text-xs">
                      {sortByShootTime === 'desc' ? '最新优先（点击切换）' : sortByShootTime === 'asc' ? '最早优先（点击切换）' : '默认排序'}
                    </TooltipContent>
                  </Tooltip>
                

                <div className="h-6 w-px bg-border/60" />
              </>
            )}

            {/* 布局切换 */}
            
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={currentStyle === 'waterfall' ? '切换到单列' : '切换到瀑布流'}
                    onClick={toggleTheme}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
                  >
                    {currentStyle === 'waterfall' ? <Rows className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="text-xs">
                  {currentStyle === 'waterfall' ? '切换到单列' : '切换到瀑布流'}
                </TooltipContent>
              </Tooltip>
            

            <div className="h-6 w-px bg-border/60" />

            {/* 筛选 */}
            
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    aria-expanded={sheetOpen}
                    aria-controls="filter-sheet"
                    aria-label={activeCount > 0 ? `筛选（已选 ${activeCount} 项）` : '筛选'}
                    className={cn(
                      'relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all duration-200',
                      activeCount > 0 || sheetOpen
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold leading-none text-primary-foreground">
                        {activeCount > 9 ? '9+' : activeCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="text-xs">
                  {activeCount > 0 ? `筛选（已选 ${activeCount} 项）` : '筛选'}
                </TooltipContent>
              </Tooltip>
            
          </div>
        </div>
      )}

      {/* ── 画廊内容 ── */}
      <div>
        {currentStyle === 'waterfall'
          ? <WaterfallGallery {...galleryProps} />
          : <SimpleGallery {...galleryProps} />}
      </div>

      {/* ── 筛选面板（Sheet）── */}
      {enableFilters && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            id="filter-sheet"
            side={isMobile ? 'bottom' : 'right'}
            className={cn(
              'flex flex-col gap-0 p-0',
              isMobile ? 'h-[85dvh] rounded-t-2xl' : 'w-80 sm:w-96',
            )}
          >
            <SheetHeader className="flex-row items-center justify-between border-b px-5 py-4 shrink-0">
              <SheetTitle className="text-base font-semibold">筛选 & 排序</SheetTitle>
              {activeCount > 0 && (
                <button type="button" onClick={resetFilters} className="text-xs text-destructive hover:underline">
                  清除全部
                </button>
              )}
            </SheetHeader>

            {isMobile && (
              <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/30" />
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel {...filterPanelProps} />
            </div>

            {isMobile && (
              <div className="shrink-0 border-t px-5 py-4 bg-background">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  完成
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </TooltipProvider>
  )
}
