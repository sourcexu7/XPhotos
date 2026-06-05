'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import React from 'react'

/**
 * 这个是相册页面模板，需要写新主题时直接复制一份，然后开写！
 * @param props 组件参数
 */
export default function TemplateGallery(props : Readonly<ImageHandleProps>) {
  // data->数据; isLoading->状态; size->页码; setSize->设置页码;
  useSWRInfinite((index) => {
      return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })

  return (
    <>
    </>
  )
}
