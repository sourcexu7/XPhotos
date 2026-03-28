'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useCoversPrefetch } from '~/hooks/use-covers-swr-prefetch'

export default function CoversBackButton() {
  useCoversPrefetch()
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="ghost"
      className="gap-2 pl-0 hover:bg-transparent hover:text-gray-900"
      onClick={() => {
        // iOS/弱网/冷启动场景：可能没有可回退历史，直接回到 covers
        if (typeof window !== 'undefined' && window.history.length <= 1) {
          router.push('/covers')
          return
        }
        router.back()
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      返回相册列表
    </Button>
  )
}

