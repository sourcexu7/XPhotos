'use client'

import React from 'react'
import { Row, Col, Card, Image } from 'antd'

export default function AntdAlbum({ items }: { items: Array<{ src: string; title?: string }> }) {
  return (
    <Row gutter={[16, 16]}>
      {items?.map((it, idx) => (
        <Col key={idx} xs={24} sm={12} md={8} lg={6}>
          <Card hoverable cover={<Image src={it.src} alt={it.title || 'image'} />}>
            {it.title}
          </Card>
        </Col>
      ))}
    </Row>
  )
}
