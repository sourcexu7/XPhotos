'use client'

import React, { useEffect, useState } from 'react'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ArrowUp, ArrowDown, Pin, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { useRouter } from 'next/navigation'
import { Badge } from '~/components/ui/badge'
import AlbumAddButton from '~/components/admin/album/album-add-button'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '~/lib/utils'

export default function AlbumList(props : Readonly<HandleProps>) {
  const { data, mutate, isLoading } = useSwrHydrated(props)
  const router = useRouter()
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
  const reduce = useReducedMotion()

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
      <div className="flex w-full max-w-[1440px] flex-col bg-background/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-lg">
        {!isLoading && albums.length === 0 && (
          <motion.div 
            initial={reduce ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 flex flex-col items-center justify-center"
          >
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-xl">
              <div className="w-14 h-14 text-primary">
                📁
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">{t('Album.noAlbumsTitle')}</h3>
            <p className="text-muted-foreground text-sm mb-8 text-center max-w-md leading-relaxed">
              {t('Album.noAlbumsDescription')}
            </p>
            <AlbumAddButton />
          </motion.div>
        )}

        <div className="space-y-4">
          {albums?.map((album, index) => {
            const onlyOne = albums.length <= 1
            const isFirst = index === 0
            const isLast = index === albums.length - 1
            const disableUp = isFirst || onlyOne || savingSort
            const disableDown = isLast || onlyOne || savingSort
            const disablePin = isFirst || onlyOne || savingSort

            return (
              <motion.div
                key={album.id}
                initial={reduce ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={reduce ? {} : { y: -2, scale: 1.01 }}
                className={cn(
                  'flex items-center gap-5 p-5 rounded-2xl transition-all duration-300 ease-out',
                  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-border/40',
                  'shadow-sm hover:shadow-lg hover:shadow-primary/5',
                  'hover:border-primary/20 dark:hover:border-primary/30'
                )}
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div className="h-24 w-36 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-md">
                  {album.cover ? (
                    <motion.img
                      whileHover={reduce ? {} : { scale: 1.08 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      src={album.cover}
                      alt={album.name || '相册封面'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/30 text-muted-foreground text-sm font-medium">
                      无封面
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <motion.span 
                      initial={reduce ? {} : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate text-lg font-semibold text-foreground tracking-tight"
                    >
                      {album.name}
                    </motion.span>
                    <Badge
                      variant="secondary"
                      aria-label={t('Album.router')}
                      className="bg-muted/60 text-muted-foreground border-border/50 text-xs px-3 py-1 rounded-full"
                    >
                      {album.album_value}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                    {album.detail || t('Album.noTips')}
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-medium">{album.show === 0 ? t('Album.show') : t('Album.hide')}</span>
                    <Switch
                      checked={album.show === 0}
                      disabled={updateAlbumLoading && updateAlbumId === album.id}
                      size="small"
                      onChange={(checked: boolean) => {
                        updateAlbumShow(album.id, checked ? 0 : 1)
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={reduce ? {} : { scale: 1.1 }}
                      whileTap={reduce ? {} : { scale: 0.95 }}
                      type="button"
                      className="flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent transition-all duration-200 p-2.5"
                      disabled={disablePin}
                      onClick={() => pinTop(index)}
                      aria-label="置顶"
                      title="置顶到列表最前面"
                    >
                      <Pin size={18} strokeWidth={1.75} />
                    </motion.button>
                    <motion.button
                      whileHover={reduce ? {} : { scale: 1.1 }}
                      whileTap={reduce ? {} : { scale: 0.95 }}
                      type="button"
                      className="flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent transition-all duration-200 p-2.5"
                      disabled={disableUp}
                      onClick={() => moveUp(index)}
                      aria-label="上移"
                      title="向上移动一位"
                    >
                      <ArrowUp size={18} strokeWidth={1.75} />
                    </motion.button>
                    <motion.button
                      whileHover={reduce ? {} : { scale: 1.1 }}
                      whileTap={reduce ? {} : { scale: 0.95 }}
                      type="button"
                      className="flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent transition-all duration-200 p-2.5"
                      disabled={disableDown}
                      onClick={() => moveDown(index)}
                      aria-label="下移"
                      title="向下移动一位"
                    >
                      <ArrowDown size={18} strokeWidth={1.75} />
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={reduce ? {} : { scale: 1.1, y: -1 }}
                    whileTap={reduce ? {} : { scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 hover:shadow-md"
                    onClick={() => {
                      router.push(`/admin/album/${encodeURIComponent(album.album_value)}/sort`)
                    }}
                    title={t('Album.manageSort')}
                    aria-label={t('Album.manageSort')}
                  >
                    <Settings2 size={18} />
                  </motion.button>

                  <motion.button
                    whileHover={reduce ? {} : { scale: 1.1, y: -1 }}
                    whileTap={reduce ? {} : { scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 hover:shadow-md"
                    onClick={() => {
                      setAlbumEditData(album)
                      setAlbumEdit(true)
                    }}
                    title={t('Album.editAlbum')}
                    aria-label={t('Album.editAlbum')}
                  >
                    <SquarePenIcon size={18} />
                  </motion.button>

                  <Dialog onOpenChange={(value) => {
                    if (!value) {
                      setAlbum({} as AlbumType)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <motion.button
                        whileHover={reduce ? {} : { scale: 1.1, y: -1 }}
                        whileTap={reduce ? {} : { scale: 0.95 }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 hover:shadow-md"
                        onClick={() => {
                          setAlbum(album)
                        }}
                        title={t('Album.deleteAlbum')}
                        aria-label={t('Album.deleteAlbum')}
                      >
                        <DeleteIcon size={18} />
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/60 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">{t('Tips.reallyDelete')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-muted-foreground py-2">
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{t('Album.albumId')}：</span>
                          <span className="font-mono">{album.id}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{t('Album.albumName')}：</span>
                          <span>{album.name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{t('Album.albumRouter')}：</span>
                          <span className="font-mono">{album.album_value}</span>
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          danger
                          className="cursor-pointer bg-background border border-red-500/30 hover:bg-red-500/10 text-red-500 rounded-xl transition-all hover:shadow-md"
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
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
