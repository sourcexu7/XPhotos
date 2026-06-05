'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { 
  ArrowUp, 
  ArrowDown, 
  Pin, 
  ArrowDownToLine, 
  RotateCcw, 
  Check, 
  Move, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { Badge } from '~/components/ui/badge'
import { useTranslations } from 'next-intl'
import { FixedSizeList as List } from 'react-window'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface AlbumSortImage {
  id: string
  image_name: string | null
  url: string | null
  preview_url: string | null
  width: number
  height: number
  sort: number
  show: number
  featured: number
  blurhash: string | null
  created_at: Date
}

interface AlbumSortPanelProps {
  open: boolean
  albumValue: string
  albumName: string
  onClose: () => void
}

const ITEM_HEIGHT = 80

function ImageItem({
  image,
  index,
  totalCount,
  selected,
  saving,
  sorting,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  featuredText,
}: {
  image: AlbumSortImage
  index: number
  totalCount: number
  selected: boolean
  saving: boolean
  sorting: boolean
  onToggleSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToTop: () => void
  onMoveToBottom: () => void
  featuredText: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: sorting ? 0.98 : 1,
        filter: sorting ? 'blur(1px)' : 'blur(0px)'
      }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.03,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={reduce ? {} : { y: -2 }}
      className={`flex items-center gap-4 px-6 py-3 border-b transition-all duration-300 ${
        selected 
          ? 'bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200/60 dark:border-amber-800/40' 
          : 'bg-white/50 dark:bg-slate-900/30 border-gray-100/70 dark:border-slate-800/60 hover:bg-gray-50/60 dark:hover:bg-slate-800/30'
      }`}
      style={{ height: ITEM_HEIGHT }}
    >
      <div className="flex items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`选择 ${image.image_name || image.id}`}
          className={`data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 ${
            selected ? 'ring-2 ring-amber-500/30 ring-offset-1' : ''
          } transition-all duration-200`}
        />
      </div>

      <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-center text-sm font-semibold font-mono ${
        sorting 
          ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-300' 
          : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-500 dark:from-slate-800 dark:to-slate-900 dark:text-slate-400'
      } shadow-sm`}>
        {index + 1}
      </div>

      <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-lg">
        {image.preview_url || image.url ? (
          <motion.img
            whileHover={reduce ? {} : { scale: 1.08 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            src={image.preview_url || image.url || ''}
            alt={image.image_name || ''}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
            <ImageIcon className="h-6 w-6 text-gray-400 dark:text-slate-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-gray-900 dark:text-slate-100 tracking-tight">
          {image.image_name || image.id.slice(0, 10)}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
          <span className="font-mono">{image.width} × {image.height}</span>
          {image.featured === 1 && (
            <Badge 
              variant="secondary" 
              className="ml-1 text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-200 border-amber-200/50"
            >
              {featuredText}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl text-gray-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-900/30 transition-all duration-200"
            onClick={onMoveToTop}
            disabled={index === 0 || saving}
            title="置顶"
          >
            <Pin className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-all duration-200"
            onClick={onMoveUp}
            disabled={index === 0 || saving}
            title="上移"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-all duration-200"
            onClick={onMoveDown}
            disabled={index === totalCount - 1 || saving}
            title="下移"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl text-gray-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-orange-900/30 transition-all duration-200"
            onClick={onMoveToBottom}
            disabled={index === totalCount - 1 || saving}
            title="置底"
          >
            <ArrowDownToLine className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function AlbumSortPanel({
  open,
  albumValue,
  albumName,
  onClose,
}: AlbumSortPanelProps) {
  const t = useTranslations()
  const listRef = useRef<typeof List>(null)
  const [images, setImages] = useState<AlbumSortImage[]>([])
  const [originalImages, setOriginalImages] = useState<AlbumSortImage[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [, startTransition] = useTransition()
  const [sortingIndex, setSortingIndex] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const fetchImages = useCallback(async () => {
    if (!albumValue) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/images/album-images/${encodeURIComponent(albumValue)}`)
      if (!res.ok) throw new Error('Failed to fetch images')
      const data = await res.json()
      const imageList = data.data || []
      setImages(imageList)
      setOriginalImages(imageList)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch images:', error)
      toast.error(t('Tips.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [albumValue, t])

  useEffect(() => {
    if (open && albumValue) {
      fetchImages()
      setSelectedIds(new Set())
    }
  }, [open, albumValue, fetchImages])

  useEffect(() => {
    if (images.length !== originalImages.length) {
      setHasChanges(true)
      return
    }
    const hasChanged = images.some((img, idx) => img.id !== originalImages[idx]?.id)
    setHasChanges(hasChanged)
  }, [images, originalImages])

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return
    setSortingIndex(index)
    startTransition(() => {
      setImages(prev => {
        const next = [...prev]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        return next
      })
      setTimeout(() => setSortingIndex(null), 250)
    })
  }, [])

  const moveDown = useCallback((index: number) => {
    if (index >= images.length - 1) return
    setSortingIndex(index)
    startTransition(() => {
      setImages(prev => {
        const next = [...prev]
        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        return next
      })
      setTimeout(() => setSortingIndex(null), 250)
    })
  }, [images.length])

  const moveToTop = useCallback((index: number) => {
    if (index <= 0) return
    setSortingIndex(index)
    startTransition(() => {
      setImages(prev => {
        const next = [...prev]
        const [item] = next.splice(index, 1)
        next.unshift(item)
        return next
      })
      setTimeout(() => setSortingIndex(null), 350)
    })
  }, [])

  const moveToBottom = useCallback((index: number) => {
    if (index >= images.length - 1) return
    setSortingIndex(index)
    startTransition(() => {
      setImages(prev => {
        const next = [...prev]
        const [item] = next.splice(index, 1)
        next.push(item)
        return next
      })
      setTimeout(() => setSortingIndex(null), 350)
    })
  }, [images.length])

  const batchMoveToTop = useCallback(() => {
    if (selectedIds.size === 0) return
    startTransition(() => {
      setImages(prev => {
        const selected: AlbumSortImage[] = []
        const others: AlbumSortImage[] = []
        prev.forEach((img) => {
          if (selectedIds.has(img.id)) {
            selected.push(img)
          } else {
            others.push(img)
          }
        })
        return [...selected, ...others]
      })
      setSelectedIds(new Set())
    })
  }, [selectedIds])

  const batchMoveToBottom = useCallback(() => {
    if (selectedIds.size === 0) return
    startTransition(() => {
      setImages(prev => {
        const selected: AlbumSortImage[] = []
        const others: AlbumSortImage[] = []
        prev.forEach((img) => {
          if (selectedIds.has(img.id)) {
            selected.push(img)
          } else {
            others.push(img)
          }
        })
        return [...others, ...selected]
      })
      setSelectedIds(new Set())
    })
  }, [selectedIds])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)))
    }
  }, [selectedIds, images])

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    try {
      const orders = images.map((img, idx) => ({
        imageId: img.id,
        sort: idx,
      }))
      
      const res = await fetch('/api/v1/images/album-sort', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumValue, orders }),
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.message || 'Failed to save')
      }
      
      toast.success(t('Tips.updateSuccess'))
      setOriginalImages([...images])
      setHasChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
      toast.error(t('Tips.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/images/reset-album-sort/${encodeURIComponent(albumValue)}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to reset')
      toast.success(t('Tips.updateSuccess'))
      await fetchImages()
    } catch (error) {
      console.error('Reset failed:', error)
      toast.error(t('Tips.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm(t('Album.unsavedChanges'))) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const Row = useMemo(() => {
    const RowComponent = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const image = images[index]
      if (!image) return null
      
      return (
        <div style={style}>
          <ImageItem
            image={image}
            index={index}
            totalCount={images.length}
            selected={selectedIds.has(image.id)}
            saving={saving}
            sorting={sortingIndex === index}
            onToggleSelect={() => toggleSelect(image.id)}
            onMoveUp={() => moveUp(index)}
            onMoveDown={() => moveDown(index)}
            onMoveToTop={() => moveToTop(index)}
            onMoveToBottom={() => moveToBottom(index)}
            featuredText={t('Album.featured')}
          />
        </div>
      )
    }
    RowComponent.displayName = 'Row'
    return RowComponent
  }, [images, selectedIds, saving, sortingIndex, toggleSelect, moveUp, moveDown, moveToTop, moveToBottom, t])

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl flex flex-col bg-gradient-to-br from-white/95 to-gray-50/90 dark:from-slate-900/95 dark:to-slate-950/90 backdrop-blur-xl border-l border-gray-200/70 dark:border-slate-800/60 shadow-2xl"
      >
        <SheetHeader className="border-b border-gray-200/50 dark:border-slate-800/50 pb-5 bg-gradient-to-r from-white/70 to-gray-50/70 dark:from-slate-900/80 dark:to-slate-950/80">
          <SheetTitle className="flex items-center gap-3 text-gray-900 dark:text-slate-100 text-xl font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-lg">
              <Move className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            {albumName}
            <Badge 
              variant="secondary" 
              className="font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-200 border-amber-200/50 text-sm"
            >
              {images.length} {t('Album.images')}
            </Badge>
            {hasChanges && (
              <motion.div
                initial={reduce ? {} : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="ml-auto"
              >
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                  {t('Album.unsavedChanges')}
                </Badge>
              </motion.div>
            )}
          </SheetTitle>
          <SheetDescription className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            {t('Album.sortDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-3 py-4 border-b border-gray-200/50 dark:border-slate-800/50 bg-gradient-to-r from-gray-50/70 to-white/70 dark:from-slate-900/70 dark:to-slate-950/70 px-6 -mx-6">
          <Checkbox
            checked={selectedIds.size === images.length && images.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label={t('Album.selectAll')}
            className={`data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 ${
              selectedIds.size > 0 ? 'ring-2 ring-amber-500/30 ring-offset-1' : ''
            } transition-all duration-200`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {selectedIds.size > 0 ? `${selectedIds.size} ${t('Album.selected')}` : t('Album.selectAll')}
          </span>
          <div className="flex-1" />
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={reduce ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? {} : { opacity: 0, x: 20 }}
                className="flex items-center gap-2"
              >
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={batchMoveToTop} 
                  disabled={saving}
                  className="bg-white/80 dark:bg-slate-800/80 border-gray-200/70 dark:border-slate-700/60 text-gray-700 dark:text-slate-200 hover:bg-amber-50/80 dark:hover:bg-amber-900/30 hover:border-amber-300/70 dark:hover:border-amber-700/60 hover:text-amber-700 dark:hover:text-amber-300 transition-all duration-200 rounded-xl"
                >
                  <Pin className="h-4 w-4 mr-1.5" />
                  {t('Album.batchTop')}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={batchMoveToBottom} 
                  disabled={saving}
                  className="bg-white/80 dark:bg-slate-800/80 border-gray-200/70 dark:border-slate-700/60 text-gray-700 dark:text-slate-200 hover:bg-orange-50/80 dark:hover:bg-orange-900/30 hover:border-orange-300/70 dark:hover:border-orange-700/60 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 rounded-xl"
                >
                  <ArrowDownToLine className="h-4 w-4 mr-1.5" />
                  {t('Album.batchBottom')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleReset} 
            disabled={saving}
            className="bg-white/80 dark:bg-slate-800/80 border-gray-200/70 dark:border-slate-700/60 text-gray-700 dark:text-slate-200 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:border-blue-300/70 dark:hover:border-blue-700/60 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 rounded-xl"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            {t('Album.resetSort')}
          </Button>
        </div>

        <div className="flex-1 -mx-6" style={{ height: 'calc(100vh - 300px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <motion.div 
                animate={reduce ? {} : { rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="flex items-center gap-3"
              >
                <div className="w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </motion.div>
              <p className="text-gray-600 dark:text-slate-400 font-medium">{t('Tips.loading')}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-5 text-gray-500 dark:text-slate-400">
              <motion.div 
                initial={reduce ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-xl"
              >
                <Move className="h-10 w-10 text-gray-400 dark:text-slate-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">{t('Album.noImages')}</h3>
              <p className="text-sm text-center max-w-md px-4 text-gray-500 dark:text-slate-500">
                该相册暂无图片，无法进行排序操作
              </p>
            </div>
          ) : (
            <List
              ref={listRef}
              height={typeof window !== 'undefined' ? window.innerHeight - 300 : 500}
              width="100%"
              itemCount={images.length}
              itemSize={ITEM_HEIGHT}
              overscanCount={8}
              className="focus:outline-none"
            >
              {Row}
            </List>
          )}
        </div>

        <SheetFooter className="mt-4 border-t border-gray-200/50 dark:border-slate-800/50 pt-5 pb-7 bg-gradient-to-r from-gray-50/70 to-white/70 dark:from-slate-900/70 dark:to-slate-950/70 -mx-6 px-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="bg-white/80 dark:bg-slate-800/80 border-gray-200/70 dark:border-slate-700/60 text-gray-700 dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-slate-700/80 hover:border-gray-300/70 dark:hover:border-slate-600/60 transition-all duration-200 rounded-xl"
          >
            {t('Button.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className={`rounded-xl transition-all duration-300 ${
              hasChanges && !saving
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/25 hover:scale-105 active:scale-98'
                : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('Button.saving')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {t('Button.save')}
              </span>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
