'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function RouteLoopGuard() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [stuck, setStuck] = useState(false)

  const currentKey = useMemo(
    () => (searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname),
    [pathname, searchParams],
  )

  useEffect(() => {
    if (!currentKey) return
  }, [currentKey])

  if (!stuck) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-6">
      <div className="max-w-md rounded-2xl bg-background/95 p-6 text-center shadow-2xl">
        <p className="mb-4 text-sm text-muted-foreground">
          检测到页面在短时间内发生异常跳转，已为你暂停自动导航。
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }}
          >
            返回首页
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground"
            onClick={() => {
              setStuck(false)
            }}
          >
            继续浏览
          </button>
        </div>
      </div>
    </div>
  )
}

