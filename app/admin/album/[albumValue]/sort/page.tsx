'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, Pin, ArrowDownToLine, RotateCcw, Check, Move, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import { FixedSizeList as List } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'

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
      className={`flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border transition-all duration-200 ${
        selected ? 'bg-primary/5' : 'hover:bg-muted/50'
      }`}
      style={{ height: ITEM_HEIGHT }}
    >
      <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`选择 ${image.image_name || image.id}`}
          className="data-[state=checked]:bg-primary"
        />

      <div className="w-8 sm:w-10 text-center text-xs sm:text-sm font-mono ${
        sorting ? 'text-primary font-semibold' : 'text-muted-foreground'
      }">
        {index + 1}
      </div>

      <div className="h-12 sm:h-16 w-16 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted border border-border transition-all duration-200 hover:shadow-sm">
        {image.preview_url || image.url ? (
          <img
            src={image.preview_url || image.url || ''}
            alt={image.image_name || ''}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
            无
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-medium truncate text-foreground">
          {image.image_name || image.id.slice(0, 8)}
        </div>
        <div className="text-xs text-muted-foreground">
          {image.width} × {image.height}
          {image.featured === 1 && (
            <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">
              {featuredText}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200"
          onClick={onMoveToTop}
          disabled={index === 0 || saving}
          title="置顶"
        >
          <Pin className="h-3 sm:h-4 w-3 sm:w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200"
          onClick={onMoveUp}
          disabled={index === 0 || saving}
          title="上移"
        >
          <ArrowUp className="h-3 sm:h-4 w-3 sm:w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200"
          onClick={onMoveDown}
          disabled={index === totalCount - 1 || saving}
          title="下移"
        >
          <ArrowDown className="h-3 sm:h-4 w-3 sm:w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 sm:h-8 w-7 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-200"
          onClick={onMoveToBottom}
          disabled={index === totalCount - 1 || saving}
          title="置底"
        >
          <ArrowDownToLine className="h-3 sm:h-4 w-3 sm:w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export default function AlbumSortPage() {
  const router = useRouter()
  const params = useParams<{ albumValue: string }>()
  // 确保albumValue不为空
  const albumValue = params.albumValue || ''
  const t = useTranslations()
  const listRef = useRef<List>(null)
  const [images, setImages] = useState<AlbumSortImage[]>([])
  const [originalImages, setOriginalImages] = useState<AlbumSortImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [albumName, setAlbumName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [sortingIndex, setSortingIndex] = useState<number | null>(null)

  const fetchImages = useCallback(async () => {
    if (!albumValue) return
    setLoading(true)
    try {
      // 先解码确保得到原始值
      const decodedAlbumValue = decodeURIComponent(albumValue)
      
      // 先获取相册信息，使用相册的实际名称
      const albumRes = await fetch(`/api/v1/albums/get-by-value/${encodeURIComponent(decodedAlbumValue)}`)
      let albumNameValue = decodedAlbumValue // 默认使用解码后的值作为备用
      
      if (albumRes.ok) {
        const albumData = await albumRes.json()
        if (albumData.data && albumData.data.name) {
          albumNameValue = albumData.data.name
        }
      }
      
      setAlbumName(albumNameValue)

      // 只调用获取图片的API
      // 先解码确保得到原始值，再编码，避免双重编码
      const encodedAlbumValue = encodeURIComponent(decodedAlbumValue)
      const res = await fetch(`/api/v1/images/album-images/${encodedAlbumValue}`)
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
    if (albumValue) {
      fetchImages()
    }
  }, [albumValue, fetchImages])

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
      
      // 先解码确保得到原始值，再传递给后端
      const decodedAlbumValue = decodeURIComponent(albumValue)
      
      const res = await fetch('/api/v1/images/album-sort', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumValue: decodedAlbumValue, orders }),
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
      // 先解码确保得到原始值，再编码，避免双重编码
      const decodedAlbumValue = decodeURIComponent(albumValue)
      const encodedAlbumValue = encodeURIComponent(decodedAlbumValue)
      const res = await fetch(`/api/v1/images/reset-album-sort/${encodedAlbumValue}`, {
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
        router.push('/admin/album')
      }
    } else {
      router.push('/admin/album')
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="mr-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t('Button.back')}
              </Button>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Move className="h-5 w-5 text-primary" />
                {t('Album.management')} - {albumName}
                <Badge variant="secondary" className="font-normal bg-primary/10 text-primary">
                  {images.length} {t('Album.images')}
                </Badge>
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="bg-card border-border text-foreground hover:bg-primary/5 hover:border-primary transition-colors duration-200"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('Album.resetSort')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 transform hover:scale-[1.02]"
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
            </div>
          </div>
          <div className="pb-4">
            <p className="text-sm text-muted-foreground">
              {t('Album.sortDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Checkbox
              checked={selectedIds.size === images.length && images.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label={t('Album.selectAll')}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} ${t('Album.selected')}` : t('Album.selectAll')}
            </span>
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={batchMoveToTop}
                  disabled={saving}
                  className="bg-card border-border text-foreground hover:bg-primary/5 hover:border-primary transition-colors duration-200"
                >
                  <Pin className="h-4 w-4 mr-1" />
                  {t('Album.batchTop')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={batchMoveToBottom}
                  disabled={saving}
                  className="bg-card border-border text-foreground hover:bg-primary/5 hover:border-primary transition-colors duration-200"
                >
                  <ArrowDownToLine className="h-4 w-4 mr-1" />
                  {t('Album.batchBottom')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="flex space-x-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <Loader2 className="h-10 w-10 text-primary/70 animate-spin" style={{ animationDelay: '0.2s' }} />
              <Loader2 className="h-10 w-10 text-primary/40 animate-spin" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-muted-foreground text-lg">{t('Tips.loading')}</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <Move className="h-12 w-12 text-muted-foreground/70" />
            </div>
            <h3 className="text-xl font-medium text-foreground">{t('Album.noImages')}</h3>
            <p className="text-sm text-center max-w-md px-4">
              该相册暂无图片，无法进行排序操作
            </p>
            <Button
              onClick={handleClose}
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
            >
              {t('Button.back')}
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden transition-all duration-200 hover:shadow-sm">
            <div className="h-[70vh]">
              <List
                ref={listRef}
                height={typeof window !== 'undefined' ? window.innerHeight - 300 : 600}
                width="100%"
                itemCount={images.length}
                itemSize={ITEM_HEIGHT}
                overscanCount={5}
                className="focus:outline-none"
              >
                {Row}
              </List>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}