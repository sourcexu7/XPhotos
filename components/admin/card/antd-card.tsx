'use client'

import React from 'react'
import { Card } from 'antd'

export default function AntdCard({ children, ...rest }: React.ComponentProps<typeof Card>) {
  return (
    <Card {...rest}>
      {children}
    </Card>
  )
}
