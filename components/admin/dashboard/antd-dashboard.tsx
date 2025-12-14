'use client'

import React from 'react'
import { Row, Col, Card, Statistic, Table } from 'antd'
import type { AnalysisDataProps } from '~/types/props'

export default function AntdDashboard({ data }: { data: AnalysisDataProps['data'] }) {
  const cameraColumns = [
    { title: 'Camera', dataIndex: 'camera', key: 'camera' },
    { title: 'Count', dataIndex: 'count', key: 'count', align: 'right' as const },
  ]

  const albumColumns = [
    { title: 'Album', dataIndex: 'name', key: 'name' },
    { title: 'Total', dataIndex: 'total', key: 'total' },
    { title: 'Show', dataIndex: 'show_total', key: 'show_total' },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="总图片数" value={data?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="已展示" value={data?.showTotal ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="标签总数" value={data?.tagsTotal ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="相机种类" value={(data?.cameraStats?.length) ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="相机统计">
            <Table 
              dataSource={data?.cameraStats ?? []} 
              columns={cameraColumns} 
              pagination={false} 
              rowKey={(r) => r.camera}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="相册统计">
            <Table 
              dataSource={data?.result ?? []} 
              columns={albumColumns} 
              pagination={false} 
              rowKey={(r: { name: string }) => r.name}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
