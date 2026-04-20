'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, Select, Spin, Empty, Button, Modal, App, Tooltip } from 'antd'
import { LinkOutlined, PictureOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons'
import Image from 'next/image'

interface Album {
  id: string
  name: string
  album_value: string
  cover?: string
  images?: AlbumImage[]
}

interface AlbumImage {
  id: string
  url: string
  preview_url?: string
  title?: string
}

interface GuideAlbumsRelation {
  id: string
  guide_id: string
  album_id: string
  album: Album
}

interface GuideCoverEditorProps {
  guideId: string
  guideTitle: string
  coverImage?: string
  albums?: GuideAlbumsRelation[]
  onCoverChange?: (coverImage: string) => void
  onAlbumsChange?: (albumIds: string[]) => void
}

export default function GuideCoverEditor({
  guideId,
  guideTitle,
  coverImage,
  albums = [],
  onCoverChange,
  onAlbumsChange,
}: GuideCoverEditorProps) {
  const { message } = App.useApp()
  const [allAlbums, setAllAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>(albums.map(a => a.album_id))
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [isAlbumCoverModalOpen, setIsAlbumCoverModalOpen] = useState(false)
  const [currentAlbumForCover, setCurrentAlbumForCover] = useState<Album | null>(null)
  const [albumImages, setAlbumImages] = useState<Record<string, AlbumImage[]>>({})
  const [loadingImages, setLoadingImages] = useState(false)
  const [updatingAlbumCover, setUpdatingAlbumCover] = useState(false)

  useEffect(() => {
    fetchAlbums()
  }, [])

  useEffect(() => {
    setSelectedAlbumIds(albums.map(a => a.album_id))
  }, [albums])

  const fetchAlbums = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/albums/get')
      const result = await res.json()
      setAllAlbums(Array.isArray(result) ? result : (result.data || []))
    } catch (error) {
      console.error('Failed to fetch albums:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbumImages = useCallback(async (albumId: string, albumValue: string) => {
    if (albumImages[albumId]) return
    
    setLoadingImages(true)
    try {
      // API 需要 album_value（如 /dxal），不是 album id
      const res = await fetch(`/api/v1/public/gallery/images?album=${encodeURIComponent(albumValue)}&page=1`)
      const result = await res.json()
      setAlbumImages(prev => ({
        ...prev,
        [albumId]: result.items || []
      }))
    } catch (error) {
      console.error('Failed to fetch album images:', error)
    } finally {
      setLoadingImages(false)
    }
  }, [albumImages])

  const handleAlbumSelect = (albumId: string) => {
    const album = allAlbums.find(a => a.id === albumId)
    const newSelectedIds = [...selectedAlbumIds, albumId]
    setSelectedAlbumIds(newSelectedIds)
    onAlbumsChange?.(newSelectedIds)
    
    if (album) {
      fetchAlbumImages(albumId, album.album_value)
      if (album.cover && !coverImage) {
        onCoverChange?.(album.cover)
      }
    }
  }

  useEffect(() => {
    if (selectedAlbumIds.length > 0) {
      selectedAlbumIds.forEach(albumId => {
        if (!albumImages[albumId]) {
          const album = allAlbums.find(a => a.id === albumId)
          if (album) {
            fetchAlbumImages(albumId, album.album_value)
          }
        }
      })
    }
  }, [selectedAlbumIds, albumImages, allAlbums, fetchAlbumImages])

  const handleAlbumRemove = (albumId: string) => {
    const newSelectedIds = selectedAlbumIds.filter(id => id !== albumId)
    setSelectedAlbumIds(newSelectedIds)
    onAlbumsChange?.(newSelectedIds)
  }

  const handleCoverSelect = (imageUrl: string) => {
    onCoverChange?.(imageUrl)
    setIsCoverModalOpen(false)
  }

  const handleOpenAlbumCoverModal = (album: Album) => {
    setCurrentAlbumForCover(album)
    setIsAlbumCoverModalOpen(true)
    fetchAlbumImages(album.id, album.album_value)
  }

  const handleAlbumCoverSelect = async (imageUrl: string) => {
    if (!currentAlbumForCover) return
    
    setUpdatingAlbumCover(true)
    try {
      const res = await fetch('/api/v1/albums/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentAlbumForCover.id,
          cover: imageUrl,
        }),
      })
      
      if (res.ok) {
        message.success('相册封面已更新')
        setAllAlbums(prev => prev.map(a => 
          a.id === currentAlbumForCover.id ? { ...a, cover: imageUrl } : a
        ))
        setIsAlbumCoverModalOpen(false)
      } else {
        const errorData = await res.json()
        message.error(errorData.message || '更新失败')
      }
    } catch (error) {
      console.error('Failed to update album cover:', error)
      message.error('更新失败')
    } finally {
      setUpdatingAlbumCover(false)
    }
  }

  const getAlbumUrl = (albumValue: string) => {
    if (albumValue.startsWith('/albums/')) {
      return albumValue.replace('/albums/', '/')
    }
    return albumValue
  }

  const handleOpenCoverModal = () => {
    setIsCoverModalOpen(true)
  }

  const selectedAlbums = allAlbums.filter(a => selectedAlbumIds.includes(a.id))
  const coverImages: string[] = []
  
  selectedAlbums.forEach(album => {
    const images = albumImages[album.id] || []
    images.slice(0, 3).forEach(img => {
      if (coverImages.length < 5) {
        coverImages.push(img.preview_url || img.url)
      }
    })
  })

  return (
    <div className="space-y-4">
      <Card 
        title={
          <div className="flex items-center gap-2">
            <LinkOutlined />
            <span>关联相册</span>
          </div>
        }
        size="small"
        style={{ borderRadius: '12px' }}
      >
        {loading ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : (
          <div className="space-y-3">
            <Select
              style={{ width: '100%' }}
              placeholder="选择要关联的相册"
              value={null}
              onChange={handleAlbumSelect}
              options={allAlbums
                .filter(a => !selectedAlbumIds.includes(a.id))
                .map(a => ({
                  value: a.id,
                  label: (
                    <div className="flex items-center gap-2">
                      {a.cover && (
                        <Image 
                          src={a.cover} 
                          alt={a.name}
                          width={24}
                          height={24}
                          className="rounded object-cover"
                        />
                      )}
                      <span>{a.name}</span>
                    </div>
                  ),
                }))}
              showSearch
              filterOption={(input, option) => {
                const album = allAlbums.find(a => a.id === option?.value)
                return album?.name.toLowerCase().includes(input.toLowerCase()) || false
              }}
            />

            {selectedAlbums.length > 0 ? (
              <div className="space-y-2">
                {selectedAlbums.map(album => (
                  <div 
                    key={album.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {album.cover && (
                        <Image
                          src={album.cover}
                          alt={album.name}
                          width={32}
                          height={32}
                          className="rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-sm">{album.name}</div>
                        <div className="text-xs text-gray-400">{album.album_value}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip title="设置相册封面">
                        <Button
                          size="small"
                          type="text"
                          icon={<PictureOutlined />}
                          onClick={() => handleOpenAlbumCoverModal(album)}
                        />
                      </Tooltip>
                      <Tooltip title="在新窗口打开相册">
                        <a
                          href={getAlbumUrl(album.album_value)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="small"
                            type="text"
                            icon={<ExportOutlined />}
                          />
                        </a>
                      </Tooltip>
                      <Tooltip title="取消关联">
                        <Button
                          size="small"
                          type="text"
                          danger
                          onClick={() => handleAlbumRemove(album.id)}
                        >
                          ×
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无关联相册" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <PictureOutlined />
            <span>攻略封面预览</span>
          </div>
        }
        size="small"
        style={{ borderRadius: '12px' }}
        extra={
          <Button 
            size="small" 
            icon={<PlusOutlined />}
            onClick={handleOpenCoverModal}
            disabled={selectedAlbums.length === 0}
          >
            选择封面
          </Button>
        }
      >
        <div 
          className="relative w-full aspect-[3/1] overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          style={{ minHeight: '200px' }}
        >
          {coverImage ? (
            <Image
              src={coverImage}
              alt={guideTitle}
              fill
              sizes="100%"
              className="object-cover"
            />
          ) : coverImages.length > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {coverImages.map((img, index) => (
                <div
                  key={index}
                  className="absolute w-[180px] h-[180px] rounded-lg overflow-hidden shadow-xl"
                  style={{
                    transform: `translateX(${(index - 2) * 100}px) translateY(${(index % 2) * 10}px)`,
                    zIndex: 5 - Math.abs(index - 2),
                  }}
                >
                  <Image
                    src={img}
                    alt={`Cover ${index + 1}`}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <PictureOutlined style={{ fontSize: '48px' }} />
                <p className="mt-2">请先关联相册</p>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-2">
              Travel Guide
            </p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {guideTitle || '攻略标题'}
            </h2>
          </div>
        </div>
      </Card>

      {/* 攻略封面选择弹窗 */}
      <Modal
        title="选择攻略封面图片"
        open={isCoverModalOpen}
        onCancel={() => setIsCoverModalOpen(false)}
        footer={null}
        width={800}
      >
        {loadingImages ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2">
            {selectedAlbums.map(album => (
              <div key={album.id} className="col-span-4">
                <div className="text-sm font-medium text-slate-600 mb-2">{album.name}</div>
                <div className="grid grid-cols-4 gap-2">
                  {albumImages[album.id]?.map(img => (
                    <div
                      key={img.id}
                      className="relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                      onClick={() => handleCoverSelect(img.url)}
                    >
                      <Image
                        src={img.preview_url || img.url}
                        alt={img.title || 'Image'}
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 相册封面选择弹窗 */}
      <Modal
        title={`设置「${currentAlbumForCover?.name}」的封面`}
        open={isAlbumCoverModalOpen}
        onCancel={() => !updatingAlbumCover && setIsAlbumCoverModalOpen(false)}
        footer={null}
        width={800}
      >
        {loadingImages ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-[500px] overflow-y-auto p-2">
            {albumImages[currentAlbumForCover?.id || '']?.map(img => (
              <div
                key={img.id}
                className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                  updatingAlbumCover ? 'border-gray-200 pointer-events-none opacity-50' : 'border-transparent hover:border-primary'
                }`}
                onClick={() => !updatingAlbumCover && handleAlbumCoverSelect(img.url)}
              >
                <Image
                  src={img.preview_url || img.url}
                  alt={img.title || 'Image'}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
            ))}
            {(!albumImages[currentAlbumForCover?.id || ''] || albumImages[currentAlbumForCover?.id || ''].length === 0) && (
              <div className="col-span-4 text-center py-8 text-gray-400">
                暂无图片
              </div>
            )}
          </div>
        )}
        {updatingAlbumCover && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Spin size="large" tip="更新中...">
              <div className="w-20 h-20" />
            </Spin>
          </div>
        )}
      </Modal>
    </div>
  )
}
