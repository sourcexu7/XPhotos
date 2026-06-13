'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { message, Button, Checkbox, Badge } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PushpinOutlined,
  DownloadOutlined,
  ReloadOutlined,
  CheckOutlined,
  HolderOutlined,
  LoadingOutlined,
  LeftOutlined,
} from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { FixedSizeList as List } from 'react-window'
import { motion } from 'framer-motion'
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 16px',
      borderBottom: '1px solid #f0f0f0',
      backgroundColor: selected ? 'rgba(0,0,0,0.02)' : 'transparent',
      opacity: sorting ? 0.7 : 1,
      height: ITEM_HEIGHT,
    }}>
      <Checkbox
        checked={selected}
        onChange={onToggleSelect}
      />

      <div style={{
        width: 40,
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'monospace',
        color: sorting ? '#1677ff' : '#8c8c8c',
        fontWeight: sorting ? 600 : 400,
      }}>
        {index + 1}
      </div>

      <div style={{
        height: 56,
        width: 84,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        border: '1px solid #f0f0f0',
      }}>
        {image.preview_url || image.url ? (
          <img
            src={image.preview_url || image.url || ''}
            alt={image.image_name || ''}
            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#8c8c8c',
          }}>
            无
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {image.image_name || image.id.slice(0, 8)}
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          {image.width} × {image.height}
          {image.featured === 1 && (
            <Badge color="gold" style={{ marginLeft: 8 }}>{featuredText}</Badge>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Button
          type="text"
          size="small"
          icon={<PushpinOutlined />}
          onClick={onMoveToTop}
          disabled={index === 0 || saving}
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowUpOutlined />}
          onClick={onMoveUp}
          disabled={index === 0 || saving}
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowDownOutlined />}
          onClick={onMoveDown}
          disabled={index === totalCount - 1 || saving}
        />
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          onClick={onMoveToBottom}
          disabled={index === totalCount - 1 || saving}
        />
      </div>
    </div>
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
  const [, startTransition] = useTransition()
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
      message.error(t('Tips.loadFailed'))
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
      // 先解码确保得到原始值，再编码，避免双重编码
      const decodedAlbumValue = decodeURIComponent(albumValue)
      const encodedAlbumValue = encodeURIComponent(decodedAlbumValue)
      const res = await fetch(`/api/v1/images/reset-album-sort/${encodedAlbumValue}`, {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: 64, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                onClick={handleClose}
                style={{ marginRight: 16 }}
                icon={<LeftOutlined />}
              >
                {t('Button.back')}
              </Button>
              <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HolderOutlined />
                  {t('Album.management')} - {albumName}
                  <Badge count={images.length} />
                </h1>
              </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                onClick={handleReset}
                disabled={saving}
                icon={<ReloadOutlined />}
              >
                {t('Album.resetSort')}
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                icon={saving ? <LoadingOutlined /> : <CheckOutlined />}
              >
                {saving ? t('Button.saving') : t('Button.save')}
              </Button>
            </div>
          </div>
          <div style={{ paddingBottom: 16 }}>
            <p style={{ fontSize: 14, color: '#8c8c8c', margin: 0 }}>{t('Album.sortDescription')}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0' }}>
            <Checkbox
              checked={selectedIds.size === images.length && images.length > 0}
              onChange={toggleSelectAll}
            >
              {selectedIds.size > 0 ? `${selectedIds.size} ${t('Album.selected')}` : t('Album.selectAll')}
            </Checkbox>
            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <Button
                  onClick={batchMoveToTop}
                  disabled={saving}
                  icon={<PushpinOutlined />}
                >
                  {t('Album.batchTop')}
                </Button>
                <Button
                  onClick={batchMoveToBottom}
                  disabled={saving}
                  icon={<DownloadOutlined />}
                >
                  {t('Album.batchBottom')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LoadingOutlined style={{ fontSize: 24 }} />
              <span>{t('Tips.loading')}</span>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, color: '#8c8c8c' }}>
            <div style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
              <HolderOutlined />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>{t('Album.noImages')}</h3>
            <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 400 }}>该相册暂无图片，无法进行排序操作</p>
            <Button type="primary" onClick={handleClose}>
              {t('Button.back')}
            </Button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            <div style={{ height: '70vh' }}>
              <List
                ref={listRef}
                height={typeof window !== 'undefined' ? window.innerHeight - 300 : 600}
                width="100%"
                itemCount={images.length}
                itemSize={ITEM_HEIGHT}
                overscanCount={5}
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