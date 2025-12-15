import { Badge, Tag } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import React from 'react'

export default function TabsTableCell(props : Readonly<any>) {
  const { data } = props
  
  // 转换为 Ant Design Table 所需的 dataSource 格式
  return data.map((item: any) => ({
    key: item.id,
    config_key: item.config_key,
    config_value: item.config_value,
    renderValue: () => {
      if (!item.config_value) {
        return <Tag>N&A</Tag>
      }
      if (item.config_value === 'true') {
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            true
          </Tag>
        )
      }
      if (item.config_value === 'false') {
        return (
          <Tag icon={<CloseCircleOutlined />} color="warning">
            false
          </Tag>
        )
      }
      return <Tag color="default">{item.config_value}</Tag>
    }
  }))
}