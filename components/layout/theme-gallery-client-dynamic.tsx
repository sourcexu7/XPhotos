'use client'

import dynamic from 'next/dynamic'

export const ThemeGalleryClient = dynamic(
  () => import('~/components/layout/theme-gallery-client'),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground/50 animate-spin" />
      </div>
    ),
  },
)
