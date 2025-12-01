'use client'

import React from 'react'
import { Upload, Button, Select as AntSelect } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const { Dragger } = Upload

export default function AntdUpload(props: any) {
  const [primary, setPrimary] = React.useState<string | null>(null)
  const [secondary, setSecondary] = React.useState<string[]>([])

  const presetTags: string[] = props.presetTags || []

  function onPrimaryChange(v: string) {
    setPrimary(v)
    props.onTagChange?.({ primary: v, secondary })
  }

  function onSecondaryChange(v: string[]) {
    setSecondary(v)
    props.onTagChange?.({ primary, secondary: v })
  }
  return (
    <div>
      {props.showTagSelectors && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <AntSelect placeholder="一级标签" style={{ minWidth: 160 }} value={primary} onChange={onPrimaryChange} allowClear>
            {presetTags.map(t => (<AntSelect.Option key={t} value={t}>{t}</AntSelect.Option>))}
          </AntSelect>
          <AntSelect mode="multiple" placeholder="二级标签" style={{ minWidth: 240 }} value={secondary} onChange={onSecondaryChange} allowClear>
            {presetTags.map(t => (<AntSelect.Option key={t} value={t}>{t}</AntSelect.Option>))}
          </AntSelect>
        </div>
      )}
      <Dragger {...props} style={{ padding: 16 }}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">将文件拖拽到此处，或点击上传</p>
      </Dragger>
      <div style={{ marginTop: 12 }}>
        <Button icon={<UploadOutlined />}>上传文件</Button>
      </div>
    </div>
  )
}
