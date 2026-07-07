'use client'

import React from 'react'
import { Form, Input, Switch, Divider, FormInstance, FormRule } from 'antd'
import { useTranslations } from 'next-intl'

type StorageType = 's3' | 'r2' | 'cos' | 'alist'

interface StorageFormProps {
  form: FormInstance
  storageType: StorageType
  initialValues?: Record<string, any>
  onValuesChange?: (changed: any, all: any) => void
}

export function StorageForm({ form: formInstance, storageType, initialValues, onValuesChange }: StorageFormProps) {
  const t = useTranslations()
  const commonRules: Record<string, FormRule[]> = {
    required: [{ required: true, message: t('Config.requiredField') }],
    url: [{ type: 'url', message: t('Config.invalidUrl') }],
    https: [{
      validator: (_: unknown, value: string) => {
        if (value && !/^https:\/\//i.test(value)) {
          return Promise.reject(new Error(t('Config.mustStartWithHttps')))
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
            label={t('Config.accesskey_id')}
            name="accesskey_id"
            rules={commonRules.required}
          >
            <Input placeholder="AKIAXXXXXXXXXXXXXXXX" />
          </Form.Item>
          <Form.Item
            label={t('Config.secretAccessKey')}
            name="accesskey_secret"
            rules={commonRules.required}
          >
            <Input.Password placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
          </Form.Item>
          <Form.Item
            label={t('Config.region')}
            name="region"
            rules={commonRules.required}
          >
            <Input placeholder="us-east-1" />
          </Form.Item>
          <Form.Item
            label={t('Config.endpoint')}
            name="endpoint"
            rules={[...commonRules.required, ...commonRules.url]}
          >
            <Input placeholder="https://s3.amazonaws.com" />
          </Form.Item>
          <Form.Item
            label={t('Config.bucket')}
            name="bucket"
            rules={commonRules.required}
          >
            <Input placeholder="my-bucket" />
          </Form.Item>
          <Form.Item
            label={t('Config.storageFolder')}
            name="storage_folder"
            tooltip={t('Config.storageFolderTooltip')}
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
            label={t('Config.cos_secret_id')}
            name="cos_secret_id"
            rules={commonRules.required}
          >
            <Input placeholder="AKID****************" />
          </Form.Item>
          <Form.Item
            label={t('Config.cos_secret_key')}
            name="cos_secret_key"
            rules={commonRules.required}
          >
            <Input.Password placeholder="****************" />
          </Form.Item>
          <Form.Item
            label={t('Config.cos_region')}
            name="cos_region"
            rules={commonRules.required}
          >
            <Input placeholder="ap-guangzhou" />
          </Form.Item>
          <Form.Item
            label={t('Config.cos_endpoint')}
            name="cos_endpoint"
            rules={[...commonRules.required, ...commonRules.https]}
          >
            <Input placeholder="https://cos.ap-guangzhou.myqcloud.com" />
          </Form.Item>
          <Form.Item
            label={t('Config.bucketWithAppId')}
            name="cos_bucket"
            rules={commonRules.required}
          >
            <Input placeholder="example-1250000000" />
          </Form.Item>
          <Form.Item
            label={t('Config.storageFolder')}
            name="cos_storage_folder"
            tooltip={t('Config.storageFolderTooltip')}
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
          <Form.Item label={t('Config.forcePathStyle')} name="force_path_style" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label={t('Config.enableCDN')} name="s3_cdn" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.s3_cdn !== cur.s3_cdn}>
            {({ getFieldValue }) =>
              getFieldValue('s3_cdn') ? (
                <Form.Item label={t('Config.cdnUrl')} name="s3_cdn_url" rules={[...commonRules.required, ...commonRules.url]}>
                  <Input placeholder="https://cdn.example.com" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label={t('Config.directDownload')} name="s3_direct_download" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )
    }

    if (storageType === 'cos') {
      return (
        <>
          <Form.Item label={t('Config.forcePathStyle')} name="cos_force_path_style" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label={t('Config.enableCDN')} name="cos_cdn" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.cos_cdn !== cur.cos_cdn}>
            {({ getFieldValue }) =>
              getFieldValue('cos_cdn') ? (
                <Form.Item label={t('Config.cdnUrl')} name="cos_cdn_url" rules={[...commonRules.required, ...commonRules.url]}>
                  <Input placeholder="https://cdn.example.com" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label={t('Config.directDownload')} name="cos_direct_download" valuePropName="checked">
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
      
      <Divider titlePlacement="left" style={{ margin: '24px 0 16px' }}>{t('Config.advancedSettings')}</Divider>
      
      {renderAdvancedFields()}
    </Form>
  )
}
