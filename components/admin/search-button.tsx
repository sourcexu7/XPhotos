'use client'

import { SearchOutlined } from '@ant-design/icons'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { usePathname } from 'next/navigation'

export default function SearchButton() {
  const pathname = usePathname()
  const { setSearchOpen } = useButtonStore(
    (state) => state,
  )

  return (
    <>
      {
        pathname.startsWith('/admin') && <SearchOutlined onClick={() => setSearchOpen(true)} />
      }
    </>
  )
}