'use client'

import type { HandleProps, ImageFilters, ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React from 'react'
import GalleryImage from '~/components/gallery/simple/gallery-image.tsx'

export default function SimpleGallery(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
      return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)
  const dataList: ImageType[] = data ? ([] as ImageType[]).concat(...data) : []
  const t = useTranslations()

  // 新增：根据前端筛选条件过滤已加载的数据（不额外请求接口）
  const appliedFilters: ImageFilters | undefined = props.filters
  const filteredList: ImageType[] = appliedFilters
    ? dataList.filter((img) => {
        // Bug修复：移除作品名称筛选，保留 EXIF/标签过滤
        if (appliedFilters.cameras?.length) {
          const camera = (img.exif?.model ?? '') as string
          const hit = appliedFilters.cameras.some(c => camera.includes(c))
          if (!hit) return false
        }
        if (appliedFilters.lenses?.length) {
          const lens = (img.exif?.lens_model ?? '') as string
          const hit = appliedFilters.lenses.some(l => lens.includes(l))
          if (!hit) return false
        }
        // 标签 AND 逻辑（多选全部命中）
        if (appliedFilters.tags?.length) {
          const labels: string[] = Array.isArray(img.labels) ? (img.labels as string[]) : []
          const allMatched = appliedFilters.tags.every(tag => labels.includes(tag))
          if (!allMatched) return false
        }
        return true
      })
    : dataList

  return (
    <div className="w-full mx-auto max-w-[1400px] px-3 space-y-3 sm:px-4 sm:py-1 sm:space-y-4 md:px-6 md:space-y-6">
      {filteredList?.map((item: ImageType) => (
        <GalleryImage key={item.id} photo={item} configData={configData} />
      ))}
      <div className="flex items-center justify-center my-4 pb-4">
        {
          isValidating ?
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>
            : filteredList.length > 0 ?
              size < pageTotal &&
              <Button
                disabled={isLoading}
                onClick={() => {
                  setSize(size + 1)
                }}
                className="select-none cursor-pointer"
                aria-label={t('Button.loadMore')}
              >
                {t('Button.loadMore')}
              </Button>
              : t('Tips.noImg')
        }
      </div>
    </div>
  )
}
