'use client'

import React from 'react'
import { Input } from 'antd'

const { Search } = Input

export default function AntdSearchButton({ onSearch, placeholder = '搜索' }: { onSearch?: (val: string) => void; placeholder?: string }) {
  return <Search placeholder={placeholder} onSearch={onSearch} enterButton />
}
