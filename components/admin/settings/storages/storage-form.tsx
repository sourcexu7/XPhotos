'use client'

import React from 'react'
import { Form, Input, Switch, Divider, FormInstance, FormRule } from 'antd'

type StorageType = 's3' | 'r2' | 'cos' | 'alist'

interface StorageFormProps {
  form: FormInstance
  storageType: StorageType
  initialValues?: Record<string, any>
  onValuesChange?: (changed: any, all: any) => void
}

export function StorageForm({ form: formInstance, storageType, initialValues, onValuesChange }: StorageFormProps) {
  const commonRules: Record<string, FormRule[]> = {
    required: [{ required: true, message: '该字段为必填项' }],
    url: [{ type: 'url', message: '请输入合法的 URL（包含协议，例如 https://）' }],
    https: [{
      validator: (_: unknown, value: string) => {
        if (value && !/^https:\/\//i.test(value)) {
          return Promise.reject(new Error('必须以 https:// 开头'))
        }
        return Promise.resolve()
      }
    }]
  }

  const renderBasicFields = () => {
    if (storageType === 's3') {
      return (
        <>
          <Form.Item
            label="Access Key ID"
            name="accesskey_id"
            rules={commonRules.required}
          >
            <Input placeholder="AKIAXXXXXXXXXXXXXXXX" />
          </Form.Item>
          <Form.Item
            label="Secret Access Key"
            name="accesskey_secret"
            rules={commonRules.required}
          >
            <Input.Password placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
          </Form.Item>
          <Form.Item
            label="Region"
            name="region"
            rules={commonRules.required}
          >
            <Input placeholder="us-east-1" />
          </Form.Item>
          <Form.Item
            label="Endpoint"
            name="endpoint"
            rules={[...commonRules.required, ...commonRules.url]}
          >
            <Input placeholder="https://s3.amazonaws.com" />
          </Form.Item>
          <Form.Item
            label="Bucket"
            name="bucket"
            rules={commonRules.required}
          >
            <Input placeholder="my-bucket" />
          </Form.Item>
          <Form.Item
            label="Storage Folder"
            name="storage_folder"
            tooltip="Leave empty for root, no leading/trailing slashes"
          >
            <Input placeholder="path/to/folder" />
          </Form.Item>
        </>
      )
    }

    if (storageType === 'cos') {
      return (
        <>
          <Form.Item
            label="Secret ID"
            name="cos_secret_id"
            rules={commonRules.required}
          >
            <Input placeholder="AKID****************" />
          </Form.Item>
          <Form.Item
            label="Secret Key"
            name="cos_secret_key"
            rules={commonRules.required}
          >
            <Input.Password placeholder="****************" />
          </Form.Item>
          <Form.Item
            label="Region"
            name="cos_region"
            rules={commonRules.required}
          >
            <Input placeholder="ap-guangzhou" />
          </Form.Item>
          <Form.Item
            label="Endpoint"
            name="cos_endpoint"
            rules={[...commonRules.required, ...commonRules.https]}
          >
            <Input placeholder="https://cos.ap-guangzhou.myqcloud.com" />
          </Form.Item>
          <Form.Item
            label="Bucket (with AppId)"
            name="cos_bucket"
            rules={commonRules.required}
          >
            <Input placeholder="example-1250000000" />
          </Form.Item>
          <Form.Item
            label="Storage Folder"
            name="cos_storage_folder"
            tooltip="Leave empty for root, no leading/trailing slashes"
          >
            <Input placeholder="path/to/folder" />
          </Form.Item>
        </>
      )
    }

    // Add R2 and AList implementations as needed
    return null
  }

  const renderAdvancedFields = () => {
    if (storageType === 's3') {
      return (
        <>
          <Form.Item label="强制 Path-Style" name="force_path_style" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="启用 CDN" name="s3_cdn" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.s3_cdn !== cur.s3_cdn}>
            {({ getFieldValue }) =>
              getFieldValue('s3_cdn') ? (
                <Form.Item label="CDN URL" name="s3_cdn_url" rules={[...commonRules.required, ...commonRules.url]}>
                  <Input placeholder="https://cdn.example.com" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="直接下载" name="s3_direct_download" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )
    }

    if (storageType === 'cos') {
      return (
        <>
          <Form.Item label="强制 Path-Style" name="cos_force_path_style" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="启用 CDN" name="cos_cdn" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.cos_cdn !== cur.cos_cdn}>
            {({ getFieldValue }) =>
              getFieldValue('cos_cdn') ? (
                <Form.Item label="CDN URL" name="cos_cdn_url" rules={[...commonRules.required, ...commonRules.url]}>
                  <Input placeholder="https://cdn.example.com" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="直接下载" name="cos_direct_download" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )
    }

    return null
  }

  return (
    <Form
      form={formInstance}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={onValuesChange}
    >
      {renderBasicFields()}
      
      <Divider titlePlacement="left" style={{ margin: '24px 0 16px' }}>Advanced Settings</Divider>
      
      {renderAdvancedFields()}
    </Form>
  )
}
