'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button, Input, Form, Switch, Card, Space, Row, Col, Typography, theme } from 'antd'
import { SaveOutlined, CopyOutlined, DeleteOutlined, PlusOutlined, HolderOutlined } from '@ant-design/icons'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
// 「关于我」头像上传使用现有上传工具 & 压缩
import Compressor from 'compressorjs'
import { uploadFile } from '~/lib/utils/file'

const { Compact } = Space

// 拖拽排序相关类型
interface DragItem {
  index: number
  url: string
}

export default function Preferences() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  // 多图画廊状态 - 存储原图和预览图
  const [galleryImages, setGalleryImages] = useState<Array<{ original: string; preview: string }>>([])
  const [galleryUploading, setGalleryUploading] = useState(false)
  // 拖拽排序状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  const { token } = theme.useToken()
  const t = useTranslations()
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

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
          // 「关于我」前台展示配置
          aboutIntro: values.aboutIntro,
          aboutInsUrl: values.aboutInsUrl,
          aboutXhsUrl: values.aboutXhsUrl,
          aboutWeiboUrl: values.aboutWeiboUrl,
          aboutGithubUrl: values.aboutGithubUrl,
          // 多图画廊 - 存储原图和预览图URL数组
          aboutGalleryImages: galleryImages.map(img => img.preview), // 向后兼容，存储预览图URL数组
          aboutGalleryImagesFull: galleryImages, // 完整数据，包含原图和预览图
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
        // 「关于我」前台展示配置
        aboutIntro: data?.find((item) => item.config_key === 'about_intro')?.config_value || '',
        aboutInsUrl: data?.find((item) => item.config_key === 'about_ins_url')?.config_value || '',
        aboutXhsUrl: data?.find((item) => item.config_key === 'about_xhs_url')?.config_value || '',
        aboutWeiboUrl: data?.find((item) => item.config_key === 'about_weibo_url')?.config_value || '',
        aboutGithubUrl: data?.find((item) => item.config_key === 'about_github_url')?.config_value || '',
      })

      // 解析多图画廊数据 - 优先使用完整数据（包含原图和预览图）
      const galleryFullJson = data?.find((item) => item.config_key === 'about_gallery_images_full')?.config_value
      const galleryJson = data?.find((item) => item.config_key === 'about_gallery_images')?.config_value
      
      if (galleryFullJson) {
        try {
          const parsed = JSON.parse(galleryFullJson)
          if (Array.isArray(parsed) && parsed.every(item => item.original && item.preview)) {
            setGalleryImages(parsed)
          }
        } catch {
          // 解析失败，尝试使用旧格式
        }
      }
      
      // 向后兼容：如果没有完整数据，尝试从旧格式迁移
      if (galleryImages.length === 0 && galleryJson) {
        try {
          const parsed = JSON.parse(galleryJson)
          if (Array.isArray(parsed)) {
            // 旧格式是字符串数组，转换为新格式（预览图=原图）
            setGalleryImages(parsed.map((url: string) => ({ original: url, preview: url })))
          }
        } catch {
          // 解析失败，使用空数组
        }
      }
    }
  }, [data, form])

  // 「关于我」个人照片上传逻辑（限制 JPG/PNG + 粗略校验 16:9 比例）
  const handleAboutPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('仅支持 JPG / PNG 格式的图片')
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
      // 要求横屏 16:9（宽/高）
      const target = 16 / 9
      const diff = Math.abs(ratio - target)
      if (diff > 0.15) {
        toast.warning('建议上传接近 16:9 比例的横图，以获得最佳展示效果')
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

  // 多图画廊上传逻辑
  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // 限制最多上传 10 张
    if (galleryImages.length + files.length > 10) {
      toast.error('画廊最多支持 10 张图片')
      return
    }

    setGalleryUploading(true)
    const newUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
          toast.warning(`跳过不支持的格式: ${file.name}`)
          continue
        }

        // 压缩图片
        const compressedFile: File = await new Promise((resolve, reject) => {
          // @ts-expect-error - compressorjs constructor typing
          new Compressor(file, {
            quality: 0.85,
            maxWidth: 1920,
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

        // 上传到画廊目录
        const resp = await uploadFile(compressedFile, '/about/gallery', 's3', '')
        if (resp.code === 200 && resp.data?.url) {
          newUrls.push(resp.data.url)
          toast.success(`上传成功: ${file.name}`)
        } else {
          toast.error(`上传失败: ${file.name}`)
        }
      }

      if (newUrls.length > 0) {
        setGalleryImages(prev => [...prev, ...newUrls])
      }
    } catch (e) {
      console.error(e)
      toast.error('画廊图片上传失败')
    } finally {
      setGalleryUploading(false)
      event.target.value = ''
    }
  }

  // 删除画廊图片
  const handleDeleteGalleryImage = useCallback((index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index))
    toast.success('已删除')
  }, [])

  // 拖拽排序 - 开始拖拽
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  // 拖拽排序 - 拖拽经过
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])

  // 拖拽排序 - 拖拽结束
  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setGalleryImages(prev => {
        const newImages = [...prev]
        const [removed] = newImages.splice(draggedIndex, 1)
        newImages.splice(dragOverIndex, 0, removed)
        return newImages
      })
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, dragOverIndex])

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
              <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
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
              <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
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
              <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
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
              <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
                <Card
                  size="small"
                  style={{
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorder
                  }}
                >
                  <Space orientation="vertical" size={token.marginXS} style={{ width: '100%' }}>
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
                  <Space orientation="vertical" size={token.marginXS} style={{ width: '100%' }}>
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
                  <Space orientation="vertical" size={token.marginXS} style={{ width: '100%' }}>
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

          {/* 「关于我」前台配置模块 */}
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
                <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
                  <Row gutter={[token.marginLG, token.marginLG]}>
                    {/* 左侧：个人介绍 + 社交链接 */}
                    <Col xs={24} md={8} className="flex flex-col justify-start">
                      <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
                        <Form.Item
                          label="个人介绍"
                          name="aboutIntro"
                        >
                          <Input.TextArea
                            rows={6}
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

                    {/* 右侧：多图画廊管理 */}
                    <Col xs={24} md={12} className="flex flex-col items-start justify-start">
                      <Space orientation="vertical" size={token.margin} style={{ width: '100%' }}>
                        <div className="flex items-center justify-between w-full">
                          <Typography.Text strong>
                            画廊图片（最多 10 张，可拖拽排序）
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                            {galleryImages.length} / 10
                          </Typography.Text>
                        </div>

                        {/* 上传按钮 */}
                        <div className="flex items-center gap-2">
                          <input
                            ref={el => (galleryInputRef.current = el)}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleGalleryUpload}
                            disabled={galleryUploading || galleryImages.length >= 10}
                            style={{ display: 'none' }}
                          />
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => galleryInputRef.current?.click()}
                            loading={galleryUploading}
                            disabled={galleryUploading || galleryImages.length >= 10}
                          >
                            添加图片
                          </Button>
                        </div>

                        {/* 画廊图片预览列表 */}
                        <div className="grid grid-cols-2 gap-2 w-full mt-2">
                          {galleryImages.map((img, idx) => (
                            <div
                              key={`${img.preview}-${idx}`}
                              draggable
                              onDragStart={() => handleDragStart(idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDragEnd={handleDragEnd}
                              className={`relative group rounded-lg overflow-hidden border transition-all cursor-move
                                ${draggedIndex === idx ? 'opacity-50 scale-95' : ''}
                                ${dragOverIndex === idx ? 'border-blue-500 border-2' : 'border-gray-200'}
                              `}
                              style={{ aspectRatio: '16/9' }}
                            >
                              <img
                                src={img.preview}
                                alt={`画廊图片 ${idx + 1}`}
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                              {/* 拖拽手柄 */}
                              <div className="absolute top-1 left-1 p-1 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <HolderOutlined className="text-xs" />
                              </div>
                              {/* 序号标签 */}
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs">
                                {idx + 1}
                              </div>
                              {/* 删除按钮 */}
                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryImage(idx)}
                                className="absolute bottom-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <DeleteOutlined className="text-xs" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {galleryImages.length === 0 && (
                          <div 
                            className="w-full py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition-colors"
                            onClick={() => galleryInputRef.current?.click()}
                          >
                            <PlusOutlined className="text-2xl mb-2" />
                            <span className="text-sm">点击添加画廊图片</span>
                          </div>
                        )}

                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          提示：画廊图片将在前台「关于我」页面以轮播形式展示
                        </Typography.Text>
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
