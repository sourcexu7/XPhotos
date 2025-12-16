'use client'

import React from 'react'
import { Form, Input, Switch, Button } from 'antd'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'

const { TextArea } = Input

export default function AntdForm<T = unknown>({ onFinish, initialValues }: { onFinish?: (v: T) => void; initialValues?: T }) {
  return (
    <Form layout="vertical" onFinish={onFinish} initialValues={initialValues}>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item name="category" label="分类">
        {/* Adapter: Form.Item provides `value` and `onChange` — map to Select's `value` and `onValueChange` */}
        {(fieldProps) => (
          <Select value={fieldProps.value ?? undefined} onValueChange={fieldProps.onChange}>
            <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="请选择" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认</SelectItem>
            </SelectContent>
          </Select>
        )}
      </Form.Item>
      <Form.Item name="published" label="发布">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  )
}
