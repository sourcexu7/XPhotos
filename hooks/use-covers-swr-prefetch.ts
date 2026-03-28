'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export function useCoversPrefetch() {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    mutate('/api/v1/public/covers', fetcher('/api/v1/public/covers'), {
      populateCache: true,
      revalidate: false,
    })
    // 只做一次预热
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

