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

interface ThemeGalleryClientProps extends ImageHandleProps {
  systemStyle: string
  preferredStyle?: 'waterfall' | 'single'
  enableFilters?: boolean
  filterOptions?: { cameras: string[]; lenses: string[] }
  tagOptions?: string[]
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
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, fontWeight: 500 }}>
        拍摄时间排序
      </Typography.Text>
      <Segmented
        block
        style={{ marginTop: token.marginXS }}
        value={value ?? 'default'}
        onChange={(v) => onChange(v === 'default' ? undefined : (v as 'desc' | 'asc'))}
        options={[
          { label: '默认', value: 'default' },
          { label: '最新', value: 'desc' },
          { label: '最早', value: 'asc' },
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
            清除
          </Button>
        )}
      </Flex>

      {/* 搜索框（选项多时有用） */}
      {options.length > 6 && (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`搜索${label}…`}
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          allowClear
          style={{ marginBottom: token.marginXS }}
        />
      )}

      {/* CheckableTag 多选标签，自然换行 */}
      <Flex gap={token.marginXS} wrap="wrap">
        {filtered.map((opt) => (
          <Tag.CheckableTag
            key={opt}
            checked={selectedSet.has(opt)}
            onChange={() => toggle(opt)}
            style={{ fontSize: token.fontSizeSM, padding: '3px 10px', borderRadius: token.borderRadiusSM }}
          >
            {opt}
          </Tag.CheckableTag>
        ))}
        {filtered.length === 0 && (
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            无匹配结果
          </Typography.Text>
        )}
      </Flex>
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
  return (
    <Flex gap={8} align="center">
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        标签匹配：
      </Typography.Text>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
        options={[
          { label: '全部匹配', value: 'and' },
          { label: '任一匹配', value: 'or' },
        ]}
      />
    </Flex>
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
  const { token } = theme.useToken()

  return (
    <Flex vertical gap={token.marginLG}>
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
        <Button block danger onClick={onReset}>
          清除全部筛选
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
  const sortLabel = sortByShootTime === 'desc' ? '最新' : sortByShootTime === 'asc' ? '最早' : '默认'

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
        <FloatButton
          shape="circle"
          icon={currentStyle === 'waterfall' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          tooltip={currentStyle === 'waterfall' ? '切换为单列' : '切换为瀑布流'}
          aria-label={currentStyle === 'waterfall' ? '切换为单列' : '切换为瀑布流'}
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
            tooltip={currentStyle === 'waterfall' ? '单列' : '瀑布流'}
            aria-label={currentStyle === 'waterfall' ? '切换为单列' : '切换为瀑布流'}
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
              tooltip={`拍摄时间排序：${sortLabel}`}
              aria-label={`拍摄时间排序：${sortLabel}，点击切换`}
              // 激活态：antd 官方语义 —— 主色圆钮表示当前生效项
              type={sortByShootTime !== undefined ? 'primary' : 'default'}
              onClick={cycleSort}
            />
          )}
          <FloatButton
            shape="circle"
            icon={<SlidersOutlined />}
            tooltip="筛选"
            aria-label="筛选"
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
          title="筛选 & 排序"
          extra={
            hasActivity && (
              <Button type="text" danger size="small" onClick={resetFilters}>
                清除全部
              </Button>
            )
          }
          footer={
            isMobile ? (
              <Button block type="primary" onClick={() => setSheetOpen(false)}>
                完成
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
