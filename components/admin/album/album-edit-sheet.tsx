'use client'

import { Drawer } from 'antd'
import { useButtonStore } from '~/app/providers/button-store-providers'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button, Select, Switch } from 'antd'
import { useTranslations } from 'next-intl'
import { Label } from '~/components/ui/label.tsx'

export default function AlbumEditSheet(props : Readonly<HandleProps>) {
  const { mutate } = useSwrHydrated(props)
  const { albumEdit, setAlbumEdit, album } = useButtonStore(
    (state) => state,
  )
  const [data, setData] = useState<AlbumType>({} as AlbumType)
  const [loading, setLoading] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    if (album) {
      setData(album)
    }
  }, [album])

  async function submit() {
    if (!data.name || !data.album_value) {
      toast.error(t('Album.requiredFields'))
      return
    }
    if (data.album_value && data.album_value.charAt(0) !== '/') {
      toast.error(t('Album.routerStartWithSlash'))
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/albums/update', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'PUT',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success(t('Tips.updateSuccess'))
        setAlbumEdit(false)
        await mutate()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error(t('Tips.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title={t('Album.editAlbum')}
      placement="left"
      size={400}
      open={albumEdit}
      onClose={() => setAlbumEdit(false)}
      mask={false}
      styles={{
        header: { padding: '16px 24px', background: '#f9fafb' },
        body: { padding: '24px' },
      }}
    >
      <div className="space-y-4 text-sm">
        <label
          htmlFor="name"
          className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
        >
          <span className="text-xs font-medium text-gray-700">{t('Album.name')}</span>
          <input
            type="text"
            id="name"
            value={data?.name || ''}
            placeholder={t('Album.inputName')}
            onChange={(e) => setData({...data, name: e.target.value})}
            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />
        </label>
        <label
          htmlFor="album_value"
          className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
        >
          <span className="text-xs font-medium text-gray-700">{t('Album.router')}</span>
          <input
            type="text"
            id="album_value"
            value={data?.album_value || ''}
            placeholder={t('Album.inputRouter')}
            onChange={(e) => setData({...data, album_value: e.target.value})}
            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />
        </label>
        <label
          htmlFor="detail"
          className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
        >
          <span className="text-xs font-medium text-gray-700">{t('Album.detail')}</span>
          <input
            type="text"
            id="detail"
            value={data?.detail || ''}
            placeholder={t('Album.inputDetail')}
            onChange={(e) => setData({...data, detail: e.target.value})}
            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />
        </label>
        <label
          htmlFor="sort"
          className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
        >
          <span className="text-xs font-medium text-gray-700">{t('Album.sort')}</span>
          <input
            type="number"
            id="sort"
            value={data?.sort}
            placeholder="0"
            onChange={(e) => setData({...data, sort: Number(e.target.value)})}
            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />
        </label>
        <label
          htmlFor="license"
          className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
        >
          <span className="text-xs font-medium text-gray-700">{t('Album.license')}</span>
          <input
            type="text"
            id="license"
            value={data?.license || ''}
            placeholder={t('Album.licensePlaceholder')}
            onChange={(e) => setData({...data, license: e.target.value})}
            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />
        </label>

        {data.cover && (
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-700 block mb-2">封面预览</span>
            <div className="relative w-full aspect-video rounded-md overflow-hidden border border-gray-200 group">
              <img src={data.cover} alt={data.title ? `${data.title} 封面` : '封面预览'} className="w-full h-full object-cover" decoding="async" draggable={false} />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  danger 
                  size="small"
                  onClick={() => setData({...data, cover: null})}
                >
                  清除封面
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full space-y-1">
          <Label htmlFor="indexStyleSelect"> {t('Preferences.indexThemeSelect')} </Label>
          <Select
            value={data?.theme || '0'}
            onChange={(value) => setData({...data, theme: value})}
            className="w-full"
            options={[
              { label: t('Theme.indexDefaultStyle'), value: '0' },
              { label: t('Theme.indexSimpleStyle'), value: '1' }
            ]}
          />
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">{t('Album.showStatus')}</div>
            <div className="text-xs text-gray-500">
              {t('Album.showStatusDesc')}
            </div>
          </div>
          <Switch
            checked={data?.show === 0}
            onChange={(checked) => setData({ ...data, show: checked ? 0 : 1 })}
          />
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">{t('Album.randomSort')}</div>
            <div className="text-xs text-gray-500">
              {t('Album.randomSortDesc')}
            </div>
          </div>
          <Switch
            checked={data?.random_show === 0}
            onChange={(checked) => setData({ ...data, random_show: checked ? 0 : 1 })}
          />
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="text-sm font-medium">{t('Album.imageSortRule')}</div>
          <Select
            value={typeof data.image_sorting === 'number' ? data.image_sorting.toString() : '1'}
            onChange={(value) => {
              setData({
                ...data,
                image_sorting: parseInt(value),
              })
            }}
            className="w-full mt-2"
            placeholder={t('Album.selectSortRule')}
            options={[
              { label: t('Album.uploadTimeNewToOld'), value: '1' },
              { label: t('Album.shootTimeNewToOld'), value: '2' },
              { label: t('Album.uploadTimeOldToNew'), value: '3' },
              { label: t('Album.shootTimeOldToNew'), value: '4' }
            ]}
          />
        </div>
        <Button
          type="primary"
          className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-700 border-transparent h-10"
          disabled={loading}
          onClick={() => submit()}
          aria-label={t('Album.submit')}
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Album.submit')}
        </Button>
      </div>
    </Drawer>
  )
}
