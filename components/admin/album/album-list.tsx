'use client'

import React, { useEffect, useState } from 'react'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ArrowDown10, ArrowUp, ArrowDown, Pin } from 'lucide-react'
import { toast } from 'sonner'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { Switch } from '~/components/ui/switch'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { DeleteIcon } from '~/components/icons/delete'
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'

export default function AlbumList(props : Readonly<HandleProps>) {
  const { data, mutate } = useSwrHydrated(props)
  const [album, setAlbum] = useState({} as AlbumType)
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [prevAlbums, setPrevAlbums] = useState<AlbumType[]>([])
  const [savingSort, setSavingSort] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateAlbumLoading, setUpdateAlbumLoading] = useState(false)
  const [updateAlbumId, setUpdateAlbumId] = useState('')
  const { setAlbumEdit, setAlbumEditData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  useEffect(() => {
    if (Array.isArray(data)) {
      setAlbums(data as AlbumType[])
      setPrevAlbums(data as AlbumType[])
    }
  }, [data])

  async function deleteAlbum() {
    setDeleteLoading(true)
    if (!album.id) return
    try {
      const res = await fetch(`/api/v1/albums/delete/${album.id}`, {
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
    } finally {
      setDeleteLoading(false)
    }
  }

  async function updateAlbumShow(id: string, show: number) {
    try {
      setUpdateAlbumId(id)
      setUpdateAlbumLoading(true)
      const res = await fetch('/api/v1/albums/update-show', {
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
        toast.success(t('Tips.updateSuccess'))
        await mutate()
      } else {
        toast.error(t('Tips.updateFailed'))
      }
    } catch {
      toast.error(t('Tips.updateFailed'))
    } finally {
      setUpdateAlbumId('')
      setUpdateAlbumLoading(false)
    }
  }

  // 重新计算排序权重：直接按照当前列表顺序从 0 开始递增
  // 说明：sort 越小越靠前（与后端 ORDER BY album.sort ASC 对齐）
  function recalcSortValues(list: AlbumType[]): AlbumType[] {
    if (!list.length) return list
    return list.map((album, idx) => ({
      ...album,
      sort: idx,
    }))
  }

  async function persistSort(newAlbums: AlbumType[]) {
    setPrevAlbums(albums)
    const withSort = recalcSortValues(newAlbums)
    setAlbums(withSort)
    setSavingSort(true)
    try {
      const orderedIds = withSort.map((item) => item.id)
      const res = await fetch('/api/v1/albums/update-sort', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      })
      if (!res.ok) {
        throw new Error('sort failed')
      }
      toast.success('排序已保存')
      await mutate()
    } catch {
      toast.error('调整失败，请重试')
      setAlbums(prevAlbums)
    } finally {
      setSavingSort(false)
    }
  }

  function moveUp(index: number) {
    if (index <= 0 || albums.length <= 1 || savingSort) return
    const next = [...albums]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    void persistSort(next)
  }

  function moveDown(index: number) {
    if (index >= albums.length - 1 || albums.length <= 1 || savingSort) return
    const next = [...albums]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    void persistSort(next)
  }

  function pinTop(index: number) {
    if (index <= 0 || albums.length <= 1 || savingSort) return
    const next = [...albums]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    void persistSort(next)
  }

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-[1440px] flex-col bg-white px-3 py-2 md:px-4 md:py-2">
        {albums?.map((album, index) => {
          const onlyOne = albums.length <= 1
          const isFirst = index === 0
          const isLast = index === albums.length - 1
          const disableUp = isFirst || onlyOne || savingSort
          const disableDown = isLast || onlyOne || savingSort
          const disablePin = isFirst || onlyOne || savingSort

          return (
            <div
              key={album.id}
              className={[
                'flex items-center gap-3 py-3 transition-all duration-200 ease-in-out',
                index !== albums.length - 1 ? 'border-b border-gray-100' : '',
              ].join(' ')}
            >
              {/* 左侧：相册封面 */}
              <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.name || '相册封面'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                    无封面
                  </div>
                )}
              </div>

              {/* 中间：相册名称和信息 */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {album.name}
                  </span>
                  <Badge
                    variant="secondary"
                    aria-label={t('Album.router')}
                    className="bg-white text-gray-500 border-gray-200 hover:bg-gray-50 text-xs"
                  >
                    {album.album_value}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-xs text-gray-500">
                  {album.detail || t('Album.noTips')}
                </p>
              </div>

              {/* 右侧：操作按钮区域 */}
              <div className="flex flex-shrink-0 items-center gap-2">
                {/* 显示状态开关 */}
                {updateAlbumLoading && updateAlbumId === album.id ? (
                  <ReloadIcon className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Switch
                    checked={album.show === 0}
                    disabled={updateAlbumLoading}
                    className="cursor-pointer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent"
                    onCheckedChange={(isSelected: boolean) => updateAlbumShow(album.id, isSelected ? 0 : 1)}
                  />
                )}

                {/* 排序按钮组：置顶、↑、↓ - 位置在相册框右侧，间距8px，按钮之间间距4px */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    className="flex items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-150 border-0 bg-transparent p-1"
                    disabled={disablePin}
                    onClick={() => pinTop(index)}
                    aria-label="置顶"
                    title="置顶到列表最前面"
                  >
                    <Pin size={14} className="w-[12px] h-[12px] md:w-[14px] md:h-[14px]" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-150 border-0 bg-transparent p-1"
                    disabled={disableUp}
                    onClick={() => moveUp(index)}
                    aria-label="上移"
                    title="向上移动一位"
                  >
                    <ArrowUp size={14} className="w-[12px] h-[12px] md:w-[14px] md:h-[14px]" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-150 border-0 bg-transparent p-1"
                    disabled={disableDown}
                    onClick={() => moveDown(index)}
                    aria-label="下移"
                    title="向下移动一位"
                  >
                    <ArrowDown size={14} className="w-[12px] h-[12px] md:w-[14px] md:h-[14px]" strokeWidth={1.5} />
                  </button>
                </div>

                {/* 编辑按钮 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                  onClick={() => {
                    setAlbumEditData(album)
                    setAlbumEdit(true)
                  }}
                  aria-label={t('Album.editAlbum')}
                >
                  <SquarePenIcon className="h-3.5 w-3.5" />
                </Button>

                {/* 删除按钮 */}
                <Dialog onOpenChange={(value) => {
                  if (!value) {
                    setAlbum({} as AlbumType)
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      onClick={() => {
                        setAlbum(album)
                      }}
                      aria-label={t('Album.deleteAlbum')}
                    >
                      <DeleteIcon className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
                    <DialogHeader>
                      <DialogTitle>{t('Tips.reallyDelete')}</DialogTitle>
                    </DialogHeader>
                    <div>
                      <p>{t('Album.albumId')}：{album.id}</p>
                      <p>{t('Album.albumName')}：{album.name}</p>
                      <p>{t('Album.albumRouter')}：{album.album_value}</p>
                    </div>
                    <DialogFooter>
                      <Button
                        className="cursor-pointer bg-white text-red-600 border border-red-200 hover:bg-red-50"
                        disabled={deleteLoading}
                        onClick={() => deleteAlbum()}
                        aria-label={t('Button.yesDelete')}
                      >
                        {deleteLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                        {t('Button.delete')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}