'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ImageFilters, ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery'
import WaterfallGallery from '~/components/layout/theme/waterfall/main/waterfall-gallery'
import {
  Button,
  Drawer,
  Flex,
  FloatButton,
  Input,
  Radio,
  Segmented,
  Tag,
  theme,
  Typography,
} from 'antd'
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  BarsOutlined,
  SlidersOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useFilterStore } from '~/lib/store/filter-store'
import { useIsMobile } from '~/hooks/use-mobile'
import { useTranslations } from 'next-intl'

interface ThemeGalleryClientProps extends ImageHandleProps {
  systemStyle: string
  preferredStyle?: 'waterfall' | 'single'
  enableFilters?: boolean
  filterOptions?: { cameras: string[]; lenses: string[] }
  tagOptions?: string[]
  /** 预设标签（如 /tag/:tag 页）：挂载时写入筛选，卸载时清空全局筛选状态 */
  presetTags?: string[]
}

// ─── 排序 segment（antd Segmented 分段控制器） ────────────────────────────────
function SortSegment({
  value,
  onChange,
}: {
  value: 'desc' | 'asc' | undefined
  onChange: (v: 'desc' | 'asc' | undefined) => void
}) {
  const { token } = theme.useToken()
  const t = useTranslations('GalleryFilter')
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, fontWeight: 500 }}>
        {t('sortLabel')}
      </Typography.Text>
      <Segmented
        block
        style={{ marginTop: token.marginXS }}
        value={value ?? 'default'}
        onChange={(v) => onChange(v === 'default' ? undefined : (v as 'desc' | 'asc'))}
        options={[
          { label: t('sortDefault'), value: 'default' },
          { label: t('sortLatest'), value: 'desc' },
          { label: t('sortEarliest'), value: 'asc' },
        ]}
      />
    </div>
  )
}

// ─── 多选列表（antd Input 搜索 + CheckableTag 多选标签） ──────────────────────
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
  const { token } = theme.useToken()
  const t = useTranslations('GalleryFilter')
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
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginXS }}>
        <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, fontWeight: 500 }}>
          {label}
        </Typography.Text>
        {selected.length > 0 && (
          <Button type="text" size="small" onClick={() => onChange([])}>
            {t('clear')}
          </Button>
        )}
      </Flex>

      {/* 搜索框（选项多时有用） */}
      {options.length > 6 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchOptionsPlaceholder', { label })}
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          allowClear
          style={{ marginBottom: token.marginXS }}
        />
      )}

      {/* CheckableTag 多选标签，自然换行 */}
      {/* antd v6 CheckableTag 未选中态无边框无底色，选项会呈现为粘连裸文字；
          双态都给边界：未选中 = 描边 + 浅填充底，选中 = 主色描边（主色填充由 antd 自带） */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
        {filtered.map((opt) => {
          const checked = selectedSet.has(opt)
          return (
            <Tag.CheckableTag
              key={opt}
              checked={checked}
              onChange={() => toggle(opt)}
              // antd v6 已内置 role="checkbox"/aria-checked/tabIndex/Space 切换，这里仅补 Enter
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  toggle(opt)
                }
              }}
              style={{
                fontSize: token.fontSizeSM,
                padding: '4px 12px',
                borderRadius: token.borderRadiusSM,
                border: `1px solid ${checked ? token.colorPrimary : token.colorBorderSecondary}`,
                background: checked ? undefined : token.colorFillQuaternary,
              }}
            >
              {opt}
            </Tag.CheckableTag>
          )
        })}
        {filtered.length === 0 && (
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {t('noMatch')}
          </Typography.Text>
        )}
      </div>
    </div>
  )
}

// ─── 标签逻辑 AND / OR（antd Radio.Group 官方单选按钮组） ─────────────────────
function TagOperatorSegment({
  value,
  onChange,
}: {
  value: 'and' | 'or'
  onChange: (v: 'and' | 'or') => void
}) {
  const t = useTranslations('GalleryFilter')
  return (
    <Flex gap={8} align="center">
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t('tagMatchLabel')}
      </Typography.Text>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
        options={[
          { label: t('matchAll'), value: 'and' },
          { label: t('matchAny'), value: 'or' },
        ]}
      />
    </Flex>
  )
}

