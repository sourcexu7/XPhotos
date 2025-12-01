'use client'

import React from 'react'
import { Button } from 'antd'

export default function AntdButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} />
}
