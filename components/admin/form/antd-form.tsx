'use client'

import React from 'react'
import { Form, Input, Select, Switch, Button } from 'antd'

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
        <Select options={[{ label: '默认', value: 'default' }]} />
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
