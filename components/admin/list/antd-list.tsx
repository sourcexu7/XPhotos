'use client'

import React from 'react'
import { List, Card } from 'antd'

export default function AntdList<T>({
  dataSource,
  renderItem,
  ...rest
}: React.ComponentProps<typeof List>) {
  return (
    <List
      grid={{ gutter: 16, column: 3 }}
      dataSource={dataSource}
      renderItem={(item: any) => (
        <List.Item>
          {renderItem ? renderItem(item) : <Card title={item.title}>{item.content}</Card>}
        </List.Item>
      )}
      {...rest}
    />
  )
}
