'use client'

import React from 'react'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import type { HandleProps } from '~/types/props.ts'
import { ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

export default function RefreshButton(props: Readonly<HandleProps>) {
  const { isLoading, mutate } = useSwrHydrated(props)

  return (
    <Button
      icon={isLoading ? <ReloadOutlined spin /> : <ReloadOutlined />}
      disabled={isLoading}
      onClick={async () => {
        await mutate()
      }}
    >
      刷新
    </Button>
  )
}