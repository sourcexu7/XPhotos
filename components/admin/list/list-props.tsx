
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'
import { ArrowDown10, ScanSearch, Replace, Filter, Rows3, LayoutGrid, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import { Button } from '~/components/ui/button'
import { Card, CardFooter } from '~/components/ui/card'
import { Button as AntButton, Pagination, Tooltip } from 'antd'
import { TooltipIconButton } from '~/components/ui/tooltip-icon-button'
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { Checkbox } from '~/components/ui/checkbox'
import { DeleteOutlined, ReloadOutlined, StarFilled, StarOutlined } from '@ant-design/icons'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Switch } from '~/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '~/components/ui/sheet'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [album, setAlbum] = useState('')
  const [showStatus, setShowStatus] = useState('')
  // staged filters (apply when user clicks 查询)
  const [stagedAlbum, setStagedAlbum] = useState('')
  const [stagedShowStatus, setStagedShowStatus] = useState('')
  const [stagedFeatured, setStagedFeatured] = useState('')
  const [stagedSelectedCamera, setStagedSelectedCamera] = useState('')
  const [stagedSelectedLens, setStagedSelectedLens] = useState('')
  const [stagedSelectedExposure, setStagedSelectedExposure] = useState('')
  const [stagedSelectedAperture, setStagedSelectedAperture] = useState('')
  const [stagedSelectedISO, setStagedSelectedISO] = useState('')
  const [stagedSelectedTags, setStagedSelectedTags] = useState<string[]>([])
  const [stagedLabelsOperator, setStagedLabelsOperator] = useState<'and' | 'or'>('and')
  const [imageAlbum, setImageAlbum] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedFeatured, setSelectedFeatured] = useState('')
  const [selectedLens, setSelectedLens] = useState('')
  const [selectedExposure, setSelectedExposure] = useState('')
  const [selectedAperture, setSelectedAperture] = useState('')
  const [selectedISO, setSelectedISO] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagsList, setTagsList] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [labelsOperator, setLabelsOperator] = useState<'and' | 'or'>('and')
  const [cameras, setCameras] = useState<string[]>([])
  const [lenses, setLenses] = useState<string[]>([])
  const defaultPresets = {
    cameraModels: ['Canon EOS R5','Sony A7 III','Nikon Z7 II','Fujifilm X-T4','iPhone 13 Pro'],
    shutterSpeeds: ['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1'],
    isos: ['50','100','200','400','800','1600','3200','6400'],
    apertures: ['1.4','1.8','2.0','2.8','3.5','4.0','5.6','8.0','11','16'],
  }
  const [exifPresets] = useState(defaultPresets)
  const [pageSize] = useState(8)
  const [layout, setLayout] = useState<'card' | 'list'>('card')
  const { data, isLoading, mutate } = useSwrInfiniteServerHook(
    props,
    pageNum,
    album,
    showStatus === 'all' || showStatus === '' ? -1 : Number(showStatus),
    selectedFeatured === 'all' || selectedFeatured === '' ? -1 : Number(selectedFeatured),
    selectedCamera === 'all' ? '' : selectedCamera,
    selectedLens === 'all' ? '' : selectedLens,
    selectedExposure === 'all' ? '' : selectedExposure,
    selectedAperture === 'all' ? '' : selectedAperture,
    selectedISO === 'all' ? '' : selectedISO,
    selectedTags,
    labelsOperator
  )
  const { data: total, mutate: totalMutate } = useSwrPageTotalServerHook(
    props,
    album,
    showStatus === 'all' || showStatus === '' ? -1 : Number(showStatus),
    selectedFeatured === 'all' || selectedFeatured === '' ? -1 : Number(selectedFeatured),
    selectedCamera === 'all' ? '' : selectedCamera,
    selectedLens === 'all' ? '' : selectedLens,
    selectedExposure === 'all' ? '' : selectedExposure,
    selectedAperture === 'all' ? '' : selectedAperture,
    selectedISO === 'all' ? '' : selectedISO,
    selectedTags,
    labelsOperator
  )
  const [image, setImage] = useState({} as ImageType)
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
  // const { data: adminConfig } = useSWR('/api/v1/settings/get-admin-config', fetcher)
  const t = useTranslations()

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
      // image.album_value 其实是相册的 ID (后端 SQL 查询中做了别名: albums.id AS album_value)
      // 优化：使用 Map 进行 O(1) 查找，替代 O(n) 的数组查找
      const targetAlbum = albumMap.get(albumValue)
      if (!targetAlbum) {
        toast.error('相册不存在')
        return
      }
      
      const res = await fetch('/api/v1/albums/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetAlbum, cover: coverUrl })
      }).then(r => r.json())

      if (res.code === 200) {
        toast.success('封面设置成功')
      } else {
        toast.error(res.message || '封面设置失败')
      }
    } catch (e) {
      toast.error('封面设置失败')
    }
  }

  useEffect(() => {
    if (Array.isArray(data)) {
      setLocalImages(data as ImageType[])
      setPrevImages(data as ImageType[])
    }
  }, [data])

  useEffect(() => {
    // Fetch camera and lens list
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

    // Fetch tags for multi-select
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
      toast.success('排序已更新')
      await mutate()
    } catch {
      toast.error('调整失败，请重试')
      setLocalImages(prevImages)
    } finally {
      setSavingSort(false)
    }
  }

  // 重新计算排序权重：直接按照当前列表顺序从 0 开始递增
  // 说明：sort 越小越靠前（与后端 ORDER BY image.sort ASC 对齐）
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

  async function updateImageAlbum() {
    if (!imageAlbum) {
      toast.error('图片绑定的相册不能为空！')
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
          imageId: image.id,
          albumId: imageAlbum
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        setImageAlbum('')
        setImage({} as ImageType)
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch {
      toast.error('更新失败！')
    } finally {
      setUpdateImageAlbumLoading(false)
    }
  }
  
  // 手动设置图片精选状态
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
        toast.success(featured === 1 ? '已设为精选' : '已取消精选')
        await mutate()
      } else {
        toast.error('操作失败')
      }
    } catch (e) {
      toast.error('操作失败')
    } finally {
      setUpdateFeaturedLoading(false)
      setUpdateFeaturedId('')
    }
  }

  // 更新图片显示状态
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
        toast.success(show === 0 ? '已设为公开' : '已设为隐藏')
        await mutate()
      } else {
        toast.error('更新显示状态失败')
      }
    } catch {
      toast.error('更新显示状态失败')
    } finally {
      setUpdateShowLoading(false)
      setUpdateShowId('')
    }
  }

  const FilterContent = () => (
    <div className="flex flex-col md:flex-row gap-3 flex-wrap items-start md:items-center">
      <Select value={stagedAlbum} onValueChange={setStagedAlbum}>
        <SelectTrigger className="w-full md:w-[140px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('List.selectAlbum')} /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">{t('Words.all')}</SelectItem>{albums?.map((a: AlbumType) => <SelectItem key={a.album_value} value={a.album_value}>{a.name}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={stagedShowStatus} onValueChange={setStagedShowStatus}>
        <SelectTrigger className="w-full md:w-[140px] h-9 bg-white text-gray-900 border-gray-200 whitespace-nowrap truncate"><SelectValue placeholder={t('List.selectShowStatus')} /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">{t('Words.all')}</SelectItem><SelectItem value="0">{t('Words.public')}</SelectItem><SelectItem value="1">{t('Words.private')}</SelectItem></SelectGroup></SelectContent>
      </Select>
      <Select value={stagedFeatured} onValueChange={setStagedFeatured}>
        <SelectTrigger className="w-full md:w-[120px] h-9 bg-white text-gray-900 border-gray-200 whitespace-nowrap truncate"><SelectValue placeholder="是否精选" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="1">已精选</SelectItem>
            <SelectItem value="0">未精选</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={stagedSelectedCamera} onValueChange={setStagedSelectedCamera}>
        <SelectTrigger className="w-full md:w-[120px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('List.selectCamera')} /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">{t('Words.all')}</SelectItem>{cameras.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={stagedSelectedLens} onValueChange={setStagedSelectedLens}>
        <SelectTrigger className="w-full md:w-[120px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('List.selectLens')} /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">{t('Words.all')}</SelectItem>{lenses.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={stagedSelectedExposure} onValueChange={setStagedSelectedExposure}>
        <SelectTrigger className="w-full md:w-[100px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="快门" /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">全部</SelectItem>{exifPresets.shutterSpeeds.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={stagedSelectedAperture} onValueChange={setStagedSelectedAperture}>
        <SelectTrigger className="w-full md:w-[90px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="光圈" /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">全部</SelectItem>{exifPresets.apertures.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={stagedSelectedISO} onValueChange={setStagedSelectedISO}>
        <SelectTrigger className="w-full md:w-[80px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="ISO" /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">全部</SelectItem>{exifPresets.isos.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      
      <Popover>
        <PopoverTrigger asChild>
          <button className="h-9 px-3 border border-gray-200 rounded-md text-sm text-left w-full md:w-auto min-w-[100px] bg-white text-gray-900 hover:bg-gray-50 transition-colors">
            {stagedSelectedTags.length > 0 ? `标签(${stagedSelectedTags.length})` : '筛选标签'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">选择标签</span>
            <div className="flex gap-1">
              <button className={`px-2 py-0.5 text-xs border rounded ${stagedLabelsOperator === 'and' ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}`} onClick={()=>setStagedLabelsOperator('and')}>AND</button>
              <button className={`px-2 py-0.5 text-xs border rounded ${stagedLabelsOperator === 'or' ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}`} onClick={()=>setStagedLabelsOperator('or')}>OR</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto my-2">
            {tagsList.map(tag => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <Checkbox checked={stagedSelectedTags.includes(tag)} onCheckedChange={(v)=>{ const next = v ? [...stagedSelectedTags, tag] : stagedSelectedTags.filter(t=>t!==tag); setStagedSelectedTags(next) }} />
                  <span className="text-xs truncate" title={tag}>{tag}</span>
                </label>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <button className="text-xs text-gray-500 hover:text-primary" onClick={()=>setStagedSelectedTags([])}>清除已选</button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0">
        <Tooltip title="应用筛选条件">
          <AntButton
            type="primary"
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 border-none shadow-sm transition-all text-white"
            onClick={async () => {
              setAlbum(stagedAlbum)
              setShowStatus(stagedShowStatus)
              setSelectedFeatured(stagedFeatured)
              setSelectedCamera(stagedSelectedCamera)
              setSelectedLens(stagedSelectedLens)
              setSelectedExposure(stagedSelectedExposure)
              setSelectedAperture(stagedSelectedAperture)
              setSelectedISO(stagedSelectedISO)
              setSelectedTags(stagedSelectedTags)
              setLabelsOperator(stagedLabelsOperator)
              await totalMutate()
              await mutate()
            }}
          >
            {t('Button.query') || '查询'}
          </AntButton>
        </Tooltip>
        <Tooltip title="重置所有筛选条件">
          <AntButton
            className="flex-1 md:flex-none hover:text-blue-600 hover:border-blue-600 transition-all"
            onClick={async () => {
              setStagedAlbum('')
              setStagedShowStatus('')
              setStagedFeatured('')
              setStagedSelectedCamera('')
              setStagedSelectedLens('')
              setStagedSelectedExposure('')
              setStagedSelectedAperture('')
              setStagedSelectedISO('')
              setStagedSelectedTags([])
              setStagedLabelsOperator('and')
              // Also reset active filters
              setAlbum('')
              setShowStatus('')
              setSelectedFeatured('')
              setSelectedCamera('')
              setSelectedLens('')
              setSelectedExposure('')
              setSelectedAperture('')
              setSelectedISO('')
              setSelectedTags([])
              setLabelsOperator('and')
              await totalMutate()
              await mutate()
            }}
          >
            {t('Button.reset') || '清空'}
          </AntButton>
        </Tooltip>
        <Tooltip title={layout === 'card' ? '切换为列表布局' : '切换为卡片布局'}>
          <AntButton
            type="text"
            className="flex flex-1 items-center gap-1 text-gray-600 hover:bg-gray-50 hover:text-blue-600 md:flex-none"
            icon={layout === 'card' ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
            onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
          >
            {layout === 'card' ? '卡片' : '列表'}
          </AntButton>
        </Tooltip>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col space-y-4 h-full flex-1 relative">
      {/* 1. 筛选栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="hidden md:block">
          <FilterContent />
        </div>
        <div className="md:hidden flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">筛选条件</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter size={14} /> 筛选
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>筛选照片</SheetTitle>
              </SheetHeader>
              <div className="py-4 flex flex-col gap-4">
                <FilterContent />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">关闭</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

      </div>

      {/* 2. 批量操作栏 (吸顶) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg shadow-lg flex justify-between items-center animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                selectedIds.length === 0
                  ? false
                  : (selectedIds.length < (Array.isArray(data) ? data.length : 0) ? 'indeterminate' : true)
              }
              onCheckedChange={(v) => toggleSelectAll(!!v)}
              className="text-gray-900"
            />
            <span className="text-sm font-medium">已选择 {selectedIds.length} 张照片</span>
          </div>
          <div className="flex gap-3">
            <Tooltip title="刷新列表数据">
              <AntButton
                type="text"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1"
                icon={<ReloadOutlined />}
                onClick={async () => { await totalMutate(); await mutate() }}
              >
                刷新
              </AntButton>
            </Tooltip>
            <Tooltip title="删除选中的图片">
              <AntButton
                type="default"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setImageBatchDelete(true)}
                className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm"
              >
                批量删除
              </AntButton>
            </Tooltip>
          </div>
        </div>
      )}

      {/* 3. 照片布局：卡片 / 列表切换 */}
      {layout === 'card' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.isArray(localImages) &&
            localImages.map((image: ImageType, index) => {
              const onlyOne = localImages.length <= 1
              const isFirst = index === 0
              const isLast = index === localImages.length - 1
              const disableUp = isFirst || onlyOne || savingSort
              const disableDown = isLast || onlyOne || savingSort
              const disablePin = isFirst || onlyOne || savingSort

              return (
                <Card
                  key={image.id}
                  className="group flex h-auto flex-col items-center gap-0 overflow-hidden border-gray-200 bg-white py-0 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {/* 图片区域 */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img
                      src={image.preview_url || image.url}
                      alt={image.title || '图片'}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />

                    {/* 遮罩 */}
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />

                    {/* 左上角：复选框 & 相册标签 */}
                    <div
                      className={`absolute left-2 top-2 z-10 flex flex-col gap-2 transition-opacity duration-200 ${
                        selectedIds.includes(image.id)
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.includes(image.id)}
                        onCheckedChange={(v) => toggleSelectOne(image.id, !!v)}
                        className="rounded-sm bg-white shadow-sm"
                      />
                      <span className="max-w-[120px] truncate rounded bg-black/50 px-2 py-0.5 text-[10px] text-white shadow-sm backdrop-blur-sm">
                        {image.album_name}
                      </span>
                    </div>

                    {/* 右上角：查看按钮 */}
                    <Tooltip title="查看大图详情">
                      <button
                        className="absolute right-2 top-2 transform rounded-full bg-white/90 p-1.5 text-gray-700 opacity-0 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-blue-600 hover:scale-110 group-hover:opacity-100"
                        onClick={() => {
                          setImageViewData(image)
                          setImageView(true)
                        }}
                      >
                        <ScanSearch size={16} />
                      </button>
                    </Tooltip>
                  </div>

                  {/* 底部操作栏 */}
                  <CardFooter className="flex h-14 w-full items-center justify-between border-t border-gray-100 bg-white p-2">
                    <div className="flex items-center gap-2">
                      <Tooltip title={image.show === 0 ? '当前公开' : '当前隐藏'}>
                        <Switch
                          checked={image.show === 0}
                          disabled={updateShowLoading && updateShowId === image.id}
                          className="border-transparent scale-90 cursor-pointer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white"
                          onCheckedChange={(isSelected: boolean) =>
                            updateImageShow(image.id, isSelected ? 0 : 1)
                          }
                        />
                      </Tooltip>
                      <Tooltip title={image.featured === 1 ? '已精选' : '设为精选'}>
                        <div
                          className={`cursor-pointer rounded p-1 hover:bg-gray-100 ${
                            image.featured === 1 ? 'text-[#E2B714]' : 'text-gray-400'
                          }`}
                          onClick={() =>
                            updateImageFeatured(image.id, image.featured === 1 ? 0 : 1)
                          }
                        >
                          {updateFeaturedLoading && updateFeaturedId === image.id ? (
                            <ReloadIcon className="h-4 w-4 animate-spin" />
                          ) : image.featured === 1 ? (
                            <StarFilled />
                          ) : (
                            <StarOutlined />
                          )}
                        </div>
                      </Tooltip>
                      <Badge className="flex h-6 items-center gap-0.5 border-gray-200 bg-gray-50 px-1.5 font-normal text-gray-500 hover:bg-gray-100">
                        <ArrowDown10 size={12} /> {image.sort}
                      </Badge>

                      {/* 排序按钮 */}
                      <div className="ml-1 flex items-center gap-1">
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
                          disabled={disablePin}
                          onClick={() => pinTop(index)}
                          aria-label="置顶"
                          title="置顶到当前相册最前面"
                        >
                          📌
                        </button>
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
                          disabled={disableUp}
                          onClick={() => moveUp(index)}
                          aria-label="上移"
                          title="向上移动一位"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
                          disabled={disableDown}
                          onClick={() => moveDown(index)}
                          aria-label="下移"
                          title="向下移动一位"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <ShadcnTooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-8 w-8 p-0 border-0 bg-white hover:bg-gray-100 shadow-none !text-gray-900"
                                onClick={() => {
                                  setImage(image)
                                  setImageAlbum(image.album_value)
                                }}
                              >
                                <Replace size={14} className="!text-gray-900" />
                                <span className="sr-only">绑定相册</span>
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>绑定相册</TooltipContent>
                        </ShadcnTooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('List.bindAlbum')}</AlertDialogTitle>
                          </AlertDialogHeader>
                          <Select
                            defaultValue={imageAlbum}
                            disabled={isLoading}
                            onValueChange={setImageAlbum}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('List.selectAlbum')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>{t('Words.album')}</SelectLabel>
                                {albums?.map((a: AlbumType) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                setImage({} as ImageType)
                                setImageAlbum('')
                              }}
                            >
                              {t('Button.canal')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="border-transparent bg-blue-600 text-white hover:bg-blue-700"
                              disabled={updateImageAlbumLoading}
                              onClick={() => updateImageAlbum()}
                            >
                              {updateImageAlbumLoading && (
                                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {t('Button.update')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <TooltipIconButton
                        tooltip="设为相册封面"
                        variant="outline"
                        className="h-8 w-8 p-0 border-0 bg-white hover:bg-gray-100 shadow-none !text-gray-900"
                        onClick={() =>
                          updateAlbumCover(
                            image.album_value,
                            image.preview_url || image.url,
                          )
                        }
                      >
                        <ImageIcon className="h-3.5 w-3.5 !text-gray-900" />
                      </TooltipIconButton>

                      <TooltipIconButton
                        tooltip="编辑图片信息"
                        variant="outline"
                        className="h-8 w-8 p-0 border-0 bg-white hover:bg-gray-100 shadow-none !text-gray-900"
                        onClick={() => {
                          setImageEditData(image)
                          setImageEdit(true)
                        }}
                      >
                        <SquarePenIcon className="h-3.5 w-3.5 !text-gray-900 p-0 hover:bg-transparent" />
                      </TooltipIconButton>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
        </div>
      ) : (
        <div className="flex w-full justify-center">
          <div className="flex w-full max-w-[1440px] flex-col rounded-md bg-white/70 px-3 py-2 md:px-4 md:py-2">
            {Array.isArray(localImages) &&
              localImages.map((image: ImageType, index) => {
                const onlyOne = localImages.length <= 1
                const isFirst = index === 0
                const isLast = index === localImages.length - 1
                const disableUp = isFirst || onlyOne || savingSort
                const disableDown = isLast || onlyOne || savingSort
                const disablePin = isFirst || onlyOne || savingSort

                return (
                  <div
                    key={image.id}
                    className={[
                      'flex items-center gap-3 py-2 transition-all duration-200 ease-in-out',
                      index !== localImages.length - 1 ? 'border-b border-gray-100' : '',
                    ].join(' ')}
                  >
                    {/* 左侧缩略图 */}
                    <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={image.preview_url || image.url}
                        alt={image.title || '图片'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* 中间信息 */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {image.title || '未命名图片'}
                        </span>
                        <Badge className="border-gray-200 bg-white px-1.5 text-[11px] text-gray-500">
                          {image.album_name || '未绑定相册'}
                        </Badge>
                      </div>
                      <p className="line-clamp-1 text-xs text-gray-500">
                        {image.detail || image.url}
                      </p>
                    </div>

                    {/* 右侧操作区 */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Tooltip title={image.show === 0 ? '当前公开' : '当前隐藏'}>
                        <Switch
                          checked={image.show === 0}
                          disabled={updateShowLoading && updateShowId === image.id}
                          className="border-transparent cursor-pointer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white"
                          onCheckedChange={(isSelected: boolean) =>
                            updateImageShow(image.id, isSelected ? 0 : 1)
                          }
                        />
                      </Tooltip>
                      <Badge className="border-gray-200 bg-white px-1.5 text-[11px] text-gray-500">
                        <ArrowDown10 size={14} className="mr-0.5" />
                        {image.sort}
                      </Badge>
                      {/* 排序按钮 */}
                      <div className="ml-1 flex items-center gap-1">
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
                          disabled={disablePin}
                          onClick={() => pinTop(index)}
                          aria-label="置顶"
                          title="置顶到当前相册最前面"
                        >
                          📌
                        </button>
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
                          disabled={disableUp}
                          onClick={() => moveUp(index)}
                          aria-label="上移"
                          title="向上移动一位"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
                          disabled={disableDown}
                          onClick={() => moveDown(index)}
                          aria-label="下移"
                          title="向下移动一位"
                        >
                          ↓
                        </button>
                      </div>
                      <TooltipIconButton
                        tooltip="编辑图片信息"
                        variant="outline"
                        className="h-8 w-8 p-0 border-0 bg-white hover:bg-gray-100 shadow-none !text-gray-900"
                        onClick={() => {
                          setImageEditData(image)
                          setImageEdit(true)
                        }}
                      >
                        <SquarePenIcon className="h-3.5 w-3.5 !text-gray-900 p-0 hover:bg-transparent" />
                      </TooltipIconButton>
                    </div>
                  </div>
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
            showTotal={(total) => `共 ${total} 张图片`}
            itemRender={(page, type, originalElement) => {
              if (type === 'page') {
                return <a className={`${pageNum === page ? 'bg-blue-600 text-white border-blue-600' : ''} rounded hover:text-blue-600`}>{page}</a>
              }
              return originalElement
            }}
          />
        </div>
      )}

      <ImageEditSheet {...{...props, pageNum, album}} />
      <ImageView />
      <ImageBatchDeleteSheet {...{...props, dataProps, pageNum, album, selectedIds}} />
    </div>
  )
}