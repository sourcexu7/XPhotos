'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { useState, useEffect } from 'react'

export function ProgressBarProviders({children}: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {mounted && (
        <ProgressBar
          height="2px"
          color="oklch(87.2% 0.01 258.338)"
          shallowRouting
        />
      )}
      {children}
    </>
  )
}
