'use client'

import { useTranslations } from 'next-intl'

export default function AlbumTitle() {
  const t = useTranslations()
  return (
    <h4 className="text-small font-semibold leading-none text-gray-900 select-none">
      {t('Album.management')}
    </h4>
  )
} 