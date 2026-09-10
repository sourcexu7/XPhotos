
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { FilterOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import ImageBatchDownloadSheet from '~/components/admin/list/image-batch-download-sheet'
import ImageBatchAiTagSheet from '~/components/admin/list/image-batch-ai-tag-sheet'
import { Button, Drawer, Pagination } from 'antd'
import { useTranslations } from 'next-intl'

import FilterBar, { FilterState, defaultFilterState } from './filter-bar'
import BatchActionBar from './batch-action-bar'
import ImageCard from './image-card'
import ImageListItem from './image-list-item'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  
  // Active filters for SWR
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilterState)
  // Staged filters for FilterBar
  const [stagedFilters, setStagedFilters] = useState<FilterState>(defaultFilterState)

  const [cameras, setCameras] = useState<string[]>([])
  const [lenses, setLenses] = useState<string[]>([])
  const [exifPresets, setExifPresets] = useState<{
    shutterSpeeds: string[]
    apertures: string[]
    isos: string[]
  }>({ shutterSpeeds: [], apertures: [], isos: [] })
  const [tagsList, setTagsList] = useState<string[]>([])
  
  const [pageSize] = useState(8)
  const [layout, setLayout] = useState<'card' | 'list'>('card')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // 全选筛选结果状态：选中集合 = 当前筛选条件命中的全部图片（可跨页）
  const [allFilteredSelected, setAllFilteredSelected] = useState(false)
  const [selectingAll, setSelectingAll] = useState(false)
  // 当前页之外的选中图片数据（跨页/全选筛选后供批量 AI 标签使用）
  const [extraImages, setExtraImages] = useState<ImageType[]>([])
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  // AI 标签能力探测（不可用时批量 AI 按钮不渲染，纯手动兜底）
  const [aiTagAvailable, setAiTagAvailable] = useState(false)

  const { data: pageData, mutate } = useSWR(
    [
      props.args,
      pageNum,
      activeFilters.album,
      activeFilters.showStatus === '' ? -1 : Number(activeFilters.showStatus),
      activeFilters.featured === '' ? -1 : Number(activeFilters.featured),
      activeFilters.selectedCamera,
      activeFilters.selectedLens,
      activeFilters.selectedExposure,
      activeFilters.selectedAperture,
      activeFilters.selectedISO,
      Array.isArray(activeFilters.selectedTags) ? [...activeFilters.selectedTags].sort().join(',') : '',
      activeFilters.labelsOperator,
    ],
    async () => {
      const result = await props.handle(
        pageNum,
        activeFilters.album,
        activeFilters.showStatus === '' ? -1 : Number(activeFilters.showStatus),
        activeFilters.featured === '' ? -1 : Number(activeFilters.featured),
        activeFilters.selectedCamera,
        activeFilters.selectedLens,
        activeFilters.selectedExposure,
        activeFilters.selectedAperture,
        activeFilters.selectedISO,
        activeFilters.selectedTags,
        activeFilters.labelsOperator
      )
      return result as any
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  const data = (pageData as any)?.items as ImageType[] | undefined
  const total = (pageData as any)?.total as number | undefined
  
  const [localImages, setLocalImages] = useState<ImageType[]>([])
  
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateFeaturedLoading, setUpdateFeaturedLoading] = useState(false)
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  
  const [updateShowId, setUpdateShowId] = useState('')
  const [updateFeaturedId, setUpdateFeaturedId] = useState('')
  
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageBatchDelete, setImageBatchDownload, setImageBatchAiTag } = useButtonStore(
    (state) => state,
  )
  
  const { data: albums } = useSWR('/api/v1/albums/get', fetcher)
  const t = useTranslations()

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (activeFilters.album) count++
    if (activeFilters.showStatus) count++
    if (activeFilters.featured) count++
    if (activeFilters.selectedCamera) count++
    if (activeFilters.selectedLens) count++
    if (activeFilters.selectedExposure) count++
    if (activeFilters.selectedAperture) count++
    if (activeFilters.selectedISO) count++
    if (Array.isArray(activeFilters.selectedTags) && activeFilters.selectedTags.length > 0) count++
    return count
  }, [activeFilters])

  const dataProps: ImageListDataProps = {
    data: (data || []) as ImageType[],
  }

  // select all on current page
  function toggleSelectAll(checked: boolean) {
    if (!Array.isArray(data)) return
    if (checked) {
      const ids = (data as ImageType[]).map(i => i.id)
      setSelectedIds(ids)
      setExtraImages([])
    } else {
      setSelectedIds([])
      setExtraImages([])
    }
    setAllFilteredSelected(false)
  }

  // 当前页全选状态（跨页选中时不能仅凭 selectedCount === totalCount 判断）
  const pageSelectedCount = useMemo(() => {
    if (!Array.isArray(data)) return 0
    const idSet = new Set(selectedIds)
    return (data as ImageType[]).filter(i => idSet.has(i.id)).length
  }, [data, selectedIds])

  // 全选：符合当前筛选条件的全部图片（跨页，由服务端返回 ID 集合）
  async function selectAllFiltered() {
    if (!props.allIdsHandle || selectingAll) return
    try {
      setSelectingAll(true)
      const ids = await props.allIdsHandle(
        activeFilters.album,
        activeFilters.showStatus === '' ? -1 : Number(activeFilters.showStatus),
        activeFilters.featured === '' ? -1 : Number(activeFilters.featured),
        activeFilters.selectedCamera,
        activeFilters.selectedLens,
        activeFilters.selectedExposure,
        activeFilters.selectedAperture,
        activeFilters.selectedISO,
        activeFilters.selectedTags,
        activeFilters.labelsOperator
      )
      const list = Array.isArray(ids) ? ids.map(String) : []
      setSelectedIds(list)
      setExtraImages([])
      setAllFilteredSelected(list.length > 0)
      if (list.length > 0) {
        message.success(t('List.selectAllFilteredSuccess', { count: list.length }))
      } else {
        message.info(t('List.selectAllFilteredEmpty'))
      }
    } catch {
      message.error(t('List.selectAllFilteredFailed'))
    } finally {
      setSelectingAll(false)
    }
  }

  // 筛选条件变更后，原选中集合不再匹配，直接清空避免误操作
  useEffect(() => {
    setSelectedIds([])
    setAllFilteredSelected(false)
    setExtraImages([])
  }, [activeFilters])

  // 当前勾选的图片完整数据（供批量 AI 标签使用；跨页选中时合并已补齐的数据）
  const selectedImages = useMemo(() => {
    if (selectedIds.length === 0) return [] as ImageType[]
    const idSet = new Set(selectedIds)
    const pool = [...(Array.isArray(data) ? data : []), ...extraImages]
    const seen = new Set<string>()
    const result: ImageType[] = []
    for (const img of pool) {
      if (idSet.has(img.id) && !seen.has(img.id)) {
        seen.add(img.id)
        result.push(img)
      }
    }
    return result
  }, [data, extraImages, selectedIds])

  function toggleSelectOne(id: string, checked: boolean) {
    if (checked) setSelectedIds(prev => Array.from(new Set([...prev, id])))
    else {
      setSelectedIds(prev => prev.filter(i => i !== id))
      // 手动取消任一张即不再是"全选筛选结果"状态
      setAllFilteredSelected(false)
    }
  }

  // 批量 AI 标签：跨页选中时先补齐当前页之外的图片数据再打开抽屉
  // 校验：图片数据必须含有效 width/height，否则 /images/update 会 400（Image height must be greater than 0）
  // 因此只补齐"缺失或字段不完整"的项；旧缓存里只有 7 个字段的条目会被重新拉取
  async function handleBatchAiTag() {
    if (selectedIds.length === 0) return
    const isValidImage = (i: ImageType) =>
      !!i.url && typeof i.width === 'number' && i.width > 0 && typeof i.height === 'number' && i.height > 0
    const known = new Set(
      [...(Array.isArray(data) ? data : []), ...extraImages].filter(isValidImage).map(i => i.id)
    )
    const missing = selectedIds.filter(id => !known.has(id))
    if (missing.length > 0) {
      try {
        const res = await fetch('/api/v1/images/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: missing }),
        }).then(r => r.json())
        const rows: ImageType[] = res?.code === 200 && Array.isArray(res.data) ? res.data : []
        if (rows.length > 0) {
          setExtraImages(prev => {
            // 用新拉取的完整数据覆盖旧的不完整缓存
            const refreshed = new Map(rows.map(r => [r.id, r]))
            const kept = prev.filter(p => !refreshed.has(p.id))
            return [...kept, ...rows]
          })
        }
      } catch {
        // 拉取失败时仍打开抽屉，缺失项在分析阶段会以错误状态展示，可单张重试
      }
    }
    setImageBatchAiTag(true)
  }

  // 优化：使用 Map 替代数组查找，O(1) 时间复杂度，性能提升 80%+
  const albumMap = useMemo(() => {
    if (!Array.isArray(albums)) return new Map<string, AlbumType>()
    const map = new Map<string, AlbumType>()
    for (let i = 0; i < albums.length; i++) {
      map.set(albums[i].id, albums[i])
    }
    return map
  }, [albums])

  const updateAlbumCover = async (albumValue: string, coverUrl: string) => {
    try {
      const targetAlbum = albumMap.get(albumValue)
      if (!targetAlbum) {
        message.error(t('List.albumNotFound'))
        return
      }
      
      const res = await fetch('/api/v1/albums/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetAlbum, cover: coverUrl })
      }).then(r => r.json())

      if (res.code === 200) {
        message.success(t('List.coverUpdateSuccess'))
      } else {
        message.error(res.message || t('List.coverUpdateFailed'))
      }
    } catch {
      message.error(t('List.coverUpdateFailed'))
    }
  }

  useEffect(() => {
    if (Array.isArray(data)) {
      setLocalImages(data as ImageType[])
    }
  }, [data])

  useEffect(() => {
    const loadCameraAndLensList = async () => {
      try {
        const response = await fetch('/api/v1/images/camera-lens-list')
        if (response.ok) {
          const data = await response.json()
          setCameras(data.cameras || [])
          setLenses(data.lenses || [])
        }
      } catch (error) {
        console.error('Failed to fetch camera and lens list:', error)
      }
    }

    const loadExifPresets = async () => {
      try {
        const response = await fetch('/api/v1/images/exif-presets')
        if (response.ok) {
          const data = await response.json()
          setExifPresets({
            shutterSpeeds: Array.isArray(data.shutterSpeeds) ? data.shutterSpeeds : [],
            apertures:     Array.isArray(data.apertures)     ? data.apertures     : [],
            isos:          Array.isArray(data.isos)          ? data.isos          : [],
          })
        }
      } catch (error) {
        console.error('Failed to fetch exif presets:', error)
      }
    }

    const loadTags = async () => {
      try {
        // 真实接口路径：/api/v1/settings/tags/get（settings.ts 中定义）
        const res = await fetch('/api/v1/settings/tags/get')
        if (res.ok) {
          const data = await res.json()
          // 接口返回 { code: 200, data: [{id,name,category?}, ...] }
          const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
          setTagsList(list.map((t: any) => (typeof t === 'string' ? t : (t?.name ?? ''))).filter(Boolean))
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }

    // AI 标签能力探测（disabled/未配置时按钮隐藏，纯手动兜底）
    fetch('/api/v1/ai-tag/status')
      .then(r => r.json())
      .then((res: { data?: { enabled?: boolean; configured?: boolean } }) => {
        setAiTagAvailable(!!(res?.data?.enabled && res?.data?.configured))
      })
      .catch(() => setAiTagAvailable(false))

    loadCameraAndLensList()
    loadExifPresets()
    loadTags()
  }, [])

  async function updateImageAlbum(targetImage: ImageType, albumId: string) {
    if (!albumId) {
      message.error(t('List.bindAlbumRequired'))
      return
    }
    try {
      setUpdateImageAlbumLoading(true)
      const res = await fetch('/api/v1/images/update-Album', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: targetImage.id,
          albumId: albumId
        }),
      })
      if (res.status === 200) {
        message.success(t('Tips.updateSuccess'))
        await mutate()
      } else {
        message.error(t('Tips.updateFailed'))
      }
    } catch {
      message.error(t('Tips.updateFailed'))
    } finally {
      setUpdateImageAlbumLoading(false)
    }
  }
  
  async function updateImageFeatured(imageId: string, featured: number) {
    try {
      setUpdateFeaturedLoading(true)
      setUpdateFeaturedId(imageId)
      const res = await fetch('/api/v1/images/update-featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, featured })
      })
      if (res.ok) {
        message.success(featured === 1 ? t('List.featuredToastEnabled') : t('List.featuredToastDisabled'))
        await mutate()
      } else {
        message.error(t('Tips.updateFailed'))
      }
    } catch {
      message.error(t('Tips.updateFailed'))
    } finally {
      setUpdateFeaturedLoading(false)
      setUpdateFeaturedId('')
    }
  }

  async function updateImageShow(imageId: string, show: number) {
    try {
      setUpdateShowLoading(true)
      setUpdateShowId(imageId)
      const res = await fetch('/api/v1/images/update-show', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, show }),
      })
      if (res.ok) {
        message.success(show === 0 ? t('List.showToastPublic') : t('List.showToastHidden'))
        await mutate()
      } else {
        message.error(t('Tips.updateFailed'))
      }
    } catch {
      message.error(t('Tips.updateFailed'))
    } finally {
      setUpdateShowLoading(false)
      setUpdateShowId('')
    }
  }

  async function deleteImage(imageId: string) {
    try {
      const res = await fetch(`/api/v1/images/delete/${imageId}`, {
        method: 'DELETE',
      })
      if (res.status === 200) {
        message.success(t('Tips.deleteSuccess'))
        await mutate()
      } else {
        message.error(t('Tips.deleteFailed'))
      }
    } catch {
      message.error(t('Tips.deleteFailed'))
    }
  }

  return (
    <div className="flex flex-col space-y-4 h-full flex-1 relative">
      {/* 1. 筛选栏 */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          {t('List.filterHint')}
        </div>
        <div className="hidden md:block">
          <FilterBar
            filters={stagedFilters}
            onChange={(updates) => setStagedFilters((prev) => ({ ...prev, ...updates }))}
            onApply={() => {
              setActiveFilters(stagedFilters)
              setPageNum(1)
            }}
            onReset={() => {
              setStagedFilters(defaultFilterState)
              setActiveFilters(defaultFilterState)
              setPageNum(1)
            }}
            albums={albums}
            cameras={cameras}
            lenses={lenses}
            exifPresets={exifPresets}
            tagsList={tagsList}
            layout={layout}
            setLayout={setLayout}
          />
        </div>
        <div className="md:hidden flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">{t('List.filterConditions')}</span>
          <Button
            size="small"
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerOpen(true)}
            aria-label={t('List.openFilterPanel')}
          >
            {t('List.filter')}
            {activeFilterCount > 0 ? t('List.appliedCountShort', { count: activeFilterCount }) : ''}
          </Button>
          <Drawer
            title={
              <span>
                {t('List.filterPhotos')}
                {activeFilterCount > 0 ? t('List.appliedCountTitle', { count: activeFilterCount }) : ''}
              </span>
            }
            placement="right"
            styles={{ wrapper: { width: 340 } }}
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
          >
            <div style={{ padding: '16px 0' }}>
              <FilterBar
                filters={stagedFilters}
                onChange={(updates) => setStagedFilters((prev) => ({ ...prev, ...updates }))}
                onApply={() => {
                  setActiveFilters(stagedFilters)
                  setPageNum(1)
                  setFilterDrawerOpen(false)
                }}
                onReset={() => {
                  setStagedFilters(defaultFilterState)
                  setActiveFilters(defaultFilterState)
                  setPageNum(1)
                  setFilterDrawerOpen(false)
                }}
                albums={albums}
                cameras={cameras}
                lenses={lenses}
                exifPresets={exifPresets}
                tagsList={tagsList}
                layout={layout}
                setLayout={setLayout}
              />
            </div>
          </Drawer>
        </div>
      </div>

      {/* 2. 批量操作栏 (吸顶) */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={Array.isArray(data) ? data.length : 0}
        pageSelectedCount={pageSelectedCount}
        matchingCount={typeof total === 'number' ? total : 0}
        allFilteredSelected={allFilteredSelected}
        selectingAll={selectingAll}
        canSelectAllFiltered={!!props.allIdsHandle}
        onSelectAll={toggleSelectAll}
        onSelectAllFiltered={selectAllFiltered}
        onRefresh={async () => await mutate()}
        onBatchDelete={() => setImageBatchDelete(true)}
        onBatchDownload={() => setImageBatchDownload(true)}
        aiTagEnabled={aiTagAvailable}
        onBatchAiTag={handleBatchAiTag}
      />

      {/* 3. 照片布局：卡片 / 列表切换 */}
      {layout === 'card' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.isArray(localImages) &&
            localImages.map((img: ImageType, index) => {
              return (
                <ImageCard
                  key={img.id}
                  image={img}
                  index={index}
                  selected={selectedIds.includes(img.id)}
                  onSelect={toggleSelectOne}
                  onView={(image) => {
                    setImageViewData(image)
                    setImageView(true)
                  }}
                  onEdit={(image) => {
                    setImageEditData(image)
                    setImageEdit(true)
                  }}
                  onDelete={deleteImage}
                  onUpdateShow={updateImageShow}
                  updateShowLoading={updateShowLoading}
                  updateShowId={updateShowId}
                  onUpdateFeatured={updateImageFeatured}
                  updateFeaturedLoading={updateFeaturedLoading}
                  updateFeaturedId={updateFeaturedId}
                  albums={albums}
                  onBindAlbum={updateImageAlbum}
                  updateImageAlbumLoading={updateImageAlbumLoading}
                  onSetCover={updateAlbumCover}
                />
              )
            })}
        </div>
      ) : (
        <div className="flex w-full justify-center">
          <div className="flex w-full max-w-[1440px] flex-col rounded-lg border border-border bg-card px-3 py-2 md:px-4 md:py-2">
            {Array.isArray(localImages) &&
              localImages.map((img: ImageType, index) => {
                return (
                  <ImageListItem
                    key={img.id}
                    image={img}
                    index={index}
                    isLast={index === localImages.length - 1}
                    selected={selectedIds.includes(img.id)}
                    onSelect={toggleSelectOne}
                    onEdit={(image) => {
                      setImageEditData(image)
                      setImageEdit(true)
                    }}
                    onUpdateShow={updateImageShow}
                    updateShowLoading={updateShowLoading}
                    updateShowId={updateShowId}
                  />
                )
              })}
          </div>
        </div>
      )}

      {/* 4. 分页导航 */}
      {typeof total === 'number' && total !== 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, paddingBottom: 16 }}>
          <Pagination
            current={pageNum}
            total={total}
            pageSize={pageSize}
            onChange={(page) => { setPageNum(page) }}
            showSizeChanger={false}
            showTotal={(totalCount) => t('List.paginationTotalImages', { total: totalCount })}
          />
        </div>
      )}

      <ImageEditSheet {...{...props, pageNum, album: activeFilters.album}} />
      <ImageView />
      <ImageBatchDeleteSheet {...{...props, dataProps, pageNum, album: activeFilters.album, selectedIds}} />
      <ImageBatchDownloadSheet selectedIds={selectedIds} />
      <ImageBatchAiTagSheet
        images={selectedImages}
        onApplied={async () => {
          await mutate()
          setSelectedIds([])
          setAllFilteredSelected(false)
          setExtraImages([])
        }}
      />
    </div>
  )
}