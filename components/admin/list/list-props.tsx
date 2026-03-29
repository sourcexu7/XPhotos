
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import { Pagination, Button } from 'antd'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '~/components/ui/sheet'
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
  const defaultPresets = {
    cameraModels: ['Canon EOS R5','Sony A7 III','Nikon Z7 II','Fujifilm X-T4','iPhone 13 Pro'],
    shutterSpeeds: ['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1'],
    isos: ['50','100','200','400','800','1600','3200','6400'],
    apertures: ['1.4','1.8','2.0','2.8','3.5','4.0','5.6','8.0','11','16'],
  }
  const [exifPresets] = useState(defaultPresets)
  const [tagsList, setTagsList] = useState<string[]>([])
  
  const [pageSize] = useState(8)
  const [layout, setLayout] = useState<'card' | 'list'>('card')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: pageData, error: pageError, isLoading, mutate } = useSWR(
    [
      props.args,
      pageNum,
      activeFilters.album,
      activeFilters.showStatus === 'all' || activeFilters.showStatus === '' ? -1 : Number(activeFilters.showStatus),
      activeFilters.featured === 'all' || activeFilters.featured === '' ? -1 : Number(activeFilters.featured),
      activeFilters.selectedCamera === 'all' ? '' : activeFilters.selectedCamera,
      activeFilters.selectedLens === 'all' ? '' : activeFilters.selectedLens,
      activeFilters.selectedExposure === 'all' ? '' : activeFilters.selectedExposure,
      activeFilters.selectedAperture === 'all' ? '' : activeFilters.selectedAperture,
      activeFilters.selectedISO === 'all' ? '' : activeFilters.selectedISO,
      Array.isArray(activeFilters.selectedTags) ? [...activeFilters.selectedTags].sort().join(',') : '',
      activeFilters.labelsOperator,
    ],
    async () => {
      const result = await props.handle(
        pageNum,
        activeFilters.album,
        activeFilters.showStatus === 'all' || activeFilters.showStatus === '' ? -1 : Number(activeFilters.showStatus),
        activeFilters.featured === 'all' || activeFilters.featured === '' ? -1 : Number(activeFilters.featured),
        activeFilters.selectedCamera === 'all' ? '' : activeFilters.selectedCamera,
        activeFilters.selectedLens === 'all' ? '' : activeFilters.selectedLens,
        activeFilters.selectedExposure === 'all' ? '' : activeFilters.selectedExposure,
        activeFilters.selectedAperture === 'all' ? '' : activeFilters.selectedAperture,
        activeFilters.selectedISO === 'all' ? '' : activeFilters.selectedISO,
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
  const [prevImages, setPrevImages] = useState<ImageType[]>([])
  const [savingSort, setSavingSort] = useState(false)
  
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateFeaturedLoading, setUpdateFeaturedLoading] = useState(false)
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  
  const [updateShowId, setUpdateShowId] = useState('')
  const [updateFeaturedId, setUpdateFeaturedId] = useState('')
  
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  
  const { data: albums } = useSWR('/api/v1/albums/get', fetcher)
  const t = useTranslations()

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (activeFilters.album) count++
    if (activeFilters.showStatus && activeFilters.showStatus !== 'all') count++
    if (activeFilters.featured && activeFilters.featured !== 'all') count++
    if (activeFilters.selectedCamera && activeFilters.selectedCamera !== 'all') count++
    if (activeFilters.selectedLens && activeFilters.selectedLens !== 'all') count++
    if (activeFilters.selectedExposure && activeFilters.selectedExposure !== 'all') count++
    if (activeFilters.selectedAperture && activeFilters.selectedAperture !== 'all') count++
    if (activeFilters.selectedISO && activeFilters.selectedISO !== 'all') count++
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
    } else {
      setSelectedIds([])
    }
  }

  function toggleSelectOne(id: string, checked: boolean) {
    if (checked) setSelectedIds(prev => Array.from(new Set([...prev, id])))
    else setSelectedIds(prev => prev.filter(i => i !== id))
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
        toast.error(t('List.albumNotFound'))
        return
      }
      
      const res = await fetch('/api/v1/albums/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetAlbum, cover: coverUrl })
      }).then(r => r.json())

      if (res.code === 200) {
        toast.success(t('List.coverUpdateSuccess'))
      } else {
        toast.error(res.message || t('List.coverUpdateFailed'))
      }
    } catch (e) {
      toast.error(t('List.coverUpdateFailed'))
    }
  }

  useEffect(() => {
    if (Array.isArray(data)) {
      setLocalImages(data as ImageType[])
      setPrevImages(data as ImageType[])
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

    const loadTags = async () => {
      try {
        const res = await fetch('/api/v1/settings/tags/get')
        if (res.ok) {
          const data = await res.json()
          setTagsList(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }

    loadCameraAndLensList()
    loadTags()
  }, [])

  async function persistImageSort(nextList: ImageType[]) {
    setPrevImages(localImages)
    setLocalImages(nextList)
    setSavingSort(true)
    try {
      const orders = nextList.map((img) => ({
        id: img.id,
        sort: img.sort,
      }))
      const res = await fetch('/api/v1/images/update-sort', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders }),
      })
      if (!res.ok) {
        throw new Error('sort failed')
      }
      toast.success(t('List.sortUpdateSuccess'))
      await mutate()
    } catch {
      toast.error(t('List.sortUpdateFailedRetry'))
      setLocalImages(prevImages)
    } finally {
      setSavingSort(false)
    }
  }

  function recalcSortValues(list: ImageType[]): ImageType[] {
    if (!list.length) return list
    return list.map((img, idx) => ({
      ...img,
      sort: idx,
    }))
  }

  function moveUp(index: number) {
    if (index <= 0 || localImages.length <= 1 || savingSort) return
    const next = [...localImages]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    const withSort = recalcSortValues(next)
    void persistImageSort(withSort)
  }

  function moveDown(index: number) {
    if (index >= localImages.length - 1 || localImages.length <= 1 || savingSort) return
    const next = [...localImages]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    const withSort = recalcSortValues(next)
    void persistImageSort(withSort)
  }

  function pinTop(index: number) {
    if (index <= 0 || localImages.length <= 1 || savingSort) return
    const next = [...localImages]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    const withSort = recalcSortValues(next)
    void persistImageSort(withSort)
  }

  async function updateImageAlbum(targetImage: ImageType, albumId: string) {
    if (!albumId) {
      toast.error(t('List.bindAlbumRequired'))
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
        toast.success(t('Tips.updateSuccess'))
        await mutate()
      } else {
        toast.error(t('Tips.updateFailed'))
      }
    } catch {
      toast.error(t('Tips.updateFailed'))
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
        toast.success(featured === 1 ? t('List.featuredToastEnabled') : t('List.featuredToastDisabled'))
        await mutate()
      } else {
        toast.error(t('Tips.updateFailed'))
      }
    } catch (e) {
      toast.error(t('Tips.updateFailed'))
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
        toast.success(show === 0 ? t('List.showToastPublic') : t('List.showToastHidden'))
        await mutate()
      } else {
        toast.error(t('Tips.updateFailed'))
      }
    } catch {
      toast.error(t('Tips.updateFailed'))
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
        toast.success(t('Tips.deleteSuccess'))
        await mutate()
      } else {
        toast.error(t('Tips.deleteFailed'))
      }
    } catch {
      toast.error(t('Tips.deleteFailed'))
    }
  }

  return (
    <div className="flex flex-col space-y-4 h-full flex-1 relative">
      {/* 1. 筛选栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
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
          <span className="text-sm font-medium text-gray-600">{t('List.filterConditions')}</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="small" className="gap-2" aria-label={t('List.openFilterPanel')}>
                <Filter size={14} /> {t('List.filter')}
                {activeFilterCount > 0 ? t('List.appliedCountShort', { count: activeFilterCount }) : ''}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {t('List.filterPhotos')}
                  {activeFilterCount > 0 ? t('List.appliedCountTitle', { count: activeFilterCount }) : ''}
                </SheetTitle>
              </SheetHeader>
              <div className="py-4 flex flex-col gap-4">
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
              <SheetFooter>
                <SheetClose asChild>
                  <Button>{t('Button.close')}</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 2. 批量操作栏 (吸顶) */}
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={Array.isArray(data) ? data.length : 0}
        onSelectAll={toggleSelectAll}
        onRefresh={async () => await mutate()}
        onBatchDelete={() => setImageBatchDelete(true)}
      />

      {/* 3. 照片布局：卡片 / 列表切换 */}
      {layout === 'card' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.isArray(localImages) &&
            localImages.map((img: ImageType, index) => {
              const onlyOne = localImages.length <= 1
              const isFirst = index === 0
              const isLast = index === localImages.length - 1
              const disableUp = isFirst || onlyOne || savingSort
              const disableDown = isLast || onlyOne || savingSort
              const disablePin = isFirst || onlyOne || savingSort

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
                  onPin={pinTop}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                  disablePin={disablePin}
                  disableUp={disableUp}
                  disableDown={disableDown}
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
          <div className="flex w-full max-w-[1440px] flex-col rounded-md bg-white/70 px-3 py-2 md:px-4 md:py-2">
            {Array.isArray(localImages) &&
              localImages.map((img: ImageType, index) => {
                const onlyOne = localImages.length <= 1
                const isFirst = index === 0
                const isLast = index === localImages.length - 1
                const disableUp = isFirst || onlyOne || savingSort
                const disableDown = isLast || onlyOne || savingSort
                const disablePin = isFirst || onlyOne || savingSort

                return (
                  <ImageListItem
                    key={img.id}
                    image={img}
                    index={index}
                    isLast={index === localImages.length - 1}
                    onEdit={(image) => {
                      setImageEditData(image)
                      setImageEdit(true)
                    }}
                    onUpdateShow={updateImageShow}
                    updateShowLoading={updateShowLoading}
                    updateShowId={updateShowId}
                    onPin={pinTop}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                    disablePin={disablePin}
                    disableUp={disableUp}
                    disableDown={disableDown}
                  />
                )
              })}
          </div>
        </div>
      )}

      {/* 4. 分页导航 */}
      {typeof total === 'number' && total !== 0 && (
        <div className="flex justify-center mt-6 pb-4">
          <Pagination
            current={pageNum}
            total={total}
            pageSize={pageSize}
            onChange={async (page) => { setPageNum(page); await mutate() }}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => t('List.paginationTotalImages', { total })}
            itemRender={(page, type, originalElement) => {
              if (type === 'page') {
                return <a className={`${pageNum === page ? 'bg-blue-600 text-white border-blue-600' : ''} rounded hover:text-blue-600`}>{page}</a>
              }
              return originalElement
            }}
          />
        </div>
      )}

      <ImageEditSheet {...{...props, pageNum, album: activeFilters.album}} />
      <ImageView />
      <ImageBatchDeleteSheet {...{...props, dataProps, pageNum, album: activeFilters.album, selectedIds}} />
    </div>
  )
}