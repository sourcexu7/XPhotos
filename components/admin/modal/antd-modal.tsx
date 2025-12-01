'use client'

import React from 'react'
import { Modal } from 'antd'

export default function AntdModal({ visible, onOk, onCancel, title, children }: { visible: boolean; onOk?: () => void; onCancel?: () => void; title?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Modal open={visible} onOk={onOk} onCancel={onCancel} title={title}>
      {children}
    </Modal>
  )
}
