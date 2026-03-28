'use client'

import React from 'react'
import { Input } from 'antd'

export default function AntdSearchBorder({ placeholder = '搜索' }: { placeholder?: string }) {
  return <Input placeholder={placeholder} style={{ borderRadius: 8 }} />
}
