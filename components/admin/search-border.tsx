'use client'

import { Button } from 'antd'
import { cn } from '~/lib/utils'
import { SearchOutlined } from '@ant-design/icons'
import { useButtonStore } from '~/app/providers/button-store-providers'

export default function SearchBorder() {
  const { setSearchOpen } = useButtonStore(
    (state) => state,
  )

  return (
    <Button
      className={cn(
        'w-[240px] justify-start text-left font-normal',
        'text-muted-foreground'
      )}
      onClick={() => setSearchOpen(true)}
    >
      <SearchOutlined style={{ marginRight: 8, fontSize: 16 }} />
      <span className="align-middle">搜索</span>
    </Button>
  )
}