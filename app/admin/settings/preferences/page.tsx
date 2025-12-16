'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button, Input, Form, Switch, Card, Space, Row, Col, Typography, theme } from 'antd'
import { SaveOutlined, CopyOutlined } from '@ant-design/icons'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
// 新增：「关于我」头像上传使用现有上传工具 & 压缩
import Compressor from 'compressorjs'
import { uploadFile } from '~/lib/utils/file'

const { Compact } = Space

export default function Preferences() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [aboutUploading, setAboutUploading] = useState(false)
  const [aboutPreviewUrl, setAboutPreviewUrl] = useState('')
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
          // 瀑布流(2) / 单列(1)，默认瀑布流
          customIndexStyle: values.customIndexStyle ?? '2',
          customIndexDownloadEnable: values.customIndexDownloadEnable,
          enablePreviewImageMaxWidthLimit: values.enablePreviewImageMaxWidthLimit,
          previewImageMaxWidth: maxWidth,
          previewQuality,
          umamiHost: values.umamiHost,
          umamiAnalytics: values.umamiAnalytics,
          maxUploadFiles: maxFiles,
          customIndexOriginEnable: values.customIndexOriginEnable,
          adminImagesPerPage: imagesPerPage,
          // 新增：「关于我」前台展示配置
          aboutIntro: values.aboutIntro,
          aboutPhotoOriginalUrl: values.aboutPhotoOriginalUrl,
          aboutPhotoPreviewUrl: values.aboutPhotoPreviewUrl,
          aboutInsUrl: values.aboutInsUrl,
          aboutXhsUrl: values.aboutXhsUrl,
          aboutWeiboUrl: values.aboutWeiboUrl,
          aboutGithubUrl: values.aboutGithubUrl,
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
        // 仅保留单列(1)与瀑布流(2)，默认瀑布流
        customIndexStyle: data?.find((item) => item.config_key === 'custom_index_style')?.config_value || '2',
        customIndexDownloadEnable: data?.find((item) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true' || false,
        previewImageMaxWidth: data?.find((item) => item.config_key === 'preview_max_width_limit')?.config_value?.toString() || '0',
        enablePreviewImageMaxWidthLimit: data?.find((item) => item.config_key === 'preview_max_width_limit_switch')?.config_value === '1',
        previewQuality: data?.find((item) => item.config_key === 'preview_quality')?.config_value || '0.2',
        umamiHost: data?.find((item) => item.config_key === 'umami_host')?.config_value || '',
        umamiAnalytics: data?.find((item) => item.config_key === 'umami_analytics')?.config_value || '',
        maxUploadFiles: data?.find((item) => item.config_key === 'max_upload_files')?.config_value || '5',
        customIndexOriginEnable: data?.find((item) => item.config_key === 'custom_index_origin_enable')?.config_value.toString() === 'true' || false,
        adminImagesPerPage: data?.find((item) => item.config_key === 'admin_images_per_page')?.config_value || '8',
        // 新增：「关于我」前台展示配置
        aboutIntro: data?.find((item) => item.config_key === 'about_intro')?.config_value || '',
        aboutPhotoOriginalUrl: data?.find((item) => item.config_key === 'about_photo_original_url')?.config_value || '',
        aboutPhotoPreviewUrl: data?.find((item) => item.config_key === 'about_photo_preview_url')?.config_value || '',
        aboutInsUrl: data?.find((item) => item.config_key === 'about_ins_url')?.config_value || '',
        aboutXhsUrl: data?.find((item) => item.config_key === 'about_xhs_url')?.config_value || '',
        aboutWeiboUrl: data?.find((item) => item.config_key === 'about_weibo_url')?.config_value || '',
        aboutGithubUrl: data?.find((item) => item.config_key === 'about_github_url')?.config_value || '',
      })
      const preview = data?.find((item) => item.config_key === 'about_photo_preview_url')?.config_value
      if (preview) setAboutPreviewUrl(preview)
    }
  }, [data, form])

  // 新增：「关于我」个人照片上传逻辑（限制 JPG/PNG + 粗略校验 9:16 比例）
  const handleAboutPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('仅支持 JPG / PNG 格式的图片')
      return
    }
    // Bug修复：上传体积限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小需小于 5MB')
      return
    }

    setAboutUploading(true)

    try {
      // 先读取尺寸进行比例校验
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.onerror = reject
          // @ts-expect-error - FileReader result typing
          img.src = e.target?.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const ratio = dimensions.width / dimensions.height
      const target = 9 / 16
      const diff = Math.abs(ratio - target)
      if (diff > 0.1) {
        toast.warning('建议上传接近 9:16 比例的竖图，以获得最佳展示效果')
      }

      // 上传原图
      const originalResp = await uploadFile(file, '/about/original', 's3', '')
      if (originalResp.code !== 200 || !originalResp.data?.url) {
        throw new Error('原图上传失败')
      }

      // 生成压缩预览图（用于前台 About 展示）
      const previewFile: File = await new Promise((resolve, reject) => {
        // @ts-expect-error - compressorjs constructor typing
        new Compressor(file, {
          quality: 0.8,
          maxWidth: 1080,
          maxHeight: 1920,
          success(result: Blob | File) {
            const f = result instanceof File ? result : new File([result], file.name, { type: file.type })
            resolve(f)
          },
          error(err: Error) {
            reject(err)
          },
        })
      })

      const previewResp = await uploadFile(previewFile, '/about/preview', 's3', '')
      if (previewResp.code !== 200 || !previewResp.data?.url) {
        throw new Error('预览图上传失败')
      }

      form.setFieldsValue({
        aboutPhotoOriginalUrl: originalResp.data.url,
        aboutPhotoPreviewUrl: previewResp.data.url,
      })
      setAboutPreviewUrl(previewResp.data.url)

      toast.success('个人照片上传成功')
    } catch (e) {
      console.error(e)
      toast.error('个人照片上传失败，请稍后重试')
    } finally {
      setAboutUploading(false)
      // 重置 input，避免选择同一文件时不触发 change
      event.target.value = ''
    }
  }

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
                >
                  <Select
                    value={form.getFieldValue('customIndexStyle') ?? undefined}
                    onValueChange={(v: string) => form.setFieldsValue({ customIndexStyle: v })}
                  >
                    <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200">
                      <SelectValue placeholder={t('Preferences.indexThemeSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">单列主题</SelectItem>
                      <SelectItem value="2">瀑布流主题（默认）</SelectItem>
                    </SelectContent>
                  </Select>
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

          {/* 新增：「关于我」前台配置模块 */}
          <Row gutter={[token.marginLG, token.marginLG]} style={{ marginTop: token.marginLG }}>
            <Col xs={24} lg={24}>
              <Card
                size="small"
                style={{
                  borderRadius: token.borderRadiusLG,
                  borderColor: token.colorBorder,
                }}
                title="前台『关于我』配置"
              >
                <Space direction="vertical" size={token.margin} style={{ width: '100%' }}>
                  <Row gutter={[token.marginLG, token.marginLG]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size={token.margin} style={{ width: '100%' }}>
                        <Form.Item
                          label="个人介绍"
                          name="aboutIntro"
                        >
                          <Input.TextArea
                            rows={4}
                            placeholder="例如：偏爱自然光人像与城市夜景，记录每一束真实的光。"
                          />
                        </Form.Item>

                        <Form.Item
                          label="INS 链接"
                          name="aboutInsUrl"
                          rules={[{ type: 'url', message: '请输入合法的链接' }]}
                        >
                          <Input placeholder="例如：https://instagram.com/yourname" />
                        </Form.Item>

                        <Form.Item
                          label="小红书链接"
                          name="aboutXhsUrl"
                          rules={[{ type: 'url', message: '请输入合法的链接' }]}
                        >
                          <Input placeholder="例如：https://www.xiaohongshu.com/user/xxxx" />
                        </Form.Item>

                        <Form.Item
                          label="微博链接"
                          name="aboutWeiboUrl"
                          rules={[{ type: 'url', message: '请输入合法的链接' }]}
                        >
                          <Input placeholder="例如：https://weibo.com/xxxx" />
                        </Form.Item>

                        <Form.Item
                          label="GitHub 链接"
                          name="aboutGithubUrl"
                          rules={[{ type: 'url', message: '请输入合法的链接' }]}
                        >
                          <Input placeholder="例如：https://github.com/yourname" />
                        </Form.Item>
                      </Space>
                    </Col>

                    <Col xs={24} md={12}>
                      <Space direction="vertical" size={token.margin} style={{ width: '100%' }}>
                        <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                          个人照片（建议 9:16 竖图，JPG / PNG）
                        </Typography.Text>
                        <Form.Item
                          label="原图地址"
                          name="aboutPhotoOriginalUrl"
                        >
                          <Input placeholder="上传后自动填充，也可粘贴已有图片地址" />
                        </Form.Item>
                        <Form.Item
                          label="预览图地址"
                          name="aboutPhotoPreviewUrl"
                        >
                          <Input placeholder="上传后自动填充，用于前台展示" />
                        </Form.Item>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleAboutPhotoChange}
                            disabled={aboutUploading}
                          />
                          <Button
                            loading={aboutUploading}
                            disabled={aboutUploading}
                          >
                            上传个人照片
                          </Button>
                        </div>
                        {aboutPreviewUrl && (
                          <div className="mt-3">
                            <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                              预览：
                            </Typography.Text>
                            <div
                              style={{
                                marginTop: 8,
                                width: '180px',
                                aspectRatio: '9 / 16',
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: `1px solid ${token.colorBorder}`,
                              }}
                            >
                              <img
                                src={aboutPreviewUrl}
                                alt="关于我预览图"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </div>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}
