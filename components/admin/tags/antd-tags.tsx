'use client'

import React from 'react'
import AntdTag from '~/components/admin/tag/antd-tag'

export default function AntdTags({ tags }: { tags: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tags?.map((t) => (
        <AntdTag key={t}>{t}</AntdTag>
      ))}
    </div>
  )
}
