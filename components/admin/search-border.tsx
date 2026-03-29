'use client'

import { Button } from 'antd'
import { cn } from '~/lib/utils'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
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
      <MagnifyingGlassIcon className="mr-2 h-4 w-4 inline-block align-middle" />
      <span className="align-middle">搜索</span>
    </Button>
  )
}