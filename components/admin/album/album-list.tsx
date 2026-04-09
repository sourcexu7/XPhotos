'use client'

import React, { useEffect, useState } from 'react'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ArrowDown10, ArrowUp, ArrowDown, Pin } from 'lucide-react'
import { toast } from 'sonner'
import { Empty } from 'antd'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button, Switch } from 'antd'
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
import AlbumAddButton from '~/components/admin/album/album-add-button'

export default function AlbumList(props : Readonly<HandleProps>) {
  const { data, mutate, isLoading } = useSwrHydrated(props)
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
      <div className="flex w-full max-w-[1440px] flex-col bg-background-alt p-4 rounded-lg border border-border">
        {!isLoading && albums.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <div className="w-12 h-12 text-primary">
                📁
              </div>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{t('Album.noAlbumsTitle')}</h3>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-md">
              {t('Album.noAlbumsDescription')}
            </p>
            <AlbumAddButton />
          </div>
        )}

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
                'flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ease-in-out',
                index !== albums.length - 1 ? 'mb-3' : '',
                'bg-background hover:bg-background/80 border border-border'
              ].join(' ')}
            >
              {/* 左侧：相册封面 */}
              <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.name || '相册封面'}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-background text-text-muted text-sm">
                    无封面
                  </div>
                )}
              </div>

              {/* 中间：相册名称和信息 */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-semibold text-text-primary">
                    {album.name}
                  </span>
                  <Badge
                    variant="secondary"
                    aria-label={t('Album.router')}
                    className="bg-background text-text-secondary border-border hover:bg-background/80 text-xs px-2 py-0.5"
                  >
                    {album.album_value}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-sm text-text-secondary">
                  {album.detail || t('Album.noTips')}
                </p>
              </div>

              {/* 右侧：操作按钮区域 */}
              <div className="flex flex-shrink-0 items-center gap-3">
                {/* 显示状态开关 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">{album.show === 0 ? t('Album.show') : t('Album.hide')}</span>
                  <Switch
                    checked={album.show === 0}
                    disabled={updateAlbumLoading && updateAlbumId === album.id}
                    size="small"
                    onChange={(checked: boolean) => {
                      updateAlbumShow(album.id, checked ? 0 : 1)
                    }}
                  />
                </div>

                {/* 排序按钮组：置顶、↑、↓ - 位置在相册框右侧，间距8px，按钮之间间距4px */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-150 border-0 bg-transparent p-2"
                    disabled={disablePin}
                    onClick={() => pinTop(index)}
                    aria-label="置顶"
                    title="置顶到列表最前面"
                  >
                    <Pin size={16} className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-150 border-0 bg-transparent p-2"
                    disabled={disableUp}
                    onClick={() => moveUp(index)}
                    aria-label="上移"
                    title="向上移动一位"
                  >
                    <ArrowUp size={16} className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-150 border-0 bg-transparent p-2"
                    disabled={disableDown}
                    onClick={() => moveDown(index)}
                    aria-label="下移"
                    title="向下移动一位"
                  >
                    <ArrowDown size={16} className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>

                {/* 编辑按钮 */}
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-text-secondary transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => {
                    setAlbumEditData(album)
                    setAlbumEdit(true)
                  }}
                  title={t('Album.editAlbum')}
                >
                  <SquarePenIcon size={16} />
                </button>

                {/* 删除按钮 */}
                <Dialog onOpenChange={(value) => {
                  if (!value) {
                    setAlbum({} as AlbumType)
                  }
                }}>
                  <DialogTrigger asChild>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-text-secondary transition-all duration-200 hover:bg-error/10 hover:text-error focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
                      onClick={() => {
                        setAlbum(album)
                      }}
                      title={t('Album.deleteAlbum')}
                    >
                      <DeleteIcon size={16} />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-background-alt border-border">
                    <DialogHeader>
                      <DialogTitle className="text-text-primary">{t('Tips.reallyDelete')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-text-secondary">
                      <p>{t('Album.albumId')}：{album.id}</p>
                      <p>{t('Album.albumName')}：{album.name}</p>
                      <p>{t('Album.albumRouter')}：{album.album_value}</p>
                    </div>
                    <DialogFooter>
                      <Button
                        danger
                        className="cursor-pointer bg-background border border-error hover:bg-error/10 text-error"
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