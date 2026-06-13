'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { message } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PushpinOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckOutlined,
  HolderOutlined,
  LoadingOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import {
  Drawer,
  Button,
  Checkbox,
  Badge,
  Space,
  theme,
} from 'antd'
import { useTranslations } from 'next-intl'
import { FixedSizeList as List } from 'react-window'
import { motion, useReducedMotion } from 'framer-motion'

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
          onChange={onToggleSelect}
          aria-label={`选择 ${image.image_name || image.id}`}
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
            <PictureOutlined />
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
            <Badge color="gold">{featuredText}</Badge>
          )}
        </div>
      </div>

      <Space size="small">
        <Button
          type="text"
          size="small"
          icon={<PushpinOutlined />}
          onClick={onMoveToTop}
          disabled={index === 0 || saving}
          title="置顶"
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowUpOutlined />}
          onClick={onMoveUp}
          disabled={index === 0 || saving}
          title="上移"
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowDownOutlined />}
          onClick={onMoveDown}
          disabled={index === totalCount - 1 || saving}
          title="下移"
        />
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          onClick={onMoveToBottom}
          disabled={index === totalCount - 1 || saving}
          title="置底"
        />
      </Space>
    </motion.div>
  )
}

export default function AlbumSortPanel({
  open,
  albumValue,
  albumName,
  onClose,
}: AlbumSortPanelProps) {
  const { token } = theme.useToken()
  const t = useTranslations()
  const listRef = useRef<List>(null)
  const [images, setImages] = useState<AlbumSortImage[]>([])
  const [originalImages, setOriginalImages] = useState<AlbumSortImage[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [, startTransition] = useTransition()
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
      message.error(t('Tips.loadFailed'))
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
      
      message.success(t('Tips.updateSuccess'))
      setOriginalImages([...images])
      setHasChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
      message.error(t('Tips.updateFailed'))
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
      message.success(t('Tips.updateSuccess'))
      await fetchImages()
    } catch (error) {
      console.error('Reset failed:', error)
      message.error(t('Tips.updateFailed'))
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
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,179,71,0.2), rgba(255,139,97,0.2))' }}>
            <HolderOutlined />
          </span>
          {albumName}
          <Badge count={images.length} showZero />
          {hasChanges && (
            <Badge status="warning" text={t('Album.unsavedChanges')} />
          )}
        </span>
      }
      size={520}
      placement="right"
      extra={
        <Space>
          <Button onClick={handleReset} icon={<ReloadOutlined />} disabled={saving}>
            {t('Album.resetSort')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            type="primary"
            icon={saving ? <LoadingOutlined /> : <CheckOutlined />}
          >
            {saving ? t('Button.saving') : t('Button.save')}
          </Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${token.colorBorder}` }}>
        <Checkbox
          checked={selectedIds.size === images.length && images.length > 0}
          onChange={toggleSelectAll}
        >
          {selectedIds.size > 0 ? `${selectedIds.size} ${t('Album.selected')}` : t('Album.selectAll')}
        </Checkbox>
        <div style={{ flex: 1 }} />
        {selectedIds.size > 0 && (
          <>
            <Button
              size="small"
              onClick={batchMoveToTop}
              disabled={saving}
              icon={<PushpinOutlined />}
            >
              {t('Album.batchTop')}
            </Button>
            <Button
              size="small"
              onClick={batchMoveToBottom}
              disabled={saving}
              icon={<ArrowDownOutlined />}
            >
              {t('Album.batchBottom')}
            </Button>
          </>
        )}
      </div>

      <div style={{ height: 'calc(100vh - 300px)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LoadingOutlined style={{ fontSize: 24 }} />
              <span>{t('Tips.loading')}</span>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
            <div style={{ width: 96, height: 96, borderRadius: 24, background: token.colorBgLayout, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HolderOutlined style={{ fontSize: 32, color: token.colorTextTertiary }} />
            </div>
            <h3 style={{ fontWeight: 600, color: token.colorTextSecondary }}>{t('Album.noImages')}</h3>
            <p style={{ color: token.colorTextTertiary, textAlign: 'center', maxWidth: 400 }}>
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
          >
            {Row}
          </List>
        )}
      </div>
    </Drawer>
  )
}
