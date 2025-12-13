'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
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
    <Sheet
      defaultOpen={false}
      open={albumEdit}
      onOpenChange={() => setAlbumEdit(!albumEdit)}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide bg-white text-gray-900" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('Album.editAlbum')}</SheetTitle>
          <div data-slot="sheet-description" className="space-y-2 text-muted-foreground text-sm">
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
              htmlFor="detail"
              className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400"
            >
              <span className="text-xs font-medium text-gray-700">{t('Album.license')}</span>

              <input
                type="text"
                id="detail"
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
                  <img src={data.cover} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setData({...data, cover: null})}
                    >
                      清除封面
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full max-w-sm space-y-1">
              <Label htmlFor="indexStyleSelect"> {t('Preferences.indexThemeSelect')} </Label>
              <Select value={data?.theme || '0'} onValueChange={(value) => setData({...data, theme: value})}>
                <SelectTrigger className="w-full cursor-pointer bg-white text-gray-900 border-gray-200">
                  <SelectValue placeholder={t('Preferences.indexThemeSelect')} />
                </SelectTrigger>
                <SelectContent className="cursor-pointer">
                  <SelectItem className="cursor-pointer" value="0">{t('Theme.indexDefaultStyle')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="1">{t('Theme.indexSimpleStyle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="text-medium">{t('Album.showStatus')}</div>
                <div className="text-tiny text-default-400">
                  {t('Album.showStatusDesc')}
                </div>
              </div>
              <Switch
                className="cursor-pointer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent"
                checked={data?.show === 0}
                onCheckedChange={(value) => {
                  setData({...data, show: value ? 0 : 1})
                }}
              />
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="text-medium">{t('Album.randomSort')}</div>
                <div className="text-tiny text-default-400">
                  {t('Album.randomSortDesc')}
                </div>
              </div>
              <Switch
                className="cursor-pointer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent"
                checked={data?.random_show === 0}
                onCheckedChange={(value) => {
                  setData({...data, random_show: value ? 0 : 1})
                }}
              />
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-gray-200 p-3 shadow-sm">
              <div className="text-medium">{t('Album.imageSortRule')}</div>
              <Select
                value={typeof data.image_sorting === 'number' ? data.image_sorting.toString() : '1'}
                onValueChange={(value) => {
                  setData({
                    ...data,
                    image_sorting: parseInt(value),
                  })
                }}
              >
                <SelectTrigger className="w-full cursor-pointer bg-white text-gray-900 border-gray-200">
                  <SelectValue placeholder={t('Album.selectSortRule')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem className="cursor-pointer" value="1">{t('Album.uploadTimeNewToOld')}</SelectItem>
                    <SelectItem className="cursor-pointer" value="2">{t('Album.shootTimeNewToOld')}</SelectItem>
                    <SelectItem className="cursor-pointer" value="3">{t('Album.uploadTimeOldToNew')}</SelectItem>
                    <SelectItem className="cursor-pointer" value="4">{t('Album.shootTimeOldToNew')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700 border-transparent"
              disabled={loading}
              onClick={() => submit()}
              aria-label={t('Album.submit')}
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
              {t('Album.submit')}
            </Button>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
