'use client'

import { Card, Row, Col, Button, Progress, Table, theme, Space, Typography } from 'antd'
import type { AnalysisDataProps } from '~/types/props'
import Link from 'next/link'
import { MessageSquareHeart, Star, Send, ArrowUpDown } from 'lucide-react'
import TextCounter from '~/components/ui/origin/text-counter'
import { useTranslations } from 'next-intl'
import { useState, useMemo } from 'react'

const { Text } = Typography

type SortKey = 'camera' | 'count'
type SortDirection = 'ascending' | 'descending'

export default function CardList({ data }: Readonly<AnalysisDataProps>) {
  const t = useTranslations()
  const { token } = theme.useToken()
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null
    direction: SortDirection
  }>({ key: null, direction: 'ascending' })

  const sortedCameraStats = useMemo(() => {
    if (!data?.cameraStats || !sortConfig.key) return data?.cameraStats || []

    return [...data.cameraStats].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (sortConfig.key === 'count') {
        return sortConfig.direction === 'ascending'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue)
      }

      const comparison = String(aValue).localeCompare(String(bValue))
      return sortConfig.direction === 'ascending' ? comparison : -comparison
    })
  }, [data?.cameraStats, sortConfig])

  const requestSort = (key: SortKey) => {
    const direction: SortDirection =
      sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: SortKey) => {
    const isActive = sortConfig.key === key
    const isAscending = sortConfig.direction === 'ascending'
    return (
      <ArrowUpDown
        className={`ml-2 h-4 w-4 ${isActive && isAscending ? 'rotate-180' : ''}`}
      />
    )
  }

  const showPercentage = Math.round(((data?.showTotal ?? 0) / (data?.total || 1)) * 100)

  return (
    <div>
      <Row gutter={[token.margin, token.margin]}>
        <Col xs={24} lg={8}>
          <Card
            style={{
              minHeight: 200,
              borderRadius: token.borderRadiusLG,
            }}
            title={t('Dashboard.picData')}
          >
            <Space vertical style={{ width: '100%' }}>
              <div>
                <Text type="secondary">{t('Dashboard.albumData')}</Text>
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: token.marginXS }}>
                  {data?.tagsTotal ? <TextCounter targetValue={data.tagsTotal} /> : 0}
                  {t('Dashboard.ge')}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: token.margin }}>
                <div>
                  <Text type="secondary">{t('Dashboard.picData')}</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: token.marginXS }}>
                    {data?.total ? <TextCounter targetValue={data.total} /> : 0}
                    {t('Dashboard.zhang')}
                  </div>
                </div>
                <div>
                  <Text type="secondary">{t('Dashboard.picShow')}</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: token.marginXS }}>
                    {data?.showTotal ? <TextCounter targetValue={data.showTotal} /> : 0}
                    {t('Dashboard.zhang')}
                  </div>
                </div>
              </div>
              <Progress percent={showPercentage} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            style={{
              minHeight: 200,
              borderRadius: token.borderRadiusLG,
            }}
            title={t('Dashboard.albumData')}
          >
            <Table
              pagination={false}
              size="small"
              columns={[
                { title: t('Words.album'), dataIndex: 'name', key: 'name' },
                { title: t('Dashboard.show'), dataIndex: 'total', key: 'total' },
                { title: t('Dashboard.count'), dataIndex: 'show_total', key: 'show_total' },
              ]}
              dataSource={(data?.result || []).map((item: any, idx: number) => ({
                key: idx,
                ...item,
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            style={{
              minHeight: 200,
              borderRadius: token.borderRadiusLG,
            }}
            title={t('Dashboard.how')}
          >
            <Space vertical style={{ width: '100%' }} size={token.marginSM}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text type="secondary" style={{ paddingRight: token.paddingSM }}>
                  {t('Dashboard.starTip')}
                </Text>
                <div style={{ flex: 1, height: 1, background: token.colorBorder }} />
              </div>
              <Space size={token.marginSM}>
                <Link href="https://github.com/sourcexu7/XPhotos" target="_blank">
                  <Button type="default" icon={<Star size={16} />}>
                    Star
                  </Button>
                </Link>
                <Link
                  href="https://github.com/sourcexu7/XPhotos/issues/new"
                  target="_blank"
                >
                  <Button type="default" icon={<MessageSquareHeart size={16} />}>
                    {t('Button.issue')}
                  </Button>
                </Link>
                <Link href="https://ziyume.com/docs/xphotos" target="_blank">
                  <Button type="link" icon={<Send />}>
                    文档
                  </Button>
                </Link>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: token.marginLG }}>
        <Table
          pagination={false}
          style={{
            borderRadius: token.borderRadiusLG,
          }}
          columns={[
            {
              title: (
                <div style={{ cursor: 'pointer' }} onClick={() => requestSort('camera')}>
                  <span>{t('Dashboard.camera')}</span>
                  {getSortIcon('camera')}
                </div>
              ),
              dataIndex: 'camera',
              key: 'camera',
            },
            {
              title: (
                <div
                  style={{ textAlign: 'right', cursor: 'pointer' }}
                  onClick={() => requestSort('count')}
                >
                  <span>{t('Dashboard.count')}</span>
                  {getSortIcon('count')}
                </div>
              ),
              dataIndex: 'count',
              key: 'count',
              render: (val: any) => (
                <div style={{ textAlign: 'right' }}>
                  <TextCounter
                    targetValue={Number(val)}
                    fontStyle="text-sm font-normal text-foreground"
                    animated={false}
                  />
                </div>
              ),
            },
          ]}
          dataSource={sortedCameraStats.map((s: any, idx: number) => ({ key: idx, ...s }))}
        />
      </div>
    </div>
  )
}