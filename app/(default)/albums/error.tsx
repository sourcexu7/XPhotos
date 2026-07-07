'use client'

import { useEffect } from 'react'
import { Button } from '~/components/ui/button'

export default function AlbumsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/albums]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-muted-foreground">页面加载出错，请重试</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={reset}>
          重新加载
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/'
          }}
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}

