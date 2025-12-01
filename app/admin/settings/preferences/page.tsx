'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button, Input, Form, Switch, Select, Card, Space, Row, Col, Typography, theme } from 'antd'
import { SaveOutlined, CopyOutlined } from '@ant-design/icons'

const { Compact } = Space

export default function Preferences() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { token } = theme.useToken()
  const t = useTranslations()

  const { data, isValidating, isLoading } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  async function updateInfo(values: any) {
    const maxWidth = parseInt(values.previewImageMaxWidth)
    if (isNaN(maxWidth) || maxWidth < 0) {
      toast.error('预览图最大宽度限制不能小于 0')
      return
    }
    const previewQuality = parseFloat(values.previewQuality)
    if (isNaN(previewQuality) || previewQuality <= 0 || previewQuality > 1) {
      toast.error('预览图压缩质量只支持0-1，大于0')
      return
    }
    const maxFiles = parseInt(values.maxUploadFiles)
    if (isNaN(maxFiles) || maxFiles < 1) {
      toast.error('最大上传文件数量不能小于 1')
      return
    }
    const imagesPerPage = parseInt(values.adminImagesPerPage)
    if (isNaN(imagesPerPage) || imagesPerPage < 1) {
      toast.error(t('Preferences.inputAdminImagesPerPage'))
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/settings/update-custom-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          customFaviconUrl: values.customFaviconUrl,
          customAuthor: values.customAuthor,
          feedId: values.feedId,
          userId: values.userId,
          customIndexStyle: values.customIndexStyle,
          customIndexDownloadEnable: values.customIndexDownloadEnable,
          enablePreviewImageMaxWidthLimit: values.enablePreviewImageMaxWidthLimit,
          previewImageMaxWidth: maxWidth,
          previewQuality,
          umamiHost: values.umamiHost,
          umamiAnalytics: values.umamiAnalytics,
          maxUploadFiles: maxFiles,
          customIndexOriginEnable: values.customIndexOriginEnable,
          adminImagesPerPage: imagesPerPage
        }),
      }).then(res => res.json())
      toast.success('修改成功！')
    } catch (e) {
      toast.error('修改失败！')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data?.find((item) => item.config_key === 'custom_title')?.config_value || '',
        customFaviconUrl: data?.find((item) => item.config_key === 'custom_favicon_url')?.config_value || '',
        customAuthor: data?.find((item) => item.config_key === 'custom_author')?.config_value || '',
        feedId: data?.find((item) => item.config_key === 'rss_feed_id')?.config_value || '',
        userId: data?.find((item) => item.config_key === 'rss_user_id')?.config_value || '',
        customIndexStyle: data?.find((item) => item.config_key === 'custom_index_style')?.config_value || '0',
        customIndexDownloadEnable: data?.find((item) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true' || false,
        previewImageMaxWidth: data?.find((item) => item.config_key === 'preview_max_width_limit')?.config_value?.toString() || '0',
        enablePreviewImageMaxWidthLimit: data?.find((item) => item.config_key === 'preview_max_width_limit_switch')?.config_value === '1',
        previewQuality: data?.find((item) => item.config_key === 'preview_quality')?.config_value || '0.2',
        umamiHost: data?.find((item) => item.config_key === 'umami_host')?.config_value || '',
        umamiAnalytics: data?.find((item) => item.config_key === 'umami_analytics')?.config_value || '',
        maxUploadFiles: data?.find((item) => item.config_key === 'max_upload_files')?.config_value || '5',
        customIndexOriginEnable: data?.find((item) => item.config_key === 'custom_index_origin_enable')?.config_value.toString() === 'true' || false,
        adminImagesPerPage: data?.find((item) => item.config_key === 'admin_images_per_page')?.config_value || '8',
      })
    }
  }, [data, form])

  return (
    <div style={{ height: '100%' }}>
      <Card
        title={t('Link.preferences')}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading || isValidating}
            onClick={() => form.submit()}
          >
            {t('Button.submit')}
          </Button>
        }
        style={{ height: '100%', borderRadius: token.borderRadiusLG }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={updateInfo}
          disabled={isValidating || isLoading}
        >
          <Row gutter={[token.marginLG, token.marginLG]}>
            {/* 第一列：基本信息 */}
            <Col xs={24} lg={6}>
              <Space vertical size={token.margin} style={{ width: '100%' }}>
                <Form.Item
                  label={t('Preferences.webSiteTitle')}
                  name="title"
                >
                  <Input placeholder={t('Preferences.inputWebSiteTitle')} />
                </Form.Item>

                <Form.Item
                  label="favicon"
                  name="customFaviconUrl"
                >
                  <Input placeholder={t('Preferences.favicon')} />
                </Form.Item>

                <Form.Item
                  label={t('Preferences.webAuthor')}
                  name="customAuthor"
                >
                  <Input placeholder={t('Preferences.inputWebAuthor')} />
                </Form.Item>
              </Space>
            </Col>

            {/* 第二列：RSS 和分析 */}
            <Col xs={24} lg={6}>
              <Space vertical size={token.margin} style={{ width: '100%' }}>
                <Form.Item
                  label="RSS feedId"
                  name="feedId"
                >
                  <Input placeholder={t('Preferences.inputFeedId')} />
                </Form.Item>

                <Form.Item
                  label="RSS userId"
                  name="userId"
                >
                  <Input placeholder={t('Preferences.inputUserId')} />
                </Form.Item>

                <Form.Item label="RSS URI">
                  <Compact style={{ width: '100%' }}>
                    <Input
                      readOnly
                      value={typeof window !== 'undefined' ? window.location.origin + '/rss.xml' : ''}
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        try {
                          const url = typeof window !== 'undefined' ? window.location.origin + '/rss.xml' : ''
                          await navigator.clipboard.writeText(url)
                          toast.success('复制成功！', {duration: 500})
                        } catch (error) {
                          toast.error('复制失败！', {duration: 500})
                        }
                      }}
                    />
                  </Compact>
                </Form.Item>

                <Form.Item
                  label="Umami Cloud Analytics"
                  name="umamiHost"
                >
                  <Input placeholder={t('Preferences.umamiHost')} />
                </Form.Item>

                <Form.Item
                  label="Umami Website ID"
                  name="umamiAnalytics"
                >
                  <Input placeholder={t('Preferences.umamiAnalytics')} />
                </Form.Item>
              </Space>
            </Col>

            {/* 第三列：显示设置 */}
            <Col xs={24} lg={6}>
              <Space vertical size={token.margin} style={{ width: '100%' }}>
                <Form.Item
                  label={t('Preferences.indexThemeSelect')}
                  name="customIndexStyle"
                >
                  <Select
                    options={[
                      { label: t('Theme.indexDefaultStyle'), value: '0' },
                      { label: t('Theme.indexSimpleStyle'), value: '1' },
                      { label: t('Theme.indexWaterfallStyle'), value: '2' }
                    ]}
                    placeholder={t('Preferences.indexThemeSelect')}
                  />
                </Form.Item>

                <Form.Item
                  label={t('Preferences.previewQuality')}
                  name="previewQuality"
                >
                  <Input type="number" min={0.01} max={1} step={0.01} placeholder={t('Preferences.inputPreviewQuality')} />
                </Form.Item>

                <Form.Item
                  label={t('Preferences.maxWidth')}
                  name="previewImageMaxWidth"
                >
                  <Input type="number" placeholder={t('Preferences.inputMaxWidth')} />
                </Form.Item>

                <Form.Item
                  label={t('Preferences.maxUploadFiles')}
                  name="maxUploadFiles"
                >
                  <Input type="number" min={1} placeholder={t('Preferences.inputMaxUploadFiles')} />
                </Form.Item>

                <Form.Item
                  label={t('Preferences.adminImagesPerPage')}
                  name="adminImagesPerPage"
                >
                  <Input type="number" min={1} placeholder={t('Preferences.inputAdminImagesPerPage')} />
                </Form.Item>
              </Space>
            </Col>

            {/* 第四列：开关设置 */}
            <Col xs={24} lg={6}>
              <Space vertical size={token.margin} style={{ width: '100%' }}>
                <Card
                  size="small"
                  style={{
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorder
                  }}
                >
                  <Space vertical size={token.marginXS} style={{ width: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {t('Preferences.customIndexDownloadEnable')}
                    </Typography.Text>
                    <Form.Item
                      name="customIndexDownloadEnable"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch />
                    </Form.Item>
                  </Space>
                </Card>

                <Card
                  size="small"
                  style={{
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorder
                  }}
                >
                  <Space vertical size={token.marginXS} style={{ width: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {t('Preferences.enableMaxWidthLimit')}
                    </Typography.Text>
                    <Form.Item
                      name="enablePreviewImageMaxWidthLimit"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch />
                    </Form.Item>
                  </Space>
                </Card>

                <Card
                  size="small"
                  style={{
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorder
                  }}
                >
                  <Space vertical size={token.marginXS} style={{ width: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {t('Preferences.customIndexOriginEnable')}
                    </Typography.Text>
                    <Form.Item
                      name="customIndexOriginEnable"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch />
                    </Form.Item>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}