// ─── 关键字搜索（防抖 400ms 提交） ───────────────────────────────────────────
function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { token } = theme.useToken()
  const t = useTranslations('GalleryFilter')
  const [kw, setKw] = useState(value)

  useEffect(() => { setKw(value) }, [value])

  useEffect(() => {
    if (kw === value) return
    const timer = setTimeout(() => onChange(kw), 400)
    return () => clearTimeout(timer)
  }, [kw, value, onChange])

  return (
    <Input
      value={kw}
      onChange={(e) => setKw(e.target.value)}
      placeholder={t('searchImagesPlaceholder')}
      prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
      allowClear
    />
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
  search,
  setCameras,
  setLenses,
  setTags,
  setTagsOperator,
  setSort,
  setSearch,
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
  search: string
  setCameras: (v: string[]) => void
  setLenses: (v: string[]) => void
  setTags: (v: string[]) => void
  setTagsOperator: (v: 'and' | 'or') => void
  setSort: (v: 'desc' | 'asc' | undefined) => void
  setSearch: (v: string) => void
  onReset: () => void
}) {
  const hasAny = cameras.length > 0 || lenses.length > 0 || tags.length > 0 || sort !== undefined || search.trim().length > 0
  const { token } = theme.useToken()
  const t = useTranslations('GalleryFilter')

  return (
    <Flex vertical gap={token.marginLG}>
      <SearchBox value={search} onChange={setSearch} />

      {showSort && <SortSegment value={sort} onChange={setSort} />}

      <ChipMultiSelect
        label={t('camera')}
        options={filterOptions?.cameras ?? []}
        selected={cameras}
        onChange={setCameras}
      />

      <ChipMultiSelect
        label={t('lens')}
        options={filterOptions?.lenses ?? []}
        selected={lenses}
        onChange={setLenses}
      />

      <ChipMultiSelect
        label={t('tag')}
        options={tagOptions ?? []}
        selected={tags}
        onChange={setTags}
      />

      {tags.length > 1 && (
        <TagOperatorSegment value={tagsOperator} onChange={setTagsOperator} />
      )}

      {hasAny && (
        <Button block type="primary" onClick={onReset}>
          {t('clearAllFilters')}
        </Button>
      )}
    </Flex>
  )
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function ThemeGalleryClient({
  systemStyle,
  preferredStyle,
  enableFilters = false,
  filterOptions,
  tagOptions,
  presetTags,
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
    cameraFilter,
    lensFilter,
    tagsFilter,
    tagsOperator,
    sortByShootTime,
    search,
    setCameraFilter,
    setLensFilter,
    setTagsFilter,
    setTagsOperator,
    setSortByShootTime,
    setSearch,
    resetFilters,
  } = useFilterStore()

  // 预设标签（/tag/:tag 页）：挂载时写入全局筛选，卸载时清空，
  // 避免预设状态泄漏到 /albums 等共用全局筛选状态的页面。
  // 依赖用 join 后的字符串：用户在面板中自行增删标签不会触发覆写。
  const presetKey = useMemo(() => presetTags?.join('|') ?? '', [presetTags])
  useEffect(() => {
    if (!presetKey) return
    setTagsFilter(presetKey ? presetKey.split('|') : [])
    return () => resetFilters()
  }, [presetKey, setTagsFilter, resetFilters])

  const filters: (ImageFilters & { tagsOperator?: 'and' | 'or' }) | undefined = useMemo(() => {
    if (!enableFilters) return undefined
    return {
      cameras: cameraFilter.length ? cameraFilter : undefined,
      lenses: lensFilter.length ? lensFilter : undefined,
      tags: tagsFilter.length ? tagsFilter : undefined,
      tagsOperator: tagsFilter.length > 0 ? tagsOperator : undefined,
      search: search.trim() ? search.trim() : undefined,
    }
  }, [enableFilters, cameraFilter, lensFilter, tagsFilter, tagsOperator, search])

  const toggleTheme = () => {
    setUserOverridden(true)
    setCurrentStyle((prev) => (prev === 'waterfall' ? 'single' : 'waterfall'))
  }

  const cycleSort = () => {
    setSortByShootTime(
      sortByShootTime === undefined ? 'desc' : sortByShootTime === 'desc' ? 'asc' : undefined,
    )
  }

  const activeCount = cameraFilter.length + lensFilter.length + tagsFilter.length + (search.trim() ? 1 : 0)
  const hasActivity = activeCount > 0 || sortByShootTime !== undefined
  const t = useTranslations('GalleryFilter')
  const sortLabel = sortByShootTime === 'desc' ? t('sortLatest') : sortByShootTime === 'asc' ? t('sortEarliest') : t('sortDefault')

  // 触屏设备：antd FloatButton 的 tooltip（hover 触发）会拦截首次点按——
  // iOS/Android 首触仿真 mouseenter 只弹提示气泡不触发 click（表现为"首点只显示文本框"）。
  // 触屏不渲染 tooltip，仅桌面保留；aria-label 保留保证可访问性。
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])
  const hoverTip = (text: string) => (isTouchDevice ? undefined : text)

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
    search,
    setCameras: setCameraFilter,
    setLenses: setLensFilter,
    setTags: setTagsFilter,
    setTagsOperator,
    setSort: setSortByShootTime,
    setSearch,
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
        <FloatButton
          shape="circle"
          icon={currentStyle === 'waterfall' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          tooltip={hoverTip(currentStyle === 'waterfall' ? t('switchToSingle') : t('switchToWaterfall'))}
          aria-label={currentStyle === 'waterfall' ? t('switchToSingle') : t('switchToWaterfall')}
          onClick={toggleTheme}
          style={{ insetInlineEnd: 20, insetBlockEnd: 24 }}
        />
      )}

      {/* ── /albums 页：常驻直触发按钮组 ── */}
      {/* 不用 trigger 菜单模式：菜单展开动画期（约 300ms 平移+淡入）内点击会命中
          尚未到位/透明的元素而被吞掉，且"先开菜单再点动作"本身是两段式交互，
          移动端表现为需要二次点击。改为常驻按钮组，每个按钮单击直接触发。 */}
      {enableFilters && (
        <FloatButton.Group
          shape="circle"
          style={{ insetInlineEnd: 20, insetBlockEnd: 24 }}
        >
          <FloatButton
            shape="circle"
            icon={currentStyle === 'waterfall' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
            tooltip={hoverTip(currentStyle === 'waterfall' ? t('single') : t('waterfall'))}
            aria-label={currentStyle === 'waterfall' ? t('switchToSingle') : t('switchToWaterfall')}
            onClick={toggleTheme}
          />
          {props.album === '/' && (
            <FloatButton
              shape="circle"
              icon={
                sortByShootTime === 'desc' ? (
                  <SortDescendingOutlined />
                ) : sortByShootTime === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <BarsOutlined />
                )
              }
              tooltip={hoverTip(t('sortTooltip', { sort: sortLabel }))}
              aria-label={t('sortToggleAria', { sort: sortLabel })}
              // 激活态：antd 官方语义 —— 主色圆钮表示当前生效项
              type={sortByShootTime !== undefined ? 'primary' : 'default'}
              onClick={cycleSort}
            />
          )}
          <FloatButton
            shape="circle"
            icon={<SlidersOutlined />}
            tooltip={hoverTip(t('filter'))}
            aria-label={t('filter')}
            badge={activeCount > 0 ? { count: activeCount, overflowCount: 9 } : undefined}
            onClick={() => setSheetOpen(true)}
          />
        </FloatButton.Group>
      )}

      {/* ── 筛选面板抽屉（antd Drawer：移动端底部 / 桌面端右侧） ── */}
      {enableFilters && (
        <Drawer
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          placement={isMobile ? 'bottom' : 'right'}
          size={isMobile ? '90dvh' : 384}
          title={t('title')}
          extra={
            hasActivity && (
              <Button type="text" size="small" onClick={resetFilters}>
                {t('clearAll')}
              </Button>
            )
          }
          footer={
            isMobile ? (
              <Button block type="primary" onClick={() => setSheetOpen(false)}>
                {t('done')}
              </Button>
            ) : undefined
          }
          styles={
            isMobile
              ? { content: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } }
              : undefined
          }
        >
          <FilterPanel {...filterPanelProps} />
        </Drawer>
      )}
    </>
  )
}
