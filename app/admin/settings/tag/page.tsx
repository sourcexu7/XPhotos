'use client'
import React from 'react'
import dynamic from 'next/dynamic'

const TagManager = dynamic(
  () => import('~/components/admin/tags/tag-manager'),
  { ssr: false }
)

export default function AdminSettingsTagPage() {
  return (
    <div className="p-4">
      <TagManager />
    </div>
  )
}
