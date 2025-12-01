'use client'

import React from 'react'
import { Pagination } from 'antd'

export default function AntdPagination({ total = 0, pageSize = 10, current = 1, onChange }: { total?: number; pageSize?: number; current?: number; onChange?: (p: number, ps?: number) => void }) {
  return <Pagination total={total} pageSize={pageSize} current={current} onChange={onChange} />
}
