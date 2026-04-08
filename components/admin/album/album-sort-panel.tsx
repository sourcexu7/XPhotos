'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, Pin, ArrowDownToLine, RotateCcw, Check, Move, Loader2 } from 'lucide-react'
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
import { Skeleton } from '~/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import { FixedSizeList as List } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'

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

const ITEM_HEIGHT = 72

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
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: sorting ? 0.7 : 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 px-4 py-2 border-b border-gray-100 transition-all duration-200 ${
        selected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      style={{ height: ITEM_HEIGHT }}
    >
      <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`选择 ${image.image_name || image.id}`}
          className="data-[state=checked]:bg-blue-600"
        />

      <div className={`w-8 text-center text-sm font-mono ${
        sorting ? 'text-blue-600 font-semibold' : 'text-gray-400'
      }`}>
        {index + 1}
      </div>

      <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100 border border-gray-200">
        {image.preview_url || image.url ? (
          <img
            src={image.preview_url || image.url || ''}
            alt={image.image_name || ''}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
            无
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-gray-900">
          {image.image_name || image.id.slice(0, 8)}
        </div>
        <div className="text-xs text-gray-500">
          {image.width} × {image.height}
          {image.featured === 1 && (
            <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">
              {featuredText}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
          onClick={onMoveToTop}
          disabled={index === 0 || saving}
          title="置顶"
        >
          <Pin className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
          onClick={onMoveUp}
          disabled={index === 0 || saving}
          title="上移"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
          onClick={onMoveDown}
          disabled={index === totalCount - 1 || saving}
          title="下移"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-150"
          onClick={onMoveToBottom}
          disabled={index === totalCount - 1 || saving}
          title="置底"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </Button>
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
  const listRef = useRef<List>(null)
  const [images, setImages] = useState<AlbumSortImage[]>([])
  const [originalImages, setOriginalImages] = useState<AlbumSortImage[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [sortingIndex, setSortingIndex] = useState<number | null>(null)

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
      setTimeout(() => setSortingIndex(null), 200)
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
      setTimeout(() => setSortingIndex(null), 200)
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
      setTimeout(() => setSortingIndex(null), 300)
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
      setTimeout(() => setSortingIndex(null), 300)
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
        className="w-full sm:max-w-2xl flex flex-col bg-white text-gray-900 border-l border-gray-200 shadow-xl"
      >
        <SheetHeader className="border-b border-gray-200 pb-4">
          <SheetTitle className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
            <Move className="h-5 w-5 text-blue-600" />
            {albumName}
            <Badge variant="secondary" className="font-normal bg-blue-100 text-blue-800">
              {images.length} {t('Album.images')}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-gray-500 mt-1">
            {t('Album.sortDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 py-3 border-b border-gray-200 bg-gray-50 px-4 -mx-6">
          <Checkbox
            checked={selectedIds.size === images.length && images.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label={t('Album.selectAll')}
            className="data-[state=checked]:bg-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.size > 0 ? `${selectedIds.size} ${t('Album.selected')}` : t('Album.selectAll')}
          </span>
          <div className="flex-1" />
          {selectedIds.size > 0 && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={batchMoveToTop} 
                disabled={saving}
                className="bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Pin className="h-4 w-4 mr-1" />
                {t('Album.batchTop')}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={batchMoveToBottom} 
                disabled={saving}
                className="bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <ArrowDownToLine className="h-4 w-4 mr-1" />
                {t('Album.batchBottom')}
              </Button>
            </>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleReset} 
            disabled={saving}
            className="bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            {t('Album.resetSort')}
          </Button>
        </div>

        <div className="flex-1 -mx-6" style={{ height: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="flex space-x-2">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" style={{ animationDelay: '0.2s' }} />
                <Loader2 className="h-8 w-8 text-blue-200 animate-spin" style={{ animationDelay: '0.4s' }} />
              </div>
              <p className="text-gray-600">{t('Tips.loading')}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Move className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700">{t('Album.noImages')}</h3>
              <p className="text-sm text-center max-w-md px-4">
                该相册暂无图片，无法进行排序操作
              </p>
            </div>
          ) : (
            <List
              ref={listRef}
              height={typeof window !== 'undefined' ? window.innerHeight - 280 : 500}
              width="100%"
              itemCount={images.length}
              itemSize={ITEM_HEIGHT}
              overscanCount={5}
              className="focus:outline-none"
            >
              {Row}
            </List>
          )}
        </div>

        <SheetFooter className="mt-4 border-t border-gray-200 pt-4 pb-6 bg-gray-50 -mx-6 px-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {t('Button.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 transform hover:scale-105"
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
