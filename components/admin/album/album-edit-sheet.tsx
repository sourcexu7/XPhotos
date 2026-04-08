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

  const InputField = ({ label, id, value, onChange, type = 'text', placeholder = '' }: any) => (
    <label
      htmlFor={id}
      className="block overflow-hidden rounded-lg border border-border px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 bg-card transition-all duration-200"
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 text-sm text-foreground font-normal placeholder:text-muted-foreground"
      />
    </label>
  )

  return (
    <Drawer
      title={t('Album.editAlbum')}
      placement="left"
      size={{ xs: '100%', sm: 420 }}
      open={albumEdit}
      onClose={() => setAlbumEdit(false)}
      mask={false}
      styles={{
        header: { padding: '16px 24px', background: 'var(--card)' },
        body: { padding: '24px' },
      }}
    >
      <div className="space-y-5">
        <InputField 
          label={t('Album.name')} 
          id="name" 
          value={data?.name || ''} 
          onChange={(e) => setData({...data, name: e.target.value})} 
          placeholder={t('Album.inputName')} 
        />
        <InputField 
          label={t('Album.router')} 
          id="album_value" 
          value={data?.album_value || ''} 
          onChange={(e) => setData({...data, album_value: e.target.value})} 
          placeholder={t('Album.inputRouter')} 
        />
        <InputField 
          label={t('Album.detail')} 
          id="detail" 
          value={data?.detail || ''} 
          onChange={(e) => setData({...data, detail: e.target.value})} 
          placeholder={t('Album.inputDetail')} 
        />
        <InputField 
          label={t('Album.sort')} 
          id="sort" 
          type="number" 
          value={data?.sort} 
          onChange={(e) => setData({...data, sort: Number(e.target.value)})} 
          placeholder="0" 
        />
        <InputField 
          label={t('Album.license')} 
          id="license" 
          value={data?.license || ''} 
          onChange={(e) => setData({...data, license: e.target.value})} 
          placeholder={t('Album.licensePlaceholder')} 
        />

        {data.cover && (
          <div className="mb-5">
            <span className="text-xs font-medium text-muted-foreground block mb-2">封面预览</span>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border group transition-all duration-200 hover:shadow-sm">
              <img 
                src={data.cover} 
                alt={data.title ? `${data.title} 封面` : '封面预览'} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                decoding="async" 
                draggable={false} 
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button 
                  danger 
                  size="small"
                  onClick={() => setData({...data, cover: null})}
                  className="bg-destructive hover:bg-destructive/90 border-none transition-all duration-200"
                >
                  清除封面
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full space-y-2">
          <Label htmlFor="indexStyleSelect" className="text-sm font-medium text-foreground"> 
            {t('Preferences.indexThemeSelect')} 
          </Label>
          <Select
            value={data?.theme || '0'}
            onChange={(value) => setData({...data, theme: value})}
            className="w-full border-border rounded-lg"
            options={[
              { label: t('Theme.indexDefaultStyle'), value: '0' },
              { label: t('Theme.indexSimpleStyle'), value: '1' }
            ]}
          />
        </div>

        <div className="p-4 border border-border rounded-lg bg-muted/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-foreground">{t('Album.showStatus')}</div>
              <div className="text-xs text-muted-foreground">
                {t('Album.showStatusDesc')}
              </div>
            </div>
            <Switch
              checked={data?.show === 0}
              onChange={(checked) => setData({ ...data, show: checked ? 0 : 1 })}
              checkedChildren="显示"
              unCheckedChildren="隐藏"
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="p-4 border border-border rounded-lg bg-muted/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-foreground">{t('Album.randomSort')}</div>
              <div className="text-xs text-muted-foreground">
                {t('Album.randomSortDesc')}
              </div>
            </div>
            <Switch
              checked={data?.random_show === 0}
              onChange={(checked) => setData({ ...data, random_show: checked ? 0 : 1 })}
              checkedChildren="开启"
              unCheckedChildren="关闭"
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="p-4 border border-border rounded-lg bg-card transition-all duration-200">
          <div className="text-sm font-medium text-foreground mb-3">{t('Album.imageSortRule')}</div>
          <Select
            value={typeof data.image_sorting === 'number' ? data.image_sorting.toString() : '1'}
            onChange={(value) => {
              setData({
                ...data,
                image_sorting: parseInt(value),
              })
            }}
            className="w-full border-border rounded-lg"
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
          className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground border-none h-10 rounded-lg transition-all duration-200 transform hover:scale-[1.01]"
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
