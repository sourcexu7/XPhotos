'use client'

import React from 'react'
import type { ImageDataProps } from '~/types/props.ts'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Card, Table, theme } from 'antd'

dayjs.extend(customParseFormat)

export default function ExifView(props: Readonly<ImageDataProps>) {
  const { token } = theme.useToken()
  
  const exifData = [
    { key: 'make', label: '相机品牌', value: props.data?.exif?.make },
    { key: 'model', label: '相机型号', value: props.data?.exif?.model },
    { key: 'bits', label: 'bit 位数', value: props.data?.exif?.bits },
    { 
      key: 'data_time', 
      label: '拍摄时间', 
      value: dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() 
        ? dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
        : null
    },
    { key: 'exposure_time', label: '快门时间', value: props.data?.exif?.exposure_time },
    { key: 'f_number', label: '光圈', value: props.data?.exif?.f_number },
    { key: 'exposure_program', label: '曝光程序', value: props.data?.exif?.exposure_program },
    { key: 'iso_speed_rating', label: 'ISO', value: props.data?.exif?.iso_speed_rating },
    { key: 'focal_length', label: '焦距', value: props.data?.exif?.focal_length },
    { key: 'lens_specification', label: '镜头规格', value: props.data?.exif?.lens_specification },
    { key: 'lens_model', label: '镜头型号', value: props.data?.exif?.lens_model },
    { key: 'exposure_mode', label: '曝光模式', value: props.data?.exif?.exposure_mode },
    { key: 'cfa_pattern', label: 'CFA 模式', value: props.data?.exif?.cfa_pattern },
    { key: 'color_space', label: '色彩空间', value: props.data?.exif?.color_space },
    { key: 'white_balance', label: '白平衡', value: props.data?.exif?.white_balance },
  ].filter(item => item.value)

  const columns = [
    {
      title: '参数',
      dataIndex: 'label',
      key: 'label',
      width: '40%',
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
    },
  ]

  return (
    <Card style={{ borderRadius: token.borderRadiusLG }}>
      <Table
        columns={columns}
        dataSource={exifData}
        pagination={false}
        size="small"
        rowKey="key"
      />
    </Card>
  )
}