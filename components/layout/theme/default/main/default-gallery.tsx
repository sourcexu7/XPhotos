'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React from 'react'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import BlurImage from '~/components/album/blur-image.tsx'

function renderNextImage(
  _: RenderImageProps,
  { photo }: RenderImageContext,
  dataList: never[],
) {
  return (
    <BlurImage photo={photo} dataList={dataList} />
  )
}

export default function DefaultGallery(props : Readonly<ImageHandleProps>) {
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
  const dataList = data ? [].concat(...data) : []
  const t = useTranslations()

  return (
    <div className="w-full mx-auto max-w-[1400px] px-3 py-4 space-y-4 sm:px-4 sm:py-6 md:px-6">
      <div className="flex flex-col lg:flex-row w-full items-start justify-between lg:relative overflow-x-clip">
        {/* 左侧边栏 - 桌面端显示，移动端隐藏 */}
        <div className="hidden lg:flex lg:flex-1 flex-col px-2 lg:sticky top-4 self-start">
        </div>
        
        {/* 中间内容区 - 响应式宽度 */}
        <div className="w-full lg:w-[66.667%] mx-auto">
          <MasonryPhotoAlbum
            columns={(containerWidth) => {
              if (containerWidth < 640) return 2
              if (containerWidth < 768) return 2
              if (containerWidth < 1024) return 3
              return 4
            }}
            photos={
              dataList?.map((item: ImageType) => ({
                src: item.preview_url || item.url,
                alt: item.detail,
                ...item
              })) || []
            }
            render={{image: (...args) => renderNextImage(...args, dataList)}}
          />
        </div>
        
        {/* 右侧边栏 - 桌面端显示，移动端隐藏 */}
        <div className="hidden lg:flex flex-wrap space-x-2 lg:space-x-0 lg:flex-col flex-1 px-2 py-1 lg:py-0 space-y-1 text-gray-500 lg:sticky top-4 self-start">
        </div>
      </div>
      
      {/* 加载更多按钮 */}
      <div className="flex items-center justify-center my-4 pb-4">
        {
          isValidating ?
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>
            : dataList.length > 0 ?
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
