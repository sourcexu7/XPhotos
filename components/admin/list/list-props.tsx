'use client'

import React, { useState, useEffect } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'
import { ArrowDown10, ScanSearch, Replace } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ListImage from '~/components/admin/list/list-image'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import { Button } from '~/components/ui/button'
import { Button as AntButton, Checkbox as AntCheckbox, Pagination } from 'antd'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
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
import { SquarePenIcon } from '~/components/icons/square-pen'
import { DeleteIcon } from '~/components/icons/delete'
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { ChevronLeftIcon } from '~/components/icons/chevron-left'
import { ChevronRightIcon } from '~/components/icons/chevron-right'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { RefreshCWIcon } from '~/components/icons/refresh-cw.tsx'
import { CircleChevronDownIcon } from '~/components/icons/circle-chevron-down.tsx'

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
  const [exifPresets, setExifPresets] = useState(() => {
    try { const raw = typeof window !== 'undefined' ? localStorage.getItem('picimpact_exif_presets') : null; if (raw) return JSON.parse(raw) } catch (e) {}
    return defaultPresets
  })
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
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  const [updateShowId, setUpdateShowId] = useState('')
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

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div className="flex justify-between items-center space-x-2">
          <Select
            disabled={albumsLoading}
            value={stagedAlbum}
            onValueChange={(value: string) => {
              setStagedAlbum(value)
            }}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder={t('List.selectAlbum')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('Words.album')}</SelectLabel>
                <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                {albums?.map((album: AlbumType) => (
                  <SelectItem className="cursor-pointer" key={album.album_value} value={album.album_value}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex items-center space-x-2">
            <Select
              value={stagedShowStatus}
              onValueChange={(value: string) => {
                setStagedShowStatus(value)
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={t('List.selectShowStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Words.showStatus')}</SelectLabel>
                  <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="0">{t('Words.public')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="1">{t('Words.private')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={stagedSelectedCamera}
              onValueChange={(value: string) => {
                setStagedSelectedCamera(value)
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={t('List.selectCamera')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Words.camera')}</SelectLabel>
                  <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                  {cameras.map((camera) => (
                    <SelectItem className="cursor-pointer" key={camera} value={camera}>
                      {camera}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={stagedSelectedLens}
              onValueChange={(value: string) => {
                setStagedSelectedLens(value)
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={t('List.selectLens')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Words.lens')}</SelectLabel>
                  <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                  {lenses.map((lens) => (
                    <SelectItem className="cursor-pointer" key={lens} value={lens}>
                      {lens}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div style={{ minWidth: 140 }}>
              <Select value={stagedSelectedExposure} onValueChange={(v: string) => { setStagedSelectedExposure(v) }}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="快门 (exposure)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>常用快门</SelectLabel>
                    <SelectItem value="all">全部</SelectItem>
                    {exifPresets.shutterSpeeds.map((s: string) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div style={{ minWidth: 100 }}>
              <Select value={stagedSelectedAperture} onValueChange={(v: string) => { setStagedSelectedAperture(v) }}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="光圈 (f/)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>常用光圈</SelectLabel>
                    <SelectItem value="all">全部</SelectItem>
                    {exifPresets.apertures.map((a: string) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div style={{ minWidth: 100 }}>
              <Select value={stagedSelectedISO} onValueChange={(v: string) => { setStagedSelectedISO(v) }}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="ISO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>常用 ISO</SelectLabel>
                    <SelectItem value="all">全部</SelectItem>
                    {exifPresets.isos.map((iso: string) => (
                      <SelectItem key={iso} value={iso}>{iso}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div style={{ minWidth: 240 }}>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="border rounded px-3 py-1 w-full text-left">{stagedSelectedTags.length > 0 ? `标签：${stagedSelectedTags.join(', ')}` : '筛选标签'}</button>
                </PopoverTrigger>
                <PopoverContent className="p-2 max-h-64 overflow-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">选择标签</div>
                    <div>
                      <button className={`px-2 py-1 mr-1 border rounded ${labelsOperator === 'and' ? 'bg-gray-200' : ''}`} onClick={async ()=>{ setLabelsOperator('and'); await totalMutate(); await mutate() }}>AND</button>
                      <button className={`px-2 py-1 border rounded ${labelsOperator === 'or' ? 'bg-gray-200' : ''}`} onClick={async ()=>{ setLabelsOperator('or'); await totalMutate(); await mutate() }}>OR</button>
                    </div>
                  </div>
                    <div className="grid grid-cols-2 gap-2">
                    {tagsList.map(tag => (
                      <label key={tag} className="inline-flex items-center space-x-2">
                        <input type="checkbox" checked={stagedSelectedTags.includes(tag)} onChange={(e)=>{ const next = e.target.checked ? [...stagedSelectedTags, tag] : stagedSelectedTags.filter(t=>t!==tag); setStagedSelectedTags(next) }} />
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>{ setStagedSelectedTags([]) }}>清除</button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <AntButton type="primary" onClick={async () => {
            // apply staged filters
            setAlbum(stagedAlbum)
            setShowStatus(stagedShowStatus)
            setSelectedCamera(stagedSelectedCamera)
            setSelectedLens(stagedSelectedLens)
            setSelectedExposure(stagedSelectedExposure)
            setSelectedAperture(stagedSelectedAperture)
            setSelectedISO(stagedSelectedISO)
            setSelectedTags(stagedSelectedTags)
            setLabelsOperator(stagedLabelsOperator)
            await totalMutate()
            await mutate()
          }}>{t('Button.query') || '查询'}</AntButton>
          <AntButton onClick={async () => {
            // reset staged filters
            setStagedAlbum('')
            setStagedShowStatus('')
            setStagedSelectedCamera('')
            setStagedSelectedLens('')
            setStagedSelectedExposure('')
            setStagedSelectedAperture('')
            setStagedSelectedISO('')
            setStagedSelectedTags([])
            setStagedLabelsOperator('and')
          }}>{t('Button.reset') || '清空'}</AntButton>
        </div>
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-2">
            <AntCheckbox 
              checked={selectedIds.length > 0 && selectedIds.length === (Array.isArray(data) ? data.length : 0)} 
              onChange={(e) => toggleSelectAll(e.target.checked)}
            >
              全选
            </AntCheckbox>
            <AntButton
              type="primary"
              danger
              disabled={!selectedIds || selectedIds.length === 0}
              icon={<DeleteOutlined />}
              aria-label={t('Button.batchDelete')}
              onClick={() => {
                if (!selectedIds || selectedIds.length === 0) {
                  toast.warning('请先选择要操作的图片')
                  return
                }
                setImageBatchDelete(true)
              }}
            >
              批量删除
            </AntButton>
          </div>
          <AntButton
            type="default"
            icon={<ReloadOutlined />}
            disabled={isLoading}
            onClick={async () => {
              await totalMutate()
              await mutate()
            }}
            aria-label={t('Button.refresh')}
          >
            刷新
          </AntButton>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="flex sm:hidden cursor-pointer"
                variant="outline"
                size="icon"
              >
                <CircleChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="flex flex-col items-center space-y-1">
                <Select
                  value={showStatus}
                  onValueChange={async (value: string) => {
                    setShowStatus(value)
                    await totalMutate()
                    await mutate()
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t('List.selectShowStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Words.showStatus')}</SelectLabel>
                      <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                      <SelectItem className="cursor-pointer" value="0">{t('Words.public')}</SelectItem>
                      <SelectItem className="cursor-pointer" value="1">{t('Words.private')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCamera}
                  onValueChange={async (value: string) => {
                    setSelectedCamera(value)
                    await totalMutate()
                    await mutate()
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t('List.selectCamera')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Words.camera')}</SelectLabel>
                      <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                      {cameras.map((camera) => (
                        <SelectItem className="cursor-pointer" key={camera} value={camera}>
                          {camera}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedLens}
                  onValueChange={async (value: string) => {
                    setSelectedLens(value)
                    await totalMutate()
                    await mutate()
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t('List.selectLens')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Words.lens')}</SelectLabel>
                      <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                      {lenses.map((lens) => (
                        <SelectItem className="cursor-pointer" key={lens} value={lens}>
                          {lens}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="w-full">
                  <Select value={selectedExposure} onValueChange={async (v: string) => { setSelectedExposure(v); await totalMutate(); await mutate() }}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="快门 (exposure)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>常用快门</SelectLabel>
                        <SelectItem value="all">全部</SelectItem>
                        {exifPresets.shutterSpeeds.map((s: string) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full">
                  <Select value={selectedAperture} onValueChange={async (v: string) => { setSelectedAperture(v); await totalMutate(); await mutate() }}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="光圈 (f/)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>常用光圈</SelectLabel>
                        <SelectItem value="all">全部</SelectItem>
                        {exifPresets.apertures.map((a: string) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full">
                  <Select value={selectedISO} onValueChange={async (v: string) => { setSelectedISO(v); await totalMutate(); await mutate() }}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="ISO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>常用 ISO</SelectLabel>
                        <SelectItem value="all">全部</SelectItem>
                        {exifPresets.isos.map((iso: string) => (
                          <SelectItem key={iso} value={iso}>{iso}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full">
                  <div className="p-2 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">选择标签</div>
                      <div>
                        <button className={`px-2 py-1 mr-1 border rounded ${labelsOperator === 'and' ? 'bg-gray-200' : ''}`} onClick={async ()=>{ setLabelsOperator('and'); await totalMutate(); await mutate() }}>AND</button>
                        <button className={`px-2 py-1 border rounded ${labelsOperator === 'or' ? 'bg-gray-200' : ''}`} onClick={async ()=>{ setLabelsOperator('or'); await totalMutate(); await mutate() }}>OR</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                      {tagsList.map(tag => (
                        <label key={tag} className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={selectedTags.includes(tag)} onChange={async (e)=>{ const next = e.target.checked ? [...selectedTags, tag] : selectedTags.filter(t=>t!==tag); setSelectedTags(next); await totalMutate(); await mutate() }} />
                          <span className="text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button className="px-2 py-1 border rounded" onClick={async ()=>{ setSelectedTags([]); await totalMutate(); await mutate() }}>清除</button>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.isArray(data) && data?.map((image: ImageType) => (
          <Card key={image.id} className="flex flex-col h-72 show-up-motion items-center gap-0 py-0">
            <div className="flex h-12 justify-between w-full p-2 space-x-2">
              <div className="flex items-center space-x-2">
                <AntCheckbox checked={selectedIds.includes(image.id)} onChange={(e) => toggleSelectOne(image.id, e.target.checked)} />
                <Badge variant="secondary" aria-label={t('Words.album')}>{image.album_name}</Badge>
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => {
                    setImageViewData(image)
                    setImageView(true)
                  }}
                  aria-label={t('List.viewImage')}
                >
                  <ScanSearch size={20} />
                </Button>
              </div>
            </div>
            <CardContent className="flex h-48 items-center justify-center w-full p-2 scrollbar-hide">
              <ListImage image={image} />
            </CardContent>
            <CardFooter
              className="flex h-12 p-2 mb-1 space-x-1 select-none rounded-md before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
              <div className="flex flex-1 space-x-1 items-center">
                {
                  updateShowLoading && updateShowId === image.id ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> :
                  <Switch
                    checked={image.show === 0}
                    disabled={updateShowLoading}
                    className="cursor-pointer"
                    onCheckedChange={(isSelected: boolean) => updateImageShow(image.id, isSelected ? 0 : 1)}
                  />
                }
                <Badge variant="secondary" aria-label={t('Words.sort')}><ArrowDown10 size={18}/>{image.sort}</Badge>
              </div>
              <div className="space-x-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => {
                        setImage(image)
                        setImageAlbum(image.album_value)
                      }}
                      aria-label={t('List.bindAlbum')}
                    >
                      <Replace size={20} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('List.bindAlbum')}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <Select
                      defaultValue={imageAlbum}
                      disabled={isLoading}
                      onValueChange={async (value: string) => {
                        setImageAlbum(value)
                        await totalMutate()
                        await mutate()
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder={t('List.selectAlbum')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t('Words.album')}</SelectLabel>
                          {albums?.map((album: AlbumType) => (
                            <SelectItem className="cursor-pointer" key={album.id} value={album.id}>
                              {album.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer" onClick={() => {
                        setImage({} as ImageType)
                        setImageAlbum('')
                      }}>{t('Button.canal')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="cursor-pointer"
                        disabled={updateImageAlbumLoading}
                        onClick={() => updateImageAlbum()}
                        aria-label={t('Button.update')}
                      >
                        {updateImageAlbumLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                        {t('Button.update')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setImageEditData(image)
                    setImageEdit(true)
                  }}
                  aria-label={t('List.editImage')}
                >
                  <SquarePenIcon />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      {total !== 0 &&
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Pagination
            current={pageNum}
            total={total}
            pageSize={pageSize}
            onChange={async (page) => {
              setPageNum(page)
              await mutate()
            }}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => `共 ${total} 张图片`}
          />
        </div>
      }
      <ImageEditSheet {...{...props, pageNum, album}} />
      <ImageView />
      <ImageBatchDeleteSheet {...{...props, dataProps, pageNum, album, selectedIds}} />
    </div>
  )
}