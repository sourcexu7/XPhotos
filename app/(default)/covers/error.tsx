'use client'

import { useEffect } from 'react'
import { Button } from '~/components/ui/button'

export default function CoversError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/covers]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-muted-foreground">页面加载出错，请重试</p>
      <Button variant="outline" onClick={reset}>
        重新加载
      </Button>
    </div>
  )
}
