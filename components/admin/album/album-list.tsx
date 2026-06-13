'use client'

import React, { useEffect, useState } from 'react'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ArrowUpOutlined, ArrowDownOutlined, PushpinOutlined, SettingOutlined } from '@ant-design/icons'
import { message } from 'antd'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { Button, Switch, theme } from 'antd'
import {
  Modal as AntModal,
} from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Tag } from 'antd'
import AlbumAddButton from '~/components/admin/album/album-add-button'
import { motion, useReducedMotion } from 'motion/react'

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
  const { token } = theme.useToken()
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
        message.success(t('Tips.deleteSuccess'))
        await mutate()
      } else {
        message.error(t('Tips.deleteFailed'))
      }
    } catch {
      message.error(t('Tips.deleteFailed'))
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
        message.success(t('Tips.updateSuccess'))
        await mutate()
      } else {
        message.error(t('Tips.updateFailed'))
      }
    } catch {
      message.error(t('Tips.updateFailed'))
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
      message.success('排序已保存')
      await mutate()
    } catch {
      message.error('调整失败，请重试')
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
    <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 1440,
        flexDirection: 'column',
        backgroundColor: token.colorBgElevated,
        padding: token.marginLG,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowSecondary,
      }}>
        {!isLoading && albums.length === 0 && (
          <motion.div 
            initial={reduce ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{
              width: 112,
              height: 112,
              borderRadius: 24,
              background: `linear-gradient(135deg, ${token.colorPrimaryBgHover}, ${token.colorPrimaryBg})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              boxShadow: token.boxShadowSecondary,
              fontSize: 56,
              color: token.colorPrimary,
            }}>
              📁
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: token.colorText, marginBottom: 12 }}>{t('Album.noAlbumsTitle')}</h3>
            <p style={{
              color: token.colorTextSecondary,
              fontSize: 14,
              marginBottom: 32,
              textAlign: 'center',
              maxWidth: 448,
              lineHeight: 1.6,
            }}>
              {t('Album.noAlbumsDescription')}
            </p>
            <AlbumAddButton />
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: token.margin }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: 20,
                  borderRadius: 16,
                  backgroundColor: token.colorBgElevated,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: token.boxShadowSecondary,
                  transition: 'all 0.3s ease-out',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div style={{
                  height: 96,
                  width: 144,
                  flexShrink: 0,
                  overflow: 'hidden',
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${token.colorFillSecondary}, ${token.colorFill})`,
                  boxShadow: token.boxShadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {album.cover ? (
                    <motion.img
                      whileHover={reduce ? {} : { scale: 1.08 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      src={album.cover}
                      alt={album.name || '相册封面'}
                      style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div style={{
                      color: token.colorTextTertiary,
                      fontSize: 14,
                      fontWeight: 500,
                    }}>
                      无封面
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <motion.span 
                      initial={reduce ? {} : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 18,
                        fontWeight: 600,
                        color: token.colorText,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {album.name}
                    </motion.span>
                    <Tag
                      color="default"
                      style={{ fontSize: 12, borderRadius: 999, marginInlineEnd: 0, padding: '2px 10px' }}
                    >
                      {album.album_value}
                    </Tag>
                  </div>
                  <p style={{
                    fontSize: 14,
                    color: token.colorTextSecondary,
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {album.detail || t('Album.noTips')}
                  </p>
                </div>

                <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, color: token.colorTextSecondary, fontWeight: 500 }}>{album.show === 0 ? t('Album.show') : t('Album.hide')}</span>
                    <Switch
                      checked={album.show === 0}
                      disabled={updateAlbumLoading && updateAlbumId === album.id}
                      size="small"
                      onChange={(checked: boolean) => {
                        if (album.id) updateAlbumShow(album.id, checked ? 0 : 1)
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXXS }}>
                    <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }} style={{ display: 'inline-block' }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<PushpinOutlined />}
                        disabled={disablePin}
                        onClick={() => pinTop(index)}
                        aria-label="置顶"
                        title="置顶到列表最前面"
                      />
                    </motion.div>
                    <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }} style={{ display: 'inline-block' }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={disableUp}
                        onClick={() => moveUp(index)}
                        aria-label="上移"
                        title="向上移动一位"
                      />
                    </motion.div>
                    <motion.div whileHover={reduce ? {} : { scale: 1.1 }} whileTap={reduce ? {} : { scale: 0.95 }} style={{ display: 'inline-block' }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={disableDown}
                        onClick={() => moveDown(index)}
                        aria-label="下移"
                        title="向下移动一位"
                      />
                    </motion.div>
                  </div>

                  <motion.div whileHover={reduce ? {} : { scale: 1.1, y: -1 }} whileTap={reduce ? {} : { scale: 0.95 }} style={{ display: 'inline-block' }}>
                    <Button
                      type="text"
                      size="middle"
                      icon={<SettingOutlined />}
                      onClick={() => {
                        router.push(`/admin/album/${encodeURIComponent(album.album_value)}/sort`)
                      }}
                      title={t('Album.manageSort')}
                      aria-label={t('Album.manageSort')}
                      style={{ width: 40, height: 40 }}
                    />
                  </motion.div>

                  <motion.div whileHover={reduce ? {} : { scale: 1.1, y: -1 }} whileTap={reduce ? {} : { scale: 0.95 }} style={{ display: 'inline-block' }}>
                    <Button
                      type="text"
                      size="middle"
                      icon={<EditOutlined style={{ fontSize: 18 }} />}
                      onClick={() => {
                        setAlbumEditData(album)
                        setAlbumEdit(true)
                      }}
                      title={t('Album.editAlbum')}
                      aria-label={t('Album.editAlbum')}
                      style={{ width: 40, height: 40 }}
                    />
                  </motion.div>

                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setAlbum(album)
                      AntModal.confirm({
                        title: t('Tips.reallyDelete'),
                        content: (
                          <div style={{ fontSize: '14px', color: token.colorTextSecondary }}>
                            <p style={{ margin: '4px 0' }}>
                              <span style={{ fontWeight: 500, color: token.colorText }}>{t('Album.albumId')}：</span>
                              <span style={{ fontFamily: 'monospace' }}>{album.id}</span>
                            </p>
                            <p style={{ margin: '4px 0' }}>
                              <span style={{ fontWeight: 500, color: token.colorText }}>{t('Album.albumName')}：</span>
                              {album.name}
                            </p>
                            <p style={{ margin: '4px 0' }}>
                              <span style={{ fontWeight: 500, color: token.colorText }}>{t('Album.albumRouter')}：</span>
                              <span style={{ fontFamily: 'monospace' }}>{album.album_value}</span>
                            </p>
                          </div>
                        ),
                        okText: t('Button.delete'),
                        cancelText: '取消',
                        okButtonProps: { danger: true, loading: deleteLoading },
                        centered: true,
                        onOk: () => deleteAlbum(),
                      })
                    }}
                    title={t('Album.deleteAlbum')}
                    aria-label={t('Album.deleteAlbum')}
                  >
                    <DeleteOutlined style={{ fontSize: 18 }} />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
