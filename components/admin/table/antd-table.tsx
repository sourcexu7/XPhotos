'use client'

import React from 'react'
import { Table } from 'antd'

export default function AntdTable<T>({ columns, dataSource, loading, rowKey = 'id' }: { columns: any; dataSource: T[]; loading?: boolean; rowKey?: string }) {
  return (
    <Table columns={columns} dataSource={dataSource} loading={loading} rowKey={rowKey} pagination={{ pageSize: 10 }} />
  )
}
