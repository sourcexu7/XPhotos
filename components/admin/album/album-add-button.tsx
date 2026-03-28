'use client'

import { Button } from 'antd'
import React from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'

export default function AlbumAddButton() {
  const { setAlbumAdd } = useButtonStore(
    (state) => state,
  )

  return (
    <Button
      type="primary"
      className="cursor-pointer !text-white"
      onClick={() => setAlbumAdd(true)}
      aria-label="新增"
    >
      新增
    </Button>
  )
}

