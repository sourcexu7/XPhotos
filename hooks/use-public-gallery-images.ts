'use client'

import useSWRInfinite from 'swr/infinite'
import type { ImageType } from '~/types'

export type PublicGalleryImagesResponse = {
  page: number
  pageSize: number
  pageTotal: number
  items: ImageType[]
}

type Params = {
  album: string
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
  tagsOperator?: 'and' | 'or'
  sortByShootTime?: 'asc' | 'desc'
}

function joinCsv(arr?: string[]) {
  if (!arr || arr.length === 0) return undefined
  return arr.join(',')
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<PublicGalleryImagesResponse>
}

export function usePublicGalleryImages(params: Params) {
  const keyBase = [
    params.album,
    joinCsv(params.cameras) ?? '',
    joinCsv(params.lenses) ?? '',
    joinCsv(params.tags) ?? '',
    params.tagsOperator ?? '',
    params.sortByShootTime ?? '',
  ].join('|')

  return useSWRInfinite<PublicGalleryImagesResponse>(
    (index) => {
      const q = new URLSearchParams()
      q.set('page', String(index + 1))
      q.set('album', params.album)

      const cameras = joinCsv(params.cameras)
      const lenses = joinCsv(params.lenses)
      const tags = joinCsv(params.tags)
      if (cameras) q.set('cameras', cameras)
      if (lenses) q.set('lenses', lenses)
      if (tags) q.set('tags', tags)
      if (tags && params.tagsOperator) q.set('tagsOperator', params.tagsOperator)
      if (params.sortByShootTime) q.set('sortByShootTime', params.sortByShootTime)

      return [`public-gallery-images:${keyBase}:${index}`, `/api/v1/public/gallery/images?${q.toString()}`] as const
    },
    ([_, url]) => fetcher(url),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      dedupingInterval: 60_000,
    }
  )
}
