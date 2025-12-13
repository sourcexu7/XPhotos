'use client'

import React, { useState, useEffect } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'
import { ArrowDown10, ScanSearch, Replace, Filter, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import { Button } from '~/components/ui/button'
import { Card, CardFooter } from '~/components/ui/card'
import { Button as AntButton, Checkbox as AntCheckbox, Pagination, Tooltip } from 'antd'
import { DeleteOutlined, ReloadOutlined, StarFilled, StarOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
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
import { FilterBadge } from '~/components/ui/filter-badge'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [album, setAlbum] = useState('')
  const [showStatus, setShowStatus] = useState('')
  // staged filters (apply when user clicks 查询)
  const [stagedAlbum, setStagedAlbum] = useState('')
  const [stagedShowStatus, setStagedShowStatus] = useState('')
  const [stagedSelectedCamera, setStagedSelectedCamera] = useState('')
  const [stagedSelectedLens, setStagedSelectedLens] = useState('')
  const [stagedSelectedExposure, setStagedSelectedExposure] = useState('')
  const [stagedSelectedAperture, setStagedSelectedAperture] = useState('')
  const [stagedSelectedISO, setStagedSelectedISO] = useState('')
  const [stagedSelectedTags, setStagedSelectedTags] = useState<string[]>([])
  const [stagedLabelsOperator, setStagedLabelsOperator] = useState<'and' | 'or'>('and')
  const [imageAlbum, setImageAlbum] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')
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
  const [exifPresets, setExifPresets] = useState(defaultPresets)
  const [pageSize, setPageSize] = useState(8)
  const { data, isLoading, mutate } = useSwrInfiniteServerHook(
    props,
    pageNum,
    album,
    showStatus === 'all' || showStatus === '' ? -1 : Number(showStatus),
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
    selectedCamera === 'all' ? '' : selectedCamera,
    selectedLens === 'all' ? '' : selectedLens,
    selectedExposure === 'all' ? '' : selectedExposure,
    selectedAperture === 'all' ? '' : selectedAperture,
    selectedISO === 'all' ? '' : selectedISO,
    selectedTags,
    labelsOperator
  )
  const [image, setImage] = useState({} as ImageType)
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateFeaturedLoading, setUpdateFeaturedLoading] = useState(false)
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  const [updateShowId, setUpdateShowId] = useState('')
  const [updateFeaturedId, setUpdateFeaturedId] = useState('')
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const { data: albums, isLoading: albumsLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: adminConfig } = useSWR('/api/v1/settings/get-admin-config', fetcher)
  const t = useTranslations()

  const dataProps: ImageListDataProps = {
    data: data,
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

  const updateAlbumCover = async (albumValue: string, coverUrl: string) => {
    try {
      // image.album_value 其实是相册的 ID (后端 SQL 查询中做了别名: albums.id AS album_value)
      // 所以这里我们需要通过 ID 来查找相册，而不是通过 album_value (路由)
      const targetAlbum = (albums as AlbumType[]).find(a => a.id === albumValue)
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
    const fetchCameraAndLensList = async () => {
      try {
        const response = await fetch('/api/v1/images/camera-lens-list')
        if (response.ok) {
          const data = await response.json()
          setCameras(data.cameras)
          setLenses(data.lenses)
        }
      } catch (error) {
        console.error('Failed to fetch camera and lens list:', error)
      }
    }

    fetchCameraAndLensList()
    // fetch tags for multi-select
    ;(async () => {
      try {
        const res = await fetch('/api/v1/settings/tags/get')
        if (res.ok) {
          const json = await res.json()
          if (json?.data) setTagsList(json.data.map((t:any)=>t.name))
        }
      } catch (e) {
        console.error('Failed to fetch tags list', e)
      }
    })()
    // load exif presets from localStorage
    try {
      const raw = localStorage.getItem('picimpact_exif_presets')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed) {
          setExifPresets(parsed)
        }
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (adminConfig && adminConfig.length > 0) {
      const pageSizeConfig = adminConfig.find((config: any) => config.config_key === 'admin_images_per_page')
      if (pageSizeConfig) {
        const newPageSize = parseInt(pageSizeConfig.config_value, 10) || 8
        setPageSize(newPageSize)
      }
    }
  }, [adminConfig])

  async function updateImageShow(id: string, show: number) {
    try {
      setUpdateShowLoading(true)
      setUpdateShowId(id)
      const res = await fetch('/api/v1/images/update-show', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          show
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch {
      toast.error('更新失败！')
    } finally {
      setUpdateShowId('')
      setUpdateShowLoading(false)
    }
  }

  async function updateImageFeatured(id: string, featured: number) {
    try {
      setUpdateFeaturedLoading(true)
      setUpdateFeaturedId(id)
      const res = await fetch('/api/v1/images/update-featured', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          featured
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch {
      toast.error('更新失败！')
    } finally {
      setUpdateFeaturedId('')
      setUpdateFeaturedLoading(false)
    }
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

  const FilterContent = () => (
    <div className="flex flex-col md:flex-row gap-3 flex-wrap items-start md:items-center">
      <Select value={stagedAlbum} onValueChange={setStagedAlbum}>
        <SelectTrigger className="w-full md:w-[140px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('List.selectAlbum')} /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">{t('Words.all')}</SelectItem>{albums?.map((a: AlbumType) => <SelectItem key={a.album_value} value={a.album_value}>{a.name}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      <Select value={stagedShowStatus} onValueChange={setStagedShowStatus}>
        <SelectTrigger className="w-full md:w-[100px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('List.selectShowStatus')} /></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="all">{t('Words.all')}</SelectItem><SelectItem value="0">{t('Words.public')}</SelectItem><SelectItem value="1">{t('Words.private')}</SelectItem></SelectGroup></SelectContent>
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
                <AntCheckbox checked={stagedSelectedTags.includes(tag)} onChange={(e)=>{ const next = e.target.checked ? [...stagedSelectedTags, tag] : stagedSelectedTags.filter(t=>t!==tag); setStagedSelectedTags(next) }} />
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
          <AntButton type="primary" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 border-none shadow-sm transition-all" onClick={async () => {
            setAlbum(stagedAlbum); setShowStatus(stagedShowStatus); setSelectedCamera(stagedSelectedCamera); setSelectedLens(stagedSelectedLens);
            setSelectedExposure(stagedSelectedExposure); setSelectedAperture(stagedSelectedAperture); setSelectedISO(stagedSelectedISO);
            setSelectedTags(stagedSelectedTags); setLabelsOperator(stagedLabelsOperator);
            await totalMutate(); await mutate();
          }}>{t('Button.query') || '查询'}</AntButton>
        </Tooltip>
        <Tooltip title="重置所有筛选条件">
          <AntButton className="flex-1 md:flex-none hover:text-blue-600 hover:border-blue-600 transition-all" onClick={async () => {
            setStagedAlbum(''); setStagedShowStatus(''); setStagedSelectedCamera(''); setStagedSelectedLens('');
            setStagedSelectedExposure(''); setStagedSelectedAperture(''); setStagedSelectedISO(''); setStagedSelectedTags([]); setStagedLabelsOperator('and');
            // Also reset active filters
            setAlbum(''); setShowStatus(''); setSelectedCamera(''); setSelectedLens('');
            setSelectedExposure(''); setSelectedAperture(''); setSelectedISO(''); setSelectedTags([]); setLabelsOperator('and');
            await totalMutate(); await mutate();
          }}>{t('Button.reset') || '清空'}</AntButton>
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

        {/* 已应用的筛选条件徽章 */}
        {(album || (showStatus && showStatus !== 'all') || (selectedCamera && selectedCamera !== 'all') || (selectedLens && selectedLens !== 'all') || (selectedExposure && selectedExposure !== 'all') || (selectedAperture && selectedAperture !== 'all') || (selectedISO && selectedISO !== 'all') || (selectedTags && selectedTags.length > 0)) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {album && album !== 'all' && (
              <FilterBadge
                label="相册"
                value={(Array.isArray(albums) ? (albums as AlbumType[]).find(a => a.album_value === album)?.name : undefined) || album}
                onRemove={async () => {
                  setStagedAlbum(''); setAlbum(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {showStatus && showStatus !== 'all' && (
              <FilterBadge
                label="状态"
                value={showStatus === '0' ? '公开' : '私密'}
                onRemove={async () => {
                  setStagedShowStatus(''); setShowStatus(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {selectedCamera && selectedCamera !== 'all' && (
              <FilterBadge
                label="相机"
                value={selectedCamera}
                onRemove={async () => {
                  setStagedSelectedCamera(''); setSelectedCamera(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {selectedLens && selectedLens !== 'all' && (
              <FilterBadge
                label="镜头"
                value={selectedLens}
                onRemove={async () => {
                  setStagedSelectedLens(''); setSelectedLens(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {selectedExposure && selectedExposure !== 'all' && (
              <FilterBadge
                label="快门"
                value={selectedExposure}
                onRemove={async () => {
                  setStagedSelectedExposure(''); setSelectedExposure(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {selectedAperture && selectedAperture !== 'all' && (
              <FilterBadge
                label="光圈"
                value={selectedAperture}
                onRemove={async () => {
                  setStagedSelectedAperture(''); setSelectedAperture(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {selectedISO && selectedISO !== 'all' && (
              <FilterBadge
                label="ISO"
                value={selectedISO}
                onRemove={async () => {
                  setStagedSelectedISO(''); setSelectedISO(''); await totalMutate(); await mutate();
                }}
              />
            )}
            {selectedTags && selectedTags.length > 0 && (
              <>
                {selectedTags.map(tag => (
                  <FilterBadge
                    key={tag}
                    label="标签"
                    value={tag}
                    onRemove={async () => {
                      const next = selectedTags.filter(t => t !== tag)
                      setSelectedTags(next); setStagedSelectedTags(next); await totalMutate(); await mutate();
                    }}
                  />
                ))}
                <FilterBadge
                  variant="pill"
                  label="标签逻辑"
                  value={labelsOperator.toUpperCase()}
                  onRemove={async () => {
                    setSelectedTags([]); setStagedSelectedTags([]); await totalMutate(); await mutate();
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. 批量操作栏 (吸顶) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg shadow-lg flex justify-between items-center animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <AntCheckbox 
              checked={true}
              indeterminate={selectedIds.length > 0 && selectedIds.length < (Array.isArray(data) ? data.length : 0)}
              onChange={() => toggleSelectAll(false)}
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

      {/* 3. 照片网格 (4:3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.isArray(data) && data?.map((image: ImageType) => (
          <Card 
            key={image.id} 
            className="flex flex-col h-auto items-center gap-0 py-0 bg-white text-gray-900 border-gray-200 overflow-hidden group shadow-sm hover:shadow-md transition-all"
          >
            {/* 图片区域 */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
              <img 
                src={image.preview_url || image.url} 
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* 遮罩 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
              
              {/* 左上角：复选框 & 相册标签 */}
              <div className={`absolute top-2 left-2 flex flex-col gap-2 transition-opacity duration-200 z-10 ${selectedIds.includes(image.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <AntCheckbox 
                  checked={selectedIds.includes(image.id)} 
                  onChange={(e) => toggleSelectOne(image.id, e.target.checked)}
                  className="bg-white rounded-sm shadow-sm"
                />
                <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded shadow-sm truncate max-w-[120px]">
                  {image.album_name}
                </span>
              </div>

              {/* 右上角：查看按钮 */}
              <Tooltip title="查看大图详情">
                <button 
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white text-gray-700 shadow-sm hover:text-blue-600 hover:scale-110 transform"
                  onClick={() => { setImageViewData(image); setImageView(true) }}
                >
                  <ScanSearch size={16} />
                </button>
              </Tooltip>
            </div>

            {/* 底部操作栏 */}
            <CardFooter className="flex h-14 p-2 w-full bg-white border-t border-gray-100 justify-between items-center">
              <div className="flex items-center gap-2">
                <Tooltip title={image.show === 0 ? "当前公开" : "当前隐藏"}>
                  <Switch
                    checked={image.show === 0}
                    disabled={updateShowLoading && updateShowId === image.id}
                    className="cursor-pointer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent scale-90"
                    onCheckedChange={(isSelected: boolean) => updateImageShow(image.id, isSelected ? 0 : 1)}
                  />
                </Tooltip>
                <Tooltip title={image.featured === 1 ? "已精选" : "设为精选"}>
                  <div 
                    className={`cursor-pointer p-1 rounded hover:bg-gray-100 ${image.featured === 1 ? 'text-[#E2B714]' : 'text-gray-400'}`}
                    onClick={() => updateImageFeatured(image.id, image.featured === 1 ? 0 : 1)}
                  >
                    {updateFeaturedLoading && updateFeaturedId === image.id ? <ReloadIcon className="h-4 w-4 animate-spin"/> : (image.featured === 1 ? <StarFilled /> : <StarOutlined />)}
                  </div>
                </Tooltip>
                <Badge variant="secondary" className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 px-1.5 h-6 gap-0.5 font-normal">
                  <ArrowDown10 size={12}/> {image.sort}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <AlertDialog>
                  <Tooltip title="绑定相册">
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-blue-600" onClick={() => { setImage(image); setImageAlbum(image.album_value) }}>
                        <Replace size={14} />
                      </Button>
                    </AlertDialogTrigger>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{t('List.bindAlbum')}</AlertDialogTitle></AlertDialogHeader>
                    <Select defaultValue={imageAlbum} disabled={isLoading} onValueChange={setImageAlbum}>
                      <SelectTrigger><SelectValue placeholder={t('List.selectAlbum')} /></SelectTrigger>
                      <SelectContent><SelectGroup><SelectLabel>{t('Words.album')}</SelectLabel>{albums?.map((a: AlbumType) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => { setImage({} as ImageType); setImageAlbum('') }}>{t('Button.canal')}</AlertDialogCancel>
                      <AlertDialogAction className="bg-blue-600 hover:bg-blue-700 text-white border-transparent" disabled={updateImageAlbumLoading} onClick={() => updateImageAlbum()}>{updateImageAlbumLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}{t('Button.update')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Tooltip title="设为相册封面">
                  <Button 
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-blue-600"
                    onClick={() => updateAlbumCover(image.album_value, image.preview_url || image.url)}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </Button>
                </Tooltip>
                
                <Tooltip title="编辑图片信息">
                  <Button 
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-blue-600"
                    onClick={() => { setImageEditData(image); setImageEdit(true) }}
                  >
                    <SquarePenIcon className="w-3.5 h-3.5" />
                  </Button>
                </Tooltip>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 4. 分页导航 */}
      {total !== 0 && (
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