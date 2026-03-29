'use client'

import React from 'react'
import { Upload, Button } from 'antd'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import MultipleSelector from '~/components/ui/origin/multiselect'
import type { UploadProps } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const { Dragger } = Upload

interface AntdUploadProps extends UploadProps {
  presetTags?: string[]
  onTagChange?: (tags: { primary: string | null, secondary: string[] }) => void
  showTagSelectors?: boolean
}

export default function AntdUpload(props: AntdUploadProps) {
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
          <Select value={primary ?? undefined} onValueChange={(v: string) => onPrimaryChange(v)}>
            <SelectTrigger className="min-w-[160px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="一级标签" /></SelectTrigger>
            <SelectContent>
              {presetTags.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
          <div style={{ minWidth: 240 }}>
            <MultipleSelector
              value={(secondary || []).map(s => ({ value: s, label: s }))}
              options={presetTags.map(t => ({ value: t, label: t }))}
              placeholder="二级标签"
              onChange={(opts?: any) => onSecondaryChange((opts || []).map((o:any) => o.value))}
            />
          </div>
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
